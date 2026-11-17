import { useTranslation } from 'react-i18next'

export function BarrierTape({ showHint = false }: { showHint?: boolean }) {
  const { t } = useTranslation()
  return (
    <>
      <div className="barrier-tape" />
      {showHint && (
        <div className="bg-accent-muted border border-accent/15 rounded-lg px-3 py-2 text-[0.8rem] leading-snug">
          <strong className="text-accent">{t('barrierTape.title')}</strong> –{' '}
          <span className="text-muted">{t('barrierTape.hint')}</span>
        </div>
      )}
    </>
  )
}
