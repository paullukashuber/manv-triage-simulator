import { caseInputSchema, type CaseInput } from '@manv/triage'
import { createCase, publishCase } from '../cases/service.ts'
import type { Db } from '../db/client.ts'
import { cases } from '../db/schema.ts'

export type SeedCase = CaseInput & { slug: string }

/** Seeds only into an empty `cases` table; validates every seed first. */
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
    return { slug, input: result.data }
  })

  const existing = await db.select({ id: cases.id }).from(cases).limit(1)
  if (existing.length > 0) return { inserted: 0 }

  for (const { slug, input } of parsed) {
    const created = await createCase(db, input, null, slug)
    if (opts.publish) await publishCase(db, created.id, null)
  }
  return { inserted: parsed.length }
}
