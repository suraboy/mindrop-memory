import { LineMessagingGateway } from "@/channels/line/line.gateway";
import { CaptureRepository } from "@/capture/capture.repository";
import { Logger } from "@/infrastructure/observability/logger";

export interface DeliverResponseOptions {
  actorId: string;
  externalUserId: string;
  replyToken?: string;
  replyTokenExpiresAt?: string;
  text: string;
  captureId?: string;
}

export class InteractionService {
  constructor(
    private lineGateway: LineMessagingGateway,
    private repository: CaptureRepository,
    private logger: Logger = new Logger({ component: "InteractionService" })
  ) {}

  async deliverResponse(options: DeliverResponseOptions): Promise<{ delivered: boolean; method: "reply" | "push" | "none"; error?: string }> {
    const { actorId, externalUserId, replyToken, replyTokenExpiresAt, text, captureId } = options;

    if (!text.trim()) {
      return { delivered: false, method: "none" };
    }

    let isReplyTokenUsable = false;
    if (replyToken) {
      if (replyTokenExpiresAt) {
        const expiresAt = new Date(replyTokenExpiresAt).getTime();
        isReplyTokenUsable = Date.now() < expiresAt;
      } else {
        isReplyTokenUsable = true;
      }
    }

    // 1. Attempt Fast Reply via Reply Token
    if (isReplyTokenUsable && replyToken) {
      const replyRes = await this.lineGateway.replyText(replyToken, text);
      if (replyRes.success) {
        await this.repository.recordInteraction({
          actorId,
          channel: "line",
          direction: "outbound",
          captureId,
          text,
          timestamp: new Date().toISOString(),
          metadata: { method: "reply", replyToken },
        });
        return { delivered: true, method: "reply" };
      }
      this.logger.warn("Reply token delivery failed, falling back to push", { error: replyRes.error });
    }

    // 2. Fallback to Push Message
    if (externalUserId) {
      const pushRes = await this.lineGateway.pushText(externalUserId, text);
      if (pushRes.success) {
        await this.repository.recordInteraction({
          actorId,
          channel: "line",
          direction: "outbound",
          captureId,
          text,
          timestamp: new Date().toISOString(),
          metadata: { method: "push" },
        });
        return { delivered: true, method: "push" };
      }

      this.logger.error("Push message delivery failed", { error: pushRes.error });
      return { delivered: false, method: "push", error: pushRes.error };
    }

    return { delivered: false, method: "none", error: "No viable delivery channel" };
  }
}
