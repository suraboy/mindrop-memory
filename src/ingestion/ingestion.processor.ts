import { CaptureRepository } from "@/capture/capture.repository";
import { ObjectStorage } from "@/storage/object-storage";
import { AIHarnessClient } from "@/harness/harness.contract";
import { LineMessagingGateway } from "@/channels/line/line.gateway";
import { InteractionService } from "@/interactions/interaction.service";
import { Logger } from "@/infrastructure/observability/logger";
import crypto from "crypto";

export interface ProcessorOptions {
  maxImageSizeBytes?: number;
  downloadTimeoutMs?: number;
}

export class IngestionProcessor {
  constructor(
    private repository: CaptureRepository,
    private storage: ObjectStorage,
    private harness: AIHarnessClient,
    private lineGateway: LineMessagingGateway,
    private interactionService: InteractionService,
    private options: ProcessorOptions = {},
    private logger: Logger = new Logger({ component: "IngestionProcessor" })
  ) {}

  async processJob(jobId: string): Promise<{ success: boolean; terminal: boolean; error?: string }> {
    const job = await this.repository.getJobById(jobId);
    if (!job) {
      return { success: false, terminal: true, error: "Job not found" };
    }

    if (job.status === "completed") {
      return { success: true, terminal: true };
    }

    const capture = await this.repository.getCaptureById(job.captureId, job.actorId);
    if (!capture) {
      await this.repository.updateJob(jobId, { status: "failed", lastError: "Capture record missing" });
      return { success: false, terminal: true, error: "Capture not found" };
    }

    const actor = await this.repository.getActorById(job.actorId);
    if (!actor) {
      await this.repository.updateJob(jobId, { status: "failed", lastError: "Actor record missing" });
      return { success: false, terminal: true, error: "Actor not found" };
    }

    await this.repository.updateJob(jobId, {
      status: "processing",
      attempts: job.attempts + 1,
      startedAt: new Date().toISOString(),
    });
    await this.repository.updateCapture(capture.id, { status: "processing" });

    try {
      // 1. Binary Content Download (if image/file not yet stored)
      if (capture.type === "image" && !capture.object && capture.source.externalMessageId) {
        const { body, mimeType } = await this.lineGateway.getMessageContent(capture.source.externalMessageId);

        // Content safety check
        const maxBytes = this.options.maxImageSizeBytes || 10 * 1024 * 1024;
        if (body.length > maxBytes) {
          throw new Error(`Image size exceeds limit: ${body.length} bytes (max ${maxBytes})`);
        }

        const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
          throw new Error(`Unsupported image MIME type: ${mimeType}`);
        }

        const storageKey = `captures/${actor.id}/${capture.id}_${crypto.randomBytes(4).toString("hex")}.jpg`;
        const stored = await this.storage.put({ key: storageKey, body, mimeType });

        capture.object = {
          storageKey: stored.storageKey,
          mimeType: stored.mimeType,
          sizeBytes: stored.sizeBytes,
        };
        await this.repository.updateCapture(capture.id, { object: capture.object });
      }

      // 2. Fetch Recent Interaction History for Contextual Continuity
      const recentHistory = await this.repository.getRecentInteractions(actor.id, 5);

      // 3. Call AI Harness
      const harnessResult = await this.harness.process({
        requestId: `req_${crypto.randomBytes(6).toString("hex")}`,
        actorId: actor.id,
        interaction: {
          channel: "line",
          replyToken: job.replyToken,
        },
        capture: {
          id: capture.id,
          type: capture.type,
        },
        input: {
          text: capture.rawText,
          objectStorageKey: capture.object?.storageKey,
          mimeType: capture.object?.mimeType,
          sizeBytes: capture.object?.sizeBytes,
        },
        recentHistory,
      });

      // 4. Update Capture with AI Insights
      if (harnessResult.captureResult) {
        await this.repository.updateCapture(capture.id, {
          status: "ready",
          understanding: {
            title: harnessResult.captureResult.title,
            summary: harnessResult.captureResult.summary,
            topics: harnessResult.captureResult.topics,
            entities: harnessResult.captureResult.entities,
            keyIdeas: harnessResult.captureResult.keyIdeas,
            importanceScore: harnessResult.captureResult.importanceScore,
            whyItMatters: harnessResult.captureResult.whyItMatters,
          },
        });
      } else {
        await this.repository.updateCapture(capture.id, { status: "ready" });
      }

      // 5. Execute Communication Decision
      if (harnessResult.responsePolicy !== "silent" && harnessResult.message?.text) {
        await this.interactionService.deliverResponse({
          actorId: actor.id,
          externalUserId: actor.externalUserId,
          replyToken: job.replyToken,
          replyTokenExpiresAt: job.replyTokenExpiresAt,
          text: harnessResult.message.text,
          captureId: capture.id,
        });
      }

      // 6. Mark Job Completed
      await this.repository.updateJob(jobId, {
        status: "completed",
        completedAt: new Date().toISOString(),
      });

      return { success: true, terminal: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error("Capture processing job error", { jobId, error: errorMsg });

      const isTerminal = (job.attempts + 1) >= job.maxAttempts;
      await this.repository.updateJob(jobId, {
        status: isTerminal ? "failed" : "pending",
        lastError: errorMsg,
      });

      // Crucial Invariant: Capture itself remains safely stored even if AI fails!
      await this.repository.updateCapture(capture.id, {
        status: isTerminal ? "failed" : "stored",
      });

      return { success: false, terminal: isTerminal, error: errorMsg };
    }
  }
}
