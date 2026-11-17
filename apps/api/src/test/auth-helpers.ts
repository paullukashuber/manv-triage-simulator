import type { FastifyInstance, LightMyRequestResponse } from 'fastify'
import type { AppDeps } from '../app.ts'
import type { SessionUser } from '../auth/guards.ts'
import { randomBytes } from 'node:crypto'
import { runCli } from '../cli.ts'

/** A random, valid (10–128 chars) password for tests; generated at runtime, never committed. */
export function testPassword(): string {
  return `t-${randomBytes(12).toString('hex')}`
}

export const TEST_PASSWORD = testPassword()

/** Turns the Set-Cookie headers of an inject response into a Cookie request header. */
export function cookieHeader(res: LightMyRequestResponse): string {
  return res.cookies.map((c) => `${c.name}=${c.value}`).join('; ')
}

export async function signIn(app: FastifyInstance, email: string, password: string) {
  return app.inject({
    method: 'POST',
    url: '/api/auth/sign-in/email',
    payload: { email, password },
  })
}

/** Creates an account via the admin CLI, signs it in and returns the Cookie header for its session. */
export async function createUserAndLogin(
  app: FastifyInstance,
  deps: AppDeps,
  { email, role, name = 'Test' }: { email: string; role: SessionUser['role']; name?: string },
): Promise<string> {
  const output: string[] = []
  const args = ['create-user', '--email', email, '--name', name, '--role', role, '--password', TEST_PASSWORD]
  const code = await runCli(args, { ...deps, stdout: (s) => output.push(s) })
  if (code !== 0) throw new Error(`create-user failed: ${output.join('')}`)
  const res = await signIn(app, email, TEST_PASSWORD)
  if (res.statusCode !== 200) throw new Error(`sign-in failed (${res.statusCode}): ${res.body}`)
  return cookieHeader(res)
}
