import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './Button.tsx'

const STORAGE_KEY = 'manv:prototype-ack'

function readAcknowledged(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writeAcknowledged() {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // Ohne Storage wird der Hinweis bei jedem Besuch erneut gezeigt.
  }
}

export function PrototypeModal() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(() => !readAcknowledged())

  if (!visible) return null

  const dismiss = () => {
    writeAcknowledged()
    setVisible(false)
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prototype-modal-title"
        className="bg-card border border-border-light rounded-xl p-5 max-w-[380px] w-full text-center flex flex-col gap-3"
      >
        <div className="text-3xl leading-none" aria-hidden="true">
          ⚠️
        </div>
        <h2 id="prototype-modal-title" className="text-base font-bold text-sk2">
          {t('prototypeModal.title', { version: __APP_VERSION__ })}
        </h2>
        <p className="text-[0.8rem] leading-relaxed text-muted">{t('prototypeModal.text')}</p>
        <p className="text-[0.8rem] leading-relaxed text-muted">{t('prototypeModal.cta')}</p>
        <Button onClick={dismiss} className="py-3">
          {t('prototypeModal.button')}
        </Button>
      </div>
    </div>
  )
}
