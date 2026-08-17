import { AIHarnessClient, HarnessRequest, HarnessResult } from "./harness.contract";
import { Logger } from "@/infrastructure/observability/logger";
import { getConfig } from "@/infrastructure/config/env";

export class MockAIHarnessClient implements AIHarnessClient {
  public shouldTimeout = false;
  public shouldFail = false;
  public customResult?: Partial<HarnessResult>;
  public calls: HarnessRequest[] = [];

  constructor(private logger: Logger = new Logger({ component: "AIHarnessClient" })) {}

  async process(request: HarnessRequest): Promise<HarnessResult> {
    this.calls.push(request);

    if (this.shouldTimeout) {
      await new Promise((resolve) => setTimeout(resolve, 30000));
      throw new Error("AI Harness request timed out");
    }

    if (this.shouldFail) {
      throw new Error("AI Harness processing failure (model unavailable)");
    }

    if (this.customResult) {
      return {
        requestId: request.requestId,
        intent: this.customResult.intent || "capture",
        responsePolicy: this.customResult.responsePolicy || "ack",
        message: this.customResult.message,
        captureResult: this.customResult.captureResult,
      };
    }

    const text = (request.input.text || "").trim();
    const hasImage = Boolean(request.input.objectStorageKey);
    const config = getConfig();

    // 1. IMAGE CAPTURE (OCR & Vision Understanding)
    if (hasImage) {
      if (config.OPENAI_API_KEY && config.OPENAI_API_KEY.startsWith("sk-")) {
        this.logger.info("Processing Vision OCR via AI Harness", { requestId: request.requestId });
      }

      const defaultTopics = ["AI Agents", "Architecture", "Visual Note"];
      return {
        requestId: request.requestId,
        intent: "capture",
        responsePolicy: "ack",
        message: {
          text: `Saved ✓\n${defaultTopics.slice(0, 2).join(" · ")}`,
        },
        captureResult: {
          title: "Visual Capture (Screenshot / Photo)",
          summary: "Architecture and system workflow diagrams extracted from image.",
          topics: defaultTopics,
          entities: ["Captured Image", "OCR Ingestion"],
          importanceScore: 0.9,
          whyItMatters: "Saved into your personal visual memory stream.",
        },
      };
    }

    const lower = text.toLowerCase();

    // 2. CONVERSATIONAL / MEMORY QUERY
    const isQuery =
      lower.includes("เคยส่ง") ||
      lower.includes("สรุปเรื่อง") ||
      lower.includes("หา") ||
      lower.includes("what have i") ||
      lower.includes("find") ||
      lower.includes("summarize") ||
      text.endsWith("?") ||
      text.endsWith("มั้ย") ||
      text.endsWith("ไหม");

    if (isQuery) {
      if (lower.includes("agent memory") || lower.includes("architecture")) {
        return {
          requestId: request.requestId,
          intent: "query_memory",
          responsePolicy: "respond",
          message: {
            text: "ช่วง 6 สัปดาห์ที่ผ่านมา คุณเก็บไว้ 14 รายการเกี่ยวกับ agent memory\n\nหัวข้อหลักมี 3 กลุ่ม:\n1. Episodic memory\n2. Semantic retrieval\n3. Context compression\n\nแนวคิดที่เกิดซ้ำมากที่สุดคือการแยก long-term knowledge ออกจาก execution context",
          },
        };
      }

      return {
        requestId: request.requestId,
        intent: "query_memory",
        responsePolicy: "respond",
        message: {
          text: `🔍 ความทรงจำที่เกี่ยวข้องกับ "${text}":\n\nระบบค้นหาข้อมูลที่คุณเคยบันทึกไว้ และรวบรวมเนื้อหาที่ตรงกันให้เรียบร้อยแล้ว`,
        },
      };
    }

    // 3. TEXT CAPTURE
    const isProduct = text.includes("personal knowledge") || text.includes("folder") || text.includes("product");
    const derivedTopics = isProduct ? ["Product", "Ideas", "AI"] : ["Note", "Personal Knowledge"];

    return {
      requestId: request.requestId,
      intent: "capture",
      responsePolicy: "ack",
      message: {
        text: "Saved ✓\nProduct · Idea",
      },
      captureResult: {
        title: text.length > 50 ? `${text.slice(0, 47)}...` : text,
        summary: `Captured thought: ${text}`,
        topics: derivedTopics,
        entities: ["LINE Capture", "Personal Intelligence"],
        importanceScore: 0.85,
        whyItMatters: "Stored in your personal memory stream.",
      },
    };
  }

  clear() {
    this.calls = [];
    this.shouldTimeout = false;
    this.shouldFail = false;
    this.customResult = undefined;
  }
}
