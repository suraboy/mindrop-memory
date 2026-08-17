import { AIHarnessClient, HarnessRequest, HarnessResult } from "./harness.contract";
import { HarnessGovernor } from "./harness.governor";
import { ObjectStorage } from "@/storage/object-storage";
import { CaptureRepository } from "@/capture/capture.repository";
import { Logger } from "@/infrastructure/observability/logger";
import { GoogleGenAI } from "@google/genai";

export class GeminiAIHarnessClient implements AIHarnessClient {
  private ai: GoogleGenAI | null = null;
  private governor: HarnessGovernor;

  constructor(
    private apiKey: string,
    modelName: string = "gemini-2.0-flash",
    private storage?: ObjectStorage,
    private repository?: CaptureRepository,
    private logger: Logger = new Logger({ component: "GeminiAIHarnessClient" })
  ) {
    if (this.apiKey && this.apiKey !== "test-gemini-key") {
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    }
    this.governor = new HarnessGovernor(modelName);
  }

  async process(request: HarnessRequest): Promise<HarnessResult> {
    const text = (request.input.text || "").trim();
    const hasImage = Boolean(request.input.objectStorageKey);

    // 1. MULTIMODAL OCR & VISION (Governed Task: "ocr")
    if (hasImage && request.input.objectStorageKey && this.storage && this.ai) {
      const ocrConfig = this.governor.getExecutionConfig("ocr");
      try {
        const stored = await this.storage.get(request.input.objectStorageKey);
        if (stored?.body) {
          this.logger.info("Executing Governed Gemini OCR", {
            model: ocrConfig.model,
            temperature: ocrConfig.temperature,
            sizeBytes: stored.sizeBytes,
          });

          const base64Data = stored.body.toString("base64");
          const prompt = `You are MINDROP AI Memory Harness — high precision OCR & Knowledge Extractor.
Extract verbatim text and analyze this capture.

Return STRICT JSON:
{
  "ocrText": "Verbatim extracted text from image (Thai/English).",
  "title": "Concise descriptive title (< 60 chars)",
  "summary": "1-2 sentence core takeaway",
  "topics": ["2-4 clean topics"],
  "entities": ["3-5 entities/frameworks"],
  "keyIdeas": ["2-3 main takeaway points"],
  "importanceScore": 0.9,
  "whyItMatters": "Why this is useful to remember",
  "replyAck": "Saved ✓\\nTopic1 · Topic2"
}
Output ONLY valid JSON.`;

          const response = await this.ai.models.generateContent({
            model: ocrConfig.model,
            contents: [
              {
                role: "user",
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: stored.mimeType || "image/jpeg",
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
          });

          const rawText = response.text || "";
          const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleaned);

          return {
            requestId: request.requestId,
            intent: "capture",
            responsePolicy: "ack",
            message: {
              text: parsed.replyAck || `Saved ✓\n${(parsed.topics || ["Image", "Vision"]).slice(0, 2).join(" · ")}`,
            },
            captureResult: {
              title: parsed.title || "Visual Memory Capture",
              summary: parsed.summary || parsed.ocrText?.slice(0, 150) || "Image captured via MINDROP",
              topics: parsed.topics || ["Image", "Visual Note"],
              entities: parsed.entities || [],
              keyIdeas: parsed.keyIdeas || [],
              importanceScore: parsed.importanceScore || 0.85,
              whyItMatters: parsed.whyItMatters || "Visual note captured from LINE chat.",
            },
          };
        }
      } catch (err) {
        this.logger.error("Governed OCR call failed, using fallback", err);
      }
    }

    // 2. CONVERSATIONAL MEMORY QUERY (Governed Task: "chat")
    const lower = text.toLowerCase();
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

    if (isQuery && this.ai) {
      const chatConfig = this.governor.getExecutionConfig("chat");
      try {
        let memoryContext = "No prior memories found.";
        if (this.repository) {
          const pastCaptures = await this.repository.listCapturesByActor(request.actorId);
          if (pastCaptures.length > 0) {
            memoryContext = pastCaptures
              .slice(0, 20)
              .map(
                (c, i) =>
                  `[Memory ${i + 1}] Title: ${c.understanding?.title || c.rawText || "Untitled"}\nTopics: ${(c.understanding?.topics || []).join(", ")}\nSummary: ${c.understanding?.summary || c.ocrText || c.rawText}\nDate: ${c.receivedAt}`
              )
              .join("\n\n");
          }
        }

        const queryPrompt = `You are MINDROP — grounded personal intelligence companion.
USER QUESTION: "${text}"

USER'S CAPTURED MEMORY CONTEXT:
${memoryContext}

Respond in a warm, concise, intelligent tone in Thai (or user's language).
Highlight key recurring themes, specific items they saved, and key takeaways.
Ground answers strictly in memory context.`;

        const res = await this.ai.models.generateContent({
          model: chatConfig.model,
          contents: queryPrompt,
        });

        return {
          requestId: request.requestId,
          intent: "query_memory",
          responsePolicy: "respond",
          message: {
            text: res.text?.trim() || `ค้นพบข้อมูลในความทรงจำของคุณเกี่ยวกับ "${text}" เรียบร้อยแล้ว`,
          },
        };
      } catch (err) {
        this.logger.error("Governed conversational query error", err);
      }
    }

    // 3. TEXT CAPTURE & DEEP ANALYSIS (Governed Task: "analysis")
    if (this.ai && text) {
      const analysisConfig = this.governor.getExecutionConfig("analysis");
      try {
        const textPrompt = `You are MINDROP AI Memory Harness.
Analyze this user note/link:
"${text}"

Return STRICT JSON:
{
  "title": "short title (< 50 chars)",
  "summary": "1-2 sentence understanding in original language",
  "topics": ["2-3 concise topics"],
  "entities": ["key named entities or concepts"],
  "keyIdeas": ["1-2 key takeaways"],
  "importanceScore": 0.85,
  "replyAck": "Saved ✓\\nTopic1 · Topic2"
}
Output ONLY valid JSON.`;

        const res = await this.ai.models.generateContent({
          model: analysisConfig.model,
          contents: textPrompt,
        });

        const raw = res.text || "";
        const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);

        return {
          requestId: request.requestId,
          intent: "capture",
          responsePolicy: "ack",
          message: {
            text: parsed.replyAck || `Saved ✓\n${(parsed.topics || ["Note", "Knowledge"]).slice(0, 2).join(" · ")}`,
          },
          captureResult: {
            title: parsed.title || (text.length > 50 ? `${text.slice(0, 47)}...` : text),
            summary: parsed.summary || text,
            topics: parsed.topics || ["Note", "Knowledge"],
            entities: parsed.entities || [],
            keyIdeas: parsed.keyIdeas || [],
            importanceScore: parsed.importanceScore || 0.85,
            whyItMatters: "Saved in your personal memory stream.",
          },
        };
      } catch (err) {
        this.logger.warn("Governed text analysis failed, using fallback", err);
      }
    }

    // Fallback if AI is offline
    const isProduct = text.includes("personal knowledge") || text.includes("folder") || text.includes("product");
    const defaultTopics = isProduct ? ["Product", "Ideas", "AI"] : ["Note", "Personal Knowledge"];

    return {
      requestId: request.requestId,
      intent: "capture",
      responsePolicy: "ack",
      message: {
        text: "Saved ✓\nProduct · Idea",
      },
      captureResult: {
        title: text.length > 50 ? `${text.slice(0, 47)}...` : text || "Captured Item",
        summary: `Captured thought: ${text}`,
        topics: defaultTopics,
        entities: ["LINE Capture"],
        importanceScore: 0.85,
        whyItMatters: "Stored in your personal memory stream.",
      },
    };
  }
}
