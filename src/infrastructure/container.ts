import { InMemoryCaptureRepository, CaptureRepository } from "@/capture/capture.repository";
import { MemoryObjectStorage, LocalObjectStorage, ObjectStorage } from "@/storage/object-storage";
import { MockAIHarnessClient } from "@/harness/harness.client";
import { AIHarnessClient } from "@/harness/harness.contract";
import { HttpLineMessagingGateway, MockLineMessagingGateway, LineMessagingGateway } from "@/channels/line/line.gateway";
import { InteractionService } from "@/interactions/interaction.service";
import { IngestionProcessor } from "@/ingestion/ingestion.processor";
import { IngestionService } from "@/ingestion/ingestion.service";
import { getConfig } from "./config/env";

export interface ServiceContainer {
  repository: CaptureRepository;
  storage: ObjectStorage;
  harness: AIHarnessClient;
  lineGateway: LineMessagingGateway;
  interactionService: InteractionService;
  processor: IngestionProcessor;
  ingestionService: IngestionService;
}

let defaultContainer: ServiceContainer | null = null;

export function getServiceContainer(overrides?: Partial<ServiceContainer>): ServiceContainer {
  if (defaultContainer && !overrides) {
    return defaultContainer;
  }

  const config = getConfig();

  const repository = overrides?.repository || new InMemoryCaptureRepository();
  const storage =
    overrides?.storage ||
    (config.STORAGE_PROVIDER === "local"
      ? new LocalObjectStorage(config.STORAGE_LOCAL_DIR)
      : new MemoryObjectStorage());

  const harness = overrides?.harness || new MockAIHarnessClient();
  const lineGateway =
    overrides?.lineGateway ||
    (config.LINE_CHANNEL_ACCESS_TOKEN && config.LINE_CHANNEL_ACCESS_TOKEN !== "test-channel-access-token"
      ? new HttpLineMessagingGateway(config.LINE_CHANNEL_ACCESS_TOKEN)
      : new MockLineMessagingGateway());

  const interactionService =
    overrides?.interactionService || new InteractionService(lineGateway, repository);

  const processor =
    overrides?.processor ||
    new IngestionProcessor(repository, storage, harness, lineGateway, interactionService, {
      maxImageSizeBytes: config.MAX_IMAGE_SIZE_BYTES,
      downloadTimeoutMs: config.DOWNLOAD_TIMEOUT_MS,
    });

  const ingestionService =
    overrides?.ingestionService || new IngestionService(repository, processor);

  const container: ServiceContainer = {
    repository,
    storage,
    harness,
    lineGateway,
    interactionService,
    processor,
    ingestionService,
  };

  if (!overrides) {
    defaultContainer = container;
  }

  return container;
}
