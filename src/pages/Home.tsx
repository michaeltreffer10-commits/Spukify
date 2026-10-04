import { Maximize2, Settings, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Cover, pickImage } from '../components/Cover'
import { Avatar } from '../components/Layout'
import { linkTo, MediaCard, PlayButton, Shelf } from '../components/Media'
import { PlayPauseIcon } from '../components/PlayerControls'
import { artistNames, greeting } from '../lib/format'
import { useIsMobile } from '../lib/hooks'
import { useFollowedArtists, useMe, useMyPlaylists, useRecentlyPlayed, useSavedAlbums, useSavedTracks, useTopArtists, useTopTracks } from '../lib/queries'
import { isDemoMode } from '../lib/spotify'
import type { AlbumRef, MediaItem, Track } from '../lib/types'
import { DJ_URI, usePlayer } from '../state/player'
import { useUi } from '../state/ui'

function QuickTile({ item, liked }: { item?: MediaItem; liked?: { uri: string; fallbackUris?: string[] } }) {
  const navigate = useNavigate()
  const player = usePlayer()
  const uri = liked ? liked.uri : item!.uri
  const playing = player.state?.context?.uri === uri
  return (
    <button type="button" className={`quick-tile${playing ? ' playing' : ''}`} onClick={() => navigate(liked ? '/lieblingssongs' : linkTo(item!))}>
      <Cover images={item?.images} liked={!!liked} round={item?.type === 'artist'} size={64} />
      <span className="quick-tile-name">{liked ? 'Lieblingssongs' : item!.name}</span>
      <PlayButton contextUri={uri} size={15} className={playing ? 'visible' : ''} fallbackUris={liked?.fallbackUris} />
    </button>
  )
}

/** Große, leuchtende Karte mit dem aktuellen (oder zuletzt gehörten) Song. */
function Spotlight({ lastPlayed }: { lastPlayed?: Track }) {
  const player = usePlayer()
  const { setNowPlayingOpen } = useUi()
  const current = player.state?.item
  const track = current ?? lastPlayed
  if (!track) return null
  const isCurrent = !!current
  const bg = pickImage(track.album?.images, 300)

  return (
    <div className="spotlight">
      {bg && <div key={bg} className="spotlight-bg" style={{ backgroundImage: `url("${bg}")` }} />}
      <Cover images={track.album?.images} size={300} glow />
      <div className="spotlight-text">
        <div className="kicker">{isCurrent ? (player.state?.is_playing ? 'Jetzt läuft' : 'Pausiert') : 'Weiterhören'}</div>
        <div className="spotlight-title">{track.name}</div>
        <div className="muted ellipsis">{artistNames(track.artists)}</div>
        <div className="spotlight-actions">
          <button
            type="button"
            className="play-btn small"
            aria-label={isCurrent && player.state?.is_playing ? 'Pause' : 'Abspielen'}
            onClick={() => {
              if (isCurrent) player.togglePlay()
              else if (track.album) player.playContext(track.album.uri, { uri: track.uri })
              else player.playUris([track.uri])
            }}
          >
            <PlayPauseIcon playing={isCurrent && !!player.state?.is_playing} size={20} />
          </button>
          {isCurrent && (
            <button type="button" className="pill-btn secondary small" onClick={() => setNowPlayingOpen(true)}>
              <Maximize2 size={15} /> Kino-Modus
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function DjCard() {
  const player = usePlayer()
  const playing = player.state?.context?.uri === DJ_URI
  return (
    <div className="dj-card">
      <div>
        <div className="kicker" style={{ color: 'rgba(255,255,255,.8)' }}>
          <Sparkles size={12} style={{ verticalAlign: '-1px', marginRight: 6 }} />
          KI-DJ
        </div>
        <div className="dj-title" style={{ marginTop: 10 }}>
          Dein <em>DJ</em>
        </div>
        <p style={{ color: 'rgba(255,255,255,.75)', marginTop: 6, fontSize: 13.5 }}>Spotifys DJ mischt Songs, die zu dir passen.</p>
      </div>
      <div>
        <button type="button" className="pill-btn small" onClick={() => (playing ? player.togglePlay() : player.startDj())}>
          {playing && player.state?.is_playing ? 'Pausieren' : playing ? 'Weiter' : 'DJ starten'}
        </button>
      </div>
    </div>
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
  const firstName = me.data?.display_name?.split(' ')[0]
  const today = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="page">
      <div className="page-pad">
        <div className="home-head">
          {mobile && <Avatar />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="kicker">{today}</div>
            <h1 className="home-greeting">
              {greeting()}
              {firstName && (
                <>
                  , <em>{firstName}</em>
                </>
              )}
            </h1>
          </div>
          {isDemoMode() && <span className="demo-badge">Demo</span>}
          {mobile && (
            <Link to="/einstellungen" className="icon-btn glass" aria-label="Einstellungen">
              <Settings size={19} />
            </Link>
          )}
        </div>

        <div className="spotlight-row">
          <Spotlight lastPlayed={recent.data?.items[0]?.track} />
          <DjCard />
        </div>

        <div className="quick-grid">
          <QuickTile liked={{ uri: likedUri, fallbackUris: liked.data?.pages[0]?.items.map((i) => i.track.uri) }} />
          {quick.map((p) => (
            <QuickTile key={p.id} item={p} />
          ))}
          {loading && Array.from({ length: 5 }, (_, i) => <div key={i} className="skeleton" style={{ height: mobile ? 54 : 62 }} />)}
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
        <Shelf title="Gerade deine Lieblinge">
          {topTrackAlbums.map((t) => (
            <MediaCard key={t.id} item={t.album!} subtitle={`${t.name} · ${t.artists[0]?.name ?? ''}`} />
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
          <h2>Willkommen bei Spukify.</h2>
          <p>Deine Bibliothek ist noch leer. Suche nach Musik und speichere deine Lieblingssongs.</p>
          <Link to="/suche" className="pill-btn">
            Musik suchen
          </Link>
        </div>
      )}
    </div>
  )
}
