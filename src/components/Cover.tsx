import { Heart, Music, User } from 'lucide-react'
import type { SpotifyImage } from '../lib/types'

interface Props {
  images?: SpotifyImage[] | null
  alt?: string
  round?: boolean
  shadow?: boolean
  /** Gewünschte Breite in Pixeln – wählt das passende Bild aus. */
  size?: number
  liked?: boolean
  className?: string
  /** Farbiger Lichtschein hinter dem Cover (Ambient Light). „hover“ = nur beim Darüberfahren. */
  glow?: boolean | 'hover'
}

export function pickImage(images: SpotifyImage[] | null | undefined, size = 300): string | undefined {
  if (!images?.length) return undefined
  const sorted = [...images].sort((a, b) => (a.width ?? 640) - (b.width ?? 640))
  return (sorted.find((i) => (i.width ?? 640) >= size) ?? sorted[sorted.length - 1]).url
}

const LIKED_GLOW =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#7c3aed'/><stop offset='.6' stop-color='#db2777'/><stop offset='1' stop-color='#f59e0b'/></linearGradient></defs><rect width='10' height='10' fill='url(#g)'/></svg>",
  )

export function Cover({ images, alt = '', round, shadow, size = 300, liked, className = '', glow }: Props) {
  const url = pickImage(images, size)
  const cls = ['cover', round && 'round', shadow && 'shadow', liked && 'liked-cover', !glow && className].filter(Boolean).join(' ')
  const inner = liked ? (
    <div className={cls}>
      <Heart fill="currentColor" size="38%" />
    </div>
  ) : (
    <div className={cls}>
      {url ? <img src={url} alt={alt} loading="lazy" decoding="async" /> : round ? <User size="40%" /> : <Music size="40%" />}
    </div>
  )
  if (!glow) return inner

  const glowUrl = liked ? LIKED_GLOW : pickImage(images, 64)
  return (
    <div className={['glow-wrap', round && 'round', glow === 'hover' && 'soft', className].filter(Boolean).join(' ')}>
      {glowUrl && <img className="glow-img" src={glowUrl} alt="" aria-hidden="true" loading="lazy" />}
      {inner}
    </div>
  )
}
