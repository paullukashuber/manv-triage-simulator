import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { authClient } from './auth-client.ts'
import { isRole } from './roles.ts'

export function UserMenu() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data } = authClient.useSession()
  if (!data) return null

  const role: unknown = (data.user as { role?: unknown }).role
  const roleLabel = isRole(role) ? t(`auth.roles.${role}`) : ''

  async function signOut() {
    await authClient.signOut()
    await navigate('/login', { replace: true })
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.82rem]">
      <span>
        <strong>{data.user.name}</strong> <span className="text-muted">({roleLabel})</span>
      </span>
      {role === 'admin' && (
        <Link to="/admin/users" className="text-accent underline">
          {t('admin.usersLink')}
        </Link>
      )}
      <button type="button" onClick={() => void signOut()} className="text-accent underline cursor-pointer">
        {t('auth.signOut')}
      </button>
    </div>
  )
}
