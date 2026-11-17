import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { Db } from '../db/client.ts'
import { parseOrReply } from '../http/validation.ts'
import { listTrainingCases } from './service.ts'

const querySchema = z.object({
  count: z.coerce.number().int().min(1).max(30).default(10),
})

export function registerTrainingRoutes(app: FastifyInstance, db: Db): void {
  app.get('/api/training/cases', async (req, reply) => {
    const query = parseOrReply(querySchema, req.query, reply)
    if (!query) return reply
    return { cases: await listTrainingCases(db, query.count) }
  })
}
