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
}

export function pickImage(images: SpotifyImage[] | null | undefined, size = 300): string | undefined {
  if (!images?.length) return undefined
  const sorted = [...images].sort((a, b) => (a.width ?? 640) - (b.width ?? 640))
  return (sorted.find((i) => (i.width ?? 640) >= size) ?? sorted[sorted.length - 1]).url
}

export function Cover({ images, alt = '', round, shadow, size = 300, liked, className = '' }: Props) {
  const url = pickImage(images, size)
  const cls = ['cover', round && 'round', shadow && 'shadow', liked && 'liked-cover', className].filter(Boolean).join(' ')
  if (liked) {
    return (
      <div className={cls}>
        <Heart fill="currentColor" size="38%" />
      </div>
    )
  }
  return (
    <div className={cls}>
      {url ? (
        <img src={url} alt={alt} loading="lazy" decoding="async" />
      ) : round ? (
        <User size="40%" />
      ) : (
        <Music size="40%" />
      )}
    </div>
  )
}
