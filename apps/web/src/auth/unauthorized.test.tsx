import { useQuery } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import { render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../lib/api.ts'
import { createAppQueryClient, loginUrlFor } from './unauthorized.ts'

function Probe({ error }: { error: Error }) {
  useQuery({
    queryKey: ['x'],
    queryFn: () => Promise.reject(error),
    retry: false,
  })
  return null
}

function run(error: Error) {
  const onUnauthorized = vi.fn()
  const client = createAppQueryClient(onUnauthorized)
  render(
    <QueryClientProvider client={client}>
      <Probe error={error} />
    </QueryClientProvider>,
  )
  return onUnauthorized
}

describe('createAppQueryClient', () => {
  it('calls the handler for a 401 ApiError', async () => {
    const onUnauthorized = run(new ApiError(401, { error: 'unauthenticated' }))
    await waitFor(() => expect(onUnauthorized).toHaveBeenCalledTimes(1))
  })

  it('ignores other errors', async () => {
    const onUnauthorized = run(new ApiError(403, { error: 'forbidden' }))
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('calls the handler for a 401 from a mutation', async () => {
    const onUnauthorized = vi.fn()
    const client = createAppQueryClient(onUnauthorized)
    await client
      .getMutationCache()
      .build(client, { mutationFn: () => Promise.reject(new ApiError(401, null)) })
      .execute(undefined)
      .catch(() => undefined)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })
})

describe('loginUrlFor', () => {
  it('encodes the current path as redirect', () => {
    expect(loginUrlFor('/editor/cases', '?a=1')).toBe('/login?redirect=%2Feditor%2Fcases%3Fa%3D1')
  })

  it('does not nest redirects when already on the login page', () => {
    expect(loginUrlFor('/login', '?redirect=%2Feditor')).toBe('/login?redirect=%2Feditor')
  })
})
