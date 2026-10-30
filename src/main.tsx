import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { ApiError, ForbiddenError, UnauthorizedError } from '@/core/api'
import './index.css'
import { router } from './router'

// A lapsed session, met by a read or a write, goes back to sign-in
const toSignIn = (error: Error) => {
  if (error instanceof UnauthorizedError) {
    window.location.assign('/auth/login')
  }
}

// Asking again cannot change a refusal: only a network failure or a 5xx is worth a retry
const refused = (error: Error) =>
  error instanceof UnauthorizedError ||
  error instanceof ForbiddenError ||
  (error instanceof ApiError && error.status < 500)

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: toSignIn }),
  mutationCache: new MutationCache({ onError: toSignIn }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => !refused(error) && failureCount < 3,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
