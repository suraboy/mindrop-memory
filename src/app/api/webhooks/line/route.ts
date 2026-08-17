import { NextRequest, NextResponse } from "next/server";
import { validateLineSignature, lineWebhookPayloadSchema } from "@/channels/line/line.signature";
import { getServiceContainer } from "@/infrastructure/container";
import { getConfig } from "@/infrastructure/config/env";
import { logger } from "@/infrastructure/observability/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const signature = req.headers.get("x-line-signature");

  // Read raw text body for cryptographic signature verification
  const rawBody = await req.text();

  const config = getConfig();
  const secret = config.LINE_CHANNEL_SECRET ? config.LINE_CHANNEL_SECRET.trim() : "";

  // 1. Signature Verification
  const isValid = validateLineSignature(rawBody, signature, secret);
  if (!isValid) {
    logger.warn("Invalid LINE webhook signature attempt", {
      hasSignature: Boolean(signature),
      signaturePreview: signature ? `${signature.slice(0, 8)}...` : "none",
      secretLength: secret.length,
      secretPrefix: secret ? `${secret.slice(0, 4)}...` : "none",
      bodyLength: rawBody.length,
      bodyPreview: rawBody.slice(0, 100),
    });
    return NextResponse.json(
      {
        error: "Invalid webhook signature",
        hint: "Ensure LINE_CHANNEL_SECRET in Vercel matches Channel Secret in Basic settings of channel 7K กระดานบอท",
      },
      { status: 401 }
    );
  }

  // 2. Parse Webhook JSON Payload
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Malformed JSON payload" },
      { status: 400 }
    );
  }

  const parseResult = lineWebhookPayloadSchema.safeParse(parsedJson);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid LINE webhook payload structure" },
      { status: 400 }
    );
  }

  // 3. Dispatch to Ingestion Service
  const container = getServiceContainer();
  const ingestResult = await container.ingestionService.handleLineWebhook(parseResult.data.events);

  const durationMs = Date.now() - startTime;
  logger.info("LINE webhook processed successfully", {
    durationMs,
    accepted: ingestResult.accepted,
    duplicate: ingestResult.duplicate,
    ignored: ingestResult.ignored,
  });

  return NextResponse.json({
    status: "ok",
    durationMs,
    ...ingestResult,
  });
}
