import { ArrowUpDown, Plus, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Avatar } from '../components/Layout'
import { LibraryRow, playlistSubtitle } from '../components/Media'
import { artistNames } from '../lib/format'
import { useIsMobile } from '../lib/hooks'
import { useFollowedArtists, useMyPlaylists, useSavedAlbums, useSavedTracks } from '../lib/queries'
import type { MediaItem, Playlist } from '../lib/types'
import { useUi } from '../state/ui'

const FILTERS = [
  { key: 'playlists', label: 'Playlists' },
  { key: 'albums', label: 'Alben' },
  { key: 'artists', label: 'Künstler' },
]

const SORT_KEY = 'spukify.librarySort'

export function Library() {
  const mobile = useIsMobile()
  const { setCreatePlaylistOpen } = useUi()
  const [params, setParams] = useSearchParams()
  const filter = params.get('filter')
  const [sort, setSort] = useState<'recent' | 'alpha'>(() => (localStorage.getItem(SORT_KEY) as 'alpha') || 'recent')
  const playlists = useMyPlaylists()
  const albums = useSavedAlbums()
  const artists = useFollowedArtists()
  const liked = useSavedTracks()

  const items = useMemo(() => {
    const out: { item: MediaItem; sub: string }[] = []
    if (!filter || filter === 'playlists') out.push(...(playlists.data ?? []).map((p) => ({ item: p, sub: playlistSubtitle(p as Playlist) })))
    if (!filter || filter === 'albums')
      out.push(...(albums.data ?? []).map(({ album }) => ({ item: album as MediaItem, sub: `Album • ${artistNames(album.artists)}` })))
    if (!filter || filter === 'artists') out.push(...(artists.data ?? []).map((a) => ({ item: a as MediaItem, sub: 'Künstler' })))
    if (sort === 'alpha') out.sort((a, b) => a.item.name.localeCompare(b.item.name, 'de'))
    return out
  }, [filter, sort, playlists.data, albums.data, artists.data])

  const loading = playlists.isLoading || albums.isLoading || artists.isLoading
  const likedTotal = liked.data?.pages[0]?.total ?? 0

  const setFilter = (key: string | null) => {
    const next = new URLSearchParams(params)
    if (key) next.set('filter', key)
    else next.delete('filter')
    setParams(next, { replace: true })
  }

  return (
    <div className="page">
      <div
        className="page-pad"
        style={{ paddingTop: mobile ? 'calc(16px + var(--safe-top))' : 24, position: 'sticky', top: 0, zIndex: 10, background: 'var(--surface)', paddingBottom: 8 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          {mobile && <Avatar />}
          <h1 style={{ fontSize: mobile ? 24 : 32, fontWeight: 800, flex: 1, letterSpacing: '-0.02em' }}>Bibliothek</h1>
          <button type="button" className="icon-btn" style={{ color: '#fff' }} aria-label="Playlist erstellen" onClick={() => setCreatePlaylistOpen(true)}>
            <Plus size={26} />
          </button>
        </div>
        <div className="chips">
          {filter && (
            <button type="button" className="chip" aria-label="Filter entfernen" onClick={() => setFilter(null)}>
              <X size={16} style={{ verticalAlign: '-3px' }} />
            </button>
          )}
          {FILTERS.filter((f) => !filter || f.key === filter).map((f) => (
            <button key={f.key} type="button" className={`chip${filter === f.key ? ' on' : ''}`} onClick={() => setFilter(filter === f.key ? null : f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="muted"
          style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, fontSize: 13, fontWeight: 600 }}
          onClick={() => {
            const next = sort === 'recent' ? 'alpha' : 'recent'
            setSort(next)
            localStorage.setItem(SORT_KEY, next)
          }}
        >
          <ArrowUpDown size={14} />
          {sort === 'recent' ? 'Zuletzt hinzugefügt' : 'Alphabetisch'}
        </button>
      </div>

      <div className="page-pad" style={{ paddingTop: 4 }}>
        {(!filter || filter === 'playlists') && (
          <LibraryRow item={{ type: 'liked', name: 'Lieblingssongs', uri: 'liked', total: likedTotal }} />
        )}
        {items.map(({ item, sub }) => (
          <LibraryRow key={item.uri} item={item} subtitle={sub} />
        ))}
        {loading && (
          <div className="center" style={{ padding: 32 }}>
            <div className="spinner" />
          </div>
        )}
        {!loading && items.length === 0 && filter && (
          <div className="empty">
            <p>Hier ist noch nichts.</p>
          </div>
        )}
      </div>
    </div>
  )
}
