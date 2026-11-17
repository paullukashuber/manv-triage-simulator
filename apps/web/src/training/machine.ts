import { gradeRun, STEP_KEYS, type GradeResult, type RunAnswer, type TrainingCase } from '@manv/triage'

export type TrainingPhase = 'intro' | 'step' | 'result' | 'summary'

export type CaseResult = { trainingCase: TrainingCase; grade: GradeResult }

export type TrainingState = {
  phase: TrainingPhase
  cases: TrainingCase[]
  caseIndex: number
  /** Answers of the current case, in algorithm order. */
  answers: RunAnswer[]
  results: CaseResult[]
}

export type TrainingAction = { type: 'begin' } | { type: 'answer'; answer: boolean } | { type: 'next' }

export function createTrainingState(cases: TrainingCase[]): TrainingState {
  return { phase: 'intro', cases, caseIndex: 0, answers: [], results: [] }
}

export function trainingReducer(state: TrainingState, action: TrainingAction): TrainingState {
  switch (action.type) {
    case 'begin':
      return state.phase === 'intro' ? { ...state, phase: 'step', answers: [] } : state

    case 'answer': {
      const trainingCase = state.cases[state.caseIndex]
      const key = STEP_KEYS[state.answers.length]
      if (state.phase !== 'step' || !trainingCase || !key) return state
      const answers = [...state.answers, { key, answer: action.answer }]
      if (!action.answer && answers.length < STEP_KEYS.length) return { ...state, answers }
      const grade = gradeRun(trainingCase.findings, answers)
      return { ...state, phase: 'result', answers, results: [...state.results, { trainingCase, grade }] }
    }

    case 'next': {
      if (state.phase !== 'result') return state
      const caseIndex = state.caseIndex + 1
      if (caseIndex >= state.cases.length) return { ...state, phase: 'summary' }
      return { ...state, phase: 'intro', caseIndex, answers: [] }
    }
  }
}
