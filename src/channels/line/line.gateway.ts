import { Logger } from "@/infrastructure/observability/logger";

export interface LineMessagingGateway {
  replyText(replyToken: string, text: string): Promise<{ success: boolean; error?: string }>;
  pushText(userId: string, text: string): Promise<{ success: boolean; error?: string }>;
  getMessageContent(messageId: string): Promise<{ body: Buffer; mimeType: string }>;
}

export class HttpLineMessagingGateway implements LineMessagingGateway {
  private apiEndpoint = "https://api.line.me/v2/bot/message";
  private dataEndpoint = "https://api-data.line.me/v2/bot/message";

  constructor(
    channelAccessToken: string,
    private logger: Logger = new Logger({ component: "LineGateway" })
  ) {
    this.channelAccessToken = (channelAccessToken || "").trim();
  }
  private channelAccessToken: string;

  async replyText(replyToken: string, text: string): Promise<{ success: boolean; error?: string }> {
    this.logger.info("Sending LINE reply", {
      replyTokenPrefix: replyToken ? `${replyToken.slice(0, 6)}...` : "none",
      textLength: text.length,
      hasToken: Boolean(this.channelAccessToken),
      tokenLength: this.channelAccessToken.length,
    });

    try {
      const res = await fetch(`${this.apiEndpoint}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.channelAccessToken}`,
        },
        body: JSON.stringify({
          replyToken,
          messages: [{ type: "text", text }],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        this.logger.warn("LINE replyText failed", { status: res.status, error: errText });
        return { success: false, error: `LINE API ${res.status}: ${errText}` };
      }

      this.logger.info("LINE replyText succeeded");
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error("LINE replyText exception", err);
      return { success: false, error: msg };
    }
  }

  async pushText(userId: string, text: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${this.apiEndpoint}/push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.channelAccessToken}`,
        },
        body: JSON.stringify({
          to: userId,
          messages: [{ type: "text", text }],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        this.logger.warn("LINE pushText failed", { status: res.status, error: errText });
        return { success: false, error: `LINE API ${res.status}: ${errText}` };
      }

      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error("LINE pushText exception", err);
      return { success: false, error: msg };
    }
  }

  async getMessageContent(messageId: string): Promise<{ body: Buffer; mimeType: string }> {
    const res = await fetch(`${this.dataEndpoint}/${messageId}/content`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.channelAccessToken}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`LINE getMessageContent failed [${res.status}]: ${errText}`);
    }

    const mimeType = res.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await res.arrayBuffer();
    return {
      body: Buffer.from(arrayBuffer),
      mimeType,
    };
  }
}

export class MockLineMessagingGateway implements LineMessagingGateway {
  public replies: { replyToken: string; text: string; timestamp: string }[] = [];
  public pushes: { userId: string; text: string; timestamp: string }[] = [];
  public contentStore = new Map<string, { body: Buffer; mimeType: string }>();

  public shouldFailReply = false;
  public shouldFailPush = false;
  public shouldFailDownload = false;

  async replyText(replyToken: string, text: string): Promise<{ success: boolean; error?: string }> {
    if (this.shouldFailReply) {
      return { success: false, error: "Mock reply token expired or invalid" };
    }
    this.replies.push({ replyToken, text, timestamp: new Date().toISOString() });
    return { success: true };
  }

  async pushText(userId: string, text: string): Promise<{ success: boolean; error?: string }> {
    if (this.shouldFailPush) {
      return { success: false, error: "Mock push delivery failed" };
    }
    this.pushes.push({ userId, text, timestamp: new Date().toISOString() });
    return { success: true };
  }

  async getMessageContent(messageId: string): Promise<{ body: Buffer; mimeType: string }> {
    if (this.shouldFailDownload) {
      throw new Error("Mock download network failure");
    }
    const content = this.contentStore.get(messageId);
    if (!content) {
      // Default mock binary (small JPEG header buffer)
      return {
        body: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]),
        mimeType: "image/jpeg",
      };
    }
    return content;
  }

  clear() {
    this.replies = [];
    this.pushes = [];
    this.contentStore.clear();
    this.shouldFailReply = false;
    this.shouldFailPush = false;
    this.shouldFailDownload = false;
  }
}
