import { TopBar } from '../components/Layout'
import { TrackList } from '../components/TrackList'
import { useQueue } from '../lib/queries'
import { usePlayer } from '../state/player'

export function QueuePage() {
  const player = usePlayer()
  const queue = useQueue(!!player.state)
  const current = queue.data?.currently_playing ?? player.state?.item
  const upcoming = (queue.data?.queue ?? []).filter(Boolean)

  return (
    <div className="page">
      <TopBar title="Warteschlange" />
      <div className="page-pad">
        <h1 className="page-title">Warteschlange</h1>
      </div>
      {!player.state && (
        <div className="empty">
          <h2>Gerade läuft nichts</h2>
          <p>Starte einen Song, dann siehst du hier, was als Nächstes kommt.</p>
        </div>
      )}
      {current && (
        <section style={{ marginBottom: 24 }}>
          <h2 className="page-pad muted" style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
            Aktuell läuft
          </h2>
          <TrackList items={[{ track: current }]} showHeader={false} showAlbum />
        </section>
      )}
      {upcoming.length > 0 && (
        <section>
          <h2 className="page-pad muted" style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
            Als Nächstes
          </h2>
          <TrackList items={upcoming.map((track) => ({ track }))} showHeader={false} />
        </section>
      )}
    </div>
  )
}
