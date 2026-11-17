import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'
import { Button } from '../components/ui/Button.tsx'
import { Card } from '../components/ui/Card.tsx'
import { Header } from '../components/ui/Header.tsx'
import { authClient } from './auth-client.ts'
import { safeRedirect } from './safeRedirect.ts'

const INPUT_CLASS =
  'w-full bg-surface border border-border-light rounded-lg px-3 py-2.5 text-text focus:outline-2 focus:outline-accent'

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { error: authError } = await authClient.signIn.email({ email, password })
      if (authError) {
        setError(authError.status === 401 || authError.status === 400 ? t('auth.invalidCredentials') : t('auth.loginFailed'))
        return
      }
      await navigate(safeRedirect(params.get('redirect')), { replace: true })
    } catch {
      setError(t('auth.loginFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-[480px] min-h-dvh flex flex-col gap-3 p-4">
      <Header title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')} />
      <Card>
        <form onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-[0.82rem] text-muted">
            {t('auth.email')}
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          <label className="flex flex-col gap-1 text-[0.82rem] text-muted">
            {t('auth.password')}
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          {error && (
            <p role="alert" className="text-[0.82rem] text-wrong">
              {error}
            </p>
          )}
          <Button type="submit" disabled={submitting}>
            {submitting ? t('auth.submitting') : t('auth.submit')}
          </Button>
        </form>
      </Card>
    </main>
  )
}
