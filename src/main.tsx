import '@fontsource-variable/plus-jakarta-sans'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import './styles/global.css'
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { AuthError, handleRedirectCallback } from './lib/auth'
import { ApiError } from './lib/errors'
import { SessionProvider } from './state/session'

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof AuthError) window.dispatchEvent(new Event('spukify:auth-expired'))
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (count, error) => {
        if (error instanceof AuthError) return false
        if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 429) return false
        return count < 2
      },
    },
  },
})

async function start() {
  let authError: string | undefined
  let returnTo: string | undefined
  try {
    const result = await handleRedirectCallback()
    authError = result?.error
    returnTo = result?.returnTo
  } catch (e) {
    authError = e instanceof Error ? e.message : 'Anmeldung fehlgeschlagen.'
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <App authError={authError} returnTo={returnTo} />
        </SessionProvider>
      </QueryClientProvider>
    </StrictMode>,
  )
}

start()
