import { useEffect, useState } from 'react'
import { hashHue } from './format'

const MOBILE_QUERY = '(max-width: 767px)'

export function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches)
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const onChange = () => setMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return mobile
}

export function useDebounced<T>(value: T, ms = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

export interface HeroColor {
  h: number
  s: number
  l: number
  solid: string
  dim: string
}

const colorCache = new Map<string, HeroColor>()

function fromHsl(h: number, s: number, l: number): HeroColor {
  return { h, s, l, solid: `hsl(${h} ${s}% ${l}%)`, dim: `hsl(${h} ${s}% ${l}% / 0.35)` }
}

function fallbackColor(seed: string): HeroColor {
  return fromHsl(hashHue(seed), 45, 32)
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return [h * 60, s, l]
}

/** Ermittelt die Hauptfarbe eines Covers – für die farbigen Seitenköpfe wie bei Spotify. */
export function useDominantColor(url: string | undefined, seed = ''): HeroColor {
  const key = url || seed
  const [color, setColor] = useState<HeroColor>(() => colorCache.get(key) ?? fallbackColor(key))

  useEffect(() => {
    if (!url) {
      setColor(fallbackColor(seed))
      return
    }
    const cached = colorCache.get(url)
    if (cached) {
      setColor(cached)
      return
    }
    setColor(fallbackColor(url))
    let cancelled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const size = 24
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return
        ctx.drawImage(img, 0, 0, size, size)
        const data = ctx.getImageData(0, 0, size, size).data
        let r = 0
        let g = 0
        let b = 0
        let weight = 0
        for (let i = 0; i < data.length; i += 4) {
          const [, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2])
          // Kräftige, mittelhelle Pixel zählen mehr
          const w = 0.15 + s * (1 - Math.abs(l - 0.5) * 2)
          r += data[i] * w
          g += data[i + 1] * w
          b += data[i + 2] * w
          weight += w
        }
        const [h, s, l] = rgbToHsl(r / weight, g / weight, b / weight)
        const result = fromHsl(Math.round(h), Math.round(Math.min(s, 0.7) * 100), Math.round(Math.min(Math.max(l, 0.24), 0.42) * 100))
        colorCache.set(url, result)
        if (!cancelled) setColor(result)
      } catch {
        // Bild ohne CORS-Freigabe → Ersatzfarbe bleibt
      }
    }
    img.src = url
    return () => {
      cancelled = true
    }
  }, [url, seed])

  return color
}

/** Gibt true zurück, sobald der Hauptbereich gescrollt wurde (für die Kopfleiste). */
export function useScrolled(threshold = 120) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const main = document.querySelector('.main')
    if (!main) return
    const onScroll = () => setScrolled(main.scrollTop > threshold)
    onScroll()
    main.addEventListener('scroll', onScroll, { passive: true })
    return () => main.removeEventListener('scroll', onScroll)
  }, [threshold])
  return scrolled
}
