import { describe, expect, it } from 'vitest'
import { caseInputSchema } from './case.ts'
import { defaultFindings } from './findings.ts'

const valid = () => ({
  description: 'Erwachsener, liegt am Boden, ansprechbar.',
  reasoning: 'Keine der Kriterien trifft zu, daher SK 2.',
  findings: defaultFindings(),
  expectedCategory: 'yellow',
  focusFields: ['a', 'b'],
  tags: ['Einstieg'],
})

describe('caseInputSchema', () => {
  it('accepts a complete valid case', () => {
    expect(caseInputSchema.safeParse(valid()).success).toBe(true)
  })

  it('rejects a too short description', () => {
    expect(caseInputSchema.safeParse({ ...valid(), description: 'kurz' }).success).toBe(false)
  })

  it('rejects duplicate focusFields', () => {
    expect(caseInputSchema.safeParse({ ...valid(), focusFields: ['a', 'a'] }).success).toBe(false)
  })

  it('rejects 11 tags', () => {
    const tags = Array.from({ length: 11 }, (_, i) => `tag${i}`)
    expect(caseInputSchema.safeParse({ ...valid(), tags }).success).toBe(false)
  })

  it('rejects an empty tag', () => {
    expect(caseInputSchema.safeParse({ ...valid(), tags: [''] }).success).toBe(false)
  })
})
