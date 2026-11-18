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
  /** Answered after the decisive step was passed; shown to the learner but not graded. */
  afterDecisiveStep: boolean
}

/**
 * - `correct`: the learner stopped exactly at the decisive step (category and path right).
 * - `wrongPath`: the category matches, but the learner stopped at another step.
 * - `wrong`: the category does not match.
 */
export type Verdict = 'correct' | 'wrongPath' | 'wrong'

export type GradeResult = {
  userCategory: Category
  correctCategory: Category
  verdict: Verdict
  categoryCorrect: boolean
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

  const correct = triage(findings)
  const decisiveIndex = correct.decisiveStep === null ? -1 : STEP_KEYS.indexOf(correct.decisiveStep)

  const stepResults = answers.map((a, index): StepResult => {
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
      afterDecisiveStep: decisiveIndex >= 0 && index > decisiveIndex,
    }
  })

  const lastIndex = answers.length - 1
  const stoppedAt = answers[lastIndex]?.answer ? lastIndex : -1
  const userCategory =
    stoppedAt >= 0 ? (STEPS[stoppedAt]?.resultIfYes ?? FALLBACK_CATEGORY) : FALLBACK_CATEGORY

  const stoppedEarly = stoppedAt >= 0 && (decisiveIndex === -1 || stoppedAt < decisiveIndex)
  const passedDecisiveStep = decisiveIndex >= 0 && answers[decisiveIndex]?.answer === false

  const categoryCorrect = userCategory === correct.category
  const pathCorrect = stoppedAt === decisiveIndex
  const verdict: Verdict = pathCorrect ? 'correct' : categoryCorrect ? 'wrongPath' : 'wrong'

  return {
    userCategory,
    correctCategory: correct.category,
    verdict,
    categoryCorrect,
    decisiveStep: correct.decisiveStep,
    stepResults,
    stoppedEarly,
    passedDecisiveStep,
  }
}
