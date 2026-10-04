import { MonitorSpeaker } from 'lucide-react'
import { artistNames } from '../lib/format'
import { usePlayer, useProgress } from '../state/player'
import { useUi } from '../state/ui'
import { Cover } from './Cover'
import { LikeButton } from './LikeButton'
import { DeviceIcon, PlayPauseIcon } from './PlayerControls'

/** Schwebender Mini-Player über der Tab-Leiste (Handy). */
export function MiniPlayer() {
  const player = usePlayer()
  const { setNowPlayingOpen, openDevicePicker } = useUi()
  const s = player.state
  const track = s?.item
  const { progress, duration } = useProgress()

  if (!player.ready) return null

  if (!track) {
    return (
      <div className="mini-player idle">
        <div className="mini-text">
          <div className="mini-title">Gerade läuft nichts</div>
          <div className="mini-sub">Wähle ein Gerät, um Musik zu hören</div>
        </div>
        <button type="button" className="pill-btn small" onClick={() => openDevicePicker()}>
          <MonitorSpeaker size={16} /> Gerät
        </button>
      </div>
    )
  }

  return (
    <div className="mini-player" onClick={() => setNowPlayingOpen(true)} role="button" tabIndex={0} aria-label="Kino-Modus öffnen">
      <Cover images={track.album?.images} size={64} glow />
      <div className="mini-text">
        <div className="mini-title ellipsis">{track.name}</div>
        <div className="mini-sub ellipsis">{artistNames(track.artists)}</div>
      </div>
      <button
        type="button"
        className="icon-btn"
        style={{ color: 'var(--accent)' }}
        aria-label={`Gerät: ${s?.device.name ?? ''}`}
        onClick={(e) => {
          e.stopPropagation()
          openDevicePicker()
        }}
      >
        <DeviceIcon type={s?.device.type} size={19} />
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
