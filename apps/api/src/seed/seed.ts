import { caseInputSchema, triage, type CaseInput } from '@manv/triage'
import { createCase, publishCase } from '../cases/service.ts'
import type { Db } from '../db/client.ts'
import { cases } from '../db/schema.ts'

export type SeedCase = CaseInput & { slug: string }

/**
 * Seeds only into an empty `cases` table. Validates every seed (schema and
 * expected vs. computed category) before writing, then inserts all seeds in one
 * transaction so a failure leaves the table empty.
 */
export async function seedCases(
  db: Db,
  seeds: SeedCase[],
  opts: { publish: boolean },
): Promise<{ inserted: number }> {
  const parsed = seeds.map(({ slug, ...input }) => {
    const result = caseInputSchema.safeParse(input)
    if (!result.success) {
      const problems = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
      throw new Error(`Invalid seed case "${slug}": ${problems.join('; ')}`)
    }
    const computed = triage(result.data.findings).category
    if (computed !== result.data.expectedCategory) {
      throw new Error(
        `Invalid seed case "${slug}": expectedCategory "${result.data.expectedCategory}" does not match computed category "${computed}"`,
      )
    }
    return { slug, input: result.data }
  })

  return db.transaction(async (tx) => {
    const existing = await tx.select({ id: cases.id }).from(cases).limit(1)
    if (existing.length > 0) return { inserted: 0 }

    for (const { slug, input } of parsed) {
      const created = await createCase(tx, input, null, slug)
      if (opts.publish) await publishCase(tx, created.id, null)
    }
    return { inserted: parsed.length }
  })
}
