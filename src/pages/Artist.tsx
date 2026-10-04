import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { pickImage } from '../components/Cover'
import { TopBar } from '../components/Layout'
import { useToggleSaved } from '../components/LikeButton'
import { MediaCard, PlayButton } from '../components/Media'
import { TrackList } from '../components/TrackList'
import { year } from '../lib/format'
import { useDominantColor } from '../lib/hooks'
import { useArtist, useArtistAlbums, useArtistPopular } from '../lib/queries'
import { useSaved } from '../lib/savedStore'
import { PageError, PageLoading } from './Playlist'

const TABS = [
  { key: 'all', label: 'Alle' },
  { key: 'album', label: 'Alben' },
  { key: 'single', label: 'Singles und EPs' },
]

export function ArtistPage() {
  const { id } = useParams()
  const artist = useArtist(id)
  const a = artist.data
  const popular = useArtistPopular(a)
  const albums = useArtistAlbums(a)
  const following = useSaved(a?.uri)
  const toggle = useToggleSaved('artist')
  const [showAll, setShowAll] = useState(false)
  const [tab, setTab] = useState('all')
  const image = pickImage(a?.images, 640)
  const color = useDominantColor(pickImage(a?.images, 160), id)

  if (artist.isLoading) return <PageLoading />
  if (artist.isError || !a) return <PageError text="Dieser Künstler konnte nicht geladen werden." />

  const tracks = (popular.data ?? []).slice(0, showAll ? 10 : 5).map((track) => ({ track }))
  const discography = (albums.data ?? []).filter((x) => tab === 'all' || (tab === 'single' ? x.album_type !== 'album' : x.album_type === 'album'))

  return (
    <div className="page">
      <TopBar title={a.name} color={color.solid}>
        <PlayButton contextUri={a.uri} className="small" size={20} />
      </TopBar>
      <header
        className="artist-hero"
        style={{ backgroundImage: image ? `url("${image}")` : undefined, '--hero-color': color.solid } as React.CSSProperties}
      >
        <div>
          <h1 className="hero-title">{a.name}</h1>
          {a.genres?.length ? <p className="hero-desc" style={{ marginTop: 8 }}>{a.genres.slice(0, 3).join(' • ')}</p> : null}
        </div>
      </header>

      <div className="action-bar" style={{ '--hero-color-dim': color.dim } as React.CSSProperties}>
        <PlayButton contextUri={a.uri} />
        <button type="button" className="outline-btn" onClick={() => toggle(a.uri, !following)}>
          {following ? 'Folge ich' : 'Folgen'}
        </button>
      </div>

      {tracks.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h2 className="section-title page-pad" style={{ marginBottom: 12 }}>
            Beliebt
          </h2>
          <TrackList items={tracks} showAlbum={false} showHeader={false} />
          {(popular.data?.length ?? 0) > 5 && (
            <button type="button" className="page-pad section-link" style={{ marginTop: 12, marginLeft: 16 }} onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Weniger anzeigen' : 'Mehr anzeigen'}
            </button>
          )}
        </section>
      )}

      {(albums.data?.length ?? 0) > 0 && (
        <section className="section page-pad">
          <h2 className="section-title" style={{ marginBottom: 12 }}>
            Diskografie
          </h2>
          <div className="chips" style={{ marginBottom: 12 }}>
            {TABS.map((t) => (
              <button key={t.key} type="button" className={`chip${tab === t.key ? ' on' : ''}`} onClick={() => setTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="shelf">
            {discography.map((x) => (
              <MediaCard key={x.id} item={x} subtitle={`${year(x.release_date)} • ${x.album_type === 'single' ? 'Single' : 'Album'}`} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
