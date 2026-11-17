import type { CaseStatus } from '@manv/triage'
import { useTranslation } from 'react-i18next'

const STATUS_STYLES: Record<CaseStatus, string> = {
  draft: 'border-border-light text-muted',
  published: 'border-correct/50 text-correct',
  archived: 'border-dim text-dim line-through decoration-dim/60',
}

const CHIP_CLASS = 'inline-flex items-center rounded-full border px-2 py-px text-[0.7rem] font-bold tracking-wide'

export function CaseStatusChip({ status }: { status: CaseStatus }) {
  const { t } = useTranslation()
  return <span className={`${CHIP_CLASS} ${STATUS_STYLES[status]}`}>{t(`editor.status.${status}`)}</span>
}

/** Notice for a published case whose working copy differs from the published revision. */
export function UnpublishedChangesChip() {
  const { t } = useTranslation()
  return <span className={`${CHIP_CLASS} border-sk2/50 text-sk2`}>{t('editor.unpublishedChanges')}</span>
}
