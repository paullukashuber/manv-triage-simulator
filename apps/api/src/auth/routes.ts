import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import type { IncomingHttpHeaders } from 'node:http'
import type { Auth } from './auth.ts'

export function toWebHeaders(headers: IncomingHttpHeaders): Headers {
  const result = new Headers()
  for (const [name, value] of Object.entries(headers)) {
    if (value === undefined) continue
    for (const v of Array.isArray(value) ? value : [value]) result.append(name, v)
  }
  return result
}

async function bridge(auth: Auth, origin: string, request: FastifyRequest, reply: FastifyReply) {
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
  const response = await auth.handler(
    new Request(new URL(request.url, origin), {
      method: request.method,
      headers: toWebHeaders(request.headers),
      body: hasBody ? (request.body as Buffer | undefined) : undefined,
    }),
  )

  reply.status(response.status)
  for (const [name, value] of response.headers) {
    if (name !== 'set-cookie') reply.header(name, value)
  }
  const cookies = response.headers.getSetCookie()
  if (cookies.length > 0) reply.header('set-cookie', cookies)
  return reply.send(Buffer.from(await response.arrayBuffer()))
}

/** Forwards /api/auth/* to better-auth via a WHATWG Request/Response bridge. */
export function registerAuthRoutes(app: FastifyInstance, auth: Auth, publicUrl: string): void {
  const origin = new URL(publicUrl).origin
  // Encapsulated: better-auth parses bodies itself, so this scope hands it the raw bytes.
  void app.register(async (scope) => {
    scope.removeAllContentTypeParsers()
    scope.addContentTypeParser('*', { parseAs: 'buffer' }, (_req, body, done) => done(null, body))
    scope.route({
      method: ['GET', 'POST'],
      url: '/api/auth/*',
      handler: (request, reply) => bridge(auth, origin, request, reply),
    })
  })
}
