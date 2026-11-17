import { isDeepStrictEqual } from 'node:util'
import { and, desc, eq, ilike, isNull, sql, type SQL } from 'drizzle-orm'
import {
  ALGORITHM_VERSION,
  triage,
  type CaseDetail,
  type CaseFilter,
  type CaseInput,
  type CaseStatus,
  type CaseSummary,
  type Category,
  type LearningField,
  type StepKey,
  type TrainingCase,
} from '@manv/triage'
import type { Db } from '../db/client.ts'
import { caseRevisions, cases } from '../db/schema.ts'

export type CaseRecord = typeof cases.$inferSelect

export class CaseNotFoundError extends Error {
  constructor(caseId: string) {
    super(`Case ${caseId} not found`)
    this.name = 'CaseNotFoundError'
  }
}

export class CaseArchivedError extends Error {
  constructor(caseId: string) {
    super(`Case ${caseId} is archived; restore it before publishing`)
    this.name = 'CaseArchivedError'
  }
}

export class CaseHasRevisionsError extends Error {
  constructor(caseId: string) {
    super(`Case ${caseId} has been published and cannot be deleted; archive it instead`)
    this.name = 'CaseHasRevisionsError'
  }
}

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
    if (!c) throw new CaseNotFoundError(caseId)
    if (c.status === 'archived') throw new CaseArchivedError(caseId)
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

type RevisionRecord = typeof caseRevisions.$inferSelect

function hasChanges(c: CaseRecord, rev: RevisionRecord | null): boolean {
  if (!rev) return false
  return !(
    c.description === rev.description &&
    c.reasoning === rev.reasoning &&
    isDeepStrictEqual(c.findings, rev.findings) &&
    isDeepStrictEqual(c.focusFields, rev.focusFields) &&
    isDeepStrictEqual(c.tags, rev.tags)
  )
}

function toSummary(c: CaseRecord, rev: RevisionRecord | null): CaseSummary {
  return {
    id: c.id,
    slug: c.slug,
    description: c.description,
    expectedCategory: c.expectedCategory as Category,
    focusFields: c.focusFields as LearningField[],
    tags: c.tags,
    computedCategory: c.computedCategory as Category,
    decisiveStep: c.decisiveStep as StepKey | null,
    status: c.status as CaseStatus,
    publishedRevisionNumber: rev?.revisionNumber ?? null,
    hasUnpublishedChanges: hasChanges(c, rev),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }
}

function toDetail(c: CaseRecord, rev: RevisionRecord | null): CaseDetail {
  return { ...toSummary(c, rev), reasoning: c.reasoning, findings: c.findings }
}

async function loadDetail(db: Db, caseId: string): Promise<CaseDetail | null> {
  const [row] = await db
    .select({ c: cases, rev: caseRevisions })
    .from(cases)
    .leftJoin(caseRevisions, eq(cases.publishedRevisionId, caseRevisions.id))
    .where(eq(cases.id, caseId))
  return row ? toDetail(row.c, row.rev) : null
}

async function requireDetail(db: Db, caseId: string): Promise<CaseDetail> {
  const detail = await loadDetail(db, caseId)
  if (!detail) throw new CaseNotFoundError(caseId)
  return detail
}

export function getCase(db: Db, caseId: string): Promise<CaseDetail | null> {
  return loadDetail(db, caseId)
}

function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, '\\$&')
}

export async function listCases(db: Db, filter: CaseFilter): Promise<CaseSummary[]> {
  const conditions: SQL[] = []
  if (filter.status) conditions.push(eq(cases.status, filter.status))
  if (filter.category) conditions.push(eq(cases.computedCategory, filter.category))
  if (filter.decisiveStep === 'none') conditions.push(isNull(cases.decisiveStep))
  else if (filter.decisiveStep) conditions.push(eq(cases.decisiveStep, filter.decisiveStep))
  if (filter.tag) conditions.push(sql`${cases.tags} @> ARRAY[${filter.tag}]::text[]`)
  if (filter.q) conditions.push(ilike(cases.description, `%${escapeLike(filter.q)}%`))
  const rows = await db
    .select({ c: cases, rev: caseRevisions })
    .from(cases)
    .leftJoin(caseRevisions, eq(cases.publishedRevisionId, caseRevisions.id))
    .where(and(...conditions))
    .orderBy(desc(cases.updatedAt))
  return rows.map((r) => toSummary(r.c, r.rev))
}

export async function updateCase(db: Db, caseId: string, input: CaseInput): Promise<CaseDetail> {
  const result = triage(input.findings)
  const [updated] = await db
    .update(cases)
    .set({
      description: input.description,
      reasoning: input.reasoning,
      findings: input.findings,
      expectedCategory: input.expectedCategory,
      focusFields: input.focusFields,
      tags: input.tags,
      computedCategory: result.category,
      decisiveStep: result.decisiveStep,
      updatedAt: new Date(),
    })
    .where(eq(cases.id, caseId))
    .returning({ id: cases.id })
  if (!updated) throw new CaseNotFoundError(caseId)
  return requireDetail(db, caseId)
}

export async function duplicateCase(db: Db, caseId: string, authorId: string | null): Promise<CaseDetail> {
  const source = await requireDetail(db, caseId)
  const copy = await createCase(
    db,
    {
      description: source.description,
      reasoning: source.reasoning,
      findings: source.findings,
      expectedCategory: source.expectedCategory,
      focusFields: source.focusFields,
      tags: source.tags,
    },
    authorId,
  )
  return requireDetail(db, copy.id)
}

async function setStatus(db: Db, caseId: string, from: CaseStatus | null, to: CaseStatus): Promise<CaseDetail> {
  const current = await requireDetail(db, caseId)
  if (from !== null && current.status !== from) return current // idempotent: nothing to change
  await db.update(cases).set({ status: to, updatedAt: new Date() }).where(eq(cases.id, caseId))
  return requireDetail(db, caseId)
}

/** Archives a case of any status; idempotent. Training stops serving it. */
export async function archiveCase(db: Db, caseId: string): Promise<CaseDetail> {
  const current = await requireDetail(db, caseId)
  if (current.status === 'archived') return current
  return setStatus(db, caseId, null, 'archived')
}

/** Moves an archived case back to draft (re-publish to serve it again); no-op otherwise. */
export function restoreCase(db: Db, caseId: string): Promise<CaseDetail> {
  return setStatus(db, caseId, 'archived', 'draft')
}

export async function deleteCase(db: Db, caseId: string): Promise<void> {
  const [row] = await db.select().from(cases).where(eq(cases.id, caseId))
  if (!row) throw new CaseNotFoundError(caseId)
  if (row.publishedRevisionId !== null) throw new CaseHasRevisionsError(caseId)
  await db.delete(cases).where(eq(cases.id, caseId))
}
