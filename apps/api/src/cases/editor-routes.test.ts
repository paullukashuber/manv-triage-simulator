import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import type { CaseDetail, CaseSummary } from '@manv/triage'
import { buildApp } from '../app.ts'
import { createTestDb } from '../db/client.ts'
import { createUserAndLogin } from '../test/auth-helpers.ts'
import { testConfig } from '../test/setup.ts'
import { caseInput } from './fixtures.ts'

const BASE = '/api/editor/cases'
const ORIGIN = new URL(testConfig.publicUrl).origin
const redInput = () =>
  caseInput({
    description: 'Arterielle Blutung am Oberschenkel.',
    expectedCategory: 'red',
    focusFields: ['x'],
    findings: { ambulatory: false, lifeThreateningExtremityBleeding: true },
  })
const yellowInput = () =>
  caseInput({ description: 'Verletzter ohne kritische Befunde.', expectedCategory: 'yellow', findings: { ambulatory: false } })

describe('editor routes', () => {
  let app: FastifyInstance
  let cookie: string
  beforeEach(async () => {
    const deps = { db: await createTestDb(), config: testConfig }
    app = await buildApp(deps)
    cookie = await createUserAndLogin(app, deps, { email: 'trainer@example.test', role: 'trainer' })
  })
  afterEach(async () => {
    await app.close()
  })

  const call = (method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, payload?: unknown, headers = {}) =>
    app.inject({ method, url, payload: payload as object, headers: { cookie, origin: ORIGIN, ...headers } })
  const create = async (input = caseInput()) => (await call('POST', BASE, input)).json<CaseDetail>()
  const trainingDescriptions = async () =>
    (await app.inject({ method: 'GET', url: '/api/training/cases?count=30' }))
      .json<{ cases: { description: string }[] }>()
      .cases.map((c) => c.description)

  describe('access', () => {
    it('401 without a session', async () => {
      const res = await app.inject({ method: 'GET', url: BASE })
      expect(res.statusCode).toBe(401)
    })

    it('403 for a trainee', async () => {
      const deps = { db: await createTestDb(), config: testConfig }
      const other = await buildApp(deps)
      const traineeCookie = await createUserAndLogin(other, deps, { email: 't@example.test', role: 'trainee' })
      const res = await other.inject({ method: 'GET', url: BASE, headers: { cookie: traineeCookie } })
      expect(res.statusCode).toBe(403)
      await other.close()
    })

    it('allows admins', async () => {
      const deps = { db: await createTestDb(), config: testConfig }
      const other = await buildApp(deps)
      const adminCookie = await createUserAndLogin(other, deps, { email: 'a@example.test', role: 'admin' })
      const res = await other.inject({ method: 'GET', url: BASE, headers: { cookie: adminCookie } })
      expect(res.statusCode).toBe(200)
      await other.close()
    })
  })

  describe('origin check on writes', () => {
    it('rejects a missing Origin with 403 forbidden_origin and stores nothing', async () => {
      const res = await app.inject({ method: 'POST', url: BASE, payload: caseInput(), headers: { cookie } })
      expect(res.statusCode).toBe(403)
      expect(res.json()).toEqual({ error: 'forbidden_origin' })
      expect((await call('GET', BASE)).json<{ cases: unknown[] }>().cases).toEqual([])
    })

    it('rejects a foreign Origin on POST, PUT and DELETE', async () => {
      const c = await create()
      const foreign = { origin: 'https://evil.example' }
      expect((await call('POST', BASE, caseInput(), foreign)).statusCode).toBe(403)
      expect((await call('PUT', `${BASE}/${c.id}`, caseInput(), foreign)).statusCode).toBe(403)
      expect((await call('POST', `${BASE}/${c.id}/publish`, undefined, foreign)).statusCode).toBe(403)
      expect((await call('DELETE', `${BASE}/${c.id}`, undefined, foreign)).statusCode).toBe(403)
    })

    it('accepts the correct Origin; reads need no Origin', async () => {
      expect((await call('POST', BASE, caseInput())).statusCode).toBe(201)
      const res = await app.inject({ method: 'GET', url: BASE, headers: { cookie } })
      expect(res.statusCode).toBe(200)
    })

    it('answers 401 before the origin check for anonymous writes', async () => {
      const res = await app.inject({ method: 'POST', url: BASE, payload: caseInput() })
      expect(res.statusCode).toBe(401)
    })
  })

  describe('validation', () => {
    it('400 with field path for a fractional respiratory rate; nothing stored', async () => {
      const bad = caseInput()
      const res = await call('POST', BASE, { ...bad, findings: { ...bad.findings, respiratoryRate: 12.5 } })
      expect(res.statusCode).toBe(400)
      const body = res.json<{ error: string; issues: { path: string }[] }>()
      expect(body.error).toBe('validation')
      expect(body.issues[0]?.path).toBe('findings.respiratoryRate')
      expect((await call('GET', BASE)).json<{ cases: unknown[] }>().cases).toEqual([])
    })

    it('400 for an unknown finding key', async () => {
      const bad = caseInput()
      const res = await call('POST', BASE, { ...bad, findings: { ...bad.findings, bogus: true } })
      expect(res.statusCode).toBe(400)
      expect((await call('GET', BASE)).json<{ cases: unknown[] }>().cases).toEqual([])
    })

    it('400 for an invalid filter', async () => {
      expect((await call('GET', `${BASE}?status=nope`)).statusCode).toBe(400)
    })

    it('400 for an invalid PUT body', async () => {
      const c = await create()
      expect((await call('PUT', `${BASE}/${c.id}`, { description: 'x' })).statusCode).toBe(400)
    })
  })

  describe('ids', () => {
    const unknown = '3f1c0a52-8d2e-4b7a-9a3c-1d2e3f4a5b6c'
    it.each([
      ['GET', ''],
      ['PUT', ''],
      ['POST', '/duplicate'],
      ['POST', '/publish'],
      ['POST', '/archive'],
      ['POST', '/restore'],
      ['DELETE', ''],
    ] as const)('%s %s answers 404 for an unknown or malformed id', async (method, suffix) => {
      for (const id of [unknown, 'not-a-uuid']) {
        const res = await call(method, `${BASE}/${id}${suffix}`, method === 'PUT' ? caseInput() : undefined)
        expect(res.statusCode).toBe(404)
        expect(res.json()).toEqual({ error: 'not_found' })
      }
    })
  })

  describe('lifecycle', () => {
    it('creates a draft with computed category', async () => {
      const res = await call('POST', BASE, redInput())
      expect(res.statusCode).toBe(201)
      const c = res.json<CaseDetail>()
      expect(c).toMatchObject({
        status: 'draft',
        computedCategory: 'red',
        decisiveStep: 'tourniquet',
        publishedRevisionNumber: null,
        hasUnpublishedChanges: false,
      })
      expect((await call('GET', `${BASE}/${c.id}`)).json<CaseDetail>()).toEqual(c)
    })

    it('422 when publishing with a wrong expected category', async () => {
      const c = await create(caseInput({ expectedCategory: 'red' }))
      const res = await call('POST', `${BASE}/${c.id}/publish`)
      expect(res.statusCode).toBe(422)
      expect(res.json()).toEqual({ error: 'expected_category_mismatch', expected: 'red', computed: 'white' })
    })

    it('keeps training on the old revision until re-publish', async () => {
      const c = await create()
      const published = (await call('POST', `${BASE}/${c.id}/publish`)).json<CaseDetail>()
      expect(published).toMatchObject({ status: 'published', publishedRevisionNumber: 1, hasUnpublishedChanges: false })

      const changed = (
        await call('PUT', `${BASE}/${c.id}`, { ...caseInput(), description: 'Neue Beschreibung des Falls.' })
      ).json<CaseDetail>()
      expect(changed).toMatchObject({ status: 'published', hasUnpublishedChanges: true, publishedRevisionNumber: 1 })
      expect(await trainingDescriptions()).toEqual([caseInput().description])

      const again = (await call('POST', `${BASE}/${c.id}/publish`)).json<CaseDetail>()
      expect(again).toMatchObject({ publishedRevisionNumber: 2, hasUnpublishedChanges: false })
      expect(await trainingDescriptions()).toEqual(['Neue Beschreibung des Falls.'])
    })

    it('PUT bumps updatedAt and recomputes the category', async () => {
      const c = await create()
      const res = await call('PUT', `${BASE}/${c.id}`, redInput())
      const updated = res.json<CaseDetail>()
      expect(updated.computedCategory).toBe('red')
      expect(updated.decisiveStep).toBe('tourniquet')
      expect(Date.parse(updated.updatedAt)).toBeGreaterThanOrEqual(Date.parse(c.updatedAt))
      expect(updated.createdAt).toBe(c.createdAt)
    })

    it('DELETE: 409 for a published case, 204 for a never-published draft', async () => {
      const published = await create()
      await call('POST', `${BASE}/${published.id}/publish`)
      const res = await call('DELETE', `${BASE}/${published.id}`)
      expect(res.statusCode).toBe(409)
      expect(res.json()).toEqual({ error: 'case_has_revisions' })

      const draft = await create()
      expect((await call('DELETE', `${BASE}/${draft.id}`)).statusCode).toBe(204)
      expect((await call('GET', `${BASE}/${draft.id}`)).statusCode).toBe(404)
    })

    it('archive removes the case from training; restore returns a draft; publishing an archived case is 409', async () => {
      const c = await create()
      await call('POST', `${BASE}/${c.id}/publish`)
      expect(await trainingDescriptions()).toHaveLength(1)

      const archived = (await call('POST', `${BASE}/${c.id}/archive`)).json<CaseDetail>()
      expect(archived.status).toBe('archived')
      expect(await trainingDescriptions()).toEqual([])

      const blocked = await call('POST', `${BASE}/${c.id}/publish`)
      expect(blocked.statusCode).toBe(409)
      expect(blocked.json()).toEqual({ error: 'case_archived' })

      const restored = (await call('POST', `${BASE}/${c.id}/restore`)).json<CaseDetail>()
      expect(restored.status).toBe('draft')
      expect(await trainingDescriptions()).toEqual([])
    })

    it('duplicate creates a new draft with the same findings', async () => {
      const c = await create(redInput())
      await call('POST', `${BASE}/${c.id}/publish`)
      const res = await call('POST', `${BASE}/${c.id}/duplicate`)
      expect(res.statusCode).toBe(201)
      const copy = res.json<CaseDetail>()
      expect(copy.id).not.toBe(c.id)
      expect(copy).toMatchObject({
        status: 'draft',
        slug: null,
        publishedRevisionNumber: null,
        findings: c.findings,
        description: c.description,
      })
    })
  })

  describe('list and filter', () => {
    beforeEach(async () => {
      await create(caseInput({ description: 'Gehfähig: 100% fit_und munter.' })) // white draft
      const red = await create(redInput())
      await call('POST', `${BASE}/${red.id}/publish`)
      await create(
        caseInput({ ...yellowInput(), description: 'Gelber Fall mit Etikett.', tags: ['kind', 'verkehr'] }),
      )
    })
    const list = async (query: string) =>
      (await call('GET', `${BASE}${query}`)).json<{ cases: CaseSummary[] }>().cases

    it('returns summaries without reasoning/findings, newest update first', async () => {
      const all = await list('')
      expect(all).toHaveLength(3)
      expect(all[0]?.description).toBe('Gelber Fall mit Etikett.')
      expect(all[0]).not.toHaveProperty('findings')
      expect(all[0]).not.toHaveProperty('reasoning')
    })

    it('filters by status and category', async () => {
      expect((await list('?status=draft')).map((c) => c.computedCategory).sort()).toEqual(['white', 'yellow'])
      expect((await list('?category=red')).map((c) => c.status)).toEqual(['published'])
    })

    it('decisiveStep=none matches only cases without a decisive step', async () => {
      const none = await list('?decisiveStep=none')
      expect(none.map((c) => c.computedCategory)).toEqual(['yellow'])
      expect((await list('?decisiveStep=tourniquet')).map((c) => c.computedCategory)).toEqual(['red'])
    })

    it('filters by tag', async () => {
      expect((await list('?tag=kind')).map((c) => c.computedCategory)).toEqual(['yellow'])
      expect(await list('?tag=ki')).toEqual([])
    })

    it('q is a case-insensitive substring match with escaped wildcards', async () => {
      expect((await list('?q=ETIKETT')).map((c) => c.computedCategory)).toEqual(['yellow'])
      expect(await list('?q=%25')).toHaveLength(1) // literal "%" only
      expect(await list('?q=_')).toHaveLength(1) // literal "_" only
    })
  })
})
