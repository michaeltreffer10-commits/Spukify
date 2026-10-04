// Ambient Light: Die Farben des aktuellen Covers leuchten im Hintergrund der ganzen App.
// Quelle ist das Cover der geöffneten Seite (Playlist, Album …) oder sonst der laufende Song.

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { pickImage } from '../components/Cover'
import { useDebounced, useDominantColor } from '../lib/hooks'
import { usePlayer } from './player'

interface Ambient {
  source?: string
  setPageImage: (url: string | null) => void
}

const AmbientContext = createContext<Ambient | null>(null)

export function AmbientProvider({ children }: { children: ReactNode }) {
  const player = usePlayer()
  const [pageImage, setPageImage] = useState<string | null>(null)
  const playingImage = pickImage(player.state?.item?.album?.images, 64)
  // Kurz entprellen, damit beim Seitenwechsel nicht kurz das falsche Bild aufblitzt
  const source = useDebounced(pageImage ?? playingImage ?? undefined, 120)
  const color = useDominantColor(source, 'spukify')

  useEffect(() => {
    const root = document.documentElement.style
    const h = source ? color.h : 265
    const s = source ? Math.max(color.s, 35) : 60
    root.setProperty('--amb', `hsl(${h} ${s}% ${source ? Math.min(color.l, 40) : 34}%)`)
    root.setProperty('--accent', `hsl(${h} ${Math.max(s, 70)}% 76%)`)
    root.setProperty('--glow', `hsl(${h} ${Math.max(s, 70)}% 58% / 0.55)`)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', `hsl(${h} ${Math.round(s * 0.6)}% 9%)`)
  }, [color, source])

  const value = useMemo(() => ({ source, setPageImage }), [source])
  return <AmbientContext.Provider value={value}>{children}</AmbientContext.Provider>
}

export function useAmbient() {
  const ctx = useContext(AmbientContext)
  if (!ctx) throw new Error('useAmbient außerhalb von AmbientProvider')
  return ctx
}

/** Setzt das Cover einer Seite als Lichtquelle, solange die Seite offen ist. */
export function usePageAmbient(url: string | undefined) {
  const { setPageImage } = useAmbient()
  useEffect(() => {
    setPageImage(url ?? null)
    return () => setPageImage(null)
  }, [url, setPageImage])
}

/** Der leuchtende, langsam treibende Hintergrund. */
export function AmbientBackdrop() {
  const { source } = useAmbient()
  const player = usePlayer()
  const [layers, setLayers] = useState<{ key: number; url?: string }[]>([])

  useEffect(() => {
    setLayers((prev) => (source ? [...prev.slice(-1), { key: Date.now(), url: source }] : []))
  }, [source])

  return (
    <div className={`ambient${player.state?.is_playing ? '' : ' paused'}`} aria-hidden="true">
      <div className="ambient-aurora">
        <span />
        <span />
        <span />
      </div>
      {layers.map((l) => (
        <div key={l.key} className="ambient-layer" style={{ backgroundImage: `url("${l.url}")` }} />
      ))}
      <div className="ambient-shade" />
    </div>
  )
}

/** Nur das Polarlicht – für Seiten ohne Player (Willkommen, Einrichtung). */
export function StaticAurora() {
  return (
    <div className="ambient" aria-hidden="true">
      <div className="ambient-aurora">
        <span />
        <span />
        <span />
      </div>
      <div className="ambient-shade" />
    </div>
  )
}
