import { NextResponse } from "next/server";
import { getServiceContainer } from "@/infrastructure/container";
import { MOCK_CAPTURES } from "@/lib/mock-data/captures";
import { CaptureItem, ProcessingStatus } from "@/types";
import { CanonicalCapture } from "@/capture/capture.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const container = getServiceContainer();
  
  try {
    const liveCaptures = await container.repository.listCapturesByActor("line:default");
    
    const repoAny = container.repository as unknown as { captures?: Map<string, CanonicalCapture> };
    const allRepoCaptures: CanonicalCapture[] = repoAny.captures
      ? Array.from(repoAny.captures.values())
      : liveCaptures;

    const formattedLive: CaptureItem[] = allRepoCaptures.map((c) => {
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
        (c.rawText ? c.rawText : "Processing content from LINE...");

      return {
        id: c.id,
        type: c.type === "thought" ? "text" : (c.type as "image" | "link" | "text" | "file"),
        source: {
          channel: "line",
          senderName: "LINE User",
        },
        title,
        rawText: c.rawText,
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

    formattedLive.sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());

    const merged = [...formattedLive, ...MOCK_CAPTURES.filter((m) => !formattedLive.some((l) => l.id === m.id))];

    return NextResponse.json({
      status: "ok",
      liveCount: formattedLive.length,
      totalCount: merged.length,
      captures: merged,
    });
  } catch {
    return NextResponse.json({
      status: "ok",
      captures: MOCK_CAPTURES,
    });
  }
}
