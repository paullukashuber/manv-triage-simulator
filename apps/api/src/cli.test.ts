import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { eq } from 'drizzle-orm'
import { buildApp, type AppDeps } from './app.ts'
import { runCli } from './cli.ts'
import { createTestDb } from './db/client.ts'
import { user } from './db/schema.ts'
import { testConfig } from './test/setup.ts'
import { cookieHeader, signIn, testPassword } from './test/auth-helpers.ts'

// Generated per run so no credential-like literals live in the repository.
const PW_A = testPassword()
const PW_B = testPassword()
const PW_OLD = testPassword()
const PW_NEW = testPassword()

describe('runCli', () => {
  let deps: AppDeps
  let app: FastifyInstance
  let output: string
  const run = (...argv: string[]) => runCli(argv, { ...deps, stdout: (s) => (output += s) })
  const roleOf = async (email: string) =>
    (await deps.db.select({ role: user.role }).from(user).where(eq(user.email, email)))[0]?.role

  beforeEach(async () => {
    deps = { db: await createTestDb(), config: testConfig }
    app = await buildApp(deps)
    output = ''
  })
  afterEach(async () => {
    await app.close()
  })

  it('create-admin with no password option prints a generated password that signs in', async () => {
    expect(await run('create-admin', '--email', 'Admin@Example.test', '--name', 'Admin')).toBe(0)
    const match = /Passwort: (\S+)/.exec(output)
    expect(match?.[1]).toMatch(/^[A-Za-z0-9_-]{20}$/)
    expect(output.split(match![1]!)).toHaveLength(2) // printed exactly once
    expect(await roleOf('admin@example.test')).toBe('admin')
    expect((await signIn(app, 'admin@example.test', match![1]!)).statusCode).toBe(200)
  })

  it('create-user with an explicit password option does not print it', async () => {
    expect(await run('create-user', '--email', 'a@example.test', '--name', 'A', '--role', 'trainee', '--password', PW_A)).toBe(0)
    expect(output).not.toContain(PW_A)
    expect(await roleOf('a@example.test')).toBe('trainee')
  })

  it('refuses a duplicate email', async () => {
    await run('create-user', '--email', 'a@example.test', '--name', 'A', '--role', 'trainee', '--password', PW_A)
    output = ''
    expect(await run('create-admin', '--email', 'A@example.test', '--name', 'B', '--password', PW_B)).toBe(1)
    expect(output).toContain('a@example.test')
    expect(await roleOf('a@example.test')).toBe('trainee')
  })

  it.each([
    [['create-user', '--email', 'a@example.test', '--name', 'A', '--role', 'superuser']],
    [['create-user', '--email', 'a@example.test', '--name', 'A']],
    [['create-user', '--email', 'a@example.test', '--role', 'trainee']],
    [['create-user', '--email', 'not-an-email', '--name', 'A', '--role', 'trainee']],
    [['create-admin', '--email', 'a@example.test', '--name', 'A', '--password', 'x'.repeat(9)]],
    [['create-admin', '--email', 'a@example.test', '--name', 'A', '--password', 'x'.repeat(129)]],
    [['create-admin', '--email', 'a@example.test', '--name', 'A', '--bogus']],
    [['delete-everything']],
    [[]],
  ])('rejects invalid input %j', async (argv) => {
    expect(await run(...argv)).toBe(1)
    expect(output).not.toBe('')
    expect(await deps.db.select().from(user)).toEqual([])
  })

  it('set-role changes the role of an existing user', async () => {
    await run('create-user', '--email', 'a@example.test', '--name', 'A', '--role', 'trainee', '--password', PW_A)
    expect(await run('set-role', '--email', 'a@example.test', '--role', 'trainer')).toBe(0)
    expect(await roleOf('a@example.test')).toBe('trainer')
  })

  it('set-role fails for an unknown email or role', async () => {
    expect(await run('set-role', '--email', 'unknown@example.test', '--role', 'admin')).not.toBe(0)
    expect(output).toContain('unknown@example.test')
    await run('create-user', '--email', 'a@example.test', '--name', 'A', '--role', 'trainee', '--password', PW_A)
    expect(await run('set-role', '--email', 'a@example.test', '--role', 'root')).toBe(1)
    expect(await roleOf('a@example.test')).toBe('trainee')
  })

  it('reset-password replaces the password and ends existing sessions', async () => {
    await run('create-user', '--email', 'a@example.test', '--name', 'A', '--role', 'trainee', '--password', PW_OLD)
    const before = await signIn(app, 'a@example.test', PW_OLD)
    expect(before.statusCode).toBe(200)

    expect(await run('reset-password', '--email', 'a@example.test', '--password', PW_NEW)).toBe(0)
    expect((await signIn(app, 'a@example.test', PW_OLD)).statusCode).toBe(401)
    expect((await signIn(app, 'a@example.test', PW_NEW)).statusCode).toBe(200)

    const cookie = cookieHeader(before)
    const session = await app.inject({ method: 'GET', url: '/api/auth/get-session', headers: { cookie } })
    expect(session.json()).toBeNull()
  })

  it('reset-password with no password option prints a generated one', async () => {
    await run('create-user', '--email', 'a@example.test', '--name', 'A', '--role', 'trainee', '--password', PW_OLD)
    output = ''
    expect(await run('reset-password', '--email', 'a@example.test')).toBe(0)
    const password = /Passwort: (\S+)/.exec(output)?.[1]
    expect(password).toHaveLength(20)
    expect((await signIn(app, 'a@example.test', password!)).statusCode).toBe(200)
  })

  it('reset-password fails for an unknown email', async () => {
    expect(await run('reset-password', '--email', 'unknown@example.test', '--password', PW_NEW)).toBe(1)
  })

  it.each([['x'.repeat(9)], ['x'.repeat(129)]])('reset-password rejects the password %s and keeps the old one', async (pw) => {
    await run('create-user', '--email', 'a@example.test', '--name', 'A', '--role', 'trainee', '--password', PW_OLD)
    output = ''
    expect(await run('reset-password', '--email', 'a@example.test', '--password', pw)).toBe(1)
    expect(output).toMatch(/^Fehler: Das Passwort muss/)
    expect((await signIn(app, 'a@example.test', PW_OLD)).statusCode).toBe(200)
  })

  it('accepts passwords of exactly 10 and 128 characters', async () => {
    expect(await run('create-user', '--email', 'a@example.test', '--name', 'A', '--role', 'trainee', '--password', 'x'.repeat(10))).toBe(0)
    expect(await run('reset-password', '--email', 'a@example.test', '--password', 'y'.repeat(128))).toBe(0)
    expect((await signIn(app, 'a@example.test', 'y'.repeat(128))).statusCode).toBe(200)
  })

  it('rethrows unexpected errors instead of reporting them as input errors', async () => {
    // A system error that happens to carry a Node error code must not be mistaken for a parseArgs error.
    const failure = Object.assign(new TypeError('database exploded'), { code: 'ERR_INVALID_STATE' })
    const brokenDb = new Proxy(deps.db, {
      get() {
        throw failure
      },
    })
    const argv = ['set-role', '--email', 'a@example.test', '--role', 'admin']
    await expect(runCli(argv, { ...deps, db: brokenDb, stdout: (s) => (output += s) })).rejects.toBe(failure)
    expect(output).toBe('')
  })
})
