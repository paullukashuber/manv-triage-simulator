import { useTranslation } from 'react-i18next'

type PatientBannerProps = { description: string; label?: string }

export function PatientBanner({ description, label }: PatientBannerProps) {
  const { t } = useTranslation()
  return (
    <div className="bg-surface border border-border border-l-3 border-l-accent rounded-lg px-3 py-2">
      <p className="text-[0.55rem] font-bold tracking-[0.14em] uppercase text-accent mb-0.5">
        {label ?? t('triage.patientLabel')}
      </p>
      <p className="text-[0.82rem] leading-snug">{description}</p>
    </div>
  )
}
