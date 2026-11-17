import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { ApiError } from '../lib/api.ts'

export function loginUrlFor(pathname: string, search: string): string {
  if (pathname === '/login') return `/login${search}`
  return `/login?redirect=${encodeURIComponent(pathname + search)}`
}

/** QueryClient whose queries and mutations report any 401 ApiError to `onUnauthorized`. */
export function createAppQueryClient(onUnauthorized: () => void): QueryClient {
  const onError = (error: Error) => {
    if (error instanceof ApiError && error.status === 401) onUnauthorized()
  }
  return new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
  })
}
