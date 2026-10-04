import { Shuffle } from 'lucide-react'
import { TopBar } from '../components/Layout'
import { Cover } from '../components/Cover'
import { PlayButton } from '../components/Media'
import { TrackList } from '../components/TrackList'
import { plural } from '../lib/format'
import { useMe, useSavedTracks } from '../lib/queries'
import { usePlayer } from '../state/player'
import { PageLoading } from './Playlist'

const LIKED_COLOR = 'hsl(250 60% 38%)'

export function LikedSongs() {
  const me = useMe()
  const saved = useSavedTracks()
  const player = usePlayer()

  if (saved.isLoading) return <PageLoading />

  const items = (saved.data?.pages ?? []).flatMap((p) => p.items).map((i) => ({ track: i.track, addedAt: i.added_at }))
  const total = saved.data?.pages[0]?.total ?? 0
  const contextUri = me.data ? `spotify:user:${me.data.id}:collection` : ''
  const fallbackUris = items.map((i) => i.track.uri)

  return (
    <div className="page">
      <TopBar title="Lieblingssongs" color={LIKED_COLOR}>
        {contextUri && <PlayButton contextUri={contextUri} fallbackUris={fallbackUris} className="small" size={20} />}
      </TopBar>
      <header className="hero" style={{ '--hero-color': LIKED_COLOR } as React.CSSProperties}>
        <Cover liked />
        <div className="hero-text">
          <span className="hero-type">Playlist</span>
          <h1 className="hero-title">Lieblingssongs</h1>
          <div className="hero-meta">
            <strong>{me.data?.display_name}</strong>
            <span className="dot">{plural(total, 'Song', 'Songs')}</span>
          </div>
        </div>
      </header>

      <div className="action-bar" style={{ '--hero-color-dim': 'hsl(250 60% 38% / 0.35)' } as React.CSSProperties}>
        {contextUri && <PlayButton contextUri={contextUri} fallbackUris={fallbackUris} />}
        <button
          type="button"
          className={`icon-btn big${player.state?.shuffle_state ? ' on' : ''}`}
          aria-label="Zufallswiedergabe"
          onClick={() => contextUri && player.playContext(contextUri, undefined, { shuffle: true, fallbackUris })}
        >
          <Shuffle size={26} />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <h2>Songs, die dir gefallen, erscheinen hier</h2>
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
