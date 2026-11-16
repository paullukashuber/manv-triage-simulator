import { describe, expect, it } from 'vitest'
import { caseInputSchema, STEP_KEYS, triage, type StepKey } from '@manv/triage'
import { SEED_CASES } from './cases.ts'

const LEGACY_IDS = Array.from({ length: 18 }, (_, i) => i + 1)
const ALLOWED_TAGS = new Set([
  'Kind',
  'Brand',
  'Verkehrsunfall',
  'Sturz',
  'Explosion',
  'Massenpanik',
  'Grenzwert',
  'Falle',
])

const results = SEED_CASES.map((c) => ({ c, result: triage(c.findings) }))

describe('SEED_CASES', () => {
  it('has at least 30 cases with unique slugs', () => {
    expect(SEED_CASES.length).toBeGreaterThanOrEqual(30)
    const slugs = SEED_CASES.map((c) => c.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('contains all 18 legacy cases and only legacy-*/new-* slugs', () => {
    const slugs = SEED_CASES.map((c) => c.slug)
    for (const id of LEGACY_IDS) expect(slugs).toContain(`legacy-${id}`)
    for (const slug of slugs) expect(slug).toMatch(/^(legacy-\d+|new-[a-z0-9-]+)$/)
  })

  it.each(SEED_CASES.map((c) => [c.slug, c] as const))('%s satisfies caseInputSchema', (_slug, c) => {
    const { slug, ...input } = c
    const parsed = caseInputSchema.safeParse(input)
    expect(parsed.success, `${slug}: ${JSON.stringify(parsed.error?.issues)}`).toBe(true)
  })

  it.each(results.map(({ c, result }) => [c.slug, c, result] as const))(
    '%s: computed category matches expectedCategory',
    (slug, c, result) => {
      expect(result.category, slug).toBe(c.expectedCategory)
    },
  )

  it.each(results.map(({ c, result }) => [c.slug, c, result] as const))(
    '%s: states the counted AF whenever B is on the path or a rate is set',
    (slug, c, result) => {
      const rate = c.findings.respiratoryRate
      if (result.path.some((p) => p.key === 'abnormalBreathingRate')) {
        expect(rate, slug).not.toBeNull()
      }
      if (rate !== null) expect(c.description, slug).toContain(`AF gezählt: ${rate}/min`)
    },
  )

  it.each(SEED_CASES.map((c) => [c.slug, c] as const))(
    '%s: description does not name the answer',
    (slug, c) => {
      expect(c.description, slug).not.toMatch(/\bSK ?[12]\b|PAK|Tourniquet|Sichtungskategorie/)
    },
  )

  it.each(SEED_CASES.map((c) => [c.slug, c] as const))(
    '%s: uses only allowed tags; trap cases set focusFields; children are tagged',
    (slug, c) => {
      for (const tag of c.tags) expect(ALLOWED_TAGS.has(tag), `${slug}: ${tag}`).toBe(true)
      if (c.tags.includes('Falle')) expect(c.focusFields.length, slug).toBeGreaterThan(0)
      expect(c.tags.includes('Kind'), slug).toBe(c.findings.ageGroup === 'child')
    },
  )

  it('keeps the legacy expected categories', () => {
    const legacy = Object.fromEntries(
      SEED_CASES.filter((c) => c.slug.startsWith('legacy-')).map((c) => [
        c.slug,
        c.expectedCategory,
      ]),
    )
    expect(legacy).toEqual({
      'legacy-1': 'white',
      'legacy-2': 'red',
      'legacy-3': 'red',
      'legacy-4': 'dead',
      'legacy-5': 'red',
      'legacy-6': 'yellow',
      'legacy-7': 'red',
      'legacy-8': 'red',
      'legacy-9': 'white',
      'legacy-10': 'white',
      'legacy-11': 'dead',
      'legacy-12': 'red',
      'legacy-13': 'red',
      'legacy-14': 'red',
      'legacy-15': 'red',
      'legacy-16': 'yellow',
      'legacy-17': 'yellow',
      'legacy-18': 'yellow',
    })
  })

  it('makes legacy case 3 decide on X (tourniquet)', () => {
    const c = SEED_CASES.find((s) => s.slug === 'legacy-3')
    expect(c && triage(c.findings).decisiveStep).toBe('tourniquet')
  })

  it('covers every step at least twice as decisive step', () => {
    const counts = new Map<StepKey, number>(STEP_KEYS.map((k) => [k, 0]))
    for (const { result } of results) {
      if (result.decisiveStep) {
        counts.set(result.decisiveStep, (counts.get(result.decisiveStep) ?? 0) + 1)
      }
    }
    for (const key of STEP_KEYS) expect(counts.get(key), key).toBeGreaterThanOrEqual(2)
  })

  it('has at least 4 yellow cases and at least 4 child cases', () => {
    expect(SEED_CASES.filter((c) => c.expectedCategory === 'yellow').length).toBeGreaterThanOrEqual(4)
    expect(SEED_CASES.filter((c) => c.findings.ageGroup === 'child').length).toBeGreaterThanOrEqual(4)
  })

  it.each([
    ['adult', 9],
    ['adult', 10],
    ['adult', 30],
    ['adult', 31],
    ['child', 14],
    ['child', 15],
    ['child', 40],
    ['child', 41],
  ] as const)('includes the AF boundary value %s %i', (ageGroup, rate) => {
    expect(
      SEED_CASES.some(
        (c) => c.findings.ageGroup === ageGroup && c.findings.respiratoryRate === rate,
      ),
    ).toBe(true)
  })
})
