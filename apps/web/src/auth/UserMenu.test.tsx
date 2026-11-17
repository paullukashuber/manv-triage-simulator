import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  signOut: vi.fn(),
  useSession: vi.fn(() => ({
    data: { user: { id: 'u1', name: 'Tom Trainer', email: 'tom@example.org', role: 'trainer' } },
    isPending: false,
  })),
}))
vi.mock('./auth-client.ts', () => ({ authClient: { useSession: mocks.useSession, signOut: mocks.signOut } }))

import { UserMenu } from './UserMenu.tsx'

function renderMenu() {
  const queryClient = new QueryClient()
  queryClient.setQueryData(['editor', 'cases'], { cases: [{ id: 'c1' }] })
  const router = createMemoryRouter(
    [
      { path: '/editor', element: <UserMenu /> },
      { path: '/login', element: <p>Anmeldeseite</p> },
    ],
    { initialEntries: ['/', '/editor'], initialIndex: 1 },
  )
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { queryClient, router }
}

beforeEach(() => {
  mocks.signOut.mockReset()
})

describe('UserMenu', () => {

  it.each([
    ['succeeds', () => mocks.signOut.mockResolvedValue({ data: { success: true }, error: null })],
    ['fails', () => mocks.signOut.mockRejectedValue(new TypeError('Failed to fetch'))],
  ])('clears cached data and replaces the page with the login when sign-out %s', async (_label, arrange) => {
    arrange()
    const { queryClient, router } = renderMenu()
    await userEvent.click(screen.getByRole('button', { name: 'Abmelden' }))
    expect(await screen.findByText('Anmeldeseite')).toBeInTheDocument()
    expect(mocks.signOut).toHaveBeenCalledTimes(1)
    expect(queryClient.getQueryCache().getAll()).toEqual([])
    await waitFor(() => expect(router.state.historyAction).toBe('REPLACE'))
  })
})
