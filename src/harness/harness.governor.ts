export type ModelTaskType = "ocr" | "chat" | "analysis" | "classification";

export type PowerProfileLevel = "economy" | "balanced" | "pro" | "turbo";

export interface ModelExecutionConfig {
  task: ModelTaskType;
  model: string;
  temperature: number;
  topP?: number;
  maxOutputTokens?: number;
  thinkingBudget?: number;
  systemInstruction?: string;
}

export class HarnessGovernor {
  constructor(
    private defaultModel: string = "gemini-3.7-flash",
    private powerLevel: PowerProfileLevel = "balanced",
    private modelOverrides: Partial<Record<ModelTaskType, string>> = {}
  ) {}

  /**
   * Resolves tuned hyperparameters and model selection based on task requirements.
   */
  getExecutionConfig(task: ModelTaskType): ModelExecutionConfig {
    const selectedModel =
      this.modelOverrides[task] ||
      (this.powerLevel === "pro" ? "gemini-3.7-flash" : this.defaultModel);

    switch (task) {
      case "ocr":
        return {
          task: "ocr",
          model: selectedModel,
          temperature: 0.1, // Near zero for factual verbatim extraction
          maxOutputTokens: 2048,
          systemInstruction:
            "You are Pat (แพท) — high-precision document OCR and visual knowledge extraction engine for MINDROP. Extract text verbatim without hallucinations.",
        };

      case "chat":
        return {
          task: "chat",
          model: selectedModel,
          temperature: 0.4, // Natural conversation with strict factual grounding
          maxOutputTokens: 2048,
          systemInstruction:
            "You are Pat (แพท) — the friendly, super-competent AI companion for MINDROP. You assist with all use cases and ground answers strictly in the user's personal memory stream.",
        };

      case "analysis":
        return {
          task: "analysis",
          model: selectedModel,
          temperature: 0.2, // Structured categorization
          maxOutputTokens: 1536,
          systemInstruction:
            "You are Pat (แพท) — semantic knowledge graph analyst for MINDROP. Continuously learn, cluster topics, extract entities, and uncover deep patterns from incoming user captures.",
        };

      case "classification":
      default:
        return {
          task: "classification",
          model: selectedModel,
          temperature: 0.1,
          maxOutputTokens: 512,
          systemInstruction: "Determine user intent: capture vs. query_memory vs. command.",
        };
    }
  }
}
