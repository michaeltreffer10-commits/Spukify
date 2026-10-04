import { ListMusic, Maximize2, Volume1, Volume2, VolumeX } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { usePlayer } from '../state/player'
import { useUi } from '../state/ui'
import { Cover } from './Cover'
import { LikeButton } from './LikeButton'
import { DeviceIcon, ProgressBar, TransportControls } from './PlayerControls'
import { Slider } from './Slider'
import { ArtistLinks } from './TrackList'

/** Player-Leiste unten am PC – wie bei Spotify. */
export function PlayerBar() {
  const player = usePlayer()
  const { openDevicePicker, setNowPlayingOpen } = useUi()
  const navigate = useNavigate()
  const location = useLocation()
  const s = player.state
  const track = s?.item
  const device = s?.device
  const [lastVolume, setLastVolume] = useState(50)
  const volume = device?.volume_percent ?? 0
  const canVolume = !!device && device.supports_volume !== false
  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2
  const onQueue = location.pathname === '/warteschlange'

  return (
    <footer className="playerbar">
      <div className="pb-left">
        {track ? (
          <>
            <button type="button" onClick={() => setNowPlayingOpen(true)} aria-label="Player im Vollbild öffnen">
              <Cover images={track.album?.images} size={64} />
            </button>
            <div className="pb-text">
              <div className="pb-title ellipsis">
                {track.album ? <Link to={`/album/${track.album.id}`} className="link-hover">{track.name}</Link> : track.name}
              </div>
              <div className="pb-artist">
                <ArtistLinks artists={track.artists} />
              </div>
            </div>
            <LikeButton uri={track.uri} size={16} />
          </>
        ) : (
          <div className="pb-text muted" style={{ paddingLeft: 8 }}>
            {player.ready ? 'Gerade läuft nichts' : ''}
          </div>
        )}
      </div>

      <div className="pb-center">
        <TransportControls />
        <ProgressBar variant="bar" />
      </div>

      <div className="pb-right">
        <button
          type="button"
          className={`icon-btn${onQueue ? ' on' : ''}`}
          aria-label="Warteschlange"
          onClick={() => (onQueue ? navigate(-1) : navigate('/warteschlange'))}
        >
          <ListMusic size={18} />
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label="Mit einem Gerät verbinden"
          onClick={() => openDevicePicker()}
          style={device ? { color: 'var(--accent)' } : undefined}
          title={device ? `Läuft auf: ${device.name}` : 'Gerät auswählen'}
        >
          <DeviceIcon type={device?.type} size={18} />
        </button>
        <div className="pb-volume" title={canVolume ? undefined : 'Lautstärke wird auf dem Gerät eingestellt'}>
          <button
            type="button"
            className="icon-btn"
            aria-label={volume === 0 ? 'Ton an' : 'Stummschalten'}
            disabled={!canVolume}
            onClick={() => {
              if (volume > 0) {
                setLastVolume(volume)
                player.setVolume(0)
              } else player.setVolume(lastVolume || 50)
            }}
          >
            <VolumeIcon size={18} />
          </button>
          <Slider value={volume} max={100} onCommit={(v) => player.setVolume(v)} label="Lautstärke" disabled={!canVolume} />
        </div>
        <button type="button" className="icon-btn" aria-label="Vollbild" onClick={() => setNowPlayingOpen(true)} disabled={!track}>
          <Maximize2 size={16} />
        </button>
      </div>

      {device && (
        <div className="device-banner" role="status">
          <DeviceIcon type={device.type} size={14} />
          Wiedergabe auf {device.name}
        </div>
      )}
    </footer>
  )
}
