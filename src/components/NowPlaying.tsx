import { ChevronDown, Ellipsis, ListMusic } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { artistNames } from '../lib/format'
import { usePlaylist, useQueue } from '../lib/queries'
import { idFromUri } from '../lib/spotify'
import { DJ_URI, usePlayer } from '../state/player'
import { useUi } from '../state/ui'
import { Cover, pickImage } from './Cover'
import { LikeButton } from './LikeButton'
import { DeviceIcon, ProgressBar, TransportControls } from './PlayerControls'
import { ArtistLinks } from './TrackList'

function useContextLabel() {
  const { state } = usePlayer()
  const ctx = state?.context
  const isDj = ctx?.uri === DJ_URI
  const playlistId = ctx?.type === 'playlist' && !isDj ? idFromUri(ctx.uri) : undefined
  const playlist = usePlaylist(playlistId)
  if (!ctx) return { kind: '', name: state?.item?.album?.name ?? '' }
  if (isDj) return { kind: '', name: 'DJ' }
  if (ctx.uri.endsWith(':collection')) return { kind: 'Playlist', name: 'Lieblingssongs' }
  switch (ctx.type) {
    case 'playlist':
      return { kind: 'Playlist', name: playlist.data?.name ?? '' }
    case 'album':
      return { kind: 'Album', name: state?.item?.album?.name ?? '' }
    case 'artist':
      return { kind: 'Künstler', name: state?.item?.artists[0]?.name ?? '' }
    default:
      return { kind: '', name: '' }
  }
}

/** Kino-Modus: Vollbild-Player mit leuchtendem Cover. Nach unten wischen schließt ihn. */
export function NowPlaying() {
  const { nowPlayingOpen, setNowPlayingOpen, openDevicePicker, openTrackMenu } = useUi()
  const player = usePlayer()
  const navigate = useNavigate()
  const track = player.state?.item
  const device = player.state?.device
  const label = useContextLabel()
  const queue = useQueue(nowPlayingOpen && !!player.state)
  const [dragY, setDragY] = useState(0)
  const start = useRef<number | null>(null)

  useEffect(() => {
    if (!nowPlayingOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setNowPlayingOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nowPlayingOpen, setNowPlayingOpen])

  if (!nowPlayingOpen) return null
  const close = () => setNowPlayingOpen(false)
  const bg = pickImage(track?.album?.images, 300)
  const upcoming = (queue.data?.queue ?? []).filter(Boolean).slice(0, 4)

  return (
    <div
      className="now-playing"
      role="dialog"
      aria-label="Kino-Modus"
      style={{ transform: dragY ? `translateY(${dragY}px)` : undefined, transition: dragY ? 'none' : 'transform .3s' }}
      onTouchStart={(e) => {
        if ((e.target as HTMLElement).closest('.slider')) return
        start.current = e.touches[0].clientY
      }}
      onTouchMove={(e) => {
        if (start.current === null) return
        setDragY(Math.max(0, e.touches[0].clientY - start.current))
      }}
      onTouchEnd={() => {
        if (dragY > 120) close()
        start.current = null
        setDragY(0)
      }}
    >
      {bg && <div key={bg} className="np-bg" style={{ backgroundImage: `url("${bg}")` }} />}

      <div className="np-top">
        <button type="button" className="icon-btn glass" onClick={close} aria-label="Schließen">
          <ChevronDown size={22} />
        </button>
        <div className="np-context">
          <div className="kicker">{label.kind ? `Aus ${label.kind}` : 'Jetzt läuft'}</div>
          <strong className="ellipsis">{label.name}</strong>
        </div>
        <button
          type="button"
          className="icon-btn glass"
          aria-label="Weitere Optionen"
          disabled={!track}
          onClick={() => track && openTrackMenu({ track })}
        >
          <Ellipsis size={20} />
        </button>
      </div>

      <div className="np-stage">
        <div className="np-cover">
          <Cover images={track?.album?.images} size={640} glow />
        </div>

        <div className="np-side">
          <div className="np-info">
            <div className="np-text">
              <div className="np-title">{track?.name ?? 'Gerade läuft nichts'}</div>
              <div className="np-artist ellipsis" onClick={close}>
                {track && <ArtistLinks artists={track.artists} />}
              </div>
            </div>
            <LikeButton uri={track?.uri} size={26} />
          </div>

          <ProgressBar variant="big" />
          <TransportControls big />

          <div className="np-bottom">
            <button type="button" className="np-device" onClick={() => openDevicePicker()}>
              <DeviceIcon type={device?.type} size={16} />
              <span className="ellipsis">{device ? device.name : 'Gerät auswählen'}</span>
            </button>
            <button
              type="button"
              className="icon-btn glass"
              aria-label="Warteschlange"
              onClick={() => {
                close()
                navigate('/warteschlange')
              }}
            >
              <ListMusic size={19} />
            </button>
          </div>

          {upcoming.length > 0 && (
            <div className="np-queue">
              <div className="kicker" style={{ marginBottom: 8 }}>
                Als Nächstes
              </div>
              {upcoming.map((t, i) => (
                <div key={`${t.uri}-${i}`} className="np-queue-row">
                  <Cover images={t.album?.images} size={64} />
                  <div style={{ minWidth: 0 }}>
                    <div className="ellipsis" style={{ color: 'var(--text)', fontWeight: 600 }}>
                      {t.name}
                    </div>
                    <div className="ellipsis">{artistNames(t.artists)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
