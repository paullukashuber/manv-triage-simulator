import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { eq } from 'drizzle-orm'
import { user } from '../db/schema.ts'
import { buildApp, type AppDeps } from '../app.ts'
import { createTestDb } from '../db/client.ts'
import { testConfig } from '../test/setup.ts'
import { cookieHeader, createUserAndLogin, signIn, TEST_PASSWORD, testPassword } from '../test/auth-helpers.ts'
import { runCli } from '../cli.ts'
import { requireRole } from './guards.ts'

const quiet = { stdout: () => undefined }

describe('authentication', () => {
  let deps: AppDeps
  let app: FastifyInstance
  beforeEach(async () => {
    deps = { db: await createTestDb(), config: testConfig }
    app = await buildApp(deps)
  })
  afterEach(async () => {
    await app.close()
  })

  it('rejects public sign-up', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up/email',
      payload: { email: 'new@example.test', password: testPassword(), name: 'Neu' },
    })
    expect(res.statusCode).toBeGreaterThanOrEqual(400)
    expect(res.statusCode).toBeLessThan(500)
    expect(await runCli(['set-role', '--email', 'new@example.test', '--role', 'admin'], { ...deps, ...quiet })).not.toBe(0)
  })

  it('signs in a CLI-created user and reports the role in the session', async () => {
    const code = await runCli(
      ['create-user', '--email', 't@example.test', '--name', 'T', '--role', 'trainer', '--password', TEST_PASSWORD],
      { ...deps, ...quiet },
    )
    expect(code).toBe(0)

    const login = await signIn(app, 't@example.test', TEST_PASSWORD)
    expect(login.statusCode).toBe(200)
    const session = login.cookies.find((c) => c.name.endsWith('session_token'))
    expect(session).toMatchObject({ httpOnly: true, sameSite: 'Lax' })
    expect(session?.secure).toBeFalsy()

    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/get-session',
      headers: { cookie: cookieHeader(login) },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json<{ user: { email: string; role: string } }>().user).toMatchObject({
      email: 't@example.test',
      role: 'trainer',
    })
  })

  it('rejects a wrong password', async () => {
    await runCli(
      ['create-user', '--email', 't@example.test', '--name', 'T', '--role', 'trainer', '--password', TEST_PASSWORD],
      { ...deps, ...quiet },
    )
    expect((await signIn(app, 't@example.test', testPassword())).statusCode).toBe(401)
  })

  it('accepts the public origin and rejects untrusted ones', async () => {
    await runCli(
      ['create-user', '--email', 't@example.test', '--name', 'T', '--role', 'trainer', '--password', TEST_PASSWORD],
      { ...deps, ...quiet },
    )
    const signInFrom = (origin: string) =>
      app.inject({
        method: 'POST',
        url: '/api/auth/sign-in/email',
        headers: { origin },
        payload: { email: 't@example.test', password: TEST_PASSWORD },
      })
    const evil = await signInFrom('https://evil.example')
    expect(evil.statusCode).toBe(403)
    expect(evil.cookies).toEqual([])
    expect((await signInFrom(testConfig.publicUrl)).statusCode).toBe(200)
  })

  it('marks the session cookie secure in production', async () => {
    const prodDeps = { ...deps, config: { ...testConfig, nodeEnv: 'production' as const } }
    const prodApp = await buildApp(prodDeps)
    try {
      prodApp.log.level = 'silent'
      await runCli(
        ['create-user', '--email', 't@example.test', '--name', 'T', '--role', 'trainer', '--password', TEST_PASSWORD],
        { ...prodDeps, ...quiet },
      )
      const login = await signIn(prodApp, 't@example.test', TEST_PASSWORD)
      expect(login.statusCode).toBe(200)
      expect(login.cookies.find((c) => c.name.endsWith('session_token'))).toMatchObject({
        secure: true,
        httpOnly: true,
        sameSite: 'Lax',
      })
    } finally {
      await prodApp.close()
    }
  })

  // Production chain: Cloudflare → host nginx → web nginx container → api. The api sees
  // "<client>, <docker gateway>"; a client-supplied leftmost entry must not matter.
  it('rate-limits sign-in per client behind the proxy chain in production', async () => {
    const prodDeps = { ...deps, config: { ...testConfig, nodeEnv: 'production' as const } }
    const prodApp = await buildApp(prodDeps)
    try {
      prodApp.log.level = 'silent'
      await runCli(
        ['create-user', '--email', 't@example.test', '--name', 'T', '--role', 'trainer', '--password', TEST_PASSWORD],
        { ...prodDeps, ...quiet },
      )
      const attempt = async (forwardedFor: string) =>
        (
          await prodApp.inject({
            method: 'POST',
            url: '/api/auth/sign-in/email',
            headers: { 'x-forwarded-for': forwardedFor },
            payload: { email: 't@example.test', password: testPassword() },
          })
        ).statusCode

      for (let i = 0; i < 3; i++) expect(await attempt('203.0.113.1, 172.18.0.1')).toBe(401)
      expect(await attempt('203.0.113.1, 172.18.0.1')).toBe(429)
      expect(await attempt('203.0.113.2, 172.18.0.1')).toBe(401)
      expect(await attempt('1.2.3.4, 203.0.113.1, 172.18.0.1')).toBe(429)
    } finally {
      await prodApp.close()
    }
  })
})

describe('privilege escalation through the auth API', () => {
  let deps: AppDeps
  let app: FastifyInstance
  beforeEach(async () => {
    deps = { db: await createTestDb(), config: testConfig }
    app = await buildApp(deps)
  })
  afterEach(async () => {
    await app.close()
  })

  const post = (url: string, payload: object, cookie?: string) =>
    app.inject({
      method: 'POST',
      url,
      headers: { origin: testConfig.publicUrl, ...(cookie ? { cookie } : {}) },
      payload,
    })
  const roleOf = async (email: string) =>
    (await deps.db.select({ role: user.role }).from(user).where(eq(user.email, email)))[0]?.role
  const newAdmin = { email: 'evil@example.test', password: testPassword(), name: 'Evil', role: 'admin' }

  it('answers 401 to anonymous admin calls', async () => {
    expect((await post('/api/auth/admin/create-user', newAdmin)).statusCode).toBe(401)
    expect((await post('/api/auth/admin/set-role', { userId: 'x', role: 'admin' })).statusCode).toBe(401)
    expect(await roleOf('evil@example.test')).toBeUndefined()
  })

  it.each(['trainee', 'trainer'] as const)('answers 403 to admin calls by a %s', async (role) => {
    const email = `${role}@example.test`
    const cookie = await createUserAndLogin(app, deps, { email, role })
    const [self] = await deps.db.select({ id: user.id }).from(user).where(eq(user.email, email))

    expect((await post('/api/auth/admin/create-user', newAdmin, cookie)).statusCode).toBe(403)
    expect((await post('/api/auth/admin/set-role', { userId: self!.id, role: 'admin' }, cookie)).statusCode).toBe(403)
    expect(await roleOf('evil@example.test')).toBeUndefined()
    expect(await roleOf(email)).toBe(role)
  })

  it('rejects a role change through update-user', async () => {
    const cookie = await createUserAndLogin(app, deps, { email: 'tn@example.test', role: 'trainee' })
    const res = await post('/api/auth/update-user', { role: 'admin' }, cookie)
    expect(res.statusCode).toBeGreaterThanOrEqual(400)
    expect(res.statusCode).toBeLessThan(500)
    expect(await roleOf('tn@example.test')).toBe('trainee')
  })
})

describe('requireRole', () => {
  let deps: AppDeps
  let app: FastifyInstance
  beforeEach(async () => {
    deps = { db: await createTestDb(), config: testConfig }
    app = await buildApp(deps)
    app.get('/test/editor', { preHandler: requireRole('trainer', 'admin') }, async (req) => ({ user: req.user }))
  })
  afterEach(async () => {
    await app.close()
  })

  it('answers 401 without a session', async () => {
    const res = await app.inject({ method: 'GET', url: '/test/editor' })
    expect(res.statusCode).toBe(401)
    expect(res.json()).toEqual({ error: 'unauthenticated' })
  })

  it('answers 403 for a trainee', async () => {
    const cookie = await createUserAndLogin(app, deps, { email: 'tn@example.test', role: 'trainee' })
    const res = await app.inject({ method: 'GET', url: '/test/editor', headers: { cookie } })
    expect(res.statusCode).toBe(403)
    expect(res.json()).toEqual({ error: 'forbidden' })
  })

  it('lets a trainer through and sets request.user', async () => {
    const cookie = await createUserAndLogin(app, deps, { email: 'tr@example.test', role: 'trainer', name: 'Ausbilder' })
    const res = await app.inject({ method: 'GET', url: '/test/editor', headers: { cookie } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({
      user: { id: expect.any(String), email: 'tr@example.test', name: 'Ausbilder', role: 'trainer' },
    })
  })

  it('treats an unknown stored role as trainee', async () => {
    app.get('/test/any', { preHandler: requireRole('trainee') }, async (req) => ({ role: req.user?.role }))
    const cookie = await createUserAndLogin(app, deps, { email: 'x@example.test', role: 'trainer' })
    await deps.db.update(user).set({ role: 'superuser' }).where(eq(user.email, 'x@example.test'))

    expect((await app.inject({ method: 'GET', url: '/test/editor', headers: { cookie } })).statusCode).toBe(403)
    const res = await app.inject({ method: 'GET', url: '/test/any', headers: { cookie } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ role: 'trainee' })
  })
})
