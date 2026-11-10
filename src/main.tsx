import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setNonce } from 'get-nonce'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import { RouterProvider } from 'react-router'
import { CookieNotice } from '@/components/cookie-notice'
import { ApiError, ForbiddenError, UnauthorizedError } from '@/core/api'
import { i18n } from '@/core/i18n'
import './index.css'
import { router } from './router'

// Radix's scroll lock adds a <style> the production CSP allows only with the page's nonce. Browsers
// blank the attribute once the page loads, so it is read from the property.
const nonce = document.querySelector<HTMLMetaElement>('meta[property="csp-nonce"]')?.nonce
if (nonce) {
  setNonce(nonce)
}

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

// A tab open across a release asks for chunks the new build no longer has: reload onto the new
// index.html, but not again within a minute, so a broken release shows the route's error page
// instead of looping
window.addEventListener('vite:preloadError', (event) => {
  const key = 'fintrace:chunk-reload-at'
  try {
    if (Date.now() - Number(sessionStorage.getItem(key)) < 60_000) {
      return
    }
    sessionStorage.setItem(key, String(Date.now()))
  } catch {
    return
  }
  event.preventDefault()
  window.location.reload()
})

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
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <CookieNotice />
      </QueryClientProvider>
    </I18nextProvider>
  </StrictMode>,
)
