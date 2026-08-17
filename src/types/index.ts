export type CaptureType = "image" | "link" | "text" | "file";

export type ProcessingStatus = "processing" | "ready" | "needs_review";

export interface CaptureSource {
  channel: "line";
  provider?: string;
  url?: string;
  senderName?: string;
}

export interface CaptureItem {
  id: string;
  type: CaptureType;
  source: CaptureSource;
  title: string;
  rawText?: string;
  summary: string;
  keyIdeas?: string[];
  topics: string[];
  entities?: string[];
  capturedAt: string;
  status: ProcessingStatus;
  thumbnailUrl?: string;
  importanceScore?: number;
  whyItMatters?: string;
  relatedItemIds?: string[];
  category?: "knowledge" | "idea" | "reference" | "task";
  resurfacedContext?: {
    originalDate: string;
    triggerReason: string;
    connectedItemCount: number;
  };
}

export interface KnowledgeSignal {
  id: string;
  title: string;
  description: string;
  supportingItemIds: string[];
  period: string;
  keyTrends: string[];
}

export interface TopicItem {
  id: string;
  name: string;
  count: number;
  description?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: CaptureItem[];
  themeClusters?: {
    title: string;
    points: string[];
  }[];
}
