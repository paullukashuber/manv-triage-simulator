import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { createAccessControl } from 'better-auth/plugins/access'
import { admin } from 'better-auth/plugins/admin'
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access'
import type { Config } from '../config.ts'
import type { Db } from '../db/client.ts'
import * as schema from '../db/schema.ts'

export const ROLES = ['trainee', 'trainer', 'admin'] as const
export type Role = (typeof ROLES)[number]

export const MIN_PASSWORD_LENGTH = 10

export function isRole(value: unknown): value is Role {
  return (ROLES as readonly unknown[]).includes(value)
}

// Only admins hold admin-plugin permissions; trainee and trainer differ in app-level guards only.
const ac = createAccessControl(defaultStatements)
const roles = {
  trainee: ac.newRole({ user: [], session: [] }),
  trainer: ac.newRole({ user: [], session: [] }),
  admin: ac.newRole(adminAc.statements),
} satisfies Record<Role, unknown>

export function createAuth({ db, config }: { db: Db; config: Config }) {
  return betterAuth({
    appName: 'MANV-Sichtungstrainer',
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    basePath: '/api/auth',
    baseURL: config.publicUrl,
    secret: config.authSecret,
    trustedOrigins: [config.publicUrl],
    emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: MIN_PASSWORD_LENGTH },
    advanced: {
      useSecureCookies: config.nodeEnv === 'production',
      defaultCookieAttributes: { httpOnly: true, sameSite: 'lax' },
      // better-auth skips the origin/CSRF check under NODE_ENV=test; keep it on everywhere.
      disableOriginCheck: false,
    },
    plugins: [admin({ ac, roles, defaultRole: 'trainee', adminRoles: ['admin'] })],
    telemetry: { enabled: false },
    logger: { disabled: config.nodeEnv === 'test' },
  })
}

export type Auth = ReturnType<typeof createAuth>
