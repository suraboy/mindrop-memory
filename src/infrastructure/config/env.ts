import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  LINE_CHANNEL_SECRET: z.string().min(1).default("test-channel-secret"),
  LINE_CHANNEL_ACCESS_TOKEN: z.string().min(1).default("test-channel-access-token"),
  
  // Database / Supabase
  SUPABASE_URL: z.string().optional().default(process.env.NEXT_PUBLIC_SUPABASE_URL || ""),
  SUPABASE_KEY: z.string().optional().default(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""),
  
  // AI Keys for OCR & Vision Understanding
  OPENAI_API_KEY: z.string().optional().default(process.env.OPENAI_API_KEY || ""),
  GEMINI_API_KEY: z.string().optional().default(process.env.GEMINI_API_KEY || ""),
  GEMINI_MODEL: z.string().default(process.env.GEMINI_MODEL || "gemini-2.0-flash"),
  
  STORAGE_PROVIDER: z.enum(["memory", "local", "s3", "r2"]).default("memory"),
  STORAGE_LOCAL_DIR: z.string().default("./.storage"),
  MAX_IMAGE_SIZE_BYTES: z.coerce.number().default(10 * 1024 * 1024), // 10MB
  DOWNLOAD_TIMEOUT_MS: z.coerce.number().default(10000), // 10s
  HARNESS_TIMEOUT_MS: z.coerce.number().default(15000), // 15s
  REPLY_TOKEN_MAX_AGE_MS: z.coerce.number().default(25000), // 25s LINE budget
});

export type AppConfig = z.infer<typeof envSchema>;

let cachedConfig: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (cachedConfig) return cachedConfig;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errorDetails = JSON.stringify(result.error.format(), null, 2);
    throw new Error(`[Config] Invalid environment variables:\n${errorDetails}`);
  }

  cachedConfig = result.data;
  return cachedConfig;
}

export function resetConfigForTesting(overrides?: Partial<AppConfig>) {
  cachedConfig = envSchema.parse({
    ...process.env,
    ...overrides,
  });
}
