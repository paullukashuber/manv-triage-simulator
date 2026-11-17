import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ signInEmail: vi.fn(), refetchSession: vi.fn() }))
vi.mock('./auth-client.ts', () => ({
  authClient: {
    signIn: { email: mocks.signInEmail },
    useSession: () => ({ data: null, isPending: false, refetch: mocks.refetchSession }),
  },
}))

import { LoginPage } from './LoginPage.tsx'

function Probe() {
  const location = useLocation()
  return <p>now at {location.pathname}</p>
}

function renderLogin(search = '') {
  const router = createMemoryRouter(
    [
      { path: '/login', element: <LoginPage /> },
      { path: '/*', element: <Probe /> },
    ],
    { initialEntries: [`/login${search}`] },
  )
  render(<RouterProvider router={router} />)
}

async function fillAndSubmit() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('E-Mail'), 'a@example.org')
  await user.type(screen.getByLabelText('Passwort'), 'geheimes-passwort')
  await user.click(screen.getByRole('button', { name: 'Anmelden' }))
}

beforeEach(() => {
  mocks.signInEmail.mockReset()
  mocks.refetchSession.mockReset()
  mocks.refetchSession.mockResolvedValue(undefined)
})

describe('LoginPage', () => {
  it('shows an error when the credentials are wrong', async () => {
    mocks.signInEmail.mockResolvedValue({ data: null, error: { status: 401, message: 'Invalid email or password' } })
    renderLogin()
    await fillAndSubmit()
    expect(await screen.findByRole('alert')).toHaveTextContent('E-Mail oder Passwort ist falsch.')
    expect(mocks.signInEmail).toHaveBeenCalledWith({ email: 'a@example.org', password: 'geheimes-passwort' })
  })

  it('shows a generic error for server failures', async () => {
    mocks.signInEmail.mockResolvedValue({ data: null, error: { status: 500, message: 'boom' } })
    renderLogin()
    await fillAndSubmit()
    expect(await screen.findByRole('alert')).toHaveTextContent('Die Anmeldung ist fehlgeschlagen')
  })

  it('navigates to the redirect target after success', async () => {
    mocks.signInEmail.mockResolvedValue({ data: { user: {} }, error: null })
    renderLogin('?redirect=/editor/cases/abc')
    await fillAndSubmit()
    await waitFor(() => expect(screen.getByText('now at /editor/cases/abc')).toBeInTheDocument())
  })

  it('waits for the session store to refetch before navigating', async () => {
    let finishRefetch = () => {}
    mocks.refetchSession.mockReturnValue(new Promise<void>((resolve) => (finishRefetch = resolve)))
    mocks.signInEmail.mockResolvedValue({ data: { user: {} }, error: null })
    renderLogin('?redirect=/editor')
    await fillAndSubmit()
    await waitFor(() => expect(mocks.refetchSession).toHaveBeenCalled())
    expect(screen.queryByText('now at /editor')).not.toBeInTheDocument()
    finishRefetch()
    await waitFor(() => expect(screen.getByText('now at /editor')).toBeInTheDocument())
  })

  it('ignores external redirect targets', async () => {
    mocks.signInEmail.mockResolvedValue({ data: { user: {} }, error: null })
    renderLogin('?redirect=//evil.example')
    await fillAndSubmit()
    await waitFor(() => expect(screen.getByText('now at /editor')).toBeInTheDocument())
  })
})
