import { NextResponse } from "next/server";
import { getServiceContainer } from "@/infrastructure/container";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const container = getServiceContainer();
    const liveCaptures = await container.repository.listCapturesByActor();

    const result = await container.harness.process({
      requestId: `ask_${crypto.randomBytes(6).toString("hex")}`,
      actorId: "actor_default",
      interaction: { channel: "web" },
      input: { text: query },
    });

    const replyText =
      result.message?.text ||
      `สวัสดีครับ! ผมคือ **Pat (แพท)** ผู้ช่วยส่วนตัวอัจฉริยะของคุณ 🌟 พร้อมช่วยค้นหาความจำ สรุปข้อมูล และพัฒนาต่อยอดทุกเคสตามที่คุณบันทึกเข้ามาครับ!`;

    // Sourced relevant captures
    const sources = liveCaptures.slice(0, 3).map((c) => ({
      id: c.id,
      type: c.type,
      source: { channel: "line", provider: "LINE" },
      title: c.understanding?.title || c.rawText || "Memory Item",
      summary: c.understanding?.summary || c.rawText || "Saved thought",
      topics: c.understanding?.topics || ["Memory"],
    }));

    return NextResponse.json({
      answer: replyText,
      sources,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
