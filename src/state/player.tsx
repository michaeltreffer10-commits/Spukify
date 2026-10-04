// Wiedergabe über Spotify Connect: Spukify spielt selbst keine Musik ab, sondern steuert
// die Spotify-App (Handy, PC, Lautsprecher …). Dadurch funktionieren Hintergrund-Wiedergabe,
// Sperrbildschirm und Lossless genau wie in der Spotify-App.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AuthError } from '../lib/auth'
import { ApiError, api, isDemoMode } from '../lib/spotify'
import type { PlaybackState, RepeatState } from '../lib/types'
import { useSession } from './session'
import { useUi } from './ui'

const LAST_DEVICE_KEY = 'spukify.lastDevice'

/** Spotifys KI-DJ ist intern eine Playlist mit dieser ID. */
export const DJ_URI = 'spotify:playlist:37i9dQZF1EYkqdzj48dyYq'

type Offset = { uri: string } | { position: number }

interface PlayOptions {
  shuffle?: boolean
  /** Wird verwendet, falls Spotify den Kontext nicht abspielen kann (z. B. Lieblingssongs). */
  fallbackUris?: string[]
}

interface Player {
  state: PlaybackState | null
  fetchedAt: number
  ready: boolean
  isPlayingContext: (contextUri: string) => boolean
  playContext: (contextUri: string, offset?: Offset, opts?: PlayOptions) => Promise<void>
  playUris: (uris: string[], index?: number) => Promise<void>
  togglePlay: () => Promise<void>
  /** Startet oder pausiert einen Kontext (für die großen grünen Play-Buttons). */
  toggleContext: (contextUri: string, opts?: PlayOptions) => Promise<void>
  next: () => Promise<void>
  previous: () => Promise<void>
  seek: (ms: number) => Promise<void>
  setVolume: (percent: number) => Promise<void>
  toggleShuffle: () => Promise<void>
  cycleRepeat: () => Promise<void>
  transferTo: (deviceId: string, play?: boolean) => Promise<void>
  addToQueue: (uri: string) => Promise<void>
  /** Versucht, Spotifys KI-DJ zu starten. Klappt das nicht, wird er in der Spotify-App geöffnet. */
  startDj: () => Promise<void>
  refresh: () => Promise<void>
}

const PlayerContext = createContext<Player | null>(null)
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function isNoDeviceError(e: unknown) {
  return e instanceof ApiError && e.status === 404 && (e.reason === 'NO_ACTIVE_DEVICE' || /device/i.test(e.message))
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { mode } = useSession()
  const { toast, openDevicePicker } = useUi()
  const queryClient = useQueryClient()
  const [state, setState] = useState<PlaybackState | null>(null)
  const [fetchedAt, setFetchedAt] = useState(Date.now())
  const [ready, setReady] = useState(false)
  const actionCounter = useRef(0)
  const stateRef = useRef(state)
  stateRef.current = state
  const fetchedAtRef = useRef(fetchedAt)
  fetchedAtRef.current = fetchedAt

  const active = mode !== 'signedOut'

  const refresh = useCallback(async () => {
    const startedWith = actionCounter.current
    try {
      const s = (await api.playback()) ?? null
      // Ergebnis verwerfen, wenn in der Zwischenzeit eine Aktion ausgeführt wurde.
      if (startedWith !== actionCounter.current) return
      setState(s && s.device ? s : null)
      setFetchedAt(Date.now())
      if (s?.device?.id) localStorage.setItem(LAST_DEVICE_KEY, s.device.id)
    } catch (e) {
      if (e instanceof AuthError) window.dispatchEvent(new Event('spukify:auth-expired'))
    } finally {
      setReady(true)
    }
  }, [])

  const refreshSoon = useCallback(() => {
    setTimeout(refresh, 600)
    setTimeout(() => {
      refresh()
      queryClient.invalidateQueries({ queryKey: ['queue'] })
    }, 1800)
  }, [refresh, queryClient])

  // Regelmäßig nachfragen, was gerade läuft.
  useEffect(() => {
    if (!active) {
      setState(null)
      setReady(false)
      return
    }
    refresh()
    const id = setInterval(() => {
      if (!document.hidden) refresh()
    }, 3000)
    const onVisible = () => {
      if (!document.hidden) refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [active, refresh])

  // Tastenkürzel am PC: Leertaste = Play/Pause, Umschalt + Pfeil = Weiter/Zurück
  const keysRef = useRef<{ toggle: () => void; next: () => void; prev: () => void } | null>(null)
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('input, textarea, select, [contenteditable="true"]') || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.code === 'Space' && !target.closest('button, a, [role="slider"]')) {
        e.preventDefault()
        keysRef.current?.toggle()
      } else if (e.shiftKey && e.key === 'ArrowRight') {
        e.preventDefault()
        keysRef.current?.next()
      } else if (e.shiftKey && e.key === 'ArrowLeft') {
        e.preventDefault()
        keysRef.current?.prev()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])

  // Am Ende eines Songs sofort den nächsten abfragen.
  useEffect(() => {
    if (!state?.is_playing || !state.item) return
    const remaining = state.item.duration_ms - (state.progress_ms ?? 0)
    if (remaining <= 0 || remaining > 600_000) return
    const t = setTimeout(refresh, remaining + 700)
    return () => clearTimeout(t)
  }, [state, refresh])

  /** Sucht ein Gerät, falls gerade keins aktiv ist. */
  const findDevice = useCallback(async () => {
    const { devices } = await api.devices()
    const usable = devices.filter((d) => d.id && !d.is_restricted)
    const last = localStorage.getItem(LAST_DEVICE_KEY)
    return usable.find((d) => d.is_active) ?? usable.find((d) => d.id === last) ?? usable[0] ?? null
  }, [])

  const run = useCallback(
    async (fn: (deviceId?: string) => Promise<unknown>, optimistic?: (s: PlaybackState) => PlaybackState) => {
      actionCounter.current++
      const before = stateRef.current
      if (optimistic && before) {
        setState(optimistic(before))
        setFetchedAt(Date.now())
      }
      try {
        try {
          await fn()
        } catch (e) {
          if (!isNoDeviceError(e)) throw e
          const device = await findDevice()
          if (!device?.id) {
            setState(before)
            openDevicePicker('Gerade ist kein Spotify-Gerät aktiv. Öffne die Spotify-App auf deinem Handy oder PC und wähle es hier aus.')
            return
          }
          await api.transfer(device.id, false)
          await sleep(500)
          await fn(device.id)
        }
      } catch (e) {
        setState(before)
        if (e instanceof AuthError) window.dispatchEvent(new Event('spukify:auth-expired'))
        else if (e instanceof ApiError && e.reason === 'PREMIUM_REQUIRED') toast('Zum Steuern brauchst du Spotify Premium.')
        else if (e instanceof ApiError && e.reason === 'VOLUME_CONTROL_DISALLOW') toast('Die Lautstärke dieses Geräts lässt sich nicht fernsteuern.')
        else if (e instanceof ApiError && e.status === 403) toast('Das ist auf diesem Gerät gerade nicht möglich.')
        else toast(e instanceof Error ? e.message : 'Etwas ist schiefgelaufen.')
      } finally {
        actionCounter.current++
        refreshSoon()
      }
    },
    [findDevice, openDevicePicker, refreshSoon, toast],
  )

  const playContext = useCallback(
    (contextUri: string, offset?: Offset, opts: PlayOptions = {}) =>
      run(async (deviceId) => {
        if (opts.shuffle !== undefined) await api.shuffle(opts.shuffle)
        try {
          await api.play({ context_uri: contextUri, offset }, deviceId)
        } catch (e) {
          const canFallback =
            opts.fallbackUris?.length && e instanceof ApiError && !isNoDeviceError(e) && e.reason !== 'PREMIUM_REQUIRED'
          if (!canFallback) throw e
          const index = offset && 'uri' in offset ? Math.max(0, opts.fallbackUris!.indexOf(offset.uri)) : 0
          await api.play({ uris: opts.fallbackUris!.slice(index, index + 100) }, deviceId)
        }
      }),
    [run],
  )

  const playUris = useCallback(
    (uris: string[], index = 0) => run((deviceId) => api.play({ uris: uris.slice(0, 100), offset: { position: index } }, deviceId)),
    [run],
  )

  const togglePlay = useCallback(() => {
    const s = stateRef.current
    if (s?.is_playing) return run(() => api.pause(), (x) => ({ ...x, is_playing: false, progress_ms: currentProgress(x, fetchedAtRef.current) }))
    return run((deviceId) => api.play({}, deviceId), (x) => ({ ...x, is_playing: true }))
  }, [run])

  const isPlayingContext = useCallback((uri: string) => !!state?.is_playing && state.context?.uri === uri, [state])

  const toggleContext = useCallback(
    (uri: string, opts?: PlayOptions) => {
      const s = stateRef.current
      if (s?.context?.uri === uri) return togglePlay()
      return playContext(uri, undefined, opts)
    },
    [playContext, togglePlay],
  )

  const value = useMemo<Player>(
    () => ({
      state,
      fetchedAt,
      ready,
      isPlayingContext,
      playContext,
      playUris,
      togglePlay,
      toggleContext,
      next: () => run(() => api.next()),
      previous: () => run(() => api.previous()),
      seek: (ms) => run(() => api.seek(ms), (x) => ({ ...x, progress_ms: ms })),
      setVolume: (percent) =>
        run(() => api.volume(percent), (x) => ({ ...x, device: { ...x.device, volume_percent: percent } })),
      toggleShuffle: () => {
        const next = !stateRef.current?.shuffle_state
        return run(() => api.shuffle(next), (x) => ({ ...x, shuffle_state: next }))
      },
      cycleRepeat: () => {
        const order: RepeatState[] = ['off', 'context', 'track']
        const current = stateRef.current?.repeat_state ?? 'off'
        const next = order[(order.indexOf(current) + 1) % order.length]
        return run(() => api.repeat(next), (x) => ({ ...x, repeat_state: next }))
      },
      transferTo: (deviceId, play) =>
        run(async () => {
          await api.transfer(deviceId, play ?? !!stateRef.current?.is_playing)
          localStorage.setItem(LAST_DEVICE_KEY, deviceId)
        }),
      addToQueue: async (uri) => {
        await run(async () => {
          await api.addToQueue(uri)
          toast('Zur Warteschlange hinzugefügt')
        })
      },
      startDj: async () => {
        actionCounter.current++
        try {
          let deviceId: string | undefined
          if (!stateRef.current) {
            const device = await findDevice()
            if (!device?.id) {
              openDevicePicker('Für den DJ muss Spotify auf einem Gerät geöffnet sein. Öffne die Spotify-App und wähle sie hier aus.')
              return
            }
            deviceId = device.id
          }
          await api.play({ context_uri: DJ_URI }, deviceId)
          toast('DJ wird gestartet …')
        } catch (e) {
          if (e instanceof ApiError && e.reason === 'PREMIUM_REQUIRED') {
            toast('Für den DJ brauchst du Spotify Premium.')
          } else if (!isDemoMode()) {
            toast('Spotify lässt den DJ nur in der eigenen App starten – ich öffne sie für dich.')
            setTimeout(() => (window.location.href = DJ_URI), 900)
          } else {
            toast('Der DJ konnte nicht gestartet werden.')
          }
        } finally {
          actionCounter.current++
          refreshSoon()
        }
      },
      refresh,
    }),
    [state, fetchedAt, ready, isPlayingContext, playContext, playUris, togglePlay, toggleContext, run, refresh, toast, findDevice, openDevicePicker, refreshSoon],
  )

  keysRef.current = { toggle: value.togglePlay, next: value.next, prev: value.previous }

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

function currentProgress(s: PlaybackState, fetchedAt: number) {
  const base = s.progress_ms ?? 0
  const p = s.is_playing ? base + Math.max(0, Date.now() - fetchedAt) : base
  return Math.min(p, s.item?.duration_ms ?? p)
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer außerhalb von PlayerProvider')
  return ctx
}

/** Aktuelle Position des Songs – läuft zwischen den Abfragen flüssig weiter. */
export function useProgress() {
  const { state, fetchedAt } = usePlayer()
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!state?.is_playing) return
    const id = setInterval(() => setTick((t) => t + 1), 250)
    return () => clearInterval(id)
  }, [state?.is_playing])
  if (!state) return { progress: 0, duration: 0 }
  return { progress: currentProgress(state, fetchedAt), duration: state.item?.duration_ms ?? 0 }
}
