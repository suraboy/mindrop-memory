export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  requestId?: string;
  traceId?: string;
  eventId?: string;
  captureId?: string;
  actorId?: string;
  jobId?: string;
  harnessRequestId?: string;
  channel?: string;
  [key: string]: unknown;
}

const REDACT_KEYS = ["secret", "token", "authorization", "password", "key", "signature"];

function redact(obj: unknown): unknown {
  if (!obj || typeof obj !== "object") return obj;
  if (Buffer.isBuffer(obj)) return `[Buffer size=${obj.length}]`;
  if (Array.isArray(obj)) return obj.map(redact);

  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const isSensitive = REDACT_KEYS.some((sub) => k.toLowerCase().includes(sub));
    if (isSensitive && typeof v === "string") {
      clean[k] = v.length > 8 ? `${v.slice(0, 4)}...[REDACTED]` : "[REDACTED]";
    } else if (typeof v === "object" && v !== null) {
      clean[k] = redact(v);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

export class Logger {
  constructor(private context: LogContext = {}) {}

  withContext(additional: LogContext): Logger {
    return new Logger({ ...this.context, ...additional });
  }

  private format(level: LogLevel, message: string, data?: unknown) {
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: redact(this.context),
      ...(data ? { data: redact(data) } : {}),
    };

    const out = JSON.stringify(payload);
    if (level === "error") {
      console.error(out);
    } else if (level === "warn") {
      console.warn(out);
    } else {
      console.log(out);
    }
  }

  debug(msg: string, data?: unknown) {
    if (process.env.NODE_ENV !== "test") this.format("debug", msg, data);
  }

  info(msg: string, data?: unknown) {
    if (process.env.NODE_ENV !== "test") this.format("info", msg, data);
  }

  warn(msg: string, data?: unknown) {
    this.format("warn", msg, data);
  }

  error(msg: string, error?: unknown) {
    const errData = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : error;
    this.format("error", msg, errData);
  }
}

export const logger = new Logger({ service: "mindrop-backend" });
