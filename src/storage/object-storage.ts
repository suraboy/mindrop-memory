import fs from "fs/promises";
import path from "path";

export interface StoredObject {
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  storedAt: string;
}

export interface ObjectStorage {
  put(input: {
    key: string;
    body: Buffer;
    mimeType: string;
  }): Promise<StoredObject>;

  get(key: string): Promise<{
    body: Buffer;
    mimeType: string;
    sizeBytes: number;
  } | null>;

  delete(key: string): Promise<boolean>;

  exists(key: string): Promise<boolean>;
}

export class MemoryObjectStorage implements ObjectStorage {
  private store = new Map<string, { body: Buffer; mimeType: string; storedAt: string }>();

  async put(input: { key: string; body: Buffer; mimeType: string }): Promise<StoredObject> {
    this.store.set(input.key, {
      body: input.body,
      mimeType: input.mimeType,
      storedAt: new Date().toISOString(),
    });
    return {
      storageKey: input.key,
      mimeType: input.mimeType,
      sizeBytes: input.body.length,
      storedAt: new Date().toISOString(),
    };
  }

  async get(key: string) {
    const item = this.store.get(key);
    if (!item) return null;
    return {
      body: item.body,
      mimeType: item.mimeType,
      sizeBytes: item.body.length,
    };
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  clear() {
    this.store.clear();
  }
}

export class LocalObjectStorage implements ObjectStorage {
  constructor(private baseDir: string = "./.storage") {}

  private getFilePath(key: string): string {
    const safeKey = key.replace(/[^a-zA-Z0-9._-]/g, "_");
    return path.join(this.baseDir, safeKey);
  }

  private getMetaPath(key: string): string {
    return `${this.getFilePath(key)}.meta.json`;
  }

  private async ensureDir() {
    await fs.mkdir(this.baseDir, { recursive: true });
  }

  async put(input: { key: string; body: Buffer; mimeType: string }): Promise<StoredObject> {
    await this.ensureDir();
    const filePath = this.getFilePath(input.key);
    const metaPath = this.getMetaPath(input.key);

    await fs.writeFile(filePath, input.body);
    const metadata = {
      mimeType: input.mimeType,
      sizeBytes: input.body.length,
      storedAt: new Date().toISOString(),
    };
    await fs.writeFile(metaPath, JSON.stringify(metadata), "utf-8");

    return {
      storageKey: input.key,
      mimeType: input.mimeType,
      sizeBytes: input.body.length,
      storedAt: metadata.storedAt,
    };
  }

  async get(key: string) {
    try {
      const filePath = this.getFilePath(key);
      const metaPath = this.getMetaPath(key);
      const [body, metaRaw] = await Promise.all([
        fs.readFile(filePath),
        fs.readFile(metaPath, "utf-8"),
      ]);
      const meta = JSON.parse(metaRaw);
      return {
        body,
        mimeType: meta.mimeType || "application/octet-stream",
        sizeBytes: body.length,
      };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await Promise.all([
        fs.unlink(this.getFilePath(key)),
        fs.unlink(this.getMetaPath(key)).catch(() => {}),
      ]);
      return true;
    } catch {
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.getFilePath(key));
      return true;
    } catch {
      return false;
    }
  }
}
