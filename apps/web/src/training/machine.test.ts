import { describe, expect, it } from 'vitest'
import { makeCase } from './fixtures.ts'
import { createTrainingState, trainingReducer, type TrainingAction } from './machine.ts'

function run(cases: ReturnType<typeof makeCase>[], actions: TrainingAction[]) {
  return actions.reduce(trainingReducer, createTrainingState(cases))
}

describe('trainingReducer', () => {
  it('starts in intro phase', () => {
    const state = createTrainingState([makeCase('1')])
    expect(state).toMatchObject({ phase: 'intro', caseIndex: 0, answers: [], results: [] })
  })

  it('grades after a "yes" and moves to result', () => {
    const state = run(
      [makeCase('1', { ambulatory: true })],
      [{ type: 'begin' }, { type: 'answer', answer: false }, { type: 'answer', answer: true }],
    )
    expect(state.phase).toBe('result')
    expect(state.results).toHaveLength(1)
    expect(state.results[0]?.grade.verdict).toBe('correct')
    expect(state.results[0]?.grade.userCategory).toBe('white')
  })

  it('moves to summary on next after the last case', () => {
    const state = run(
      [makeCase('1', { ambulatory: true })],
      [
        { type: 'begin' },
        { type: 'answer', answer: false },
        { type: 'answer', answer: true },
        { type: 'next' },
      ],
    )
    expect(state.phase).toBe('summary')
  })

  it('moves to the next case intro with reset answers', () => {
    const state = run(
      [makeCase('1', { ambulatory: true }), makeCase('2')],
      [
        { type: 'begin' },
        { type: 'answer', answer: false },
        { type: 'answer', answer: true },
        { type: 'next' },
      ],
    )
    expect(state).toMatchObject({ phase: 'intro', caseIndex: 1, answers: [] })
    expect(state.results).toHaveLength(1)
  })

  it('grades yellow after nine "no" answers on default findings', () => {
    const nine: TrainingAction[] = Array.from({ length: 9 }, () => ({ type: 'answer', answer: false }))
    const state = run([makeCase('1')], [{ type: 'begin' }, ...nine])
    expect(state.phase).toBe('result')
    expect(state.results[0]?.grade.userCategory).toBe('yellow')
    expect(state.results[0]?.grade.verdict).toBe('correct')
  })

  it('stays in step phase after eight "no" answers', () => {
    const eight: TrainingAction[] = Array.from({ length: 8 }, () => ({ type: 'answer', answer: false }))
    const state = run([makeCase('1')], [{ type: 'begin' }, ...eight])
    expect(state.phase).toBe('step')
    expect(state.answers).toHaveLength(8)
  })

  it('ignores answer outside the step phase', () => {
    const initial = createTrainingState([makeCase('1')])
    expect(trainingReducer(initial, { type: 'answer', answer: true })).toBe(initial)
  })

  it('ignores begin and next in wrong phases', () => {
    const initial = createTrainingState([makeCase('1')])
    expect(trainingReducer(initial, { type: 'next' })).toBe(initial)
    const stepping = trainingReducer(initial, { type: 'begin' })
    expect(trainingReducer(stepping, { type: 'begin' })).toBe(stepping)
  })
})
