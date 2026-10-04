import { Settings } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar } from '../components/Layout'
import { linkTo, MediaCard, PlayButton, Shelf } from '../components/Media'
import { Cover } from '../components/Cover'
import { greeting } from '../lib/format'
import { useIsMobile } from '../lib/hooks'
import { useFollowedArtists, useMe, useMyPlaylists, useRecentlyPlayed, useSavedAlbums, useSavedTracks, useTopArtists, useTopTracks } from '../lib/queries'
import { isDemoMode } from '../lib/spotify'
import type { AlbumRef, MediaItem } from '../lib/types'
import { usePlayer } from '../state/player'

function QuickTile({ item, liked }: { item?: MediaItem; liked?: { uri: string; fallbackUris?: string[] } }) {
  const navigate = useNavigate()
  const player = usePlayer()
  const uri = liked ? liked.uri : item!.uri
  const playing = player.state?.context?.uri === uri
  return (
    <button
      type="button"
      className={`quick-tile${playing ? ' playing' : ''}`}
      onClick={() => navigate(liked ? '/lieblingssongs' : linkTo(item!))}
    >
      <Cover images={item?.images} liked={!!liked} round={item?.type === 'artist'} size={64} />
      <span className="quick-tile-name">{liked ? 'Lieblingssongs' : item!.name}</span>
      <PlayButton contextUri={uri} size={16} className={playing ? 'visible' : ''} fallbackUris={liked?.fallbackUris} />
    </button>
  )
}

export function Home() {
  const mobile = useIsMobile()
  const me = useMe()
  const playlists = useMyPlaylists()
  const recent = useRecentlyPlayed()
  const topArtists = useTopArtists()
  const topTracks = useTopTracks()
  const albums = useSavedAlbums()
  const artists = useFollowedArtists()
  const liked = useSavedTracks()

  // Zuletzt gehörte Alben (ohne Doppelte)
  const recentAlbums = useMemo(() => {
    const seen = new Set<string>()
    const out: AlbumRef[] = []
    for (const h of recent.data?.items ?? []) {
      const a = h.track.album
      if (a && !seen.has(a.id)) {
        seen.add(a.id)
        out.push(a)
      }
    }
    return out.slice(0, 20)
  }, [recent.data])

  const topTrackAlbums = useMemo(() => {
    const seen = new Set<string>()
    return (topTracks.data?.items ?? []).filter((t) => t.album && !seen.has(t.album.id) && seen.add(t.album.id))
  }, [topTracks.data])

  const quick = (playlists.data ?? []).slice(0, 7)
  const likedUri = me.data ? `spotify:user:${me.data.id}:collection` : 'liked'
  const loading = playlists.isLoading && recent.isLoading

  return (
    <div className="page" style={{ background: 'linear-gradient(#1f3a2a 0, #121212 320px)' }}>
      <div className="page-pad" style={{ paddingTop: mobile ? 'calc(16px + var(--safe-top))' : 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          {mobile && <Avatar />}
          <h1 style={{ fontSize: mobile ? 24 : 32, fontWeight: 800, letterSpacing: '-0.02em', flex: 1 }}>{greeting()}</h1>
          {isDemoMode() && <span className="demo-badge">Demo</span>}
          {mobile && (
            <Link to="/einstellungen" className="icon-btn" aria-label="Einstellungen" style={{ color: '#fff' }}>
              <Settings size={22} />
            </Link>
          )}
        </div>

        <div className="quick-grid">
          <QuickTile liked={{ uri: likedUri, fallbackUris: liked.data?.pages[0]?.items.map((i) => i.track.uri) }} />
          {quick.map((p) => (
            <QuickTile key={p.id} item={p} />
          ))}
          {loading &&
            Array.from({ length: 5 }, (_, i) => <div key={i} className="skeleton" style={{ height: mobile ? 48 : 56 }} />)}
        </div>
      </div>

      {recentAlbums.length > 0 && (
        <Shelf title="Zuletzt gehört">
          {recentAlbums.map((a) => (
            <MediaCard key={a.id} item={a} />
          ))}
        </Shelf>
      )}

      {(topArtists.data?.items.length ?? 0) > 0 && (
        <Shelf title="Deine Top-Künstler">
          {topArtists.data!.items.map((a) => (
            <MediaCard key={a.id} item={a} />
          ))}
        </Shelf>
      )}

      {(playlists.data?.length ?? 0) > 0 && (
        <Shelf title="Deine Playlists" to="/bibliothek?filter=playlists">
          {playlists.data!.map((p) => (
            <MediaCard key={p.id} item={p} subtitle={`Von ${p.owner?.display_name ?? ''}`} />
          ))}
        </Shelf>
      )}

      {topTrackAlbums.length > 0 && (
        <Shelf title="Deine Lieblinge gerade">
          {topTrackAlbums.map((t) => (
            <MediaCard key={t.id} item={t.album!} subtitle={`${t.name} • ${t.artists[0]?.name ?? ''}`} />
          ))}
        </Shelf>
      )}

      {(albums.data?.length ?? 0) > 0 && (
        <Shelf title="Deine Alben" to="/bibliothek?filter=albums">
          {albums.data!.map(({ album }) => (
            <MediaCard key={album.id} item={album} />
          ))}
        </Shelf>
      )}

      {(artists.data?.length ?? 0) > 0 && (
        <Shelf title="Künstler, denen du folgst" to="/bibliothek?filter=artists">
          {artists.data!.map((a) => (
            <MediaCard key={a.id} item={a} />
          ))}
        </Shelf>
      )}

      {!loading && !playlists.data?.length && !recentAlbums.length && !liked.data?.pages[0]?.total && (
        <div className="empty">
          <h2>Willkommen bei Spukify!</h2>
          <p>Deine Bibliothek ist noch leer. Suche nach Musik und speichere deine Lieblingssongs.</p>
          <Link to="/suche" className="pill-btn white">
            Musik suchen
          </Link>
        </div>
      )}
    </div>
  )
}
