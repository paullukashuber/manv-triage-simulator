import { describe, expect, it } from 'vitest'
import { defaultFindings, findingsSchema, type Findings } from './findings.ts'
import { STEP_KEYS, STEPS } from './steps.ts'

describe('findings', () => {
  it('defaultFindings has the specified values and satisfies the schema', () => {
    const f = defaultFindings()
    expect(findingsSchema.safeParse(f).success).toBe(true)
    expect(f).toEqual({
      lifeThreateningExtremityBleeding: false,
      ambulatory: false,
      definiteDeathSigns: false,
      inhalationTraumaStridor: false,
      airwayNeedsManagement: false,
      ageGroup: 'adult',
      respiratoryRate: null,
      lifeThreateningBleeding: false,
      radialPulsePalpable: true,
      respondsPurposefully: true,
    })
  })

  it.each([-1, 12.5, 81])('rejects respiratoryRate %s', (respiratoryRate) => {
    expect(findingsSchema.safeParse({ ...defaultFindings(), respiratoryRate }).success).toBe(false)
  })

  it.each([0, 80, null])('accepts respiratoryRate %s', (respiratoryRate) => {
    expect(findingsSchema.safeParse({ ...defaultFindings(), respiratoryRate }).success).toBe(true)
  })

  it('rejects unknown keys', () => {
    expect(findingsSchema.safeParse({ ...defaultFindings(), foo: true }).success).toBe(false)
  })

  it('rejects missing ageGroup', () => {
    const input: Partial<Findings> = defaultFindings()
    delete input.ageGroup
    expect(findingsSchema.safeParse(input).success).toBe(false)
  })
})

describe('steps', () => {
  it('STEPS follow STEP_KEYS order', () => {
    expect(STEPS.map((s) => s.key)).toEqual([...STEP_KEYS])
  })

  it('maps steps to learning field, badge and result', () => {
    expect(STEPS.map((s) => [s.key, s.learningField, s.badge, s.resultIfYes])).toEqual([
      ['tourniquet', 'x', 'x', 'red'],
      ['ambulatory', 'ambulatory', 'walk', 'white'],
      ['deathSigns', 'death', 'dead', 'dead'],
      ['stridor', 'a', 'a', 'red'],
      ['airwayBlocked', 'a', 'a', 'red'],
      ['abnormalBreathingRate', 'b', 'b', 'red'],
      ['majorBleeding', 'c', 'c', 'red'],
      ['noRadialPulse', 'c', 'c', 'red'],
      ['unresponsive', 'd', 'd', 'red'],
    ])
  })
})
