import { useTranslation } from 'react-i18next'

type ProgressBarProps = { current: number; total: number }

export function ProgressBar({ current, total }: ProgressBarProps) {
  const { t } = useTranslation()
  const percent = total > 0 ? (current / total) * 100 : 0
  return (
    <div className="flex items-center gap-2 text-[0.7rem] text-dim">
      <span className="font-medium tabular-nums">{t('triage.stepProgress', { current: String(current), total: String(total) })}</span>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuenow={current}
        aria-valuemax={total}
        className="flex-1 h-1 bg-surface rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
