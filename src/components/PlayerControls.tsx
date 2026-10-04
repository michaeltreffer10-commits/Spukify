// Gemeinsame Bausteine für Player-Leiste, Mini-Player und Vollbild-Player.

import { Car, Cast, Gamepad2, Laptop, MonitorSpeaker, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Smartphone, Speaker, Tv } from 'lucide-react'
import { useState } from 'react'
import { formatDuration } from '../lib/format'
import { usePlayer, useProgress } from '../state/player'
import { Slider } from './Slider'

export function DeviceIcon({ type, size = 20 }: { type?: string; size?: number }) {
  switch ((type ?? '').toLowerCase()) {
    case 'smartphone':
      return <Smartphone size={size} />
    case 'computer':
      return <Laptop size={size} />
    case 'speaker':
      return <Speaker size={size} />
    case 'tv':
      return <Tv size={size} />
    case 'castvideo':
    case 'castaudio':
      return <Cast size={size} />
    case 'automobile':
      return <Car size={size} />
    case 'gameconsole':
      return <Gamepad2 size={size} />
    default:
      return <MonitorSpeaker size={size} />
  }
}

export function PlayPauseIcon({ playing, size }: { playing: boolean; size: number }) {
  return playing ? (
    <Pause size={size} fill="currentColor" strokeWidth={0} />
  ) : (
    <Play size={size} fill="currentColor" strokeWidth={0} style={{ marginLeft: size / 10 }} />
  )
}

export function TransportControls({ big = false }: { big?: boolean }) {
  const player = usePlayer()
  const s = player.state
  const disabled = !s
  const iconSize = big ? 28 : 16
  const RepeatIcon = s?.repeat_state === 'track' ? Repeat1 : Repeat
  const repeatLabel = s?.repeat_state === 'off' ? 'Wiederholen aktivieren' : s?.repeat_state === 'context' ? 'Song wiederholen' : 'Wiederholen deaktivieren'
  return (
    <div className={big ? 'np-controls' : 'controls'}>
      <button
        type="button"
        className={`icon-btn${big ? ' big' : ''}${s?.shuffle_state ? ' on' : ''}`}
        onClick={player.toggleShuffle}
        disabled={disabled}
        aria-label={s?.shuffle_state ? 'Zufallswiedergabe aus' : 'Zufallswiedergabe an'}
        aria-pressed={!!s?.shuffle_state}
      >
        <Shuffle size={big ? 24 : 16} />
      </button>
      <button type="button" className={`icon-btn${big ? ' big' : ''}`} onClick={player.previous} disabled={disabled} aria-label="Zurück">
        <SkipBack size={big ? 32 : 18} fill="currentColor" />
      </button>
      <button type="button" className={big ? 'np-play' : 'controls-play'} onClick={player.togglePlay} aria-label={s?.is_playing ? 'Pause' : 'Abspielen'}>
        <PlayPauseIcon playing={!!s?.is_playing} size={big ? 30 : iconSize} />
      </button>
      <button type="button" className={`icon-btn${big ? ' big' : ''}`} onClick={player.next} disabled={disabled} aria-label="Weiter">
        <SkipForward size={big ? 32 : 18} fill="currentColor" />
      </button>
      <button
        type="button"
        className={`icon-btn${big ? ' big' : ''}${s && s.repeat_state !== 'off' ? ' on' : ''}`}
        onClick={player.cycleRepeat}
        disabled={disabled}
        aria-label={repeatLabel}
      >
        <RepeatIcon size={big ? 24 : 16} />
      </button>
    </div>
  )
}

export function ProgressBar({ variant }: { variant: 'bar' | 'big' }) {
  const player = usePlayer()
  const { progress, duration } = useProgress()
  const [preview, setPreview] = useState<number | null>(null)
  const shown = preview ?? progress
  const slider = (
    <Slider
      value={progress}
      max={duration}
      onCommit={(v) => player.seek(v)}
      onPreview={setPreview}
      label="Songposition"
      alwaysThumb={variant === 'big'}
      disabled={!player.state}
    />
  )
  if (variant === 'big') {
    return (
      <div className="np-progress">
        {slider}
        <div className="times">
          <span>{formatDuration(shown)}</span>
          <span>-{formatDuration(Math.max(0, duration - shown))}</span>
        </div>
      </div>
    )
  }
  return (
    <div className="progress-row">
      <span className="time">{formatDuration(shown)}</span>
      {slider}
      <span className="time">{formatDuration(duration)}</span>
    </div>
  )
}
