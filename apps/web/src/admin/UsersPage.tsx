import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { authClient } from '../auth/auth-client.ts'
import { isRole, ROLES, toClientRole, type Role } from '../auth/roles.ts'
import { UserMenu } from '../auth/UserMenu.tsx'
import { Button } from '../components/ui/Button.tsx'
import { Card } from '../components/ui/Card.tsx'
import { authErrorKey } from './authErrors.ts'

const INPUT_CLASS =
  'w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text focus:outline-2 focus:outline-accent'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERS_KEY = ['admin', 'users'] as const

type ManagedUser = { id: string; name: string; email: string; role: Role }
type AuthResult = { error: { code?: unknown } | null }

/** A rejected better-auth call; `code` is the server's error code, its English message is dropped. */
class AuthActionError extends Error {
  readonly code: unknown
  constructor(code: unknown) {
    super(typeof code === 'string' ? code : 'auth_error')
    this.code = code
  }
}

function unwrap(result: AuthResult): void {
  if (result.error) throw new AuthActionError(result.error.code)
}

function validPassword(password: string): boolean {
  return password.length >= 10 && password.length <= 128
}

export function UsersPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  /** German text for a failed call; `fallback` covers unknown codes and network errors. */
  function errorText(error: Error, fallback: 'admin.errors.generic' | 'admin.loadError' = 'admin.errors.generic') {
    const key = error instanceof AuthActionError ? authErrorKey(error.code) : null
    return t(key ?? fallback)
  }

  const users = useQuery({
    queryKey: USERS_KEY,
    queryFn: async (): Promise<ManagedUser[]> => {
      const result = await authClient.admin.listUsers({ query: { limit: 200 } })
      if (result.error) throw new AuthActionError(result.error.code)
      return result.data.users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: isRole(user.role) ? user.role : 'trainee',
      }))
    },
  })

  function report(successText: string) {
    return {
      onMutate: () => {
        setMessage(null)
        setActionError(null)
      },
      onSuccess: () => {
        setMessage(successText)
        void queryClient.invalidateQueries({ queryKey: USERS_KEY })
      },
      onError: (error: Error) => setActionError(errorText(error)),
    }
  }

  const createUser = useMutation({
    mutationFn: async (input: { name: string; email: string; password: string; role: Role }) =>
      unwrap(await authClient.admin.createUser({ ...input, role: toClientRole(input.role) })),
    ...report(t('admin.created')),
  })
  const setRole = useMutation({
    mutationFn: async (input: { userId: string; role: Role }) =>
      unwrap(await authClient.admin.setRole({ userId: input.userId, role: toClientRole(input.role) })),
    ...report(t('admin.roleChanged')),
  })
  const setPassword = useMutation({
    mutationFn: async (input: { userId: string; newPassword: string }) =>
      unwrap(await authClient.admin.setUserPassword(input)),
    ...report(t('admin.passwordChanged')),
  })

  return (
    <div className="mx-auto max-w-5xl min-h-dvh flex flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <Link to="/editor" className="text-lg font-bold tracking-tight">
          {t('admin.usersTitle')}
        </Link>
        <UserMenu />
      </header>

      {message && (
        <p role="status" className="text-[0.82rem] text-correct">
          {message}
        </p>
      )}
      {actionError && (
        <p role="alert" className="text-[0.82rem] text-wrong">
          {actionError}
        </p>
      )}

      <Card>
        <h2 className="font-bold">{t('admin.listHeading')}</h2>
        {users.isPending && (
          <p role="status" className="text-[0.82rem] text-muted">
            {t('admin.loading')}
          </p>
        )}
        {users.isError && (
          <p role="alert" className="text-[0.82rem] text-wrong">
            {errorText(users.error, 'admin.loadError')}
          </p>
        )}
        {users.data && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[0.82rem]">
              <thead className="text-muted">
                <tr>
                  <th className="py-1 pr-3 font-medium">{t('admin.columnName')}</th>
                  <th className="py-1 pr-3 font-medium">{t('admin.columnEmail')}</th>
                  <th className="py-1 pr-3 font-medium">{t('admin.columnRole')}</th>
                  <th className="py-1 font-medium">{t('admin.columnActions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.data.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onRoleChange={(role) => setRole.mutate({ userId: user.id, role })}
                    onPasswordSave={(newPassword, onSaved) =>
                      setPassword.mutate({ userId: user.id, newPassword }, { onSuccess: onSaved })
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CreateUserForm
        pending={createUser.isPending}
        onCreate={(input, onCreated) => createUser.mutate(input, { onSuccess: onCreated })}
      />
    </div>
  )
}

function UserRow({
  user,
  onRoleChange,
  onPasswordSave,
}: {
  user: ManagedUser
  onRoleChange: (role: Role) => void
  /** `onSaved` runs only after the server accepted the password. */
  onPasswordSave: (password: string, onSaved: () => void) => void
}) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  function save(event: FormEvent) {
    event.preventDefault()
    if (!validPassword(password)) {
      setError(t('admin.errors.passwordLength'))
      return
    }
    setError(null)
    onPasswordSave(password, close)
  }

  function close() {
    setEditing(false)
    setPassword('')
    setError(null)
  }

  return (
    <tr className="border-t border-border align-top">
      <td className="py-2 pr-3">{user.name}</td>
      <td className="py-2 pr-3">{user.email}</td>
      <td className="py-2 pr-3">
        <select
          aria-label={t('admin.roleFor', { name: user.name })}
          value={user.role}
          onChange={(event) => {
            if (isRole(event.target.value)) onRoleChange(event.target.value)
          }}
          className={INPUT_CLASS}
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {t(`auth.roles.${role}`)}
            </option>
          ))}
        </select>
      </td>
      <td className="py-2">
        {editing ? (
          <form onSubmit={save} className="flex flex-col gap-2">
            <input
              type="password"
              autoComplete="new-password"
              aria-label={t('admin.newPassword', { name: user.name })}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={INPUT_CLASS}
            />
            {error && <p className="text-wrong">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" className="py-2 text-[0.82rem]">
                {t('admin.savePassword')}
              </Button>
              <Button
                variant="secondary"
                className="py-2 text-[0.82rem]"
                onClick={close}
              >
                {t('admin.cancel')}
              </Button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="text-accent underline cursor-pointer">
            {t('admin.resetPassword')}
          </button>
        )}
      </td>
    </tr>
  )
}

function CreateUserForm({
  pending,
  onCreate,
}: {
  pending: boolean
  /** `onCreated` runs only after the server created the account. */
  onCreate: (input: { name: string; email: string; password: string; role: Role }, onCreated: () => void) => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('trainer')
  const [errors, setErrors] = useState<string[]>([])

  function submit(event: FormEvent) {
    event.preventDefault()
    const found: string[] = []
    if (name.trim() === '') found.push(t('admin.errors.nameRequired'))
    if (!EMAIL_PATTERN.test(email.trim())) found.push(t('admin.errors.emailInvalid'))
    if (!validPassword(password)) found.push(t('admin.errors.passwordLength'))
    setErrors(found)
    if (found.length > 0) return
    onCreate({ name: name.trim(), email: email.trim(), password, role }, () => {
      setName('')
      setEmail('')
      setPassword('')
    })
  }

  return (
    <Card>
      <h2 className="font-bold">{t('admin.createHeading')}</h2>
      <form onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-[0.82rem] text-muted">
          {t('admin.name')}
          <input value={name} onChange={(event) => setName(event.target.value)} className={INPUT_CLASS} />
        </label>
        <label className="flex flex-col gap-1 text-[0.82rem] text-muted">
          {t('admin.email')}
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1 text-[0.82rem] text-muted">
          {t('admin.startPassword')}
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1 text-[0.82rem] text-muted">
          {t('admin.role')}
          <select
            value={role}
            onChange={(event) => {
              if (isRole(event.target.value)) setRole(event.target.value)
            }}
            className={INPUT_CLASS}
          >
            {ROLES.map((value) => (
              <option key={value} value={value}>
                {t(`auth.roles.${value}`)}
              </option>
            ))}
          </select>
        </label>
        {errors.length > 0 && (
          <ul role="alert" className="sm:col-span-2 text-[0.82rem] text-wrong">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {t('admin.createButton')}
          </Button>
        </div>
      </form>
    </Card>
  )
}
