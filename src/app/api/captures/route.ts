import { NextResponse } from "next/server";
import { getServiceContainer } from "@/infrastructure/container";
import { CaptureItem, ProcessingStatus } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const container = getServiceContainer();
  
  try {
    const liveCaptures = await container.repository.listCapturesByActor();

    const formatted: CaptureItem[] = liveCaptures.map((c) => {
      const status: ProcessingStatus =
        c.status === "ready"
          ? "ready"
          : c.status === "processing" || c.status === "received" || c.status === "queued"
          ? "processing"
          : "needs_review";

      const title =
        c.understanding?.title ||
        (c.rawText ? (c.rawText.length > 50 ? `${c.rawText.slice(0, 47)}...` : c.rawText) : "Captured Item");

      const summary =
        c.understanding?.summary ||
        (c.ocrText ? `[OCR Extracted]: ${c.ocrText.slice(0, 150)}...` : c.rawText || "Visual note captured from LINE");

      return {
        id: c.id,
        type: c.type === "thought" ? "text" : (c.type as "image" | "link" | "text" | "file"),
        source: {
          channel: "line",
          senderName: "LINE User",
        },
        title,
        rawText: c.rawText || c.ocrText,
        summary,
        keyIdeas: c.understanding?.keyIdeas || [],
        topics: c.understanding?.topics || ["Inbox", "Uncategorized"],
        entities: c.understanding?.entities || [],
        capturedAt: c.receivedAt,
        status,
        importanceScore: c.understanding?.importanceScore || 0.8,
        whyItMatters: c.understanding?.whyItMatters,
      };
    });

    formatted.sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());

    return NextResponse.json({
      status: "ok",
      liveCount: formatted.length,
      captures: formatted,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      status: "error",
      error: msg,
      captures: [],
    });
  }
}
