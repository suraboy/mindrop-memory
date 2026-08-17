import { AIHarnessClient, HarnessRequest, HarnessResult } from "./harness.contract";
import { HarnessGovernor } from "./harness.governor";
import { ObjectStorage } from "@/storage/object-storage";
import { CaptureRepository } from "@/capture/capture.repository";
import { Logger } from "@/infrastructure/observability/logger";
import { GoogleGenAI } from "@google/genai";

export class GeminiAIHarnessClient implements AIHarnessClient {
  private ai: GoogleGenAI | null = null;
  private governor: HarnessGovernor;
  private trimmedApiKey: string;

  constructor(
    apiKey: string,
    modelName: string = "gemini-3.7-flash",
    private storage?: ObjectStorage,
    private repository?: CaptureRepository,
    private logger: Logger = new Logger({ component: "GeminiAIHarnessClient" })
  ) {
    this.trimmedApiKey = (apiKey || "").trim();
    if (this.trimmedApiKey && this.trimmedApiKey !== "test-gemini-key") {
      try {
        this.ai = new GoogleGenAI({ apiKey: this.trimmedApiKey });
      } catch (err) {
        this.logger.error("Failed to initialize GoogleGenAI SDK", err);
      }
    }
    this.governor = new HarnessGovernor(modelName);
  }

  /**
   * Resilient REST fallback directly calling Google AI Studio endpoint
   */
  private async callGeminiRest(model: string, contents: unknown): Promise<string | null> {
    if (!this.trimmedApiKey || this.trimmedApiKey === "test-gemini-key") return null;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.trimmedApiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      });

      if (!res.ok) {
        const errText = await res.text();
        this.logger.warn("Gemini REST API error", { status: res.status, error: errText });
        return null;
      }

      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      return text || null;
    } catch (err) {
      this.logger.error("Gemini REST fetch failed", err);
      return null;
    }
  }

  async process(request: HarnessRequest): Promise<HarnessResult> {
    const text = (request.input.text || "").trim();
    const hasImage = Boolean(request.input.objectStorageKey);

    // 1. MULTIMODAL OCR & VISION (Task: "ocr")
    if (hasImage && request.input.objectStorageKey && this.storage) {
      const ocrConfig = this.governor.getExecutionConfig("ocr");
      try {
        const stored = await this.storage.get(request.input.objectStorageKey);
        if (stored?.body) {
          this.logger.info("Executing Governed Gemini OCR", {
            model: ocrConfig.model,
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

          let rawText: string | null = null;
          if (this.ai) {
            try {
              const res = await this.ai.models.generateContent({
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
              rawText = res.text || null;
            } catch (sdkErr) {
              this.logger.warn("GoogleGenAI SDK vision error, trying REST fallback", sdkErr);
            }
          }

          if (!rawText) {
            rawText = await this.callGeminiRest(ocrConfig.model, [
              {
                role: "user",
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: stored.mimeType || "image/jpeg",
                      data: base64Data,
                    },
                  },
                ],
              },
            ]);
          }

          if (rawText) {
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
        }
      } catch (err) {
        this.logger.error("Governed OCR call failed, using fallback", err);
      }
    }

    // 2. CONVERSATIONAL MEMORY QUERY (Task: "chat")
    const lower = text.toLowerCase();
    const isQuery =
      lower.includes("เคยส่ง") ||
      lower.includes("สรุปเรื่อง") ||
      lower.includes("หา") ||
      lower.includes("คืออะไร") ||
      lower.includes("นี่อะไร") ||
      lower.includes("อะไร") ||
      lower.includes("สวัสดี") ||
      lower.includes("what") ||
      lower.includes("find") ||
      lower.includes("summarize") ||
      text.endsWith("?") ||
      text.endsWith("มั้ย") ||
      text.endsWith("ไหม");

    if (isQuery) {
      const chatConfig = this.governor.getExecutionConfig("chat");
      try {
        let memoryContext = "No prior memories recorded yet.";
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

        const queryPrompt = `You are MINDROP — a friendly, hyper-intelligent personal knowledge assistant in LINE.
USER QUESTION: "${text}"

USER'S CAPTURED MEMORY CONTEXT:
${memoryContext}

Respond warmly and helpfully in Thai.
If they greeted or asked "นี่อะไร", introduce MINDROP briefly as their personal memory assistant (ช่วยบันทึกสรุปข้อความ รูปภาพ และตอบคำถามจากสิ่งที่เคยบันทึกไว้).
If asking about specific saved topics, summarize based on their actual memory context.`;

        let replyText: string | null = null;
        if (this.ai) {
          try {
            const res = await this.ai.models.generateContent({
              model: chatConfig.model,
              contents: queryPrompt,
            });
            replyText = res.text?.trim() || null;
          } catch (sdkErr) {
            this.logger.warn("SDK chat failed, trying REST fallback", sdkErr);
          }
        }

        if (!replyText) {
          replyText = await this.callGeminiRest(chatConfig.model, [
            { role: "user", parts: [{ text: queryPrompt }] },
          ]);
        }

        return {
          requestId: request.requestId,
          intent: "query_memory",
          responsePolicy: "respond",
          message: {
            text:
              replyText ||
              `สวัสดีครับ! ผมคือ MINDROP ผู้ช่วยบันทึกและจัดการความทรงจำส่วนตัวของคุณ สามารถส่งโน้ต รูปภาพ ลิงก์ หรือสอบถามข้อมูลที่เคยบันทึกไว้ได้ตลอดเวลาครับ`,
          },
        };
      } catch (err) {
        this.logger.error("Governed conversational query error", err);
      }
    }

    // 3. TEXT CAPTURE & DEEP ANALYSIS (Task: "analysis")
    if (text) {
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

        let rawText: string | null = null;
        if (this.ai) {
          try {
            const res = await this.ai.models.generateContent({
              model: analysisConfig.model,
              contents: textPrompt,
            });
            rawText = res.text || null;
          } catch (sdkErr) {
            this.logger.warn("SDK text analysis failed, trying REST fallback", sdkErr);
          }
        }

        if (!rawText) {
          rawText = await this.callGeminiRest(analysisConfig.model, [
            { role: "user", parts: [{ text: textPrompt }] },
          ]);
        }

        if (rawText) {
          const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
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
        }
      } catch (err) {
        this.logger.warn("Governed text analysis failed, using fallback", err);
      }
    }

    // Fallback if offline
    const isProduct = text.includes("personal knowledge") || text.includes("folder") || text.includes("product");
    const defaultTopics = isProduct ? ["Product", "Ideas", "AI"] : ["Note", "Personal Knowledge"];

    return {
      requestId: request.requestId,
      intent: "capture",
      responsePolicy: "ack",
      message: {
        text: "Saved ✓\nNote · Personal Knowledge",
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
