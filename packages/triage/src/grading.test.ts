import { describe, expect, it } from 'vitest'
import { defaultFindings, type Findings } from './findings.ts'
import { gradeRun, InvalidRunError, type RunAnswer } from './grading.ts'
import { STEP_KEYS, type StepKey } from './steps.ts'

const with_ = (patch: Partial<Findings>): Findings => ({ ...defaultFindings(), ...patch })
const a = (key: StepKey, answer: boolean): RunAnswer => ({ key, answer })
const allNo = (): RunAnswer[] => STEP_KEYS.map((key) => a(key, false))

describe('gradeRun', () => {
  it('grades a correct run', () => {
    const r = gradeRun(with_({ ambulatory: true }), [a('tourniquet', false), a('ambulatory', true)])
    expect(r.verdict).toBe('correct')
    expect(r.categoryCorrect).toBe(true)
    expect(r.userCategory).toBe('white')
    expect(r.stepResults.every((s) => s.isCorrect)).toBe(true)
    expect(r.stoppedEarly).toBe(false)
    expect(r.passedDecisiveStep).toBe(false)
  })

  it('flags stopping too early', () => {
    const r = gradeRun(with_({ respiratoryRate: 34 }), [a('tourniquet', false), a('ambulatory', true)])
    expect(r.userCategory).toBe('white')
    expect(r.correctCategory).toBe('red')
    expect(r.verdict).toBe('wrong')
    expect(r.categoryCorrect).toBe(false)
    expect(r.stoppedEarly).toBe(true)
    expect(r.stepResults[1]?.errorType).toBe('overcalled')
  })

  it('flags passing the decisive step', () => {
    const r = gradeRun(with_({ ambulatory: true }), allNo())
    expect(r.userCategory).toBe('yellow')
    expect(r.decisiveStep).toBe('ambulatory')
    expect(r.passedDecisiveStep).toBe(true)
    expect(r.stoppedEarly).toBe(false)
    expect(r.stepResults[1]?.errorType).toBe('missed')
    expect(r.stepResults).toHaveLength(9)
  })

  it('grades later steps against the findings', () => {
    const r = gradeRun(with_({ airwayNeedsManagement: true, respondsPurposefully: false }), allNo())
    expect(r.stepResults[8]).toMatchObject({
      key: 'unresponsive',
      correctAnswer: true,
      errorType: 'missed',
      learningField: 'd',
    })
  })

  it('treats a yes without decisive step as stopped early', () => {
    const r = gradeRun(with_({}), [a('tourniquet', true)])
    expect(r.correctCategory).toBe('yellow')
    expect(r.userCategory).toBe('red')
    expect(r.stoppedEarly).toBe(true)
    expect(r.passedDecisiveStep).toBe(false)
  })

  it('gives "wrongPath" when an early yes lands on the right category', () => {
    // Decisive step is C (no radial pulse), but "yes" at X also yields red.
    const r = gradeRun(with_({ radialPulsePalpable: false }), [a('tourniquet', true)])
    expect(r.correctCategory).toBe('red')
    expect(r.userCategory).toBe('red')
    expect(r.categoryCorrect).toBe(true)
    expect(r.verdict).toBe('wrongPath')
  })

  it('gives "wrongPath" when a later yes lands on the right category after missing the decisive step', () => {
    const findings = with_({ inhalationTraumaStridor: true, radialPulsePalpable: false })
    const answers = [...STEP_KEYS.slice(0, STEP_KEYS.indexOf('noRadialPulse')).map((k) => a(k, false)), a('noRadialPulse', true)]
    const r = gradeRun(findings, answers)
    expect(r.decisiveStep).toBe('stridor')
    expect(r.userCategory).toBe('red')
    expect(r.verdict).toBe('wrongPath')
  })

  it('grades a correct all-"no" run as correct', () => {
    expect(gradeRun(with_({}), allNo()).verdict).toBe('correct')
  })

  it('marks answers after the decisive step as not graded', () => {
    const r = gradeRun(with_({ ambulatory: true, respondsPurposefully: false }), allNo())
    expect(r.decisiveStep).toBe('ambulatory')
    expect(r.stepResults.map((s) => s.afterDecisiveStep)).toEqual([
      false, false, true, true, true, true, true, true, true,
    ])
    expect(r.stepResults[8]?.errorType).toBe('missed')
  })

  it('marks no answer as after the decisive step when there is none', () => {
    const r = gradeRun(with_({}), allNo())
    expect(r.stepResults.every((s) => !s.afterDecisiveStep)).toBe(true)
  })

  it.each([
    ['empty', []],
    ['wrong start', [a('ambulatory', false)]],
    ['continues after yes', [a('tourniquet', true), a('ambulatory', false)]],
    ['ends on no before step 9', [a('tourniquet', false), a('ambulatory', false), a('deathSigns', false)]],
  ] as const)('rejects invalid run: %s', (_name, answers) => {
    expect(() => gradeRun(defaultFindings(), [...answers])).toThrow(InvalidRunError)
  })
})
