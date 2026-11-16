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
    expect(r.isCorrect).toBe(true)
    expect(r.userCategory).toBe('white')
    expect(r.stepResults.every((s) => s.isCorrect)).toBe(true)
    expect(r.stoppedEarly).toBe(false)
    expect(r.passedDecisiveStep).toBe(false)
  })

  it('flags stopping too early', () => {
    const r = gradeRun(with_({ respiratoryRate: 34 }), [a('tourniquet', false), a('ambulatory', true)])
    expect(r.userCategory).toBe('white')
    expect(r.correctCategory).toBe('red')
    expect(r.isCorrect).toBe(false)
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

  it.each([
    ['empty', []],
    ['wrong start', [a('ambulatory', false)]],
    ['continues after yes', [a('tourniquet', true), a('ambulatory', false)]],
    ['ends on no before step 9', [a('tourniquet', false), a('ambulatory', false), a('deathSigns', false)]],
  ] as const)('rejects invalid run: %s', (_name, answers) => {
    expect(() => gradeRun(defaultFindings(), [...answers])).toThrow(InvalidRunError)
  })
})
