import { MonitorSpeaker } from 'lucide-react'
import { pickImage, Cover } from './Cover'
import { useDominantColor } from '../lib/hooks'
import { artistNames } from '../lib/format'
import { usePlayer, useProgress } from '../state/player'
import { useUi } from '../state/ui'
import { LikeButton } from './LikeButton'
import { DeviceIcon, PlayPauseIcon } from './PlayerControls'

/** Kleiner Player über der unteren Navigation (Handy). */
export function MiniPlayer() {
  const player = usePlayer()
  const { setNowPlayingOpen, openDevicePicker } = useUi()
  const s = player.state
  const track = s?.item
  const color = useDominantColor(pickImage(track?.album?.images, 64), track?.id)
  const { progress, duration } = useProgress()

  if (!player.ready) return null

  if (!track) {
    return (
      <div className="mini-player idle">
        <div className="mini-text">
          <div className="mini-title">Gerade läuft nichts</div>
          <div className="mini-sub">Wähle ein Gerät, um Musik zu hören</div>
        </div>
        <button type="button" className="pill-btn small white" onClick={() => openDevicePicker()}>
          <MonitorSpeaker size={16} /> Gerät
        </button>
      </div>
    )
  }

  return (
    <div
      className="mini-player"
      style={{ '--mini-color': color.solid } as React.CSSProperties}
      onClick={() => setNowPlayingOpen(true)}
      role="button"
      tabIndex={0}
      aria-label="Player öffnen"
    >
      <Cover images={track.album?.images} size={64} />
      <div className="mini-text">
        <div className="mini-title ellipsis">
          {track.name} <span style={{ fontWeight: 400, opacity: 0.75 }}>• {artistNames(track.artists)}</span>
        </div>
        <div className="mini-sub device ellipsis">
          <DeviceIcon type={s?.device.type} size={12} />
          {s?.device.name}
        </div>
      </div>
      <button
        type="button"
        className="icon-btn"
        style={{ color: 'var(--accent)' }}
        aria-label="Gerät wählen"
        onClick={(e) => {
          e.stopPropagation()
          openDevicePicker()
        }}
      >
        <DeviceIcon type={s?.device.type} size={20} />
      </button>
      <LikeButton uri={track.uri} size={20} />
      <button
        type="button"
        className="icon-btn"
        style={{ color: '#fff' }}
        aria-label={s?.is_playing ? 'Pause' : 'Abspielen'}
        onClick={(e) => {
          e.stopPropagation()
          player.togglePlay()
        }}
      >
        <PlayPauseIcon playing={!!s?.is_playing} size={22} />
      </button>
      <div className="mini-progress">
        <div style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
      </div>
    </div>
  )
}
