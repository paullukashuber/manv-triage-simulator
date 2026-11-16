import type { Config } from '../config.ts'

export const testConfig: Config = {
  databaseUrl: 'postgres://unused',
  port: 0,
  publicUrl: 'http://localhost:5173',
  authSecret: 'test-secret-test-secret-test-secret-1234',
  seedPublish: false,
  nodeEnv: 'test',
}
