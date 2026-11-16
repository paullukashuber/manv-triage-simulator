import { useTranslation } from 'react-i18next'
import { Card } from '../components/ui/Card.tsx'
import { Header } from '../components/ui/Header.tsx'
import { PrototypeModal } from '../components/ui/PrototypeModal.tsx'

// Platzhalter-Startseite; Task 7 ersetzt sie.
export function HomePlaceholder() {
  const { t } = useTranslation()
  return (
    <main className="mx-auto max-w-[480px] min-h-dvh flex flex-col gap-3 p-4">
      <Header badge={t('app.badge')} title={t('app.title')} subtitle={t('app.subtitle')} />
      <Card>
        <h2 className="text-base font-bold">{t('app.title')}</h2>
      </Card>
      <PrototypeModal />
    </main>
  )
}
