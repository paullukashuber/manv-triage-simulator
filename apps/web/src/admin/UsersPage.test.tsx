import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  listUsers: vi.fn(),
  createUser: vi.fn(),
  setRole: vi.fn(),
  setUserPassword: vi.fn(),
  useSession: vi.fn(() => ({
    data: { user: { id: 'u1', name: 'Anna Admin', email: 'anna@example.org', role: 'admin' } },
    isPending: false,
  })),
}))
vi.mock('../auth/auth-client.ts', () => ({
  authClient: {
    useSession: mocks.useSession,
    admin: {
      listUsers: mocks.listUsers,
      createUser: mocks.createUser,
      setRole: mocks.setRole,
      setUserPassword: mocks.setUserPassword,
    },
  },
}))

import { UsersPage } from './UsersPage.tsx'

const users = [
  { id: 'u1', name: 'Anna Admin', email: 'anna@example.org', role: 'admin' },
  { id: 'u2', name: 'Tom Trainer', email: 'tom@example.org', role: 'trainer' },
]

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  for (const mock of [mocks.listUsers, mocks.createUser, mocks.setRole, mocks.setUserPassword]) mock.mockReset()
  mocks.listUsers.mockResolvedValue({ data: { users, total: 2 }, error: null })
})

describe('UsersPage', () => {
  it('lists users with name, email and German role label', async () => {
    renderPage()
    const row = (await screen.findByText('tom@example.org')).closest('tr')!
    expect(within(row).getByText('Tom Trainer')).toBeInTheDocument()
    expect(within(row).getByLabelText('Rolle für Tom Trainer')).toHaveValue('trainer')
    expect(screen.getByText('anna@example.org')).toBeInTheDocument()
  })

  it('shows a validation error for a 5 character password and does not call createUser', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('tom@example.org')
    await user.type(screen.getByLabelText('Name'), 'Neu Nutzer')
    await user.type(screen.getByLabelText('E-Mail'), 'neu@example.org')
    await user.type(screen.getByLabelText('Startpasswort'), '12345')
    await user.click(screen.getByRole('button', { name: 'Nutzer anlegen' }))
    expect(await screen.findByText(/zwischen 10 und 128 Zeichen/)).toBeInTheDocument()
    expect(mocks.createUser).not.toHaveBeenCalled()
  })

  it('creates a user with valid input and reloads the list', async () => {
    mocks.createUser.mockResolvedValue({ data: { user: {} }, error: null })
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('tom@example.org')
    await user.type(screen.getByLabelText('Name'), 'Neu Nutzer')
    await user.type(screen.getByLabelText('E-Mail'), 'neu@example.org')
    await user.type(screen.getByLabelText('Startpasswort'), 'sehr-geheim-123')
    await user.selectOptions(screen.getByLabelText('Rolle'), 'trainer')
    await user.click(screen.getByRole('button', { name: 'Nutzer anlegen' }))
    expect(mocks.createUser).toHaveBeenCalledWith({
      name: 'Neu Nutzer',
      email: 'neu@example.org',
      password: 'sehr-geheim-123',
      role: 'trainer',
    })
    expect(await screen.findByText('Nutzer wurde angelegt.')).toBeInTheDocument()
    expect(mocks.listUsers).toHaveBeenCalledTimes(2)
  })

  it('shows API errors from createUser', async () => {
    mocks.createUser.mockResolvedValue({ data: null, error: { message: 'User already exists' } })
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('tom@example.org')
    await user.type(screen.getByLabelText('Name'), 'Neu')
    await user.type(screen.getByLabelText('E-Mail'), 'tom@example.org')
    await user.type(screen.getByLabelText('Startpasswort'), 'sehr-geheim-123')
    await user.click(screen.getByRole('button', { name: 'Nutzer anlegen' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('User already exists')
  })

  it('changes a role', async () => {
    mocks.setRole.mockResolvedValue({ data: {}, error: null })
    const user = userEvent.setup()
    renderPage()
    const select = await screen.findByLabelText('Rolle für Tom Trainer')
    await user.selectOptions(select, 'admin')
    expect(mocks.setRole).toHaveBeenCalledWith({ userId: 'u2', role: 'admin' })
  })

  it('validates and resets a password', async () => {
    mocks.setUserPassword.mockResolvedValue({ data: {}, error: null })
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('tom@example.org')
    await user.click(screen.getAllByRole('button', { name: 'Passwort zurücksetzen' })[1]!)
    const input = screen.getByLabelText('Neues Passwort für Tom Trainer')
    await user.type(input, 'kurz')
    await user.click(screen.getByRole('button', { name: 'Passwort speichern' }))
    expect(await screen.findByText(/zwischen 10 und 128 Zeichen/)).toBeInTheDocument()
    expect(mocks.setUserPassword).not.toHaveBeenCalled()
    await user.clear(input)
    await user.type(input, 'neues-passwort-1')
    await user.click(screen.getByRole('button', { name: 'Passwort speichern' }))
    expect(mocks.setUserPassword).toHaveBeenCalledWith({ userId: 'u2', newPassword: 'neues-passwort-1' })
    expect(await screen.findByText('Passwort wurde zurückgesetzt.')).toBeInTheDocument()
  })
})
