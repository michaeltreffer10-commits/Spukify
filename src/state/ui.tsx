// Globale Oberflächen-Zustände: Overlays (Player im Vollbild, Geräte, Song-Menü) und Hinweise (Toasts).

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Track } from '../lib/types'

export interface Toast {
  id: number
  text: string
}

export interface TrackMenuTarget {
  track: Track
  /** Gesetzt, wenn der Song aus einer eigenen Playlist entfernt werden kann. */
  playlistId?: string
}

interface UiState {
  nowPlayingOpen: boolean
  setNowPlayingOpen: (open: boolean) => void
  devicePickerOpen: boolean
  devicePickerHint: string | null
  openDevicePicker: (hint?: string) => void
  closeDevicePicker: () => void
  trackMenu: TrackMenuTarget | null
  openTrackMenu: (target: TrackMenuTarget) => void
  closeTrackMenu: () => void
  addToPlaylist: Track | null
  openAddToPlaylist: (track: Track) => void
  closeAddToPlaylist: () => void
  createPlaylistOpen: boolean
  setCreatePlaylistOpen: (open: boolean) => void
  toasts: Toast[]
  toast: (text: string) => void
}

const UiContext = createContext<UiState | null>(null)

export function UiProvider({ children }: { children: ReactNode }) {
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false)
  const [devicePickerOpen, setDevicePickerOpen] = useState(false)
  const [devicePickerHint, setDevicePickerHint] = useState<string | null>(null)
  const [trackMenu, setTrackMenu] = useState<TrackMenuTarget | null>(null)
  const [addToPlaylist, setAddToPlaylist] = useState<Track | null>(null)
  const [createPlaylistOpen, setCreatePlaylistOpen] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const toast = useCallback((text: string) => {
    const id = nextId.current++
    setToasts((t) => [...t.slice(-2), { id, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  const value = useMemo<UiState>(
    () => ({
      nowPlayingOpen,
      setNowPlayingOpen,
      devicePickerOpen,
      devicePickerHint,
      openDevicePicker: (hint) => {
        setDevicePickerHint(hint ?? null)
        setDevicePickerOpen(true)
      },
      closeDevicePicker: () => setDevicePickerOpen(false),
      trackMenu,
      openTrackMenu: setTrackMenu,
      closeTrackMenu: () => setTrackMenu(null),
      addToPlaylist,
      openAddToPlaylist: (track) => {
        setTrackMenu(null)
        setAddToPlaylist(track)
      },
      closeAddToPlaylist: () => setAddToPlaylist(null),
      createPlaylistOpen,
      setCreatePlaylistOpen,
      toasts,
      toast,
    }),
    [nowPlayingOpen, devicePickerOpen, devicePickerHint, trackMenu, addToPlaylist, createPlaylistOpen, toasts, toast],
  )

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}

export function useUi() {
  const ctx = useContext(UiContext)
  if (!ctx) throw new Error('useUi außerhalb von UiProvider')
  return ctx
}
