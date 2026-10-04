// Karten, Regale und Listeneinträge für Playlists, Alben und Künstler.

import { Pause, Play } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { artistNames, year } from '../lib/format'
import { useIsMobile } from '../lib/hooks'
import { playlistTotal } from '../lib/spotify'
import type { AlbumRef, MediaItem, Playlist } from '../lib/types'
import { usePlayer } from '../state/player'
import { Cover } from './Cover'

export function linkTo(item: { type: string; id: string }): string {
  switch (item.type) {
    case 'playlist':
      return `/playlist/${item.id}`
    case 'album':
      return `/album/${item.id}`
    case 'artist':
      return `/kuenstler/${item.id}`
    default:
      return '/'
  }
}

export function subtitleOf(item: MediaItem, short = false): string {
  if (item.type === 'artist') return 'Künstler'
  if (item.type === 'album') {
    const a = item as AlbumRef
    const kind = a.album_type === 'single' ? 'Single' : a.album_type === 'compilation' ? 'Compilation' : 'Album'
    return short ? artistNames(a.artists) : [year(a.release_date), artistNames(a.artists)].filter(Boolean).join(' • ') || kind
  }
  const p = item as Playlist
  return short ? `Playlist • ${p.owner?.display_name ?? ''}` : p.description?.replace(/<[^>]+>/g, '') || `Von ${p.owner?.display_name ?? 'Spotify'}`
}

export function PlayButton({
  contextUri,
  className = '',
  size = 24,
  fallbackUris,
}: {
  contextUri: string
  className?: string
  size?: number
  fallbackUris?: string[]
}) {
  const player = usePlayer()
  const playing = player.isPlayingContext(contextUri)
  return (
    <button
      type="button"
      className={`play-btn ${className}`}
      aria-label={playing ? 'Pause' : 'Abspielen'}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        player.toggleContext(contextUri, { fallbackUris })
      }}
    >
      {playing ? <Pause size={size} fill="currentColor" strokeWidth={0} /> : <Play size={size} fill="currentColor" strokeWidth={0} style={{ marginLeft: 2 }} />}
    </button>
  )
}

export function MediaCard({ item, subtitle }: { item: MediaItem; subtitle?: string }) {
  const player = usePlayer()
  const mobile = useIsMobile()
  const playing = player.isPlayingContext(item.uri)
  const round = item.type === 'artist'
  return (
    <Link to={linkTo(item)} className="card">
      <div style={{ position: 'relative' }}>
        <Cover images={item.images} round={round} shadow alt={item.name} glow={mobile ? false : 'hover'} />
        <PlayButton contextUri={item.uri} className={`small card-play${playing ? ' visible' : ''}`} size={20} />
      </div>
      <div className="card-title ellipsis" style={playing ? { color: 'var(--accent)' } : undefined}>
        {item.name}
      </div>
      <div className="card-sub">{subtitle ?? subtitleOf(item)}</div>
    </Link>
  )
}

export function Shelf({ title, to, children }: { title: string; to?: string; children: ReactNode }) {
  return (
    <section className="section page-pad">
      <div className="section-head">
        <h2 className="section-title">{to ? <Link to={to}>{title}</Link> : title}</h2>
        {to && (
          <Link to={to} className="section-link">
            Alle anzeigen
          </Link>
        )}
      </div>
      <div className="shelf">{children}</div>
    </section>
  )
}

/** Eintrag in Listenform (Bibliothek, Seitenleiste). */
export function LibraryRow({
  item,
  active,
  subtitle,
  onClick,
}: {
  item: MediaItem | { type: 'liked'; name: string; uri: string; total: number }
  active?: boolean
  subtitle?: ReactNode
  onClick?: () => void
}) {
  const navigate = useNavigate()
  const player = usePlayer()
  const playing = player.state?.context?.uri === item.uri
  const isLiked = item.type === 'liked'
  const to = isLiked ? '/lieblingssongs' : linkTo(item as MediaItem)
  const sub =
    subtitle ??
    (isLiked
      ? `Playlist • ${(item as { total: number }).total} Songs`
      : item.type === 'artist'
        ? 'Künstler'
        : item.type === 'album'
          ? `Album • ${artistNames((item as AlbumRef).artists)}`
          : `Playlist • ${(item as Playlist).owner?.display_name ?? ''}`)
  return (
    <button
      type="button"
      className={`lib-row${active ? ' active' : ''}`}
      onClick={() => {
        onClick?.()
        navigate(to)
      }}
    >
      <Cover images={isLiked ? null : (item as MediaItem).images} liked={isLiked} round={item.type === 'artist'} size={64} />
      <div className="lib-row-text">
        <div className={`lib-row-title ellipsis${playing ? ' playing' : ''}`}>{item.name}</div>
        <div className="lib-row-sub ellipsis">{sub}</div>
      </div>
    </button>
  )
}

export function playlistSubtitle(p: Playlist) {
  const total = playlistTotal(p)
  return `Playlist • ${p.owner?.display_name ?? ''}${total ? ` • ${total} Songs` : ''}`
}
