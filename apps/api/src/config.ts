import { z } from 'zod'

export type Config = {
  databaseUrl: string
  port: number
  publicUrl: string
  authSecret: string
  seedPublish: boolean
  nodeEnv: 'development' | 'production' | 'test'
}

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.preprocess((v) => (v === '' ? undefined : v), z.coerce.number().int().min(0).max(65535).default(3001)),
  PUBLIC_URL: z.url(),
  AUTH_SECRET: z.string().min(32),
  SEED_PUBLISH: z.enum(['true', 'false']).default('false'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export function loadConfig(env: Record<string, string | undefined>): Config {
  const parsed = envSchema.safeParse(env)
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
    throw new Error(`Invalid environment configuration:\n${problems.join('\n')}`)
  }
  const e = parsed.data
  return {
    databaseUrl: e.DATABASE_URL,
    port: e.PORT,
    publicUrl: e.PUBLIC_URL,
    authSecret: e.AUTH_SECRET,
    seedPublish: e.SEED_PUBLISH === 'true',
    nodeEnv: e.NODE_ENV,
  }
}
