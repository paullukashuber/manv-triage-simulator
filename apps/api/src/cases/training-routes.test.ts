import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { trainingCaseSchema } from '@manv/triage'
import { buildApp } from '../app.ts'
import { createTestDb } from '../db/client.ts'
import { testConfig } from '../test/setup.ts'
import { caseInput } from './fixtures.ts'
import { createCase, publishCase } from './service.ts'

describe('GET /api/training/cases', () => {
  let app: FastifyInstance
  beforeEach(async () => {
    const db = await createTestDb()
    for (let i = 0; i < 12; i++)
      await publishCase(db, (await createCase(db, caseInput(), null)).id, null)
    app = await buildApp({ db, config: testConfig })
  })
  afterEach(async () => {
    await app.close()
  })

  it.each(['0', '31', 'abc', '2.5', ''])('rejects count=%s with 400', async (count) => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/training/cases?count=${count}`,
    })
    expect(res.statusCode).toBe(400)
    const body = res.json<{
      error: string
      issues: { path: string; message: string }[]
    }>()
    expect(body.error).toBe('validation')
    expect(body.issues[0]?.path).toBe('count')
  })

  it('defaults to at most 10 valid cases', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/training/cases' })
    expect(res.statusCode).toBe(200)
    const { cases } = res.json<{ cases: unknown[] }>()
    expect(cases).toHaveLength(10)
    for (const c of cases) expect(trainingCaseSchema.safeParse(c).success).toBe(true)
  })

  it('honours count', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/training/cases?count=3',
    })
    expect(res.json<{ cases: unknown[] }>().cases).toHaveLength(3)
  })
})
