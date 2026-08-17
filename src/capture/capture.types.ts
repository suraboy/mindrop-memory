export type CaptureChannel = "line" | "web" | "mobile" | "telegram" | "other";

export type CaptureType = "text" | "image" | "link" | "file" | "audio" | "thought";

export type CaptureStatus =
  | "received"
  | "stored"
  | "queued"
  | "processing"
  | "ready"
  | "failed";

export interface ActorRef {
  id: string; // Internal MINDROP actor ID (e.g. act_123)
  channel: CaptureChannel;
  externalUserId: string; // e.g. LINE U123...
  displayName?: string;
  createdAt: string;
}

export interface SourceRef {
  channel: CaptureChannel;
  externalEventId?: string; // LINE webhook event identifier or hash
  externalMessageId?: string; // LINE messageId
  replyToken?: string;
  deliveredAt: string;
}

export interface StoredObjectRef {
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  originalFileName?: string;
}

export interface CanonicalCapture {
  id: string; // Internal capture ID (e.g. cap_abc123)
  actorId: string;
  source: SourceRef;
  type: CaptureType;
  rawText?: string;
  object?: StoredObjectRef;
  status: CaptureStatus;
  receivedAt: string;
  updatedAt: string;
  understanding?: {
    title?: string;
    summary?: string;
    topics?: string[];
    entities?: string[];
    keyIdeas?: string[];
    importanceScore?: number;
    whyItMatters?: string;
  };
  metadata?: Record<string, unknown>;
}

export type ProcessingJobStatus = "pending" | "processing" | "completed" | "failed";

export interface ProcessingJob {
  id: string;
  captureId: string;
  actorId: string;
  status: ProcessingJobStatus;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  enqueuedAt: string;
  startedAt?: string;
  completedAt?: string;
  replyToken?: string;
  replyTokenExpiresAt?: string;
}

export interface ExternalEventReceipt {
  idempotencyKey: string; // e.g. line:msg:123456 or line:evt:hash
  channel: CaptureChannel;
  externalEventId: string;
  captureId: string;
  actorId: string;
  receivedAt: string;
  status: "accepted" | "processed";
}

export interface InteractionHistoryItem {
  id: string;
  actorId: string;
  channel: CaptureChannel;
  direction: "inbound" | "outbound";
  captureId?: string;
  text: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
