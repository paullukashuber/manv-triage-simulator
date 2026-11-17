import type { StepKey } from '@manv/triage'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button.tsx'
import { Card } from '../../components/ui/Card.tsx'
import { Header } from '../../components/ui/Header.tsx'
import { PatientBanner } from '../../components/ui/PatientBanner.tsx'
import { ProgressBar } from '../../components/ui/ProgressBar.tsx'
import { StepBadge } from '../../components/ui/StepBadge.tsx'

type StepScreenProps = {
  current: number
  total: number
  description: string
  stepKey: StepKey
  stepNumber: number
  stepCount: number
  onAnswer: (answer: boolean) => void
}

export function StepScreen({ current, total, description, stepKey, stepNumber, stepCount, onAnswer }: StepScreenProps) {
  const { t } = useTranslation()
  return (
    <>
      <Header badge={`${t('triage.patientLabel')} ${current}/${total}`}>
        <span className="text-base">{t('triage.headerTitle')}</span>
      </Header>

      <PatientBanner description={description} />
      <ProgressBar current={stepNumber} total={stepCount} />

      <Card className="gap-0">
        <div className="flex items-start gap-2.5">
          <StepBadge stepKey={stepKey} />
          <div className="min-w-0">
            <h2 className="text-base font-bold leading-snug">{t(`steps.${stepKey}.question`)}</h2>
            <p className="text-[0.78rem] text-muted mt-1 leading-snug whitespace-pre-line">
              {t(`steps.${stepKey}.hint`)}
            </p>
          </div>
        </div>
      </Card>

      <div className="sticky-actions mt-auto">
        <div className="flex gap-2.5">
          <Button variant="yes" onClick={() => onAnswer(true)}>
            {t('triage.yes')}
          </Button>
          <Button variant="no" onClick={() => onAnswer(false)}>
            {t('triage.no')}
          </Button>
        </div>
      </div>
    </>
  )
}
