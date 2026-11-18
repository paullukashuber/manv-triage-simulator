import type { GradeResult, StepResult, TrainingCase, Verdict } from '@manv/triage'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { BarrierTape } from '../../components/ui/BarrierTape.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { CategoryBadge } from '../../components/ui/CategoryBadge.tsx'
import { Card } from '../../components/ui/Card.tsx'
import { Header } from '../../components/ui/Header.tsx'
import { PatientBanner } from '../../components/ui/PatientBanner.tsx'

type CaseResultProps = {
  current: number
  total: number
  trainingCase: TrainingCase
  grade: GradeResult
  actionLabel: string
  onAction: () => void
}

const VERDICT_STYLES: Record<Verdict, string> = {
  correct: 'bg-correct/10 text-correct border-correct/40',
  wrongPath: 'bg-accent/10 text-accent border-accent/40',
  wrong: 'bg-wrong/10 text-wrong border-wrong/40',
}

function ErrorList({ heading, errors, graded }: { heading: string; errors: StepResult[]; graded: boolean }) {
  const { t } = useTranslation()
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-1.5">
      <h2 id={headingId} className="text-[0.65rem] font-bold text-dim uppercase tracking-[0.12em]">
        {heading}
      </h2>
      <ul className="flex flex-col gap-1.5">
        {errors.map((error) => (
          <li
            key={error.key}
            className={`px-2.5 py-1.5 rounded border text-[0.8rem] ${
              graded ? 'bg-wrong/6 border-wrong/15' : 'bg-surface border-border text-muted'
            }`}
          >
            <p className="font-medium">{t(`steps.${error.key}.question`)}</p>
            <p className="text-muted text-[0.72rem] mt-px">
              {error.errorType && <strong>{t(`training.errorTypes.${error.errorType}`)}</strong>}
              {' · '}
              {t(`training.learningFields.${error.learningField}`)}
            </p>
            <p className="text-muted text-[0.72rem] mt-px">
              {t('result.errorYourAnswer')}: {error.userAnswer ? t('triage.yes') : t('triage.no')}
              {' · '}
              {t('result.errorCorrectAnswer')}: {error.correctAnswer ? t('triage.yes') : t('triage.no')}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function CaseResult({ current, total, trainingCase, grade, actionLabel, onAction }: CaseResultProps) {
  const { t } = useTranslation()
  const errors = grade.stepResults.filter((r) => r.errorType !== null)
  const gradedErrors = errors.filter((r) => !r.afterDecisiveStep)
  const notGradedErrors = errors.filter((r) => r.afterDecisiveStep)

  return (
    <>
      <Header badge={`${t('triage.patientLabel')} ${current}/${total}`}>
        <span className="text-base">{t('result.headerTitle')}</span>
      </Header>

      <PatientBanner description={trainingCase.description} />

      <Card className="gap-2.5">
        <div
          role="status"
          className={`rounded-lg px-4 py-3 text-center font-bold text-base border ${VERDICT_STYLES[grade.verdict]}`}
        >
          {t(`result.${grade.verdict}`)}
        </div>

        {grade.verdict === 'wrongPath' && (
          <p className="text-[0.82rem] leading-snug text-muted">{t('result.wrongPathHint')}</p>
        )}

        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <p className="text-[0.65rem] text-dim mb-1">{t('result.yourCategory')}</p>
            <CategoryBadge category={grade.userCategory} />
          </div>
          {!grade.categoryCorrect && (
            <>
              <span aria-hidden="true" className="text-dim text-lg">
                →
              </span>
              <div className="text-center">
                <p className="text-[0.65rem] text-dim mb-1">{t('result.correctCategory')}</p>
                <CategoryBadge category={grade.correctCategory} />
              </div>
            </>
          )}
        </div>

        {grade.verdict !== 'correct' && (
          <p className="text-[0.82rem] leading-snug">
            {t('result.decisiveStep')}:{' '}
            {grade.decisiveStep ? t(`steps.${grade.decisiveStep}.question`) : t('result.noDecisiveStep')}
          </p>
        )}

        <BarrierTape showHint />

        <p className="text-[0.82rem] leading-snug">
          <strong>{t('result.reasoning')}:</strong> <span className="text-muted">{trainingCase.reasoning}</span>
        </p>

        {gradedErrors.length > 0 && (
          <ErrorList heading={t('result.errorsHeading')} errors={gradedErrors} graded />
        )}
        {notGradedErrors.length > 0 && (
          <ErrorList heading={t('result.notGradedHeading')} errors={notGradedErrors} graded={false} />
        )}
      </Card>

      <div className="sticky-actions mt-auto">
        <Button onClick={onAction}>{actionLabel}</Button>
      </div>
    </>
  )
}
