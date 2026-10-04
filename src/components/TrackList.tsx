import { Clock3, Ellipsis, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDate, formatDuration } from '../lib/format'
import { useIsMobile } from '../lib/hooks'
import type { Track } from '../lib/types'
import { usePlayer } from '../state/player'
import { useUi } from '../state/ui'
import { Cover } from './Cover'
import { LikeButton } from './LikeButton'

export interface TrackItem {
  track: Track
  addedAt?: string
}

interface Props {
  items: TrackItem[]
  /** Kontext (Playlist/Album), in dem abgespielt wird – damit läuft danach der Rest weiter. */
  contextUri?: string
  fallbackUris?: string[]
  showCover?: boolean
  showAlbum?: boolean
  showAdded?: boolean
  showHeader?: boolean
  /** Nummern aus dem Album (track_number) statt fortlaufend */
  albumNumbers?: boolean
  playlistId?: string
}

export function Equalizer({ paused }: { paused?: boolean }) {
  return (
    <span className={`eq${paused ? ' paused' : ''}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  )
}

export function ArtistLinks({ artists }: { artists: Track['artists'] }) {
  return (
    <span className="ellipsis">
      {artists.map((a, i) => (
        <span key={a.id || a.name}>
          {i > 0 && ', '}
          {a.id ? (
            <Link to={`/kuenstler/${a.id}`} onClick={(e) => e.stopPropagation()}>
              {a.name}
            </Link>
          ) : (
            a.name
          )}
        </span>
      ))}
    </span>
  )
}

export function TrackList({
  items,
  contextUri,
  fallbackUris,
  showCover = true,
  showAlbum = true,
  showAdded = false,
  showHeader = true,
  albumNumbers = false,
  playlistId,
}: Props) {
  const player = usePlayer()
  const { openTrackMenu } = useUi()
  const mobile = useIsMobile()
  const currentUri = player.state?.item?.uri
  const isPlaying = !!player.state?.is_playing

  const play = (track: Track) => {
    if (track.is_playable === false) return
    if (currentUri === track.uri && (!contextUri || player.state?.context?.uri === contextUri)) {
      player.togglePlay()
      return
    }
    if (contextUri) player.playContext(contextUri, { uri: track.uri }, { fallbackUris })
    else if (track.album?.uri) player.playContext(track.album.uri, { uri: track.uri })
    else player.playUris([track.uri])
  }

  const cls = ['tracklist', !showAlbum && 'no-album', showAlbum && !showAdded && 'no-added'].filter(Boolean).join(' ')

  return (
    <div className={cls} role="list">
      {showHeader && !mobile && (
        <div className="track-head">
          <span className="num">#</span>
          <span>Titel</span>
          {showAlbum && <span>Album</span>}
          {showAlbum && showAdded && <span className="added">Hinzugefügt am</span>}
          <span className="dur">
            <Clock3 size={16} />
          </span>
        </div>
      )}
      {items.map(({ track, addedAt }, index) => {
        const current = currentUri === track.uri
        const unplayable = track.is_playable === false
        return (
          <div
            key={`${track.uri}-${index}`}
            role="listitem"
            className={`track-row${current ? ' current' : ''}${unplayable ? ' unplayable' : ''}`}
            onClick={mobile ? () => play(track) : undefined}
            onDoubleClick={mobile ? undefined : () => play(track)}
          >
            <span className="num">
              {current ? <Equalizer paused={!isPlaying} /> : <span className="num-text">{albumNumbers ? track.track_number : index + 1}</span>}
              <button
                type="button"
                className="row-play"
                aria-label={`${track.name} abspielen`}
                onClick={(e) => {
                  e.stopPropagation()
                  play(track)
                }}
              >
                <Play size={14} fill="currentColor" strokeWidth={0} />
              </button>
            </span>
            <div className="track-main">
              {showCover && <Cover images={track.album?.images} size={64} />}
              <div className="track-text">
                <div className="track-title ellipsis">{track.name}</div>
                <div className="track-artists">
                  {track.explicit && <span className="explicit" title="Explicit">E</span>}
                  <ArtistLinks artists={track.artists} />
                </div>
              </div>
            </div>
            {showAlbum && (
              <span className="track-album ellipsis">
                {track.album ? (
                  <Link to={`/album/${track.album.id}`} onClick={(e) => e.stopPropagation()}>
                    {track.album.name}
                  </Link>
                ) : null}
              </span>
            )}
            {showAlbum && showAdded && <span className="added ellipsis">{formatDate(addedAt)}</span>}
            <div className="track-end">
              <LikeButton uri={track.uri.startsWith('spotify:local:') ? undefined : track.uri} size={16} />
              <span className="dur-text">{formatDuration(track.duration_ms)}</span>
              <button
                type="button"
                className="icon-btn more-btn"
                aria-label="Weitere Optionen"
                onClick={(e) => {
                  e.stopPropagation()
                  openTrackMenu({ track, playlistId })
                }}
              >
                <Ellipsis size={18} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
