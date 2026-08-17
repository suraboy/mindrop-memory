import { CaptureItem, KnowledgeSignal, TopicItem } from "@/types";

export const MOCK_TOPICS: TopicItem[] = [];

export const MOCK_CAPTURES: CaptureItem[] = [];

export const MOCK_WEEKLY_SIGNAL: KnowledgeSignal = {
  id: "sig-week-empty",
  title: "This week's signal",
  description: "Start dropping thoughts into LINE to discover emerging themes.",
  period: "This Week",
  supportingItemIds: [],
  keyTrends: [
    "No captured items yet",
    "Drop links, text or screenshots to LINE bot to generate intelligence signals",
  ],
};
