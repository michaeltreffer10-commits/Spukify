import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { isLoggedIn, login as startLogin, logout as clearLogin } from '../lib/auth'
import { resetSavedStore } from '../lib/savedStore'
import { setDemoMode } from '../lib/spotify'

export type Mode = 'live' | 'demo' | 'signedOut'

const DEMO_KEY = 'spukify.demo'

interface Session {
  mode: Mode
  login: (returnTo?: string) => Promise<void>
  logout: () => void
  startDemo: () => void
}

const SessionContext = createContext<Session | null>(null)

function initialMode(): Mode {
  if (isLoggedIn()) return 'live'
  try {
    if (localStorage.getItem(DEMO_KEY) === '1') return 'demo'
  } catch {
    // ignorieren
  }
  return 'signedOut'
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<Mode>(() => {
    const m = initialMode()
    setDemoMode(m === 'demo')
    return m
  })

  const switchMode = useCallback(
    (next: Mode) => {
      setDemoMode(next === 'demo')
      queryClient.clear()
      resetSavedStore()
      setMode(next)
    },
    [queryClient],
  )

  const logout = useCallback(() => {
    clearLogin()
    localStorage.removeItem(DEMO_KEY)
    switchMode('signedOut')
  }, [switchMode])

  const startDemo = useCallback(() => {
    localStorage.setItem(DEMO_KEY, '1')
    switchMode('demo')
  }, [switchMode])

  const login = useCallback(async (returnTo?: string) => {
    localStorage.removeItem(DEMO_KEY)
    await startLogin(returnTo)
  }, [])

  // Wenn Spotify die Anmeldung nicht mehr akzeptiert → zurück zum Start.
  useEffect(() => {
    const onExpired = () => {
      if (mode === 'live') logout()
    }
    window.addEventListener('spukify:auth-expired', onExpired)
    return () => window.removeEventListener('spukify:auth-expired', onExpired)
  }, [mode, logout])

  const value = useMemo(() => ({ mode, login, logout, startDemo }), [mode, login, logout, startDemo])
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession außerhalb von SessionProvider')
  return ctx
}
