import { describe, expect, it } from 'vitest'
import { loadConfig } from './config.ts'

const base = {
  DATABASE_URL: 'postgres://manv:manv@127.0.0.1:5433/manv',
  PUBLIC_URL: 'http://localhost:5173',
  AUTH_SECRET: 'x'.repeat(32),
}

describe('loadConfig', () => {
  it('parses a complete env and applies defaults', () => {
    expect(loadConfig(base)).toEqual({
      databaseUrl: base.DATABASE_URL,
      port: 3001,
      publicUrl: base.PUBLIC_URL,
      authSecret: base.AUTH_SECRET,
      seedPublish: false,
      nodeEnv: 'development',
    })
  })

  it('parses explicit port, seed flag and node env', () => {
    const config = loadConfig({ ...base, PORT: '8080', SEED_PUBLISH: 'true', NODE_ENV: 'production' })
    expect(config).toMatchObject({ port: 8080, seedPublish: true, nodeEnv: 'production' })
  })

  it('treats an empty PORT as unset', () => {
    expect(loadConfig({ ...base, PORT: '' }).port).toBe(3001)
  })

  it('throws naming a missing AUTH_SECRET', () => {
    expect(() => loadConfig({ ...base, AUTH_SECRET: undefined })).toThrow(/AUTH_SECRET/)
  })

  it('throws for an AUTH_SECRET shorter than 32 characters', () => {
    expect(() => loadConfig({ ...base, AUTH_SECRET: 'short-secret' })).toThrow(/AUTH_SECRET/)
  })

  it('lists every invalid variable', () => {
    expect(() => loadConfig({ PUBLIC_URL: 'not a url' })).toThrow(/DATABASE_URL[\s\S]*PUBLIC_URL[\s\S]*AUTH_SECRET/)
  })
})
