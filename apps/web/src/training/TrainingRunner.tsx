import { STEP_KEYS, type TrainingCase } from '@manv/triage'
import { useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import { CaseIntro } from './screens/CaseIntro.tsx'
import { CaseResult } from './screens/CaseResult.tsx'
import { StepScreen } from './screens/StepScreen.tsx'
import { Summary } from './screens/Summary.tsx'
import { createTrainingState, trainingReducer } from './machine.ts'

type TrainingRunnerProps = {
  cases: TrainingCase[]
  mode: 'session' | 'preview'
  /** Leaves the runner: back to the start screen (session) or to the editor (preview). */
  onExit: () => void
  /** Session only: draw a fresh case set after the summary. */
  onRetry?: () => void
}

export function TrainingRunner({ cases, mode, onExit, onRetry }: TrainingRunnerProps) {
  const { t } = useTranslation()
  const [state, dispatch] = useReducer(trainingReducer, cases, createTrainingState)

  const trainingCase = state.cases[state.caseIndex]
  const total = state.cases.length
  const current = state.caseIndex + 1
  const stepKey = STEP_KEYS[state.answers.length]
  const lastResult = state.results[state.results.length - 1]

  if (state.phase === 'summary') {
    return <Summary results={state.results} onRetry={onRetry} onHome={onExit} />
  }
  if (!trainingCase) return null

  if (state.phase === 'intro') {
    return (
      <CaseIntro
        current={current}
        total={total}
        description={trainingCase.description}
        onBegin={() => dispatch({ type: 'begin' })}
      />
    )
  }

  if (state.phase === 'step' && stepKey) {
    return (
      <StepScreen
        current={current}
        total={total}
        description={trainingCase.description}
        stepKey={stepKey}
        stepNumber={state.answers.length + 1}
        stepCount={STEP_KEYS.length}
        onAnswer={(answer) => dispatch({ type: 'answer', answer })}
      />
    )
  }

  if (state.phase === 'result' && lastResult) {
    const isPreview = mode === 'preview'
    const hasMore = state.caseIndex + 1 < total
    const actionLabel = isPreview
      ? t('training.backToEditor')
      : hasMore
        ? t('result.nextPatient')
        : t('result.toSummary')
    return (
      <CaseResult
        current={current}
        total={total}
        trainingCase={lastResult.trainingCase}
        grade={lastResult.grade}
        actionLabel={actionLabel}
        onAction={isPreview ? onExit : () => dispatch({ type: 'next' })}
      />
    )
  }

  return null
}
