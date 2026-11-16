import { useTranslation } from 'react-i18next'
import { BarrierTape } from '../../components/ui/BarrierTape.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Card } from '../../components/ui/Card.tsx'
import { Header } from '../../components/ui/Header.tsx'

export type StartStatus = 'idle' | 'loading' | 'error' | 'empty'

type StartScreenProps = { status: StartStatus; onStart: () => void }

export function StartScreen({ status, onStart }: StartScreenProps) {
  const { t } = useTranslation()
  const features = t('start.features', { returnObjects: true })
  const buttonLabel = status === 'error' || status === 'empty' ? t('training.retry') : t('start.button')

  return (
    <>
      <Header badge={t('app.badge')} title={t('app.title')} subtitle={t('app.subtitle')} />

      <Card>
        <div className="bg-accent-muted border border-accent/15 rounded-lg px-3 py-2.5 text-[0.82rem] leading-snug">
          <strong className="text-accent">{t('start.heading')}</strong>
          <br />
          <span className="text-muted">{t('start.description')}</span>
        </div>

        <BarrierTape />

        <ul className="flex flex-col gap-1.5">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-[0.82rem] text-muted">
              <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              {feature}
            </li>
          ))}
        </ul>

        {status === 'loading' && (
          <p role="status" className="text-[0.82rem] text-muted text-center">
            {t('training.loading')}
          </p>
        )}
        {status === 'error' && (
          <p role="alert" className="text-[0.82rem] text-wrong text-center">
            {t('training.loadError')}
          </p>
        )}
        {status === 'empty' && (
          <p role="status" className="text-[0.82rem] text-muted text-center">
            {t('training.noCases')}
          </p>
        )}
      </Card>

      <p className="text-center text-dim text-[0.65rem]">{t('app.version', { version: __APP_VERSION__ })}</p>

      <div className="sticky-actions mt-auto">
        <Button onClick={onStart} disabled={status === 'loading'}>
          {buttonLabel}
        </Button>
      </div>
    </>
  )
}
