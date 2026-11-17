import { useTranslation } from 'react-i18next'

export function EditorHomePage() {
  const { t } = useTranslation()
  return <p className="text-muted">{t('editor.placeholder')}</p>
}
