-- ============================================================
-- MINDROP — DATABASE SCHEMA FOR SUPABASE / POSTGRESQL
-- ============================================================

-- 1. Actors (Users across channels: LINE, Web, Mobile)
CREATE TABLE IF NOT EXISTS actors (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL DEFAULT 'line',
  external_user_id TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_actor_channel_external UNIQUE (channel, external_user_id)
);

-- 2. Captures (Raw Ingested Thoughts, Images, Links, OCR data)
CREATE TABLE IF NOT EXISTS captures (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'line',
  capture_type TEXT NOT NULL, -- 'text' | 'image' | 'link' | 'file'
  raw_text TEXT,
  ocr_text TEXT,
  source JSONB NOT NULL DEFAULT '{}'::jsonb,
  object_ref JSONB, -- { storageKey, mimeType, sizeBytes, publicUrl }
  status TEXT NOT NULL DEFAULT 'received', -- 'received' | 'processing' | 'ready' | 'failed'
  understanding JSONB DEFAULT '{}'::jsonb, -- { title, summary, topics, entities, keyIdeas, importanceScore }
  topics TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_captures_actor_id ON captures(actor_id);
CREATE INDEX IF NOT EXISTS idx_captures_created_at ON captures(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_captures_topics ON captures USING GIN(topics);

-- 3. Event Receipts (Idempotency Lock to prevent duplicate webhooks)
CREATE TABLE IF NOT EXISTS event_receipts (
  idempotency_key TEXT PRIMARY KEY,
  channel TEXT NOT NULL,
  external_event_id TEXT NOT NULL,
  capture_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'accepted',
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Interaction History (Conversational Q&A and Bot Replies)
CREATE TABLE IF NOT EXISTS interactions (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'line',
  direction TEXT NOT NULL, -- 'inbound' | 'outbound'
  capture_id TEXT,
  text TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interactions_actor ON interactions(actor_id, created_at DESC);
