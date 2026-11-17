import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ useSession: vi.fn() }))
vi.mock('./auth-client.ts', () => ({ authClient: { useSession: mocks.useSession } }))

import { RequireRole } from './RequireRole.tsx'

function LoginProbe() {
  const location = useLocation()
  return <p>login at {location.pathname + location.search}</p>
}

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { path: '/login', element: <LoginProbe /> },
      {
        path: '/editor/*',
        element: (
          <RequireRole roles={['trainer', 'admin']}>
            <p>geheim</p>
          </RequireRole>
        ),
      },
    ],
    { initialEntries: [path] },
  )
  render(<RouterProvider router={router} />)
}

function session(role: string | null, isPending = false) {
  mocks.useSession.mockReturnValue({
    data: role ? { user: { id: '1', name: 'Test', email: 't@example.org', role } } : null,
    isPending,
  })
}

beforeEach(() => mocks.useSession.mockReset())

describe('RequireRole', () => {
  it('redirects to login with the current path when there is no session', () => {
    session(null)
    renderAt('/editor')
    expect(screen.getByText('login at /login?redirect=%2Feditor')).toBeInTheDocument()
  })

  it('keeps the query string in the redirect', () => {
    session(null)
    renderAt('/editor/cases?x=1')
    expect(screen.getByText('login at /login?redirect=%2Feditor%2Fcases%3Fx%3D1')).toBeInTheDocument()
  })

  it('shows a loading state while the session is pending', () => {
    session(null, true)
    renderAt('/editor')
    expect(screen.getByRole('status')).toHaveTextContent('Sitzung wird geprüft')
    expect(screen.queryByText('geheim')).not.toBeInTheDocument()
  })

  it('shows "Kein Zugriff" for a trainee', () => {
    session('trainee')
    renderAt('/editor')
    expect(screen.getByRole('heading', { name: 'Kein Zugriff' })).toBeInTheDocument()
    expect(screen.queryByText('geheim')).not.toBeInTheDocument()
  })

  it('renders children for a trainer', () => {
    session('trainer')
    renderAt('/editor')
    expect(screen.getByText('geheim')).toBeInTheDocument()
  })
})
