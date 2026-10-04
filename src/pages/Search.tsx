import { Music, Play, Search as SearchIcon, X } from 'lucide-react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Cover } from '../components/Cover'
import { Avatar } from '../components/Layout'
import { LibraryRow, linkTo, MediaCard, PlayButton, Shelf, subtitleOf } from '../components/Media'
import { TrackList } from '../components/TrackList'
import { useDebounced, useIsMobile } from '../lib/hooks'
import { useSearch } from '../lib/queries'
import { api } from '../lib/spotify'
import type { AlbumRef, Artist, MediaItem, Playlist, SearchResults, Track } from '../lib/types'
import { usePlayer } from '../state/player'

const RECENT_KEY = 'spukify.recentSearches'

const FILTERS = [
  { key: 'alle', label: 'Alle', types: ['track', 'artist', 'album', 'playlist'] },
  { key: 'songs', label: 'Songs', types: ['track'] },
  { key: 'kuenstler', label: 'Künstler', types: ['artist'] },
  { key: 'alben', label: 'Alben', types: ['album'] },
  { key: 'playlists', label: 'Playlists', types: ['playlist'] },
] as const

const BROWSE = [
  ['Pop', '#dc148c'],
  ['Hip-Hop', '#bc5900'],
  ['Deutschrap', '#e8115b'],
  ['Rock', '#e91429'],
  ['Elektro', '#0d73ec'],
  ['Chill', '#477d95'],
  ['Workout', '#777777'],
  ['Party', '#8d67ab'],
  ['Indie', '#608108'],
  ['Schlager', '#e1118c'],
  ['Jazz', '#1e3264'],
  ['Klassik', '#7d4b32'],
  ['R&B', '#dc148c'],
  ['Fokus', '#503750'],
  ['Schlafen', '#1e3264'],
  ['Sommer', '#27856a'],
]

type RecentItem = Pick<MediaItem, 'id' | 'name' | 'uri' | 'type' | 'images'> & { sub?: string }

function readRecent(): RecentItem[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  } catch {
    return []
  }
}

function rememberItem(item: MediaItem) {
  const entry: RecentItem = {
    id: item.id,
    name: item.name,
    uri: item.uri,
    type: item.type,
    images: (item.images ?? []).slice(-1),
    sub: subtitleOf(item, true),
  }
  const list = [entry, ...readRecent().filter((r) => r.uri !== item.uri)].slice(0, 12)
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list))
  } catch {
    // ignorieren
  }
}

function pickTopResult(q: string, data: SearchResults): MediaItem | Track | null {
  const query = q.toLowerCase()
  const artist = data.artists?.items[0]
  if (artist && artist.name.toLowerCase().startsWith(query.slice(0, Math.max(3, query.length - 2)))) return artist
  return data.tracks?.items[0] ?? artist ?? data.albums?.items[0] ?? null
}

function TopResult({ item }: { item: MediaItem | Track }) {
  const navigate = useNavigate()
  const player = usePlayer()
  const isTrack = item.type === 'track'
  const images = isTrack ? (item as Track).album?.images : (item as MediaItem).images
  const contextUri = isTrack ? (item as Track).album?.uri ?? item.uri : item.uri
  const sub = isTrack
    ? `Song • ${(item as Track).artists.map((a) => a.name).join(', ')}`
    : item.type === 'artist'
      ? 'Künstler'
      : `${item.type === 'album' ? 'Album' : 'Playlist'} • ${subtitleOf(item as MediaItem, true).replace('Playlist • ', '')}`
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        className="top-result"
        onClick={() => {
          if (isTrack) {
            const t = item as Track
            if (t.album) navigate(`/album/${t.album.id}`)
          } else {
            rememberItem(item as MediaItem)
            navigate(linkTo(item as MediaItem))
          }
        }}
      >
        <Cover images={images} round={item.type === 'artist'} size={160} />
        <div>
          <div className="top-result-name ellipsis">{item.name}</div>
          <div className="muted" style={{ marginTop: 4 }}>
            {sub}
          </div>
        </div>
      </button>
      <div style={{ position: 'absolute', right: 20, bottom: 20 }}>
        {isTrack ? (
          <button
            type="button"
            className="play-btn small"
            aria-label="Abspielen"
            onClick={() => player.playContext(contextUri, { uri: item.uri })}
          >
            <Play size={22} fill="currentColor" strokeWidth={0} style={{ marginLeft: 2 }} />
          </button>
        ) : (
          <PlayButton contextUri={contextUri} className="small" />
        )}
      </div>
    </div>
  )
}

function useTypedSearch(q: string, type: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['searchTyped', q, type],
    queryFn: ({ pageParam }) => api.search(q, [type], pageParam),
    initialPageParam: 0,
    getNextPageParam: (last: SearchResults, all) => {
      const page = Object.values(last)[0] as { next: string | null } | undefined
      return page?.next && all.length < 10 ? all.length * 10 : undefined
    },
    enabled: enabled && q.length > 0,
    staleTime: 60_000,
  })
}

export function Search() {
  const mobile = useIsMobile()
  const [params, setParams] = useSearchParams()
  const [input, setInput] = useState(params.get('q') ?? '')
  const debounced = useDebounced(input.trim(), 350)
  const filterKey = params.get('typ') ?? 'alle'
  const filter = FILTERS.find((f) => f.key === filterKey) ?? FILTERS[0]
  const [recent, setRecent] = useState(readRecent)

  useEffect(() => {
    const next = new URLSearchParams(params)
    if (debounced) next.set('q', debounced)
    else next.delete('q')
    if (next.toString() !== params.toString()) setParams(next, { replace: true })
  }, [debounced])

  const q = params.get('q') ?? ''
  const all = useSearch(q, [...FILTERS[0].types], filter.key === 'alle')
  const typed = useTypedSearch(q, filter.types[0], filter.key !== 'alle')

  const typedItems = useMemo(() => {
    const pages = typed.data?.pages ?? []
    const key = { track: 'tracks', artist: 'artists', album: 'albums', playlist: 'playlists' }[filter.types[0]] as keyof SearchResults
    return pages.flatMap((p) => (p[key]?.items ?? []).filter(Boolean)) as (Track | Artist | AlbumRef | Playlist)[]
  }, [typed.data, filter.types])

  const setFilter = (key: string) => {
    const next = new URLSearchParams(params)
    if (key === 'alle') next.delete('typ')
    else next.set('typ', key)
    setParams(next, { replace: true })
  }

  const data = all.data
  const top = data ? pickTopResult(q, data) : null
  const playlists = (data?.playlists?.items ?? []).filter(Boolean) as Playlist[]

  return (
    <div className="page">
      <div className="page-pad" style={{ paddingTop: mobile ? 'calc(16px + var(--safe-top))' : 16, position: 'sticky', top: 0, zIndex: 10, background: 'var(--surface)', paddingBottom: 12 }}>
        {mobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Avatar />
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>Suche</h1>
          </div>
        )}
        <div className="search-box">
          <SearchIcon className="lead" size={22} />
          <input
            type="search"
            placeholder="Was möchtest du hören?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoComplete="off"
            enterKeyHint="search"
            aria-label="Suche"
          />
          {input && (
            <button type="button" className="icon-btn clear" aria-label="Eingabe löschen" onClick={() => setInput('')}>
              <X size={20} />
            </button>
          )}
        </div>
        {q && (
          <div className="chips" style={{ marginTop: 12 }}>
            {FILTERS.map((f) => (
              <button key={f.key} type="button" className={`chip${filter.key === f.key ? ' on' : ''}`} onClick={() => setFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {!q && (
        <div className="page-pad">
          {recent.length > 0 && (
            <section style={{ marginTop: 8, marginBottom: 24 }}>
              <div className="section-head">
                <h2 className="section-title" style={{ fontSize: 20 }}>
                  Zuletzt gesucht
                </h2>
                <button
                  type="button"
                  className="section-link"
                  onClick={() => {
                    localStorage.removeItem(RECENT_KEY)
                    setRecent([])
                  }}
                >
                  Löschen
                </button>
              </div>
              {recent.slice(0, mobile ? 6 : 8).map((r) => (
                <LibraryRow key={r.uri} item={r as MediaItem} subtitle={r.sub} />
              ))}
            </section>
          )}
          <h2 className="section-title" style={{ fontSize: 20, margin: '8px 0 16px' }}>
            Alle durchsuchen
          </h2>
          <div className="browse-grid">
            {BROWSE.map(([name, color]) => (
              <button key={name} type="button" className="browse-tile" style={{ background: color }} onClick={() => setInput(name)}>
                {name}
                <span className="deco">
                  <Music size={36} />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {q && filter.key === 'alle' && (
        <>
          {all.isLoading && (
            <div className="center">
              <div className="spinner" />
            </div>
          )}
          {data && !top && (
            <div className="empty">
              <h2>Keine Ergebnisse für „{q}“</h2>
              <p>Überprüfe die Schreibweise oder versuche es mit anderen Suchbegriffen.</p>
            </div>
          )}
          {top && (
            <div className="page-pad search-top" style={{ marginTop: 12 }}>
              <section>
                <h2 className="section-title" style={{ marginBottom: 12 }}>
                  Top-Ergebnis
                </h2>
                <TopResult item={top} />
              </section>
              {(data?.tracks?.items.length ?? 0) > 0 && (
                <section>
                  <h2 className="section-title" style={{ marginBottom: 12 }}>
                    Songs
                  </h2>
                  <div style={{ margin: mobile ? '0 -16px' : '0 -24px' }}>
                    <TrackList items={data!.tracks!.items.slice(0, 4).map((track) => ({ track }))} showAlbum={false} showHeader={false} />
                  </div>
                </section>
              )}
            </div>
          )}
          {(data?.artists?.items.length ?? 0) > 0 && (
            <Shelf title="Künstler">
              {data!.artists!.items.map((a) => (
                <div key={a.id} onClickCapture={() => rememberItem(a)}>
                  <MediaCard item={a} />
                </div>
              ))}
            </Shelf>
          )}
          {(data?.albums?.items.length ?? 0) > 0 && (
            <Shelf title="Alben">
              {data!.albums!.items.map((a) => (
                <div key={a.id} onClickCapture={() => rememberItem(a)}>
                  <MediaCard item={a} />
                </div>
              ))}
            </Shelf>
          )}
          {playlists.length > 0 && (
            <Shelf title="Playlists">
              {playlists.map((p) => (
                <div key={p.id} onClickCapture={() => rememberItem(p)}>
                  <MediaCard item={p} subtitle={`Von ${p.owner?.display_name ?? ''}`} />
                </div>
              ))}
            </Shelf>
          )}
        </>
      )}

      {q && filter.key !== 'alle' && (
        <div style={{ marginTop: 8 }}>
          {typed.isLoading && (
            <div className="center">
              <div className="spinner" />
            </div>
          )}
          {typed.data && typedItems.length === 0 && (
            <div className="empty">
              <h2>Keine Ergebnisse für „{q}“</h2>
            </div>
          )}
          {filter.key === 'songs' ? (
            <TrackList items={(typedItems as Track[]).map((track) => ({ track }))} showAdded={false} />
          ) : (
            <div className="page-pad">
              <div className="grid">
                {(typedItems as MediaItem[]).map((item) => (
                  <div key={item.uri} onClickCapture={() => rememberItem(item)}>
                    <MediaCard item={item} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {typed.hasNextPage && (
            <div className="load-more">
              <button type="button" className="outline-btn" onClick={() => typed.fetchNextPage()} disabled={typed.isFetchingNextPage}>
                Mehr laden
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
