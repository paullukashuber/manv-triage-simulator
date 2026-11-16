import { afterEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from './app.ts'
import { createTestDb } from './db/client.ts'
import { cases } from './db/schema.ts'
import { testConfig } from './test/setup.ts'

describe('buildApp', () => {
  let app: FastifyInstance | undefined
  afterEach(async () => {
    await app?.close()
    app = undefined
  })

  it('answers GET /api/health', async () => {
    app = await buildApp({ db: await createTestDb(), config: testConfig })
    const res = await app.inject({ method: 'GET', url: '/api/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ status: 'ok' })
  })

  it('runs against a migrated database (cases table exists)', async () => {
    const db = await createTestDb()
    app = await buildApp({ db, config: testConfig })
    expect(await db.select().from(cases)).toEqual([])
  })
})
