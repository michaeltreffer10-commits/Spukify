import { Link, useParams } from 'react-router-dom'
import { Cover, pickImage } from '../components/Cover'
import { TopBar } from '../components/Layout'
import { LikeButton } from '../components/LikeButton'
import { MediaCard, PlayButton, Shelf } from '../components/Media'
import { TrackList } from '../components/TrackList'
import { formatLongDuration, plural, year } from '../lib/format'
import { useAlbum, useArtist, useArtistAlbums } from '../lib/queries'
import { usePageAmbient } from '../state/ambient'
import { PageError, PageLoading } from './Playlist'

export function AlbumPage() {
  const { id } = useParams()
  const album = useAlbum(id)
  const a = album.data
  const mainArtist = useArtist(a?.artists[0]?.id)
  const more = useArtistAlbums(mainArtist.data)
  usePageAmbient(pickImage(a?.images, 64))

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
      <TopBar title={a.name}>
        <PlayButton contextUri={a.uri} className="small" size={20} />
      </TopBar>
      <header className="hero">
        <Cover images={a.images} alt={a.name} size={300} glow />
        <div className="hero-text">
          <span className="kicker">
            {kind}
            {a.release_date ? ` · ${year(a.release_date)}` : ''}
          </span>
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
            <span className="dot">{plural(tracks.length, 'Song', 'Songs')}</span>
            {duration > 0 && <span className="dot">{formatLongDuration(duration)}</span>}
          </div>
        </div>
      </header>

      <div className="action-bar">
        <PlayButton contextUri={a.uri} />
        <LikeButton uri={a.uri} size={22} kind="album" className="big glass" />
      </div>

      <TrackList items={tracks} contextUri={a.uri} showCover={false} showAlbum={false} albumNumbers />

      {a.release_date && (
        <p className="page-pad kicker" style={{ marginTop: 28 }}>
          Erschienen am {new Date(a.release_date).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
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
