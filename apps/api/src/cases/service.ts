import { desc, eq, sql } from 'drizzle-orm'
import {
  ALGORITHM_VERSION,
  triage,
  type CaseInput,
  type Category,
  type TrainingCase,
} from '@manv/triage'
import type { Db } from '../db/client.ts'
import { caseRevisions, cases } from '../db/schema.ts'

export type CaseRecord = typeof cases.$inferSelect

export class ExpectedCategoryMismatchError extends Error {
  constructor(
    readonly expected: Category,
    readonly computed: Category,
  ) {
    super(`Expected category "${expected}" does not match computed category "${computed}"`)
    this.name = 'ExpectedCategoryMismatchError'
  }
}

export async function createCase(
  db: Db,
  input: CaseInput,
  authorId: string | null,
  slug?: string,
): Promise<CaseRecord> {
  const result = triage(input.findings)
  const [row] = await db
    .insert(cases)
    .values({
      slug: slug ?? null,
      description: input.description,
      reasoning: input.reasoning,
      findings: input.findings,
      expectedCategory: input.expectedCategory,
      focusFields: input.focusFields,
      tags: input.tags,
      computedCategory: result.category,
      decisiveStep: result.decisiveStep,
      status: 'draft',
      authorId,
    })
    .returning()
  if (!row) throw new Error('Insert of case returned no row')
  return row
}

export async function publishCase(
  db: Db,
  caseId: string,
  userId: string | null,
): Promise<CaseRecord> {
  return db.transaction(async (tx) => {
    const [c] = await tx.select().from(cases).where(eq(cases.id, caseId))
    if (!c) throw new Error(`Case ${caseId} not found`)
    // The stored computedCategory could be stale (algorithm change); recompute from findings.
    const result = triage(c.findings)
    if (c.expectedCategory !== result.category) {
      throw new ExpectedCategoryMismatchError(c.expectedCategory as Category, result.category)
    }
    const [last] = await tx
      .select({ n: caseRevisions.revisionNumber })
      .from(caseRevisions)
      .where(eq(caseRevisions.caseId, caseId))
      .orderBy(desc(caseRevisions.revisionNumber))
      .limit(1)
    const [revision] = await tx
      .insert(caseRevisions)
      .values({
        caseId,
        revisionNumber: (last?.n ?? 0) + 1,
        description: c.description,
        reasoning: c.reasoning,
        findings: c.findings,
        focusFields: c.focusFields,
        tags: c.tags,
        computedCategory: result.category,
        decisiveStep: result.decisiveStep,
        algorithmVersion: ALGORITHM_VERSION,
        publishedBy: userId,
      })
      .returning()
    if (!revision) throw new Error('Insert of revision returned no row')
    const [updated] = await tx
      .update(cases)
      .set({
        status: 'published',
        publishedRevisionId: revision.id,
        computedCategory: result.category,
        decisiveStep: result.decisiveStep,
        updatedAt: new Date(),
      })
      .where(eq(cases.id, caseId))
      .returning()
    if (!updated) throw new Error('Update of case returned no row')
    return updated
  })
}

export async function listTrainingCases(db: Db, count: number): Promise<TrainingCase[]> {
  const rows = await db
    .select({
      caseId: caseRevisions.caseId,
      revisionId: caseRevisions.id,
      description: caseRevisions.description,
      reasoning: caseRevisions.reasoning,
      findings: caseRevisions.findings,
      focusFields: caseRevisions.focusFields,
    })
    .from(cases)
    .innerJoin(caseRevisions, eq(cases.publishedRevisionId, caseRevisions.id))
    .where(eq(cases.status, 'published'))
    .orderBy(sql`random()`)
    .limit(count)
  return rows as TrainingCase[]
}
