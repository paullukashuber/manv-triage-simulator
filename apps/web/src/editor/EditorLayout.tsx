import { useTranslation } from 'react-i18next'
import { Link, Outlet } from 'react-router'
import { UserMenu } from '../auth/UserMenu.tsx'

export function EditorLayout() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto max-w-5xl min-h-dvh flex flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <Link to="/editor" className="text-lg font-bold tracking-tight">
          {t('editor.title')}
        </Link>
        <UserMenu />
      </header>
      <Outlet />
    </div>
  )
}
