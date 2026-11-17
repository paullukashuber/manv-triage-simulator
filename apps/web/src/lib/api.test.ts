import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiFetch } from './api.ts'

afterEach(() => vi.unstubAllGlobals())

describe('apiFetch', () => {
  it('throws ApiError with status and parsed body on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'bad' }), { status: 400 })),
    )
    const error = await apiFetch('/api/x').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 400, body: { error: 'bad' } })
  })

  it('returns undefined for 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))
    await expect(apiFetch('/api/x')).resolves.toBeUndefined()
  })

  it('parses JSON and sends credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"a":1}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(apiFetch<{ a: number }>('/api/x')).resolves.toEqual({ a: 1 })
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ credentials: 'include' })
  })
})
