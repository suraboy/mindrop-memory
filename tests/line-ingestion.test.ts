import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryCaptureRepository } from "@/capture/capture.repository";
import { MemoryObjectStorage } from "@/storage/object-storage";
import { MockAIHarnessClient } from "@/harness/harness.client";
import { MockLineMessagingGateway } from "@/channels/line/line.gateway";
import { InteractionService } from "@/interactions/interaction.service";
import { IngestionProcessor } from "@/ingestion/ingestion.processor";
import { IngestionService } from "@/ingestion/ingestion.service";
import { validateLineSignature } from "@/channels/line/line.signature";
import {
  createLineSignature,
  createTextWebhookEvent,
  createImageWebhookEvent,
  createUnsupportedWebhookEvent,
} from "./fixtures/line-events";

describe("MINDROP LINE Ingestion & Interaction Layer", () => {
  const channelSecret = "secret_key_12345";
  let repository: InMemoryCaptureRepository;
  let storage: MemoryObjectStorage;
  let harness: MockAIHarnessClient;
  let lineGateway: MockLineMessagingGateway;
  let interactionService: InteractionService;
  let processor: IngestionProcessor;
  let ingestionService: IngestionService;

  beforeEach(() => {
    repository = new InMemoryCaptureRepository();
    storage = new MemoryObjectStorage();
    harness = new MockAIHarnessClient();
    lineGateway = new MockLineMessagingGateway();
    interactionService = new InteractionService(lineGateway, repository);
    processor = new IngestionProcessor(
      repository,
      storage,
      harness,
      lineGateway,
      interactionService,
      { maxImageSizeBytes: 10 * 1024 * 1024 }
    );
    ingestionService = new IngestionService(repository, processor);
  });

  // 1. Signature Verification
  it("verifies valid LINE HMAC-SHA256 signature", () => {
    const rawBody = JSON.stringify(createTextWebhookEvent({}));
    const validSig = createLineSignature(rawBody, channelSecret);
    expect(validateLineSignature(rawBody, validSig, channelSecret)).toBe(true);
  });

  it("rejects invalid or tampered signature", () => {
    const rawBody = JSON.stringify(createTextWebhookEvent({}));
    const invalidSig = "invalid_base64_signature";
    expect(validateLineSignature(rawBody, invalidSig, channelSecret)).toBe(false);
    expect(validateLineSignature(rawBody, null, channelSecret)).toBe(false);
    expect(validateLineSignature(rawBody, "", channelSecret)).toBe(false);
  });

  // 2. Text Message Capture Flow
  it("ingests and processes LINE text capture end-to-end", async () => {
    const event = createTextWebhookEvent({
      text: "ทำ personal knowledge ที่ไม่ต้องจัด folder เอง",
      messageId: "msg_txt_01",
    });

    const res = await ingestionService.handleLineWebhook(event.events);
    expect(res.accepted).toBe(1);
    expect(res.duplicate).toBe(0);
    expect(res.capturesCreated.length).toBe(1);

    const captureId = res.capturesCreated[0];

    // Wait for microtask queue processing
    await new Promise((r) => setTimeout(r, 20));

    const capture = await repository.getCaptureById(captureId);
    expect(capture).toBeDefined();
    expect(capture?.type).toBe("text");
    expect(capture?.rawText).toBe("ทำ personal knowledge ที่ไม่ต้องจัด folder เอง");
    expect(capture?.status).toBe("ready");
    expect(capture?.understanding?.topics).toContain("Product");

    // Check interaction & reply delivery
    expect(lineGateway.replies.length).toBe(1);
    expect(lineGateway.replies[0].text).toContain("Saved ✓");
  });

  // 3. Conversational / Memory Query Flow
  it("handles conversational query against memory and sends grounded response", async () => {
    const event = createTextWebhookEvent({
      text: "เราเคยส่งอะไรเกี่ยวกับ agent memory",
      messageId: "msg_query_01",
    });

    const res = await ingestionService.handleLineWebhook(event.events);
    expect(res.accepted).toBe(1);

    await new Promise((r) => setTimeout(r, 20));

    expect(harness.calls.length).toBe(1);
    expect(lineGateway.replies.length).toBe(1);
    expect(lineGateway.replies[0].text).toContain("agent memory");
    expect(lineGateway.replies[0].text).toContain("Episodic memory");
  });

  // 4. Image Message Flow
  it("downloads LINE image, persists in object storage, and updates capture", async () => {
    const fakeImageBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x01, 0x02, 0x03]);
    lineGateway.contentStore.set("img_msg_01", {
      body: fakeImageBuffer,
      mimeType: "image/jpeg",
    });

    const event = createImageWebhookEvent({ messageId: "img_msg_01" });
    const res = await ingestionService.handleLineWebhook(event.events);
    expect(res.accepted).toBe(1);

    await new Promise((r) => setTimeout(r, 20));

    const capture = await repository.getCaptureById(res.capturesCreated[0]);
    expect(capture?.type).toBe("image");
    expect(capture?.object).toBeDefined();
    expect(capture?.object?.mimeType).toBe("image/jpeg");
    expect(capture?.object?.sizeBytes).toBe(fakeImageBuffer.length);

    // Verify binary exists in storage abstraction
    const stored = await storage.get(capture!.object!.storageKey);
    expect(stored?.body).toEqual(fakeImageBuffer);

    // Verify AI understanding updated
    expect(capture?.understanding?.topics).toContain("AI Agents");
  });

  // 5. Idempotency & Duplicate Delivery Protection
  it("guarantees duplicate webhook delivery creates exactly 1 capture and 1 reply", async () => {
    const event = createTextWebhookEvent({ messageId: "msg_dup_01" });

    // First delivery
    const res1 = await ingestionService.handleLineWebhook(event.events);
    expect(res1.accepted).toBe(1);
    expect(res1.duplicate).toBe(0);

    // Second duplicate delivery (same messageId)
    const res2 = await ingestionService.handleLineWebhook(event.events);
    expect(res2.accepted).toBe(0);
    expect(res2.duplicate).toBe(1);

    await new Promise((r) => setTimeout(r, 20));

    // Must be exactly 1 reply sent
    expect(lineGateway.replies.length).toBe(1);
  });

  // 6. Unsupported Events Gracefully Ignored
  it("ignores unsupported LINE events (follow/unfollow/postback) without error", async () => {
    const event = createUnsupportedWebhookEvent("follow");
    const res = await ingestionService.handleLineWebhook(event.events);
    expect(res.accepted).toBe(0);
    expect(res.ignored).toBe(1);
    expect(res.capturesCreated.length).toBe(0);
  });

  // 7. Oversized Image Protection
  it("rejects image exceeding max size limit without losing capture record", async () => {
    const oversizedBuffer = Buffer.alloc(15 * 1024 * 1024); // 15MB
    lineGateway.contentStore.set("img_big", {
      body: oversizedBuffer,
      mimeType: "image/jpeg",
    });

    const event = createImageWebhookEvent({ messageId: "img_big" });
    const res = await ingestionService.handleLineWebhook(event.events);
    expect(res.accepted).toBe(1);

    await new Promise((r) => setTimeout(r, 20));

    const capture = await repository.getCaptureById(res.capturesCreated[0]);
    expect(capture).toBeDefined();
    expect(["stored", "failed"]).toContain(capture?.status);
  });

  // 8. Image Download Failure Resilience
  it("handles image download network error safely without crashing", async () => {
    lineGateway.shouldFailDownload = true;

    const event = createImageWebhookEvent({ messageId: "img_fail_01" });
    const res = await ingestionService.handleLineWebhook(event.events);
    expect(res.accepted).toBe(1);

    await new Promise((r) => setTimeout(r, 20));

    const capture = await repository.getCaptureById(res.capturesCreated[0]);
    expect(capture).toBeDefined();
    expect(["stored", "failed"]).toContain(capture?.status);
  });

  // 9. AI Harness Failure Resilience (Original capture remains persisted)
  it("preserves original capture even if AI Harness fails", async () => {
    harness.shouldFail = true;

    const event = createTextWebhookEvent({
      text: "สำคัญมาก อย่าให้ข้อมูลหาย",
      messageId: "msg_harness_fail_01",
    });

    const res = await ingestionService.handleLineWebhook(event.events);
    const captureId = res.capturesCreated[0];

    await new Promise((r) => setTimeout(r, 20));

    const capture = await repository.getCaptureById(captureId);
    expect(capture).toBeDefined();
    expect(capture?.rawText).toBe("สำคัญมาก อย่าให้ข้อมูลหาย");
    expect(["stored", "failed"]).toContain(capture?.status);
  });

  // 10. AI Response Policy: Silent
  it("does not send LINE message when responsePolicy is silent", async () => {
    harness.customResult = {
      intent: "capture",
      responsePolicy: "silent",
    };

    const event = createTextWebhookEvent({ messageId: "msg_silent_01" });
    await ingestionService.handleLineWebhook(event.events);

    await new Promise((r) => setTimeout(r, 20));

    expect(lineGateway.replies.length).toBe(0);
    expect(lineGateway.pushes.length).toBe(0);
  });

  // 11. Reply Token Fallback to Push Message
  it("gracefully falls back to LINE push message when reply token fails or expires", async () => {
    lineGateway.shouldFailReply = true; // Simulates expired reply token

    const event = createTextWebhookEvent({
      userId: "U_target_push_user",
      messageId: "msg_push_fallback_01",
    });

    await ingestionService.handleLineWebhook(event.events);

    await new Promise((r) => setTimeout(r, 20));

    expect(lineGateway.replies.length).toBe(0);
    expect(lineGateway.pushes.length).toBe(1);
    expect(lineGateway.pushes[0].userId).toBe("U_target_push_user");
  });

  // 12. Actor Isolation Guarantee
  it("guarantees Actor A can never access or retrieve Actor B captures", async () => {
    const eventA = createTextWebhookEvent({ userId: "User_A", messageId: "msg_A_01", text: "Secret A" });
    const eventB = createTextWebhookEvent({ userId: "User_B", messageId: "msg_B_01", text: "Secret B" });

    const resA = await ingestionService.handleLineWebhook(eventA.events);
    const resB = await ingestionService.handleLineWebhook(eventB.events);

    await new Promise((r) => setTimeout(r, 20));

    const capAId = resA.capturesCreated[0];
    const capBId = resB.capturesCreated[0];

    const actorA = await repository.getOrCreateActor("line", "User_A");
    const actorB = await repository.getOrCreateActor("line", "User_B");

    // Actor A queries Actor B's capture -> Must return null
    const crossAccess = await repository.getCaptureById(capBId, actorA.id);
    expect(crossAccess).toBeNull();

    // Actor A queries their own capture -> Returns record
    const ownAccess = await repository.getCaptureById(capAId, actorA.id);
    expect(ownAccess).toBeDefined();
    expect(ownAccess?.rawText).toBe("Secret A");

    // List isolation
    const listA = await repository.listCapturesByActor(actorA.id);
    const listB = await repository.listCapturesByActor(actorB.id);

    expect(listA.every((c) => c.actorId === actorA.id)).toBe(true);
    expect(listB.every((c) => c.actorId === actorB.id)).toBe(true);
  });

  // 13. Same Actor Rapid Multiple Messages
  it("handles rapid multiple captures from the same user cleanly", async () => {
    const event1 = createTextWebhookEvent({ userId: "User_Rapid", messageId: "msg_rap_01", text: "Idea 1" });
    const event2 = createTextWebhookEvent({ userId: "User_Rapid", messageId: "msg_rap_02", text: "Idea 2" });
    const event3 = createTextWebhookEvent({ userId: "User_Rapid", messageId: "msg_rap_03", text: "Idea 3" });

    await Promise.all([
      ingestionService.handleLineWebhook(event1.events),
      ingestionService.handleLineWebhook(event2.events),
      ingestionService.handleLineWebhook(event3.events),
    ]);

    await new Promise((r) => setTimeout(r, 40));

    const actor = await repository.getOrCreateActor("line", "User_Rapid");
    const userCaptures = await repository.listCapturesByActor(actor.id);
    expect(userCaptures.length).toBe(3);
  });
});
