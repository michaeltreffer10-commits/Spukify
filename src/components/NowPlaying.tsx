import { ChevronDown, Ellipsis, ListMusic } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDominantColor } from '../lib/hooks'
import { usePlaylist } from '../lib/queries'
import { idFromUri } from '../lib/spotify'
import { usePlayer } from '../state/player'
import { useUi } from '../state/ui'
import { Cover, pickImage } from './Cover'
import { LikeButton } from './LikeButton'
import { DeviceIcon, ProgressBar, TransportControls } from './PlayerControls'
import { ArtistLinks } from './TrackList'

function useContextLabel() {
  const { state } = usePlayer()
  const ctx = state?.context
  const playlistId = ctx?.type === 'playlist' ? idFromUri(ctx.uri) : undefined
  const playlist = usePlaylist(playlistId)
  if (!ctx) return { kind: 'Wiedergabe', name: state?.item?.album?.name ?? '' }
  if (ctx.uri.endsWith(':collection')) return { kind: 'Playlist', name: 'Lieblingssongs' }
  switch (ctx.type) {
    case 'playlist':
      return { kind: 'Playlist', name: playlist.data?.name ?? '' }
    case 'album':
      return { kind: 'Album', name: state?.item?.album?.name ?? '' }
    case 'artist':
      return { kind: 'Künstler', name: state?.item?.artists[0]?.name ?? '' }
    default:
      return { kind: 'Wiedergabe', name: '' }
  }
}

/** Player im Vollbild – vor allem fürs Handy. Nach unten wischen schließt ihn. */
export function NowPlaying() {
  const { nowPlayingOpen, setNowPlayingOpen, openDevicePicker, openTrackMenu } = useUi()
  const player = usePlayer()
  const navigate = useNavigate()
  const track = player.state?.item
  const device = player.state?.device
  const color = useDominantColor(pickImage(track?.album?.images, 300), track?.id)
  const label = useContextLabel()
  const [dragY, setDragY] = useState(0)
  const start = useRef<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!nowPlayingOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setNowPlayingOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nowPlayingOpen, setNowPlayingOpen])

  if (!nowPlayingOpen) return null
  const close = () => setNowPlayingOpen(false)

  return (
    <div
      ref={ref}
      className="now-playing"
      role="dialog"
      aria-label="Aktueller Song"
      style={{ '--np-color': color.solid, transform: dragY ? `translateY(${dragY}px)` : undefined } as React.CSSProperties}
      onTouchStart={(e) => {
        if ((ref.current?.scrollTop ?? 0) > 0) return
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
      <div className="np-top">
        <button type="button" className="icon-btn" style={{ color: '#fff' }} onClick={close} aria-label="Schließen">
          <ChevronDown size={26} />
        </button>
        <div className="np-context">
          <small>{label.kind === 'Wiedergabe' ? 'Wird abgespielt' : `Wiedergabe aus ${label.kind}`}</small>
          <strong className="ellipsis" style={{ display: 'block' }}>
            {label.name}
          </strong>
        </div>
        <button
          type="button"
          className="icon-btn"
          style={{ color: '#fff' }}
          aria-label="Weitere Optionen"
          disabled={!track}
          onClick={() => track && openTrackMenu({ track })}
        >
          <Ellipsis size={22} />
        </button>
      </div>

      <div className="np-body">
        <div className="np-cover">
          <Cover images={track?.album?.images} size={640} />
        </div>

        <div className="np-info">
          <div className="np-text">
            <div className="np-title ellipsis">{track?.name ?? 'Gerade läuft nichts'}</div>
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
            <DeviceIcon type={device?.type} size={18} />
            <span className="ellipsis">{device ? device.name : 'Gerät auswählen'}</span>
          </button>
          <button
            type="button"
            className="icon-btn"
            style={{ color: '#fff' }}
            aria-label="Warteschlange"
            onClick={() => {
              close()
              navigate('/warteschlange')
            }}
          >
            <ListMusic size={22} />
          </button>
        </div>
      </div>
    </div>
  )
}
