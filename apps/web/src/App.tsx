import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router/dom'
import { authClient } from './auth/auth-client.ts'
import { createAppQueryClient, loginUrlFor } from './auth/unauthorized.ts'
import { router } from './routes.tsx'

const queryClient = createAppQueryClient(() => {
  authClient.$store.notify('$sessionSignal')
  const { pathname, search } = window.location
  void router.navigate(loginUrlFor(pathname, search))
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
