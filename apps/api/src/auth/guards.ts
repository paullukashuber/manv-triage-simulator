import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify'
import { isRole, type Auth, type Role } from './auth.ts'
import { toWebHeaders } from './routes.ts'

export type SessionUser = { id: string; email: string; name: string; role: Role }

declare module 'fastify' {
  interface FastifyInstance {
    auth: Auth
  }
  interface FastifyRequest {
    user?: SessionUser
  }
}

/**
 * Resolves the session user. When better-auth extends the session (past its updateAge) it
 * re-issues the session cookie; that Set-Cookie is forwarded so the browser keeps the
 * extended expiry instead of silently dropping out after the original seven days.
 */
export async function getSessionUser(request: FastifyRequest, reply: FastifyReply): Promise<SessionUser | null> {
  const { headers, response: session } = await request.server.auth.api.getSession({
    headers: toWebHeaders(request.headers),
    returnHeaders: true,
  })
  for (const cookie of headers.getSetCookie()) reply.header('set-cookie', cookie)
  if (!session) return null
  const { id, email, name, role } = session.user
  return { id, email, name, role: isRole(role) ? role : 'trainee' }
}

/** 401 without a session, 403 when the user's role is not listed; sets `request.user` otherwise. */
export function requireRole(...roles: Role[]): preHandlerHookHandler {
  return async (request, reply) => {
    const user = await getSessionUser(request, reply)
    if (!user) return reply.code(401).send({ error: 'unauthenticated' })
    if (!roles.includes(user.role)) return reply.code(403).send({ error: 'forbidden' })
    request.user = user
  }
}
