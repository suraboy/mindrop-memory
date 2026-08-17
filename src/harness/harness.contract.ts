import { CaptureType, InteractionHistoryItem } from "@/capture/capture.types";

export interface HarnessRequest {
  requestId: string;
  actorId: string;
  interaction: {
    channel: "line" | "web" | "mobile" | "other";
    replyToken?: string;
  };
  capture?: {
    id: string;
    type: CaptureType;
  };
  input: {
    text?: string;
    objectStorageKey?: string;
    mimeType?: string;
    sizeBytes?: number;
  };
  recentHistory?: InteractionHistoryItem[];
}

export type HarnessIntent =
  | "capture"
  | "query_memory"
  | "follow_up"
  | "command"
  | "unsupported";

export type HarnessResponsePolicy = "silent" | "ack" | "respond";

export interface HarnessResult {
  requestId: string;
  intent: HarnessIntent;
  responsePolicy: HarnessResponsePolicy;
  message?: {
    text: string;
  };
  captureResult?: {
    title?: string;
    summary?: string;
    topics?: string[];
    entities?: string[];
    keyIdeas?: string[];
    importanceScore?: number;
    whyItMatters?: string;
  };
}

export interface AIHarnessClient {
  process(request: HarnessRequest): Promise<HarnessResult>;
}
