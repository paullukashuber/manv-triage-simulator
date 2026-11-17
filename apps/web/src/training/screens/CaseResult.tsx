import type { GradeResult, TrainingCase } from '@manv/triage'
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

export function CaseResult({ current, total, trainingCase, grade, actionLabel, onAction }: CaseResultProps) {
  const { t } = useTranslation()
  const errors = grade.stepResults.filter((r) => r.errorType !== null)

  return (
    <>
      <Header badge={`${t('triage.patientLabel')} ${current}/${total}`}>
        <span className="text-base">{t('result.headerTitle')}</span>
      </Header>

      <PatientBanner description={trainingCase.description} />

      <Card className="gap-2.5">
        <div
          role="status"
          className={`rounded-lg px-4 py-3 text-center font-bold text-base border ${
            grade.isCorrect
              ? 'bg-correct/10 text-correct border-correct/40'
              : 'bg-wrong/10 text-wrong border-wrong/40'
          }`}
        >
          {grade.isCorrect ? t('result.correct') : t('result.wrong')}
        </div>

        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <p className="text-[0.65rem] text-dim mb-1">{t('result.yourCategory')}</p>
            <CategoryBadge category={grade.userCategory} />
          </div>
          {!grade.isCorrect && (
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

        <BarrierTape showHint />

        <p className="text-[0.82rem] leading-snug">
          <strong>{t('result.reasoning')}:</strong> <span className="text-muted">{trainingCase.reasoning}</span>
        </p>

        {errors.length > 0 && (
          <section className="flex flex-col gap-1.5">
            <h2 className="text-[0.65rem] font-bold text-dim uppercase tracking-[0.12em]">
              {t('result.errorsHeading')}
            </h2>
            <ul className="flex flex-col gap-1.5">
              {errors.map((error) => (
                <li
                  key={error.key}
                  className="px-2.5 py-1.5 rounded bg-wrong/6 border border-wrong/15 text-[0.8rem]"
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
        )}
      </Card>

      <div className="sticky-actions mt-auto">
        <Button onClick={onAction}>{actionLabel}</Button>
      </div>
    </>
  )
}
