import { Info, Shuffle } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { Cover, pickImage } from '../components/Cover'
import { TopBar } from '../components/Layout'
import { LikeButton } from '../components/LikeButton'
import { PlayButton } from '../components/Media'
import { TrackList } from '../components/TrackList'
import { formatLongDuration, plural, stripHtml } from '../lib/format'
import { useDominantColor } from '../lib/hooks'
import { useMe, usePlaylist, usePlaylistItems } from '../lib/queries'
import { entryTrack, playlistTotal } from '../lib/spotify'
import type { Paging, PlaylistEntry } from '../lib/types'
import { usePlayer } from '../state/player'

export function PageLoading() {
  return (
    <div className="page">
      <TopBar />
      <div className="center">
        <div className="spinner" />
      </div>
    </div>
  )
}

export function PageError({ text = 'Das konnte nicht geladen werden.' }: { text?: string }) {
  return (
    <div className="page">
      <TopBar />
      <div className="empty">
        <h2>Hoppla!</h2>
        <p>{text}</p>
      </div>
    </div>
  )
}

export function PlaylistPage() {
  const { id } = useParams()
  const me = useMe()
  const player = usePlayer()
  const playlist = usePlaylist(id)
  const p = playlist.data
  const isOwn = !!p && (p.owner?.id === me.data?.id || !!p.collaborative)
  // Spotify liefert Inhalte nur noch für eigene/gemeinsame Playlists (seit Februar 2026).
  const inline = p && ((p.items ?? p.tracks) as Paging<PlaylistEntry> | undefined)
  const hasInlineItems = !!inline && Array.isArray(inline.items)
  const items = usePlaylistItems(id, !!p && (isOwn || hasInlineItems))
  const color = useDominantColor(pickImage(p?.images, 300), id)

  if (playlist.isLoading) return <PageLoading />
  if (playlist.isError || !p) return <PageError text="Diese Playlist konnte nicht geladen werden." />

  const entries = items.data?.entries ?? (hasInlineItems ? inline!.items.filter((e) => entryTrack(e)) : [])
  const tracks = entries.map((e) => ({ track: entryTrack(e)!, addedAt: e.added_at }))
  const total = playlistTotal(p)
  const duration = tracks.reduce((sum, t) => sum + (t.track.duration_ms || 0), 0)
  const contentsBlocked = !isOwn && !hasInlineItems && (items.isError || !items.data)

  return (
    <div className="page">
      <TopBar title={p.name} color={color.solid}>
        <PlayButton contextUri={p.uri} className="small" size={20} />
      </TopBar>
      <header className="hero" style={{ '--hero-color': color.solid } as React.CSSProperties}>
        <Cover images={p.images} alt={p.name} size={300} />
        <div className="hero-text">
          <span className="hero-type">{p.public === false ? 'Private Playlist' : 'Playlist'}</span>
          <h1 className="hero-title">{p.name}</h1>
          {p.description && <p className="hero-desc">{stripHtml(p.description)}</p>}
          <div className="hero-meta">
            <strong>{p.owner?.display_name}</strong>
            {total > 0 && <span className="dot">{plural(total, 'Song', 'Songs')}</span>}
            {duration > 0 && <span className="dot muted">{formatLongDuration(duration)}</span>}
          </div>
        </div>
      </header>

      <div className="action-bar" style={{ '--hero-color-dim': color.dim } as React.CSSProperties}>
        <PlayButton contextUri={p.uri} />
        <button
          type="button"
          className={`icon-btn big${player.state?.shuffle_state ? ' on' : ''}`}
          aria-label="Zufallswiedergabe"
          onClick={() => player.playContext(p.uri, undefined, { shuffle: true })}
        >
          <Shuffle size={26} />
        </button>
        {!isOwn && <LikeButton uri={p.uri} size={28} kind="playlist" className="big" />}
      </div>

      {contentsBlocked && (
        <div className="notice">
          <Info size={18} />
          <span>
            Spotify zeigt fremden Apps die Songs dieser Playlist nicht mehr an (gilt nur für Playlists, die dir nicht gehören). Abspielen
            klappt trotzdem – tippe einfach auf Play.
          </span>
        </div>
      )}

      {items.isLoading && !hasInlineItems && (
        <div className="center">
          <div className="spinner" />
        </div>
      )}

      {tracks.length > 0 && <TrackList items={tracks} contextUri={p.uri} showAdded playlistId={isOwn ? p.id : undefined} />}

      {isOwn && !items.isLoading && tracks.length === 0 && (
        <div className="empty">
          <h2>Diese Playlist ist noch leer</h2>
          <p>Füge Songs über das Menü (…) bei einem Song hinzu.</p>
        </div>
      )}

      {items.hasNextPage && (
        <div className="load-more">
          <button type="button" className="outline-btn" onClick={() => items.fetchNextPage()} disabled={items.isFetchingNextPage}>
            Weitere Songs laden
          </button>
        </div>
      )}
    </div>
  )
}
