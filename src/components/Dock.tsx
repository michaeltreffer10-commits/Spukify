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

/** Schwebendes Player-Dock am PC. */
export function Dock() {
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
    <footer className="dock">
      <div className="dock-left">
        {track ? (
          <>
            <button type="button" onClick={() => setNowPlayingOpen(true)} aria-label="Kino-Modus öffnen">
              <Cover images={track.album?.images} size={64} glow />
            </button>
            <div className="dock-text">
              <div className="dock-title ellipsis">
                {track.album ? (
                  <Link to={`/album/${track.album.id}`} className="link-hover">
                    {track.name}
                  </Link>
                ) : (
                  track.name
                )}
              </div>
              <div className="dock-artist">
                <ArtistLinks artists={track.artists} />
              </div>
              {device && (
                <button type="button" className="device-chip" onClick={() => openDevicePicker()}>
                  <DeviceIcon type={device.type} size={12} />
                  <span className="ellipsis">{device.name}</span>
                </button>
              )}
            </div>
            <LikeButton uri={track.uri} size={17} />
          </>
        ) : (
          <div className="dock-text muted" style={{ paddingLeft: 8 }}>
            {player.ready && (
              <>
                <div className="dock-title" style={{ color: 'var(--text)' }}>
                  Gerade läuft nichts
                </div>
                <button type="button" className="device-chip" onClick={() => openDevicePicker()}>
                  Gerät wählen
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="dock-center">
        <TransportControls />
        <ProgressBar variant="bar" />
      </div>

      <div className="dock-right">
        <button
          type="button"
          className={`icon-btn${onQueue ? ' on' : ''}`}
          aria-label="Warteschlange"
          title="Warteschlange"
          onClick={() => (onQueue ? navigate(-1) : navigate('/warteschlange'))}
        >
          <ListMusic size={18} />
        </button>
        <button
          type="button"
          className={`icon-btn${device ? ' on' : ''}`}
          aria-label="Mit einem Gerät verbinden"
          onClick={() => openDevicePicker()}
          title={device ? `Läuft auf: ${device.name}` : 'Gerät auswählen'}
        >
          <DeviceIcon type={device?.type} size={18} />
        </button>
        <div className="dock-volume" title={canVolume ? undefined : 'Die Lautstärke stellst du direkt am Gerät ein'}>
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
        <button type="button" className="icon-btn" aria-label="Kino-Modus" title="Kino-Modus" onClick={() => setNowPlayingOpen(true)} disabled={!track}>
          <Maximize2 size={16} />
        </button>
      </div>
    </footer>
  )
}
