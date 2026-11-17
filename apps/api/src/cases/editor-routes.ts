import type { FastifyInstance, FastifyReply } from 'fastify'
import { z } from 'zod'
import { caseFilterSchema, caseInputSchema } from '@manv/triage'
import type { Config } from '../config.ts'
import type { Db } from '../db/client.ts'
import { requireRole } from '../auth/guards.ts'
import { requireSameOrigin } from '../http/origin.ts'
import { parseOrReply } from '../http/validation.ts'
import {
  archiveCase,
  CaseArchivedError,
  CaseHasRevisionsError,
  CaseNotFoundError,
  createCase,
  deleteCase,
  duplicateCase,
  ExpectedCategoryMismatchError,
  getCase,
  listCases,
  publishCase,
  restoreCase,
  updateCase,
} from './service.ts'

const idSchema = z.uuid()

function notFound(reply: FastifyReply) {
  return reply.code(404).send({ error: 'not_found' })
}

/** requireRole sets req.user before every write handler; this only guards against a missing preHandler. */
function unauthenticated(reply: FastifyReply) {
  return reply.code(401).send({ error: 'unauthenticated' })
}

/** Maps expected service errors to HTTP replies; rethrows everything else. */
function replyError(err: unknown, reply: FastifyReply) {
  if (err instanceof CaseNotFoundError) return notFound(reply)
  if (err instanceof CaseArchivedError) return reply.code(409).send({ error: 'case_archived' })
  if (err instanceof CaseHasRevisionsError) return reply.code(409).send({ error: 'case_has_revisions' })
  if (err instanceof ExpectedCategoryMismatchError)
    return reply.code(422).send({ error: 'expected_category_mismatch', expected: err.expected, computed: err.computed })
  throw err
}

export async function registerEditorRoutes(app: FastifyInstance, db: Db, config: Config): Promise<void> {
  await app.register(
    async (scope) => {
      const read = [requireRole('trainer', 'admin')]
      const write = [requireRole('trainer', 'admin'), requireSameOrigin(config)]

      scope.get('/', { preHandler: read }, async (req, reply) => {
        const filter = parseOrReply(caseFilterSchema, req.query, reply)
        if (!filter) return reply
        return { cases: await listCases(db, filter) }
      })

      scope.get('/:id', { preHandler: read }, async (req, reply) => {
        const id = idSchema.safeParse((req.params as { id: string }).id)
        if (!id.success) return notFound(reply)
        return (await getCase(db, id.data)) ?? notFound(reply)
      })

      scope.post('/', { preHandler: write }, async (req, reply) => {
        if (!req.user) return unauthenticated(reply)
        const input = parseOrReply(caseInputSchema, req.body, reply)
        if (!input) return reply
        const created = await createCase(db, input, req.user.id)
        return reply.code(201).send(await getCase(db, created.id))
      })

      scope.put('/:id', { preHandler: write }, async (req, reply) => {
        const id = idSchema.safeParse((req.params as { id: string }).id)
        if (!id.success) return notFound(reply)
        const input = parseOrReply(caseInputSchema, req.body, reply)
        if (!input) return reply
        try {
          return await updateCase(db, id.data, input)
        } catch (err) {
          return replyError(err, reply)
        }
      })

      scope.post('/:id/duplicate', { preHandler: write }, async (req, reply) => {
        if (!req.user) return unauthenticated(reply)
        const id = idSchema.safeParse((req.params as { id: string }).id)
        if (!id.success) return notFound(reply)
        try {
          return reply.code(201).send(await duplicateCase(db, id.data, req.user.id))
        } catch (err) {
          return replyError(err, reply)
        }
      })

      scope.post('/:id/publish', { preHandler: write }, async (req, reply) => {
        if (!req.user) return unauthenticated(reply)
        const id = idSchema.safeParse((req.params as { id: string }).id)
        if (!id.success) return notFound(reply)
        try {
          await publishCase(db, id.data, req.user.id)
          return await getCase(db, id.data)
        } catch (err) {
          return replyError(err, reply)
        }
      })

      for (const [action, run] of [
        ['archive', archiveCase],
        ['restore', restoreCase],
      ] as const) {
        scope.post(`/:id/${action}`, { preHandler: write }, async (req, reply) => {
          const id = idSchema.safeParse((req.params as { id: string }).id)
          if (!id.success) return notFound(reply)
          try {
            return await run(db, id.data)
          } catch (err) {
            return replyError(err, reply)
          }
        })
      }

      scope.delete('/:id', { preHandler: write }, async (req, reply) => {
        const id = idSchema.safeParse((req.params as { id: string }).id)
        if (!id.success) return notFound(reply)
        try {
          await deleteCase(db, id.data)
          return reply.code(204).send()
        } catch (err) {
          return replyError(err, reply)
        }
      })
    },
    { prefix: '/api/editor/cases' },
  )
}
