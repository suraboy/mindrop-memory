# LINE Official Account & Messaging API Setup Guide

This guide walks through configuring LINE Messaging API for **MINDROP** personal intelligence ingestion.

---

## 1. Create LINE Developers Provider & Messaging API Channel

1. Log in to [LINE Developers Console](https://developers.line.biz/console/).
2. Click **Create a new provider** (e.g. `MINDROP Intelligence`).
3. Under the provider, click **Create a Messaging API channel**.
4. Fill in required details:
   - **Channel name**: `MINDROP` (or `@mindrop_memory`)
   - **Channel description**: `Personal AI Knowledge Memory`
   - **Category**: Product / Productivity

---

## 2. Obtain Credentials

1. Go to **Basic settings** tab:
   - Copy **Channel secret** → Set as `LINE_CHANNEL_SECRET` in `.env` / Vercel.
2. Go to **Messaging API** tab:
   - Scroll to bottom → **Channel access token (long-lived)**.
   - Click **Issue** → Copy token → Set as `LINE_CHANNEL_ACCESS_TOKEN`.

---

## 3. Configure Webhook URL

1. In the **Messaging API** tab:
   - **Webhook URL**: `https://your-domain.vercel.app/api/webhooks/line` (or your ngrok / tunnel URL during local dev)
   - Click **Update**.
2. Turn **Use webhook** toggle to **Enabled** (ON).
3. Click **Verify** to send a test ping. (Should return Success 200).

---

## 4. Disable Conflicting Default Auto-Replies

1. In **Messaging API** tab → scroll to **LINE Official Account features** → click **Edit** (opens LINE Official Account Manager).
2. Go to **Settings** → **Response settings**:
   - **Response mode**: `Bot`
   - **Auto-response messages**: `Disabled` (OFF)
   - **Greeting message**: `Disabled` or customize
   - **Webhooks**: `Enabled` (ON)

---

## 5. Configure Environment Variables

In `.env.local` or Vercel Environment Variables:

```bash
LINE_CHANNEL_SECRET="your-channel-secret"
LINE_CHANNEL_ACCESS_TOKEN="your-channel-access-token"
STORAGE_PROVIDER="memory" # or "r2" / "s3"
```

---

## 6. Testing & Verifying Ingestion

1. Add your LINE Bot as a friend via QR code in **Messaging API** tab.
2. **Text Capture Test**: Send `"ทำ personal knowledge ที่ไม่ต้องจัด folder เอง"` → Bot responds `Saved ✓`.
3. **Image Capture Test**: Send an architecture diagram screenshot → Bot downloads, stores in Object Storage, extracts topics, responds `Saved ✓`.
4. **Memory Query Test**: Send `"เราเคยส่งอะไรเกี่ยวกับ agent memory"` → Bot queries past knowledge and returns structured synthesis.
