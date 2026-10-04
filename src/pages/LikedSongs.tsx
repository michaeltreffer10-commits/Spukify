import { Shuffle } from 'lucide-react'
import { TopBar } from '../components/Layout'
import { Cover } from '../components/Cover'
import { PlayButton } from '../components/Media'
import { TrackList } from '../components/TrackList'
import { plural } from '../lib/format'
import { useMe, useSavedTracks } from '../lib/queries'
import { usePageAmbient } from '../state/ambient'
import { usePlayer } from '../state/player'
import { PageLoading } from './Playlist'

const LIKED_AMBIENT =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#7c3aed'/><stop offset='.6' stop-color='#db2777'/><stop offset='1' stop-color='#f59e0b'/></linearGradient></defs><rect width='10' height='10' fill='url(#g)'/></svg>",
  )

export function LikedSongs() {
  const me = useMe()
  const saved = useSavedTracks()
  const player = usePlayer()
  usePageAmbient(LIKED_AMBIENT)

  if (saved.isLoading) return <PageLoading />

  const items = (saved.data?.pages ?? []).flatMap((p) => p.items).map((i) => ({ track: i.track, addedAt: i.added_at }))
  const total = saved.data?.pages[0]?.total ?? 0
  const contextUri = me.data ? `spotify:user:${me.data.id}:collection` : ''
  const fallbackUris = items.map((i) => i.track.uri)

  return (
    <div className="page">
      <TopBar title="Lieblingssongs">
        {contextUri && <PlayButton contextUri={contextUri} fallbackUris={fallbackUris} className="small" size={20} />}
      </TopBar>
      <header className="hero">
        <Cover liked glow />
        <div className="hero-text">
          <span className="kicker">Playlist</span>
          <h1 className="hero-title">Lieblingssongs</h1>
          <div className="hero-meta">
            <strong>{me.data?.display_name}</strong>
            <span className="dot">{plural(total, 'Song', 'Songs')}</span>
          </div>
        </div>
      </header>

      <div className="action-bar">
        {contextUri && <PlayButton contextUri={contextUri} fallbackUris={fallbackUris} />}
        <button
          type="button"
          className={`icon-btn big glass${player.state?.shuffle_state ? ' on' : ''}`}
          aria-label="Zufällig abspielen"
          title="Zufällig abspielen"
          onClick={() => contextUri && player.playContext(contextUri, undefined, { shuffle: true, fallbackUris })}
        >
          <Shuffle size={22} />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <h2>Songs, die du liebst, landen hier.</h2>
          <p>Tippe auf das Herz, um Songs zu speichern.</p>
        </div>
      ) : (
        <TrackList items={items} contextUri={contextUri || undefined} fallbackUris={fallbackUris} showAdded />
      )}

      {saved.hasNextPage && (
        <div className="load-more">
          <button type="button" className="outline-btn" onClick={() => saved.fetchNextPage()} disabled={saved.isFetchingNextPage}>
            Weitere Songs laden
          </button>
        </div>
      )}
    </div>
  )
}
