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
  const hasGemini = Boolean(
    config.GEMINI_API_KEY &&
    config.GEMINI_API_KEY !== ""
  );
  const hasSupabase = Boolean(
    config.SUPABASE_URL &&
    config.SUPABASE_KEY &&
    config.SUPABASE_URL !== ""
  );

  return NextResponse.json({
    status: "ok",
    service: "mindrop-memory",
    timestamp: new Date().toISOString(),
    diagnostics: {
      lineSecretConfigured: hasLineSecret,
      lineTokenConfigured: hasLineToken,
      geminiConfigured: hasGemini,
      geminiModel: config.GEMINI_MODEL,
      supabaseConfigured: hasSupabase,
      storageProvider: config.STORAGE_PROVIDER,
    },
  });
}
