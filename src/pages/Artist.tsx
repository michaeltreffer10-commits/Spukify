import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { pickImage } from '../components/Cover'
import { TopBar } from '../components/Layout'
import { useToggleSaved } from '../components/LikeButton'
import { MediaCard, PlayButton } from '../components/Media'
import { TrackList } from '../components/TrackList'
import { year } from '../lib/format'
import { useArtist, useArtistAlbums, useArtistPopular } from '../lib/queries'
import { useSaved } from '../lib/savedStore'
import { usePageAmbient } from '../state/ambient'
import { PageError, PageLoading } from './Playlist'

const TABS = [
  { key: 'all', label: 'Alle' },
  { key: 'album', label: 'Alben' },
  { key: 'single', label: 'Singles & EPs' },
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
  usePageAmbient(pickImage(a?.images, 64))

  if (artist.isLoading) return <PageLoading />
  if (artist.isError || !a) return <PageError text="Dieser Künstler konnte nicht geladen werden." />

  const tracks = (popular.data ?? []).slice(0, showAll ? 10 : 5).map((track) => ({ track }))
  const discography = (albums.data ?? []).filter((x) => tab === 'all' || (tab === 'single' ? x.album_type !== 'album' : x.album_type === 'album'))

  return (
    <div className="page">
      <TopBar title={a.name}>
        <PlayButton contextUri={a.uri} className="small" size={20} />
      </TopBar>
      <header className="artist-hero">
        {image && <div className="artist-hero-img" style={{ backgroundImage: `url("${image}")` }} />}
        <div>
          <span className="kicker">Künstler{a.genres?.length ? ` · ${a.genres.slice(0, 2).join(' · ')}` : ''}</span>
          <h1 className="hero-title" style={{ marginTop: 8 }}>
            {a.name}
          </h1>
        </div>
      </header>

      <div className="action-bar" style={{ paddingTop: 24 }}>
        <PlayButton contextUri={a.uri} />
        <button type="button" className={`outline-btn${following ? ' on' : ''}`} onClick={() => toggle(a.uri, !following)}>
          {following ? 'Du folgst' : 'Folgen'}
        </button>
      </div>

      {tracks.length > 0 && (
        <section style={{ marginBottom: 12 }}>
          <h2 className="section-title page-pad" style={{ marginBottom: 12 }}>
            Beliebt
          </h2>
          <TrackList items={tracks} showAlbum={false} showHeader={false} />
          {(popular.data?.length ?? 0) > 5 && (
            <div className="page-pad" style={{ marginTop: 10 }}>
              <button type="button" className="section-link" onClick={() => setShowAll(!showAll)}>
                {showAll ? 'Weniger anzeigen' : 'Mehr anzeigen'}
              </button>
            </div>
          )}
        </section>
      )}

      {(albums.data?.length ?? 0) > 0 && (
        <section className="section page-pad">
          <h2 className="section-title" style={{ marginBottom: 14 }}>
            Diskografie
          </h2>
          <div className="chips" style={{ marginBottom: 14 }}>
            {TABS.map((t) => (
              <button key={t.key} type="button" className={`chip${tab === t.key ? ' on' : ''}`} onClick={() => setTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="shelf">
            {discography.map((x) => (
              <MediaCard key={x.id} item={x} subtitle={`${year(x.release_date)} · ${x.album_type === 'single' ? 'Single' : 'Album'}`} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
