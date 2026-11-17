import { triage, type Category, type Findings } from '@manv/triage'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../components/ui/Card.tsx'
import { CategoryBadge } from '../components/ui/CategoryBadge.tsx'
import { StepBadge } from '../components/ui/StepBadge.tsx'

type TriagePreviewProps = { findings: Findings; expectedCategory: Category }

export function TriagePreview({ findings, expectedCategory }: TriagePreviewProps) {
  const { t } = useTranslation()
  const pathId = useId()
  const result = triage(findings)
  const mismatch = result.category !== expectedCategory
  const rateMissing =
    findings.respiratoryRate === null && result.path.some((step) => step.key === 'abnormalBreathingRate')

  return (
    <Card aria-labelledby={`${pathId}-heading`} role="region">
      <h2 id={`${pathId}-heading`} className="font-bold">
        {t('editor.preview.heading')}
      </h2>

      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.82rem] text-muted">{t('editor.preview.computed')}</span>
        <CategoryBadge category={result.category} />
      </div>

      {mismatch && (
        <p role="alert" className="rounded-lg border border-wrong/40 bg-wrong/10 px-3 py-2 text-[0.82rem] text-text">
          {t('editor.preview.mismatch', {
            expected: t(`categories.${expectedCategory}.short`),
            computed: t(`categories.${result.category}.short`),
          })}
        </p>
      )}

      <h3 id={pathId} className="text-[0.82rem] font-bold text-muted">
        {t('editor.preview.path')}
      </h3>
      <ol aria-labelledby={pathId} className="flex flex-col gap-1">
        {result.path.map((step) => {
          const decisive = step.key === result.decisiveStep
          return (
            <li
              key={step.key}
              aria-current={decisive ? 'step' : undefined}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[0.82rem] ${
                decisive ? 'bg-accent-muted border border-accent/40' : ''
              }`}
            >
              <StepBadge stepKey={step.key} />
              <span className="flex-1 leading-snug">
                {t(`steps.${step.key}.question`)}
                {decisive && (
                  <span className="ml-1.5 text-[0.7rem] font-bold uppercase tracking-wide text-accent">
                    {t('editor.preview.decisive')}
                  </span>
                )}
              </span>
              <span className={`font-bold ${step.applies ? 'text-correct' : 'text-muted'}`}>
                {step.applies ? t('triage.yes') : t('triage.no')}
              </span>
            </li>
          )
        })}
      </ol>
      {result.decisiveStep === null && <p className="text-[0.82rem] text-muted">{t('editor.preview.noneApplies')}</p>}

      {rateMissing && (
        <p
          role="note"
          className="rounded-lg border border-sk2/40 bg-sk2/10 px-3 py-2 text-[0.82rem] leading-snug text-text"
        >
          {t('editor.preview.rateMissing')}
        </p>
      )}
    </Card>
  )
}
