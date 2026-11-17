import type { FastifyReply } from 'fastify'
import type { z } from 'zod'

export type ValidationIssue = { path: string; message: string }

/** Parses `data` with `schema`; on failure sends the shared 400 body and returns null. */
export function parseOrReply<S extends z.ZodType>(
  schema: S,
  data: unknown,
  reply: FastifyReply,
): z.output<S> | null {
  const parsed = schema.safeParse(data)
  if (parsed.success) return parsed.data
  const issues: ValidationIssue[] = parsed.error.issues.map((i) => ({
    path: i.path.join('.'),
    message: i.message,
  }))
  void reply.code(400).send({ error: 'validation', issues })
  return null
}
