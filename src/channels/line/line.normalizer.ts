import { CaptureType, SourceRef } from "@/capture/capture.types";

export interface NormalizedLineEvent {
  externalUserId: string;
  source: SourceRef;
  idempotencyKey: string;
  captureType: CaptureType;
  rawText?: string;
  externalMessageId?: string;
  isRedelivery: boolean;
}

export class LineEventNormalizer {
  static normalize(event: Record<string, unknown>): NormalizedLineEvent | null {
    const type = event.type as string;
    const source = (event.source || {}) as { userId?: string; type?: string };
    const userId = source.userId;

    if (!userId) {
      // Group/room event without explicit userId, or unsupported source
      return null;
    }

    const timestamp = typeof event.timestamp === "number" ? event.timestamp : Date.now();
    const replyToken = typeof event.replyToken === "string" ? event.replyToken : undefined;
    const webhookEventId = typeof event.webhookEventId === "string" ? event.webhookEventId : undefined;
    const deliveryContext = (event.deliveryContext || {}) as { isRedelivery?: boolean };
    const isRedelivery = Boolean(deliveryContext.isRedelivery);

    const message = (event.message || {}) as { id?: string; type?: string; text?: string };
    const externalMessageId = message.id;

    if (type === "message" && message.type === "text" && message.text) {
      const idKey = externalMessageId ? `line:msg:${externalMessageId}` : `line:evt:${webhookEventId || timestamp}`;
      return {
        externalUserId: userId,
        source: {
          channel: "line",
          externalEventId: webhookEventId,
          externalMessageId,
          replyToken,
          deliveredAt: new Date(timestamp).toISOString(),
        },
        idempotencyKey: idKey,
        captureType: "text",
        rawText: message.text,
        externalMessageId,
        isRedelivery,
      };
    }

    if (type === "message" && message.type === "image") {
      const idKey = externalMessageId ? `line:msg:${externalMessageId}` : `line:evt:${webhookEventId || timestamp}`;
      return {
        externalUserId: userId,
        source: {
          channel: "line",
          externalEventId: webhookEventId,
          externalMessageId,
          replyToken,
          deliveredAt: new Date(timestamp).toISOString(),
        },
        idempotencyKey: idKey,
        captureType: "image",
        externalMessageId,
        isRedelivery,
      };
    }

    // Ignore unsupported events gracefully (follow, unfollow, postback, audio, video, sticker)
    return null;
  }
}
