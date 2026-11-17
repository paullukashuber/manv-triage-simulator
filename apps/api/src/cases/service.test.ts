import { beforeEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { trainingCaseSchema } from '@manv/triage'
import { createTestDb, type Db } from '../db/client.ts'
import { caseRevisions, cases, user } from '../db/schema.ts'
import { caseInput } from './fixtures.ts'
import {
  archiveCase,
  CaseArchivedError,
  CaseHasRevisionsError,
  CaseNotFoundError,
  createCase,
  deleteCase,
  duplicateCase,
  getCase,
  restoreCase,
  updateCase,
  ExpectedCategoryMismatchError,
  listTrainingCases,
  publishCase,
} from './service.ts'

describe('case service', () => {
  let db: Db
  beforeEach(async () => {
    db = await createTestDb()
    await db.insert(user).values({ id: 'u1', name: 'Ausbilder', email: 'u1@example.test' })
  })

  it('createCase computes category and decisive step, status draft', async () => {
    const c = await createCase(db, caseInput(), null)
    expect(c.computedCategory).toBe('white')
    expect(c.decisiveStep).toBe('ambulatory')
    expect(c.status).toBe('draft')
    expect(c.publishedRevisionId).toBeNull()
  })

  it('publishCase creates revision 1, then revision 2 pointing to the newest', async () => {
    const c = await createCase(db, caseInput(), null)
    const first = await publishCase(db, c.id, 'u1')
    expect(first.status).toBe('published')
    const [rev1] = await db.select().from(caseRevisions).where(eq(caseRevisions.caseId, c.id))
    expect(rev1?.revisionNumber).toBe(1)
    expect(rev1?.algorithmVersion).toBe('1.0.0')
    expect(rev1?.publishedBy).toBe('u1')
    expect(first.publishedRevisionId).toBe(rev1?.id)

    const second = await publishCase(db, c.id, 'u1')
    const revs = await db.select().from(caseRevisions).where(eq(caseRevisions.caseId, c.id))
    expect(revs.map((r) => r.revisionNumber).sort()).toEqual([1, 2])
    const rev2 = revs.find((r) => r.revisionNumber === 2)
    expect(second.publishedRevisionId).toBe(rev2?.id)
  })

  it('deleting the author keeps case and revision with author/publisher set to null', async () => {
    const c = await createCase(db, caseInput(), 'u1')
    await publishCase(db, c.id, 'u1')
    await db.delete(user).where(eq(user.id, 'u1'))
    const [stored] = await db.select().from(cases).where(eq(cases.id, c.id))
    expect(stored?.authorId).toBeNull()
    const [rev] = await db.select().from(caseRevisions).where(eq(caseRevisions.caseId, c.id))
    expect(rev?.publishedBy).toBeNull()
  })

  it('publishCase rejects a mismatching expected category and creates no revision', async () => {
    const c = await createCase(db, caseInput({ expectedCategory: 'yellow' }), null)
    const err = await publishCase(db, c.id, null).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ExpectedCategoryMismatchError)
    expect(err).toMatchObject({ expected: 'yellow', computed: 'white' })
    expect(await db.select().from(caseRevisions)).toEqual([])
    const [row] = await db.select().from(cases).where(eq(cases.id, c.id))
    expect(row?.status).toBe('draft')
  })

  it('listTrainingCases returns only published, non-archived cases', async () => {
    for (let i = 0; i < 3; i++) {
      const c = await createCase(db, caseInput(), null)
      await publishCase(db, c.id, null)
    }
    await createCase(db, caseInput(), null) // draft
    const archived = await createCase(db, caseInput(), null)
    await publishCase(db, archived.id, null)
    await db.update(cases).set({ status: 'archived' }).where(eq(cases.id, archived.id))

    const all = await listTrainingCases(db, 10)
    expect(all).toHaveLength(3)
    for (const t of all) expect(trainingCaseSchema.safeParse(t).success).toBe(true)
    expect(await listTrainingCases(db, 2)).toHaveLength(2)
  })

  it('listTrainingCases serves the published revision, not the working copy', async () => {
    const c = await createCase(db, caseInput(), null)
    await publishCase(db, c.id, null)
    await db
      .update(cases)
      .set({ description: 'Geänderter Arbeitsstand des Falls.' })
      .where(eq(cases.id, c.id))
    const [t] = await listTrainingCases(db, 1)
    expect(t?.description).toBe(caseInput().description)
  })

  const unknownId = '3f1c0a52-8d2e-4b7a-9a3c-1d2e3f4a5b6c'

  it('publishCase rejects archived cases and unknown ids', async () => {
    const c = await createCase(db, caseInput(), null)
    await archiveCase(db, c.id)
    await expect(publishCase(db, c.id, null)).rejects.toBeInstanceOf(CaseArchivedError)
    expect(await db.select().from(caseRevisions)).toEqual([])
    await expect(publishCase(db, unknownId, null)).rejects.toBeInstanceOf(CaseNotFoundError)
  })

  it('republish after a content change serves revision 2 in training', async () => {
    const c = await createCase(db, caseInput(), null)
    await publishCase(db, c.id, null)
    await updateCase(db, c.id, { ...caseInput(), description: 'Überarbeitete Beschreibung.' })
    expect((await listTrainingCases(db, 1))[0]?.description).toBe(caseInput().description)
    await publishCase(db, c.id, null)
    const [t] = await listTrainingCases(db, 1)
    expect(t?.description).toBe('Überarbeitete Beschreibung.')
    const detail = await getCase(db, c.id)
    expect(detail?.publishedRevisionNumber).toBe(2)
    expect(t?.revisionId).toBeDefined()
  })

  it('hasUnpublishedChanges: false without revision, true after any compared field changes, false when reverted', async () => {
    const c = await createCase(db, caseInput(), null)
    expect((await getCase(db, c.id))?.hasUnpublishedChanges).toBe(false)
    await publishCase(db, c.id, null)
    expect((await getCase(db, c.id))?.hasUnpublishedChanges).toBe(false)
    const variants = [
      { reasoning: 'Andere Begründung des Falls.' },
      { tags: ['neu'] },
      { focusFields: ['ambulatory', 'a'] as const },
      { findings: { ...caseInput().findings, ageGroup: 'child' as const } },
    ]
    for (const v of variants) {
      const d = await updateCase(db, c.id, { ...caseInput(), ...v, focusFields: [...(v.focusFields ?? caseInput().focusFields)] })
      expect(d.hasUnpublishedChanges).toBe(true)
      expect((await updateCase(db, c.id, caseInput())).hasUnpublishedChanges).toBe(false)
    }
    // expectedCategory alone is not part of the published snapshot
    const d = await updateCase(db, c.id, { ...caseInput(), expectedCategory: 'white' })
    expect(d.hasUnpublishedChanges).toBe(false)
  })

  it('updateCase and unknown ids throw CaseNotFoundError; author is kept', async () => {
    const c = await createCase(db, caseInput(), 'u1')
    await updateCase(db, c.id, caseInput({ description: 'Anderer Text für den Fall.' }))
    const [row] = await db.select().from(cases).where(eq(cases.id, c.id))
    expect(row?.authorId).toBe('u1')
    for (const fn of [
      () => updateCase(db, unknownId, caseInput()),
      () => duplicateCase(db, unknownId, null),
      () => archiveCase(db, unknownId),
      () => restoreCase(db, unknownId),
      () => deleteCase(db, unknownId),
    ])
      await expect(fn()).rejects.toBeInstanceOf(CaseNotFoundError)
    expect(await getCase(db, unknownId)).toBeNull()
  })

  it('duplicateCase records the duplicating user as author', async () => {
    const c = await createCase(db, caseInput(), null)
    const copy = await duplicateCase(db, c.id, 'u1')
    const [row] = await db.select().from(cases).where(eq(cases.id, copy.id))
    expect(row?.authorId).toBe('u1')
  })

  it('deleteCase refuses cases with a published revision, also when archived', async () => {
    const c = await createCase(db, caseInput(), null)
    await publishCase(db, c.id, null)
    await archiveCase(db, c.id)
    await expect(deleteCase(db, c.id)).rejects.toBeInstanceOf(CaseHasRevisionsError)
    const draft = await createCase(db, caseInput(), null)
    await deleteCase(db, draft.id)
    expect(await getCase(db, draft.id)).toBeNull()
  })

  it('restoreCase turns archived into draft and leaves other statuses alone', async () => {
    const c = await createCase(db, caseInput(), null)
    await publishCase(db, c.id, null)
    expect((await restoreCase(db, c.id)).status).toBe('published')
    await archiveCase(db, c.id)
    expect((await restoreCase(db, c.id)).status).toBe('draft')
  })
})
