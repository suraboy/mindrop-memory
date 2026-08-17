import crypto from "crypto";

export function createLineSignature(rawBody: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(rawBody, "utf-8").digest("base64");
}

export function createTextWebhookEvent(params: {
  userId?: string;
  text?: string;
  messageId?: string;
  replyToken?: string;
  timestamp?: number;
}) {
  const userId = params.userId || "U1234567890abcdef1234567890abcdef";
  const messageId = params.messageId || "msg_text_001";
  const replyToken = params.replyToken || "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA";
  const timestamp = params.timestamp || Date.now();
  const text = params.text || "ทำ personal knowledge ที่ไม่ต้องจัด folder เอง";

  return {
    destination: "U_bot_destination",
    events: [
      {
        type: "message",
        mode: "active",
        timestamp,
        source: {
          type: "user",
          userId,
        },
        webhookEventId: `wevt_${messageId}`,
        deliveryContext: {
          isRedelivery: false,
        },
        replyToken,
        message: {
          id: messageId,
          type: "text",
          text,
        },
      },
    ],
  };
}

export function createImageWebhookEvent(params: {
  userId?: string;
  messageId?: string;
  replyToken?: string;
  timestamp?: number;
}) {
  const userId = params.userId || "U1234567890abcdef1234567890abcdef";
  const messageId = params.messageId || "msg_img_001";
  const replyToken = params.replyToken || "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA";
  const timestamp = params.timestamp || Date.now();

  return {
    destination: "U_bot_destination",
    events: [
      {
        type: "message",
        mode: "active",
        timestamp,
        source: {
          type: "user",
          userId,
        },
        webhookEventId: `wevt_${messageId}`,
        deliveryContext: {
          isRedelivery: false,
        },
        replyToken,
        message: {
          id: messageId,
          type: "image",
          contentProvider: {
            type: "line",
          },
        },
      },
    ],
  };
}

export function createUnsupportedWebhookEvent(type = "follow") {
  return {
    destination: "U_bot_destination",
    events: [
      {
        type,
        mode: "active",
        timestamp: Date.now(),
        source: {
          type: "user",
          userId: "U1234567890abcdef1234567890abcdef",
        },
        webhookEventId: `wevt_${type}_001`,
        deliveryContext: {
          isRedelivery: false,
        },
      },
    ],
  };
}
