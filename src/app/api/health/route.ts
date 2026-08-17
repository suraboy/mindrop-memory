import { NextResponse } from "next/server";
import { getConfig } from "@/infrastructure/config/env";

export async function GET() {
  const config = getConfig();
  const hasLineSecret = Boolean(
    config.LINE_CHANNEL_SECRET &&
    config.LINE_CHANNEL_SECRET !== "test-channel-secret"
  );
  const hasLineToken = Boolean(
    config.LINE_CHANNEL_ACCESS_TOKEN &&
    config.LINE_CHANNEL_ACCESS_TOKEN !== "test-channel-access-token"
  );

  return NextResponse.json({
    status: "ok",
    service: "mindrop-memory",
    timestamp: new Date().toISOString(),
    diagnostics: {
      lineSecretConfigured: hasLineSecret,
      lineSecretLength: config.LINE_CHANNEL_SECRET ? config.LINE_CHANNEL_SECRET.length : 0,
      lineTokenConfigured: hasLineToken,
      storageProvider: config.STORAGE_PROVIDER,
    },
  });
}
