import type { preHandlerHookHandler } from 'fastify'
import type { Config } from '../config.ts'

/** CSRF defence for state-changing routes: requires an `Origin` header equal to the public origin. */
export function requireSameOrigin(config: Pick<Config, 'publicUrl'>): preHandlerHookHandler {
  const allowed = new URL(config.publicUrl).origin
  return async (request, reply) => {
    if (request.headers.origin !== allowed) return reply.code(403).send({ error: 'forbidden_origin' })
  }
}
