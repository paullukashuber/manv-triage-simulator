import { beforeEach, describe, expect, it } from 'vitest'
import { createTestDb, type Db } from '../db/client.ts'
import { cases } from '../db/schema.ts'
import { caseInput } from '../cases/fixtures.ts'
import { SEED_CASES } from './cases.ts'
import { seedCases, type SeedCase } from './seed.ts'

const seeds: SeedCase[] = [
  { ...caseInput(), slug: 's-1' },
  { ...caseInput(), slug: 's-2' },
]

describe('seedCases', () => {
  let db: Db
  beforeEach(async () => {
    db = await createTestDb()
  })

  it('seeds drafts into an empty db, then does nothing', async () => {
    expect(await seedCases(db, seeds, { publish: false })).toEqual({
      inserted: 2,
    })
    const rows = await db.select().from(cases)
    expect(rows.map((r) => r.status)).toEqual(['draft', 'draft'])
    expect(await seedCases(db, seeds, { publish: false })).toEqual({
      inserted: 0,
    })
    expect(await db.select().from(cases)).toHaveLength(2)
  })

  it('publishes when requested', async () => {
    await seedCases(db, seeds, { publish: true })
    const rows = await db.select().from(cases)
    expect(rows.map((r) => r.status)).toEqual(['published', 'published'])
  })

  it('throws naming the slug on invalid seed data', async () => {
    const bad = [{ ...caseInput(), slug: 'kaputt', description: 'kurz' }]
    await expect(seedCases(db, bad, { publish: false })).rejects.toThrow(/kaputt/)
    expect(await db.select().from(cases)).toEqual([])
  })

  it('placeholder SEED_CASES are valid and publishable', async () => {
    expect(SEED_CASES.map((s) => s.slug)).toEqual([
      'placeholder-1',
      'placeholder-2',
      'placeholder-3',
    ])
    expect(await seedCases(db, SEED_CASES, { publish: true })).toEqual({
      inserted: 3,
    })
  })
})
