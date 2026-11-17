import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation } from 'react-router'
import { Card } from '../components/ui/Card.tsx'
import { authClient } from './auth-client.ts'
import { isRole, type Role } from './roles.ts'
import { loginUrlFor } from './unauthorized.ts'

type RequireRoleProps = { roles: readonly Role[]; children: ReactNode }

export function RequireRole({ roles, children }: RequireRoleProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const { data, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <p role="status" className="p-6 text-center text-[0.82rem] text-muted">
        {t('auth.sessionLoading')}
      </p>
    )
  }
  if (!data) return <Navigate to={loginUrlFor(location.pathname, location.search)} replace />

  const role: unknown = (data.user as { role?: unknown }).role
  if (!isRole(role) || !roles.includes(role)) {
    return (
      <main className="mx-auto max-w-[480px] p-4">
        <Card>
          <h1 className="text-lg font-bold">{t('auth.noAccessTitle')}</h1>
          <p className="text-[0.82rem] text-muted">{t('auth.noAccessText')}</p>
          <Link to="/" className="text-accent text-[0.82rem] underline">
            {t('auth.toStart')}
          </Link>
        </Card>
      </main>
    )
  }
  return <>{children}</>
}
