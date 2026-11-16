import { describe, expect, it } from 'vitest'
import { evaluateStep, isRespiratoryRatePathological, triage } from './algorithm.ts'
import { defaultFindings, type Findings } from './findings.ts'

const base = defaultFindings()
const with_ = (patch: Partial<Findings>): Findings => ({ ...base, ...patch })

describe('triage', () => {
  it('falls back to yellow for default findings', () => {
    const result = triage(base)
    expect(result.category).toBe('yellow')
    expect(result.decisiveStep).toBeNull()
    expect(result.path).toHaveLength(9)
    expect(result.path.every((p) => !p.applies)).toBe(true)
  })

  it('lets life-threatening extremity bleeding beat ambulatory', () => {
    const result = triage(with_({ lifeThreateningExtremityBleeding: true, ambulatory: true }))
    expect(result.category).toBe('red')
    expect(result.decisiveStep).toBe('tourniquet')
    expect(result.path).toHaveLength(1)
  })

  it('classifies ambulatory patients as white', () => {
    const result = triage(with_({ ambulatory: true }))
    expect(result.category).toBe('white')
    expect(result.path).toEqual([
      { key: 'tourniquet', applies: false },
      { key: 'ambulatory', applies: true },
    ])
  })

  it.each([
    [{ definiteDeathSigns: true }, 'dead', 'deathSigns'],
    [{ inhalationTraumaStridor: true }, 'red', 'stridor'],
    [{ airwayNeedsManagement: true }, 'red', 'airwayBlocked'],
    [{ respiratoryRate: 34 }, 'red', 'abnormalBreathingRate'],
    [{ lifeThreateningBleeding: true }, 'red', 'majorBleeding'],
    [{ radialPulsePalpable: false }, 'red', 'noRadialPulse'],
    [{ respondsPurposefully: false }, 'red', 'unresponsive'],
  ] as const)('decides on %j', (patch, category, step) => {
    const result = triage(with_(patch))
    expect(result.category).toBe(category)
    expect(result.decisiveStep).toBe(step)
    expect(result.path.at(-1)).toEqual({ key: step, applies: true })
  })
})

describe('evaluateStep', () => {
  it('maps each step to its finding', () => {
    expect(evaluateStep('noRadialPulse', with_({ radialPulsePalpable: false }))).toBe(true)
    expect(evaluateStep('noRadialPulse', base)).toBe(false)
    expect(evaluateStep('unresponsive', base)).toBe(false)
  })
})

describe('isRespiratoryRatePathological', () => {
  it.each([
    ['adult', 9, true],
    ['adult', 10, false],
    ['adult', 30, false],
    ['adult', 31, true],
    ['child', 14, true],
    ['child', 15, false],
    ['child', 40, false],
    ['child', 41, true],
    ['adult', null, false],
    ['child', null, false],
  ] as const)('%s rate %s -> %s', (ageGroup, rate, expected) => {
    expect(isRespiratoryRatePathological(rate, ageGroup)).toBe(expected)
  })
})
