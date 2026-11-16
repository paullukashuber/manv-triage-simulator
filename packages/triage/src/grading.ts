import { evaluateStep, triage } from './algorithm.ts'
import type { Findings } from './findings.ts'
import {
  FALLBACK_CATEGORY,
  STEP_KEYS,
  STEPS,
  type Category,
  type LearningField,
  type StepKey,
} from './steps.ts'

export class InvalidRunError extends Error {
  override name = 'InvalidRunError'
}

export type RunAnswer = { key: StepKey; answer: boolean }

export type StepResult = {
  key: StepKey
  learningField: LearningField
  userAnswer: boolean
  correctAnswer: boolean
  isCorrect: boolean
  errorType: 'missed' | 'overcalled' | null
}

export type GradeResult = {
  userCategory: Category
  correctCategory: Category
  isCorrect: boolean
  decisiveStep: StepKey | null
  stepResults: StepResult[]
  stoppedEarly: boolean
  passedDecisiveStep: boolean
}

function validateRun(answers: RunAnswer[]): void {
  if (answers.length === 0) throw new InvalidRunError('Run has no answers')
  if (answers.length > STEP_KEYS.length) throw new InvalidRunError('Run has too many answers')
  answers.forEach((a, i) => {
    if (a.key !== STEP_KEYS[i]) throw new InvalidRunError(`Unexpected step ${a.key} at index ${i}`)
    if (a.answer && i !== answers.length - 1) {
      throw new InvalidRunError('Run continues after a "yes"')
    }
  })
  const last = answers[answers.length - 1]
  if (last && !last.answer && answers.length < STEP_KEYS.length) {
    throw new InvalidRunError('Run ends with "no" before the last step')
  }
}

export function gradeRun(findings: Findings, answers: RunAnswer[]): GradeResult {
  validateRun(answers)

  const stepResults = answers.map((a): StepResult => {
    const step = STEPS.find((s) => s.key === a.key)
    if (!step) throw new InvalidRunError(`Unknown step ${a.key}`)
    const correctAnswer = evaluateStep(a.key, findings)
    return {
      key: a.key,
      learningField: step.learningField,
      userAnswer: a.answer,
      correctAnswer,
      isCorrect: a.answer === correctAnswer,
      errorType: a.answer === correctAnswer ? null : correctAnswer ? 'missed' : 'overcalled',
    }
  })

  const correct = triage(findings)
  const lastIndex = answers.length - 1
  const stoppedAt = answers[lastIndex]?.answer ? lastIndex : -1
  const userCategory =
    stoppedAt >= 0 ? (STEPS[stoppedAt]?.resultIfYes ?? FALLBACK_CATEGORY) : FALLBACK_CATEGORY

  const decisiveIndex = correct.decisiveStep === null ? -1 : STEP_KEYS.indexOf(correct.decisiveStep)
  const stoppedEarly = stoppedAt >= 0 && (decisiveIndex === -1 || stoppedAt < decisiveIndex)
  const passedDecisiveStep = decisiveIndex >= 0 && answers[decisiveIndex]?.answer === false

  return {
    userCategory,
    correctCategory: correct.category,
    isCorrect: userCategory === correct.category,
    decisiveStep: correct.decisiveStep,
    stepResults,
    stoppedEarly,
    passedDecisiveStep,
  }
}
