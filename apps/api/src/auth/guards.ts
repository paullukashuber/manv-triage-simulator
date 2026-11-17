import type { FastifyRequest, preHandlerHookHandler } from 'fastify'
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

export async function getSessionUser(request: FastifyRequest): Promise<SessionUser | null> {
  const session = await request.server.auth.api.getSession({ headers: toWebHeaders(request.headers) })
  if (!session) return null
  const { id, email, name, role } = session.user
  return { id, email, name, role: isRole(role) ? role : 'trainee' }
}

/** 401 without a session, 403 when the user's role is not listed; sets `request.user` otherwise. */
export function requireRole(...roles: Role[]): preHandlerHookHandler {
  return async (request, reply) => {
    const user = await getSessionUser(request)
    if (!user) return reply.code(401).send({ error: 'unauthenticated' })
    if (!roles.includes(user.role)) return reply.code(403).send({ error: 'forbidden' })
    request.user = user
  }
}
