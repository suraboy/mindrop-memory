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
      (this.powerLevel === "pro" ? "gemini-2.0-pro-exp-02-05" : this.defaultModel);

    switch (task) {
      case "ocr":
        return {
          task: "ocr",
          model: selectedModel,
          temperature: 0.1, // Near zero for factual verbatim extraction
          maxOutputTokens: 2048,
          systemInstruction:
            "You are a high-precision OCR and document analysis engine. Extract legible text verbatim with zero hallucinations.",
        };

      case "chat":
        return {
          task: "chat",
          model: selectedModel,
          temperature: 0.4, // Natural conversation with strict factual grounding
          maxOutputTokens: 2048,
          systemInstruction:
            "You are MINDROP personal intelligence companion. Answer questions using only the user's personal memory captures.",
        };

      case "analysis":
        return {
          task: "analysis",
          model: selectedModel,
          temperature: 0.2, // Structured categorization
          maxOutputTokens: 1536,
          systemInstruction:
            "You are a semantic graph analyst. Classify topics, extract key entities, and discover connections across user captures.",
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
