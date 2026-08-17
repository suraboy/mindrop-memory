import { CaptureRepository } from "@/capture/capture.repository";
import { IngestionProcessor } from "./ingestion.processor";
import { LineEventNormalizer } from "@/channels/line/line.normalizer";
import { CanonicalCapture, ProcessingJob } from "@/capture/capture.types";
import { Logger } from "@/infrastructure/observability/logger";
import crypto from "crypto";

export interface IngestResult {
  accepted: number;
  duplicate: number;
  ignored: number;
  capturesCreated: string[];
}

export class IngestionService {
  constructor(
    private repository: CaptureRepository,
    private processor: IngestionProcessor,
    private logger: Logger = new Logger({ component: "IngestionService" })
  ) {}

  /**
   * Accepts incoming webhook payload, normalizes events, applies idempotency deduplication,
   * stores initial capture records, and schedules background AI processing without blocking.
   */
  async handleLineWebhook(events: Record<string, unknown>[]): Promise<IngestResult> {
    let accepted = 0;
    let duplicate = 0;
    let ignored = 0;
    const capturesCreated: string[] = [];

    for (const rawEvent of events) {
      const normalized = LineEventNormalizer.normalize(rawEvent);
      if (!normalized) {
        ignored += 1;
        continue;
      }

      const captureId = `cap_${crypto.randomBytes(6).toString("hex")}`;
      const actor = await this.repository.getOrCreateActor("line", normalized.externalUserId);

      // 1. Check Atomic Idempotency Lock
      const lockRes = await this.repository.acquireEventLock(
        normalized.idempotencyKey,
        "line",
        normalized.source.externalEventId || normalized.idempotencyKey,
        actor.id,
        captureId
      );

      if (!lockRes.acquired) {
        duplicate += 1;
        this.logger.info("Duplicate LINE event skipped", { idempotencyKey: normalized.idempotencyKey });
        continue;
      }

      // 2. Persist Canonical Capture Record
      const capture: CanonicalCapture = {
        id: captureId,
        actorId: actor.id,
        source: normalized.source,
        type: normalized.captureType,
        rawText: normalized.rawText,
        status: "received",
        receivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await this.repository.saveCapture(capture);
      capturesCreated.push(captureId);

      // 3. Record Inbound User Message to Interaction History
      if (normalized.rawText) {
        await this.repository.recordInteraction({
          actorId: actor.id,
          channel: "line",
          direction: "inbound",
          captureId,
          text: normalized.rawText,
          timestamp: new Date().toISOString(),
        });
      }

      // 4. Create and Enqueue Processing Job
      const replyTokenExpiresAt = normalized.source.replyToken
        ? new Date(Date.now() + 25000).toISOString()
        : undefined;

      const job: ProcessingJob = {
        id: `job_${crypto.randomBytes(6).toString("hex")}`,
        captureId,
        actorId: actor.id,
        status: "pending",
        attempts: 0,
        maxAttempts: 3,
        enqueuedAt: new Date().toISOString(),
        replyToken: normalized.source.replyToken,
        replyTokenExpiresAt,
      };
      await this.repository.saveJob(job);
      accepted += 1;

      // 5. Process job and deliver response to LINE
      try {
        await this.processor.processJob(job.id);
        await this.repository.markEventProcessed(normalized.idempotencyKey);
      } catch (err) {
        this.logger.error("Processor execution error", { jobId: job.id, error: err });
      }
    }

    return { accepted, duplicate, ignored, capturesCreated };
  }
}
