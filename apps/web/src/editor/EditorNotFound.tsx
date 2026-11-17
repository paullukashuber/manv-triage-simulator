import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Card } from '../components/ui/Card.tsx'

/** Fallback for unknown editor paths and for cases that do not exist. */
export function EditorNotFound({ variant = 'page' }: { variant?: 'page' | 'case' }) {
  const { t } = useTranslation()
  return (
    <Card className="max-w-[480px]">
      <h1 className="text-lg font-bold">
        {variant === 'case' ? t('editor.notFound.caseTitle') : t('editor.notFound.title')}
      </h1>
      <p className="text-[0.82rem] text-muted">
        {variant === 'case' ? t('editor.notFound.caseText') : t('editor.notFound.text')}
      </p>
      <Link to="/editor" className="text-[0.82rem] text-accent underline">
        {t('editor.backToList')}
      </Link>
    </Card>
  )
}
