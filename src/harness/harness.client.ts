import { AIHarnessClient, HarnessRequest, HarnessResult } from "./harness.contract";
import { Logger } from "@/infrastructure/observability/logger";

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

    // 1. IMAGE CAPTURE
    if (hasImage) {
      return {
        requestId: request.requestId,
        intent: "capture",
        responsePolicy: "ack",
        message: {
          text: "Saved ✓\nAI Agents · Architecture",
        },
        captureResult: {
          title: "AI Architecture Diagram",
          summary: "Architecture diagram discussing planner, memory, tools and execution workers.",
          topics: ["AI Agents", "Architecture"],
          entities: ["Planner", "Episodic Memory", "Tool Executor"],
          importanceScore: 0.9,
          whyItMatters: "Matches your focus on agent architecture.",
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
      if (lower.includes("retail") || lower.includes("รีเทล")) {
        return {
          requestId: request.requestId,
          intent: "query_memory",
          responsePolicy: "respond",
          message: {
            text: "ช่วง 30 วันที่ผ่านมา คุณเก็บไว้ 3 รายการเกี่ยวกับ Retail AI:\n\n1. Autonomous Procurement ใน modern trade\n2. Supplier Trust Score สำคัญกว่าส่วนต่างราคา\n3. Modernization report ในเอเชียตะวันออกเฉียงใต้",
          },
        };
      }

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
          text: `ค้นพบข้อมูลในความทรงจำของคุณเกี่ยวกับ "${text}" เรียบร้อยแล้ว`,
        },
      };
    }

    // 3. TEXT CAPTURE
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
        topics: ["Product", "Ideas"],
        entities: ["Personal Intelligence"],
        importanceScore: 0.85,
        whyItMatters: "Directly relates to zero-organization knowledge storage.",
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
