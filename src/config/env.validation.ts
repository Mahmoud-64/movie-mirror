import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(8080),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  CACHE_TTL_SECONDS: z.coerce.number().default(60),
  TMDB_API_BASE_URL: z.string().url().default('https://api.themoviedb.org/3'),
  TMDB_API_TOKEN: z.string().min(1),
  TMDB_SYNC_CRON: z.string().default('0 3 * * *'),
  TMDB_SYNC_PAGES: z.coerce.number().int().positive().default(5),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('1d'),
});

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): AppEnv {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration:\n${parsed.error.toString()}`);
  }
  return parsed.data;
}
