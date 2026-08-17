import {
  ActorRef,
  CanonicalCapture,
  CaptureChannel,
  ExternalEventReceipt,
  InteractionHistoryItem,
  ProcessingJob,
} from "./capture.types";
import crypto from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

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
  listCapturesByActor(actorId?: string): Promise<CanonicalCapture[]>;

  // Processing Jobs
  saveJob(job: ProcessingJob): Promise<ProcessingJob>;
  getJobById(jobId: string): Promise<ProcessingJob | null>;
  updateJob(jobId: string, updates: Partial<ProcessingJob>): Promise<ProcessingJob | null>;

  // Interaction History
  recordInteraction(item: Omit<InteractionHistoryItem, "id">): Promise<InteractionHistoryItem>;
  getRecentInteractions(actorId: string, limit?: number): Promise<InteractionHistoryItem[]>;
}

export class InMemoryCaptureRepository implements CaptureRepository {
  public actors = new Map<string, ActorRef>();
  public actorByChannelUser = new Map<string, string>();
  public captures = new Map<string, CanonicalCapture>();
  public receipts = new Map<string, ExternalEventReceipt>();
  public jobs = new Map<string, ProcessingJob>();
  public interactions: InteractionHistoryItem[] = [];

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

  async listCapturesByActor(actorId?: string): Promise<CanonicalCapture[]> {
    return Array.from(this.captures.values())
      .filter((c) => !actorId || c.actorId === actorId)
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

export class SupabaseCaptureRepository implements CaptureRepository {
  private client: SupabaseClient;
  private memoryFallback = new InMemoryCaptureRepository();

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  async getOrCreateActor(channel: CaptureChannel, externalUserId: string): Promise<ActorRef> {
    try {
      const { data, error } = await this.client
        .from("actors")
        .select("*")
        .eq("channel", channel)
        .eq("external_user_id", externalUserId)
        .maybeSingle();

      if (data && !error) {
        return {
          id: data.id,
          channel: data.channel,
          externalUserId: data.external_user_id,
          displayName: data.display_name,
          createdAt: data.created_at,
        };
      }

      const actorId = `act_${crypto.randomBytes(6).toString("hex")}`;
      const newActor = {
        id: actorId,
        channel,
        external_user_id: externalUserId,
        created_at: new Date().toISOString(),
      };

      await this.client.from("actors").insert(newActor);
      return {
        id: actorId,
        channel,
        externalUserId,
        createdAt: newActor.created_at,
      };
    } catch {
      return this.memoryFallback.getOrCreateActor(channel, externalUserId);
    }
  }

  async getActorById(actorId: string): Promise<ActorRef | null> {
    try {
      const { data } = await this.client
        .from("actors")
        .select("*")
        .eq("id", actorId)
        .maybeSingle();

      if (!data) return this.memoryFallback.getActorById(actorId);

      return {
        id: data.id,
        channel: data.channel,
        externalUserId: data.external_user_id,
        displayName: data.display_name,
        createdAt: data.created_at,
      };
    } catch {
      return this.memoryFallback.getActorById(actorId);
    }
  }

  async acquireEventLock(
    idempotencyKey: string,
    channel: CaptureChannel,
    externalEventId: string,
    actorId: string,
    captureId: string
  ): Promise<{ acquired: boolean; receipt: ExternalEventReceipt }> {
    try {
      const { data: existing } = await this.client
        .from("event_receipts")
        .select("*")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();

      if (existing) {
        return {
          acquired: false,
          receipt: {
            idempotencyKey: existing.idempotency_key,
            channel: existing.channel,
            externalEventId: existing.external_event_id,
            captureId: existing.capture_id,
            actorId: existing.actor_id,
            status: existing.status,
            receivedAt: existing.received_at,
          },
        };
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

      await this.client.from("event_receipts").insert({
        idempotency_key: idempotencyKey,
        channel,
        external_event_id: externalEventId,
        actor_id: actorId,
        capture_id: captureId,
        status: "accepted",
        received_at: receipt.receivedAt,
      });

      return { acquired: true, receipt };
    } catch {
      return this.memoryFallback.acquireEventLock(idempotencyKey, channel, externalEventId, actorId, captureId);
    }
  }

  async markEventProcessed(idempotencyKey: string): Promise<void> {
    try {
      await this.client
        .from("event_receipts")
        .update({ status: "processed" })
        .eq("idempotency_key", idempotencyKey);
    } catch {
      await this.memoryFallback.markEventProcessed(idempotencyKey);
    }
  }

  async saveCapture(capture: CanonicalCapture): Promise<CanonicalCapture> {
    try {
      await this.client.from("captures").upsert({
        id: capture.id,
        actor_id: capture.actorId,
        channel: capture.source.channel,
        capture_type: capture.type,
        raw_text: capture.rawText,
        ocr_text: capture.ocrText,
        source: capture.source,
        object_ref: capture.object,
        status: capture.status,
        understanding: capture.understanding,
        topics: capture.understanding?.topics || [],
        created_at: capture.receivedAt,
        updated_at: capture.updatedAt,
      });
      // also cache in memory
      await this.memoryFallback.saveCapture(capture);
      return capture;
    } catch {
      return this.memoryFallback.saveCapture(capture);
    }
  }

  async getCaptureById(captureId: string, actorId?: string): Promise<CanonicalCapture | null> {
    try {
      let query = this.client.from("captures").select("*").eq("id", captureId);
      if (actorId) query = query.eq("actor_id", actorId);
      const { data } = await query.maybeSingle();

      if (!data) return this.memoryFallback.getCaptureById(captureId, actorId);

      return {
        id: data.id,
        actorId: data.actor_id,
        source: data.source || { channel: "line", deliveredAt: data.created_at },
        type: data.capture_type,
        rawText: data.raw_text,
        ocrText: data.ocr_text,
        object: data.object_ref,
        status: data.status,
        understanding: data.understanding,
        receivedAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch {
      return this.memoryFallback.getCaptureById(captureId, actorId);
    }
  }

  async updateCapture(captureId: string, updates: Partial<CanonicalCapture>): Promise<CanonicalCapture | null> {
    try {
      const dbUpdates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.understanding) {
        dbUpdates.understanding = updates.understanding;
        dbUpdates.topics = updates.understanding.topics || [];
      }
      if (updates.object) dbUpdates.object_ref = updates.object;
      if (updates.ocrText) dbUpdates.ocr_text = updates.ocrText;

      await this.client.from("captures").update(dbUpdates).eq("id", captureId);
      return this.memoryFallback.updateCapture(captureId, updates);
    } catch {
      return this.memoryFallback.updateCapture(captureId, updates);
    }
  }

  async listCapturesByActor(actorId?: string): Promise<CanonicalCapture[]> {
    try {
      let query = this.client
        .from("captures")
        .select("*")
        .order("created_at", { ascending: false });

      if (actorId) query = query.eq("actor_id", actorId);

      const { data, error } = await query;
      if (error || !data) return this.memoryFallback.listCapturesByActor(actorId);

      return data.map((d) => ({
        id: d.id,
        actorId: d.actor_id,
        source: d.source || { channel: "line", deliveredAt: d.created_at },
        type: d.capture_type,
        rawText: d.raw_text,
        ocrText: d.ocr_text,
        object: d.object_ref,
        status: d.status,
        understanding: d.understanding,
        receivedAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    } catch {
      return this.memoryFallback.listCapturesByActor(actorId);
    }
  }

  async saveJob(job: ProcessingJob): Promise<ProcessingJob> {
    return this.memoryFallback.saveJob(job);
  }

  async getJobById(jobId: string): Promise<ProcessingJob | null> {
    return this.memoryFallback.getJobById(jobId);
  }

  async updateJob(jobId: string, updates: Partial<ProcessingJob>): Promise<ProcessingJob | null> {
    return this.memoryFallback.updateJob(jobId, updates);
  }

  async recordInteraction(item: Omit<InteractionHistoryItem, "id">): Promise<InteractionHistoryItem> {
    try {
      const id = `int_${crypto.randomBytes(6).toString("hex")}`;
      await this.client.from("interactions").insert({
        id,
        actor_id: item.actorId,
        channel: item.channel,
        direction: item.direction,
        capture_id: item.captureId,
        text: item.text,
        metadata: item.metadata,
        created_at: item.timestamp,
      });
      return { id, ...item };
    } catch {
      return this.memoryFallback.recordInteraction(item);
    }
  }

  async getRecentInteractions(actorId: string, limit = 10): Promise<InteractionHistoryItem[]> {
    try {
      const { data } = await this.client
        .from("interactions")
        .select("*")
        .eq("actor_id", actorId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!data) return this.memoryFallback.getRecentInteractions(actorId, limit);

      return data.reverse().map((d) => ({
        id: d.id,
        actorId: d.actor_id,
        channel: d.channel,
        direction: d.direction,
        capture_id: d.capture_id,
        text: d.text,
        metadata: d.metadata,
        timestamp: d.created_at,
      }));
    } catch {
      return this.memoryFallback.getRecentInteractions(actorId, limit);
    }
  }
}
