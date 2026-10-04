import { useQueryClient } from '@tanstack/react-query'
import { Ellipsis, ExternalLink, Info, Link2, Pencil, Shuffle, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Cover, pickImage } from '../components/Cover'
import { TopBar } from '../components/Layout'
import { LikeButton } from '../components/LikeButton'
import { PlayButton } from '../components/Media'
import { Sheet } from '../components/Overlays'
import { TrackList } from '../components/TrackList'
import { formatLongDuration, plural, stripHtml } from '../lib/format'
import { useMe, usePlaylist, usePlaylistItems } from '../lib/queries'
import { api, entryTrack, isDemoMode, playlistTotal } from '../lib/spotify'
import type { Paging, Playlist, PlaylistEntry } from '../lib/types'
import { usePageAmbient } from '../state/ambient'
import { usePlayer } from '../state/player'
import { useUi } from '../state/ui'

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
        <h2>Hoppla.</h2>
        <p>{text}</p>
      </div>
    </div>
  )
}

/** Menü einer Playlist: bearbeiten, teilen, löschen. */
function PlaylistMenu({ playlist, isOwner, onClose }: { playlist: Playlist; isOwner: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { toast } = useUi()
  const [mode, setMode] = useState<'menu' | 'edit' | 'delete'>('menu')
  const [name, setName] = useState(playlist.name)
  const [description, setDescription] = useState(stripHtml(playlist.description))
  const [busy, setBusy] = useState(false)
  const shareUrl = `https://open.spotify.com/playlist/${playlist.id}`

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.updatePlaylist(playlist.id, { name: name.trim() || playlist.name, description: description.trim() })
      toast('Playlist gespeichert')
      queryClient.invalidateQueries({ queryKey: ['playlist', playlist.id] })
      queryClient.invalidateQueries({ queryKey: ['myPlaylists'] })
      onClose()
    } catch {
      toast('Speichern hat nicht geklappt.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await api.libraryRemove([playlist.uri])
      toast(isOwner ? 'Playlist gelöscht' : 'Aus deiner Bibliothek entfernt')
      queryClient.invalidateQueries({ queryKey: ['myPlaylists'] })
      onClose()
      navigate('/bibliothek')
    } catch {
      toast('Das hat leider nicht geklappt.')
    } finally {
      setBusy(false)
    }
  }

  if (mode === 'edit') {
    return (
      <Sheet onClose={onClose} label="Playlist bearbeiten">
        <form onSubmit={save} style={{ padding: '0 18px 6px' }}>
          <div className="sheet-title" style={{ padding: '8px 0 6px' }}>
            Playlist bearbeiten
          </div>
          <label className="field-label" htmlFor="pl-name">
            Name
          </label>
          <input id="pl-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoFocus />
          <label className="field-label" htmlFor="pl-desc">
            Beschreibung
          </label>
          <textarea id="pl-desc" className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" className="pill-btn secondary small" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="pill-btn small" disabled={busy}>
              Speichern
            </button>
          </div>
        </form>
      </Sheet>
    )
  }

  if (mode === 'delete') {
    return (
      <Sheet onClose={onClose} label="Playlist löschen">
        <div style={{ padding: '0 18px 6px' }}>
          <div className="sheet-title" style={{ padding: '8px 0 10px' }}>
            {isOwner ? 'Playlist löschen?' : 'Aus Bibliothek entfernen?'}
          </div>
          <p className="muted">
            {isOwner ? `„${playlist.name}“ wird aus deiner Bibliothek gelöscht.` : `„${playlist.name}“ wird aus deiner Bibliothek entfernt.`}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="pill-btn secondary small" onClick={onClose}>
              Abbrechen
            </button>
            <button type="button" className="pill-btn small" style={{ background: 'var(--danger)' }} disabled={busy} onClick={remove}>
              {isOwner ? 'Löschen' : 'Entfernen'}
            </button>
          </div>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet onClose={onClose} label="Playlist-Optionen">
      <div className="sheet-head">
        <Cover images={playlist.images} size={64} />
        <div style={{ minWidth: 0 }}>
          <div className="ellipsis" style={{ fontWeight: 700 }}>
            {playlist.name}
          </div>
          <div className="ellipsis muted" style={{ fontSize: 13 }}>
            Playlist · {playlist.owner?.display_name}
          </div>
        </div>
      </div>
      {isOwner && (
        <button type="button" className="menu-item" onClick={() => setMode('edit')}>
          <Pencil size={21} /> Name & Beschreibung bearbeiten
        </button>
      )}
      {!isDemoMode() && (
        <>
          <button
            type="button"
            className="menu-item"
            onClick={async () => {
              onClose()
              try {
                if (navigator.share) await navigator.share({ title: playlist.name, url: shareUrl })
                else {
                  await navigator.clipboard.writeText(shareUrl)
                  toast('Link kopiert')
                }
              } catch {
                // Teilen abgebrochen
              }
            }}
          >
            <Link2 size={21} /> Teilen / Link kopieren
          </button>
          <a className="menu-item" href={playlist.uri} onClick={onClose}>
            <ExternalLink size={21} /> In Spotify öffnen
          </a>
        </>
      )}
      <button type="button" className="menu-item danger" onClick={() => setMode('delete')}>
        <Trash2 size={21} /> {isOwner ? 'Playlist löschen' : 'Aus Bibliothek entfernen'}
      </button>
    </Sheet>
  )
}

export function PlaylistPage() {
  const { id } = useParams()
  const me = useMe()
  const player = usePlayer()
  const playlist = usePlaylist(id)
  const [menuOpen, setMenuOpen] = useState(false)
  const p = playlist.data
  const isOwner = !!p && p.owner?.id === me.data?.id
  const isOwn = isOwner || !!p?.collaborative
  // Spotify liefert Inhalte nur noch für eigene/gemeinsame Playlists (seit Februar 2026).
  const inline = p && ((p.items ?? p.tracks) as Paging<PlaylistEntry> | undefined)
  const hasInlineItems = !!inline && Array.isArray(inline.items)
  const items = usePlaylistItems(id, !!p && (isOwn || hasInlineItems))
  usePageAmbient(pickImage(p?.images, 64))

  if (playlist.isLoading) return <PageLoading />
  if (playlist.isError || !p) return <PageError text="Diese Playlist konnte nicht geladen werden." />

  const entries = items.data?.entries ?? (hasInlineItems ? inline!.items.filter((e) => entryTrack(e)) : [])
  const tracks = entries.map((e) => ({ track: entryTrack(e)!, addedAt: e.added_at }))
  const total = playlistTotal(p)
  const duration = tracks.reduce((sum, t) => sum + (t.track.duration_ms || 0), 0)
  const contentsBlocked = !isOwn && !hasInlineItems && (items.isError || !items.data)

  return (
    <div className="page">
      <TopBar title={p.name}>
        <PlayButton contextUri={p.uri} className="small" size={20} />
      </TopBar>
      <header className="hero">
        <Cover images={p.images} alt={p.name} size={300} glow />
        <div className="hero-text">
          <span className="kicker">{p.public === false ? 'Private Playlist' : 'Playlist'}</span>
          <h1 className="hero-title">{p.name}</h1>
          {p.description && <p className="hero-desc">{stripHtml(p.description)}</p>}
          <div className="hero-meta">
            <strong>{p.owner?.display_name}</strong>
            {total > 0 && <span className="dot">{plural(total, 'Song', 'Songs')}</span>}
            {duration > 0 && <span className="dot">{formatLongDuration(duration)}</span>}
          </div>
        </div>
      </header>

      <div className="action-bar">
        <PlayButton contextUri={p.uri} />
        <button
          type="button"
          className={`icon-btn big glass${player.state?.shuffle_state ? ' on' : ''}`}
          aria-label="Zufällig abspielen"
          title="Zufällig abspielen"
          onClick={() => player.playContext(p.uri, undefined, { shuffle: true })}
        >
          <Shuffle size={22} />
        </button>
        {!isOwner && <LikeButton uri={p.uri} size={22} kind="playlist" className="big glass" />}
        <button type="button" className="icon-btn big glass" aria-label="Weitere Optionen" onClick={() => setMenuOpen(true)}>
          <Ellipsis size={22} />
        </button>
      </div>

      {contentsBlocked && (
        <div className="notice">
          <Info size={18} />
          <span>
            Spotify zeigt fremden Apps die Songs dieser Playlist nicht mehr an (gilt nur für Playlists, die dir nicht gehören). Abspielen klappt
            trotzdem – tippe einfach auf Play.
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
          <h2>Noch ganz leer hier.</h2>
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

      {menuOpen && <PlaylistMenu playlist={p} isOwner={isOwner} onClose={() => setMenuOpen(false)} />}
    </div>
  )
}
