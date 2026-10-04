import { Link, useParams } from 'react-router-dom'
import { Cover, pickImage } from '../components/Cover'
import { TopBar } from '../components/Layout'
import { LikeButton } from '../components/LikeButton'
import { MediaCard, PlayButton, Shelf } from '../components/Media'
import { TrackList } from '../components/TrackList'
import { formatLongDuration, plural, year } from '../lib/format'
import { useDominantColor } from '../lib/hooks'
import { useAlbum, useArtist, useArtistAlbums } from '../lib/queries'
import { PageError, PageLoading } from './Playlist'

export function AlbumPage() {
  const { id } = useParams()
  const album = useAlbum(id)
  const a = album.data
  const mainArtist = useArtist(a?.artists[0]?.id)
  const more = useArtistAlbums(mainArtist.data)
  const color = useDominantColor(pickImage(a?.images, 300), id)

  if (album.isLoading) return <PageLoading />
  if (album.isError || !a) return <PageError text="Dieses Album konnte nicht geladen werden." />

  // Album-Songs haben kein eigenes „album“-Feld → für Menü/Links ergänzen
  const tracks = (a.tracks?.items ?? []).map((t) => ({
    track: { ...t, album: t.album ?? { id: a.id, name: a.name, uri: a.uri, images: a.images, artists: a.artists, type: 'album' as const } },
  }))
  const duration = tracks.reduce((s, t) => s + t.track.duration_ms, 0)
  const kind = a.album_type === 'single' ? 'Single' : a.album_type === 'compilation' ? 'Compilation' : 'Album'
  const artistImg = mainArtist.data?.images
  const otherAlbums = (more.data ?? []).filter((x) => x.id !== a.id)

  return (
    <div className="page">
      <TopBar title={a.name} color={color.solid}>
        <PlayButton contextUri={a.uri} className="small" size={20} />
      </TopBar>
      <header className="hero" style={{ '--hero-color': color.solid } as React.CSSProperties}>
        <Cover images={a.images} alt={a.name} size={300} />
        <div className="hero-text">
          <span className="hero-type">{kind}</span>
          <h1 className="hero-title">{a.name}</h1>
          <div className="hero-meta">
            {artistImg?.length ? <img className="avatar-mini" src={pickImage(artistImg, 64)} alt="" /> : null}
            {a.artists.map((ar, i) => (
              <span key={ar.id}>
                {i > 0 && ', '}
                <Link to={`/kuenstler/${ar.id}`} className="link-hover">
                  <strong>{ar.name}</strong>
                </Link>
              </span>
            ))}
            {a.release_date && <span className="dot">{year(a.release_date)}</span>}
            <span className="dot">{plural(tracks.length, 'Song', 'Songs')}</span>
            {duration > 0 && <span className="dot muted">{formatLongDuration(duration)}</span>}
          </div>
        </div>
      </header>

      <div className="action-bar" style={{ '--hero-color-dim': color.dim } as React.CSSProperties}>
        <PlayButton contextUri={a.uri} />
        <LikeButton uri={a.uri} size={28} kind="album" className="big" />
      </div>

      <TrackList items={tracks} contextUri={a.uri} showCover={false} showAlbum={false} albumNumbers />

      {a.release_date && (
        <p className="page-pad muted" style={{ marginTop: 24, fontSize: 13 }}>
          {new Date(a.release_date).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      )}

      {mainArtist.data && otherAlbums.length > 0 && (
        <Shelf title={`Mehr von ${mainArtist.data.name}`} to={`/kuenstler/${mainArtist.data.id}`}>
          {otherAlbums.map((x) => (
            <MediaCard key={x.id} item={x} />
          ))}
        </Shelf>
      )}
    </div>
  )
}
