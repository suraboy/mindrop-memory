import crypto from "crypto";
import { z } from "zod";

// LINE Webhook Event Schemas
export const lineTextEventSchema = z.object({
  type: z.literal("message"),
  mode: z.string().optional(),
  timestamp: z.number(),
  source: z.object({
    type: z.enum(["user", "group", "room"]),
    userId: z.string().optional(),
    groupId: z.string().optional(),
    roomId: z.string().optional(),
  }),
  webhookEventId: z.string().optional(),
  deliveryContext: z.object({ isRedelivery: z.boolean() }).optional(),
  replyToken: z.string().optional(),
  message: z.object({
    id: z.string(),
    type: z.literal("text"),
    text: z.string(),
    quoteToken: z.string().optional(),
  }),
});

export const lineImageEventSchema = z.object({
  type: z.literal("message"),
  mode: z.string().optional(),
  timestamp: z.number(),
  source: z.object({
    type: z.enum(["user", "group", "room"]),
    userId: z.string().optional(),
    groupId: z.string().optional(),
    roomId: z.string().optional(),
  }),
  webhookEventId: z.string().optional(),
  deliveryContext: z.object({ isRedelivery: z.boolean() }).optional(),
  replyToken: z.string().optional(),
  message: z.object({
    id: z.string(),
    type: z.literal("image"),
    contentProvider: z.object({
      type: z.enum(["line", "external"]),
      originalContentUrl: z.string().optional(),
      previewImageUrl: z.string().optional(),
    }),
  }),
});

export const lineGenericEventSchema = z.object({
  type: z.string(),
  mode: z.string().optional(),
  timestamp: z.number(),
  source: z.object({
    type: z.string(),
    userId: z.string().optional(),
  }),
  webhookEventId: z.string().optional(),
  deliveryContext: z.object({ isRedelivery: z.boolean() }).optional(),
  replyToken: z.string().optional(),
  message: z.object({
    id: z.string().optional(),
    type: z.string(),
  }).optional(),
});

export const lineWebhookPayloadSchema = z.object({
  destination: z.string().optional(),
  events: z.array(z.record(z.string(), z.unknown())),
});

export type LineWebhookPayload = z.infer<typeof lineWebhookPayloadSchema>;
export type LineTextEvent = z.infer<typeof lineTextEventSchema>;
export type LineImageEvent = z.infer<typeof lineImageEventSchema>;
export type LineGenericEvent = z.infer<typeof lineGenericEventSchema>;

/**
 * Validates LINE Webhook Signature using HMAC-SHA256 and constant-time comparison.
 */
export function validateLineSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null | undefined,
  channelSecret: string
): boolean {
  if (!signatureHeader || !channelSecret) {
    return false;
  }

  try {
    const rawBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, "utf-8");
    const hmac = crypto.createHmac("sha256", channelSecret);
    hmac.update(rawBuffer);
    const calculatedSignature = hmac.digest("base64");

    const sigBuf = Buffer.from(signatureHeader.trim(), "utf-8");
    const calcBuf = Buffer.from(calculatedSignature.trim(), "utf-8");

    if (sigBuf.length !== calcBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuf, calcBuf);
  } catch {
    return false;
  }
}
