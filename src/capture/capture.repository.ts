import {
  ActorRef,
  CanonicalCapture,
  CaptureChannel,
  ExternalEventReceipt,
  InteractionHistoryItem,
  ProcessingJob,
} from "./capture.types";
import crypto from "crypto";

export interface CaptureRepository {
  getOrCreateActor(channel: CaptureChannel, externalUserId: string): Promise<ActorRef>;
  getActorById(actorId: string): Promise<ActorRef | null>;

  // Idempotency
  acquireEventLock(
    idempotencyKey: string,
    channel: CaptureChannel,
    externalEventId: string,
    actorId: string,
    captureId: string
  ): Promise<{ acquired: boolean; receipt: ExternalEventReceipt }>;

  markEventProcessed(idempotencyKey: string): Promise<void>;

  // Captures
  saveCapture(capture: CanonicalCapture): Promise<CanonicalCapture>;
  getCaptureById(captureId: string, actorId?: string): Promise<CanonicalCapture | null>;
  updateCapture(captureId: string, updates: Partial<CanonicalCapture>): Promise<CanonicalCapture | null>;
  listCapturesByActor(actorId: string): Promise<CanonicalCapture[]>;

  // Processing Jobs
  saveJob(job: ProcessingJob): Promise<ProcessingJob>;
  getJobById(jobId: string): Promise<ProcessingJob | null>;
  updateJob(jobId: string, updates: Partial<ProcessingJob>): Promise<ProcessingJob | null>;

  // Interaction History
  recordInteraction(item: Omit<InteractionHistoryItem, "id">): Promise<InteractionHistoryItem>;
  getRecentInteractions(actorId: string, limit?: number): Promise<InteractionHistoryItem[]>;
}

export class InMemoryCaptureRepository implements CaptureRepository {
  private actors = new Map<string, ActorRef>(); // actorId -> ActorRef
  private actorByChannelUser = new Map<string, string>(); // "channel:externalUserId" -> actorId
  private captures = new Map<string, CanonicalCapture>(); // captureId -> CanonicalCapture
  private receipts = new Map<string, ExternalEventReceipt>(); // idempotencyKey -> ExternalEventReceipt
  private jobs = new Map<string, ProcessingJob>(); // jobId -> ProcessingJob
  private interactions: InteractionHistoryItem[] = [];

  async getOrCreateActor(channel: CaptureChannel, externalUserId: string): Promise<ActorRef> {
    const key = `${channel}:${externalUserId}`;
    const existingActorId = this.actorByChannelUser.get(key);
    if (existingActorId) {
      return this.actors.get(existingActorId)!;
    }

    const actorId = `act_${crypto.randomBytes(6).toString("hex")}`;
    const actor: ActorRef = {
      id: actorId,
      channel,
      externalUserId,
      createdAt: new Date().toISOString(),
    };
    this.actors.set(actorId, actor);
    this.actorByChannelUser.set(key, actorId);
    return actor;
  }

  async getActorById(actorId: string): Promise<ActorRef | null> {
    return this.actors.get(actorId) || null;
  }

  async acquireEventLock(
    idempotencyKey: string,
    channel: CaptureChannel,
    externalEventId: string,
    actorId: string,
    captureId: string
  ): Promise<{ acquired: boolean; receipt: ExternalEventReceipt }> {
    const existing = this.receipts.get(idempotencyKey);
    if (existing) {
      return { acquired: false, receipt: existing };
    }

    const receipt: ExternalEventReceipt = {
      idempotencyKey,
      channel,
      externalEventId,
      actorId,
      captureId,
      receivedAt: new Date().toISOString(),
      status: "accepted",
    };
    this.receipts.set(idempotencyKey, receipt);
    return { acquired: true, receipt };
  }

  async markEventProcessed(idempotencyKey: string): Promise<void> {
    const r = this.receipts.get(idempotencyKey);
    if (r) {
      r.status = "processed";
    }
  }

  async saveCapture(capture: CanonicalCapture): Promise<CanonicalCapture> {
    this.captures.set(capture.id, { ...capture });
    return capture;
  }

  async getCaptureById(captureId: string, actorId?: string): Promise<CanonicalCapture | null> {
    const cap = this.captures.get(captureId);
    if (!cap) return null;
    // Enforce Actor Isolation
    if (actorId && cap.actorId !== actorId) {
      return null;
    }
    return { ...cap };
  }

  async updateCapture(captureId: string, updates: Partial<CanonicalCapture>): Promise<CanonicalCapture | null> {
    const cap = this.captures.get(captureId);
    if (!cap) return null;
    const updated = {
      ...cap,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.captures.set(captureId, updated);
    return updated;
  }

  async listCapturesByActor(actorId: string): Promise<CanonicalCapture[]> {
    return Array.from(this.captures.values())
      .filter((c) => c.actorId === actorId)
      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
  }

  async saveJob(job: ProcessingJob): Promise<ProcessingJob> {
    this.jobs.set(job.id, { ...job });
    return job;
  }

  async getJobById(jobId: string): Promise<ProcessingJob | null> {
    return this.jobs.get(jobId) || null;
  }

  async updateJob(jobId: string, updates: Partial<ProcessingJob>): Promise<ProcessingJob | null> {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    const updated = { ...job, ...updates };
    this.jobs.set(jobId, updated);
    return updated;
  }

  async recordInteraction(item: Omit<InteractionHistoryItem, "id">): Promise<InteractionHistoryItem> {
    const fullItem: InteractionHistoryItem = {
      id: `int_${crypto.randomBytes(6).toString("hex")}`,
      ...item,
    };
    this.interactions.push(fullItem);
    return fullItem;
  }

  async getRecentInteractions(actorId: string, limit = 10): Promise<InteractionHistoryItem[]> {
    return this.interactions
      .filter((i) => i.actorId === actorId)
      .slice(-limit);
  }

  clear() {
    this.actors.clear();
    this.actorByChannelUser.clear();
    this.captures.clear();
    this.receipts.clear();
    this.jobs.clear();
    this.interactions = [];
  }
}
