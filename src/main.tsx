import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { UnauthorizedError } from '@/core/api'
import './index.css'
import { router } from './router'

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof UnauthorizedError) {
        window.location.assign('/auth/login')
      }
    },
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => !(error instanceof UnauthorizedError) && failureCount < 3,
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
