import { useTranslation } from 'react-i18next'
import { BarrierTape } from '../../components/ui/BarrierTape.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Card } from '../../components/ui/Card.tsx'
import { Header } from '../../components/ui/Header.tsx'
import { PatientBanner } from '../../components/ui/PatientBanner.tsx'

type CaseIntroProps = { current: number; total: number; description: string; onBegin: () => void }

export function CaseIntro({ current, total, description, onBegin }: CaseIntroProps) {
  const { t } = useTranslation()
  return (
    <>
      <Header
        badge={t('triage.headerTitle')}
        title={t('scenarioIntro.patientCounter', { current: String(current), total: String(total) })}
      />

      <Card>
        <PatientBanner description={description} label={t('scenarioIntro.missionLabel')} />
        <BarrierTape />
        <div className="bg-accent-muted border border-accent/15 rounded-lg px-3 py-2 text-[0.82rem] leading-snug text-muted">
          {t('scenarioIntro.info')}
        </div>
      </Card>

      <div className="sticky-actions mt-auto">
        <Button onClick={onBegin}>{t('scenarioIntro.button')}</Button>
      </div>
    </>
  )
}
