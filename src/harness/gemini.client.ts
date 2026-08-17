import { AIHarnessClient, HarnessRequest, HarnessResult } from "./harness.contract";
import { ObjectStorage } from "@/storage/object-storage";
import { CaptureRepository } from "@/capture/capture.repository";
import { Logger } from "@/infrastructure/observability/logger";
import { GoogleGenAI } from "@google/genai";

export class GeminiAIHarnessClient implements AIHarnessClient {
  private ai: GoogleGenAI | null = null;

  constructor(
    private apiKey: string,
    private modelName: string = "gemini-2.0-flash",
    private storage?: ObjectStorage,
    private repository?: CaptureRepository,
    private logger: Logger = new Logger({ component: "GeminiAIHarnessClient" })
  ) {
    if (this.apiKey && this.apiKey !== "test-gemini-key") {
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  async process(request: HarnessRequest): Promise<HarnessResult> {
    const text = (request.input.text || "").trim();
    const hasImage = Boolean(request.input.objectStorageKey);

    // 1. MULTIMODAL OCR & VISION UNDERSTANDING
    if (hasImage && request.input.objectStorageKey && this.storage && this.ai) {
      try {
        const stored = await this.storage.get(request.input.objectStorageKey);
        if (stored?.body) {
          this.logger.info("Executing Gemini Vision OCR", {
            model: this.modelName,
            mimeType: stored.mimeType,
            bytes: stored.sizeBytes,
          });

          const base64Data = stored.body.toString("base64");
          const prompt = `You are MINDROP AI Memory Harness — a personal intelligence system.
The user sent this image into their LINE chat to store in their personal knowledge base.

Analyze this image and return a STRICT JSON object with these exact keys:
{
  "ocrText": "Verbatim extracted text from the image in its original language (Thai/English). Include all legible titles, bullet points, code, or captions.",
  "title": "Concise descriptive title for this capture (under 60 characters)",
  "summary": "Clear 1-2 sentence understanding of what this image represents and why it is useful",
  "topics": ["2 to 4 clean categorical topics (e.g. AI Agents, Architecture, Retail, Design, Ideas)"],
  "entities": ["3 to 5 key entities, tools, models, frameworks, or concepts mentioned"],
  "keyIdeas": ["2 to 3 main takeaway ideas"],
  "importanceScore": 0.9,
  "whyItMatters": "Why this is worth remembering",
  "replyAck": "Saved ✓\\nTopic1 · Topic2"
}
Output ONLY valid JSON. No markdown code blocks, no backticks.`;

          const response = await this.ai.models.generateContent({
            model: this.modelName,
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
        this.logger.error("Gemini Vision call error, falling back to local extractor", err);
      }
    }

    // 2. CONVERSATIONAL MEMORY QUERY (Q&A against past captures)
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
      try {
        let memoryContext = "No prior memories found.";
        if (this.repository) {
          const pastCaptures = await this.repository.listCapturesByActor(request.actorId);
          if (pastCaptures.length > 0) {
            memoryContext = pastCaptures
              .slice(0, 15)
              .map(
                (c, i) =>
                  `[Memory ${i + 1}] Title: ${c.understanding?.title || c.rawText || "Untitled"}\nTopics: ${(c.understanding?.topics || []).join(", ")}\nSummary: ${c.understanding?.summary || c.ocrText || c.rawText}\nDate: ${c.receivedAt}`
              )
              .join("\n\n");
          }
        }

        const queryPrompt = `You are MINDROP — a personal intelligence system.
The user is asking a conversational question in LINE about what they have previously captured.

USER QUESTION: "${text}"

USER'S CAPTURED MEMORY CONTEXT:
${memoryContext}

Respond in a warm, concise, intelligent tone in Thai (or user's language).
Highlight key recurring themes, specific items they saved, and key takeaways.
Do not make up facts not present in memory context. If nothing matches, politely inform them.`;

        const res = await this.ai.models.generateContent({
          model: this.modelName,
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
        this.logger.error("Gemini conversational query error", err);
      }
    }

    // 3. TEXT CAPTURE WITH GEMINI UNDERSTANDING
    if (this.ai && text) {
      try {
        const textPrompt = `You are MINDROP AI Memory Harness.
The user sent this note/link into their personal LINE chat:
"${text}"

Analyze this capture and return a STRICT JSON object:
{
  "title": "short title under 50 characters",
  "summary": "1-2 sentence understanding in original language",
  "topics": ["2-3 concise topics"],
  "entities": ["key named entities or concepts"],
  "keyIdeas": ["1-2 key takeaways"],
  "importanceScore": 0.85,
  "replyAck": "Saved ✓\\nTopic1 · Topic2"
}
Output ONLY valid JSON.`;

        const res = await this.ai.models.generateContent({
          model: this.modelName,
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
        this.logger.warn("Gemini text analysis failed, using fallback", err);
      }
    }

    // Fallback if Gemini is not configured or offline
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
