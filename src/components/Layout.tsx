import { ChevronLeft, ChevronRight, House, Library, Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useIsMobile, useScrolled } from '../lib/hooks'
import { useFollowedArtists, useMe, useMyPlaylists, useSavedAlbums, useSavedTracks } from '../lib/queries'
import type { MediaItem } from '../lib/types'
import { AmbientBackdrop } from '../state/ambient'
import { useUi } from '../state/ui'
import { Dock } from './Dock'
import { LibraryRow } from './Media'
import { Logo } from './Logo'
import { MiniPlayer } from './MiniPlayer'
import { NowPlaying } from './NowPlaying'
import { AddToPlaylistSheet, CreatePlaylistDialog, DevicePicker, Toasts, TrackMenu } from './Overlays'

export function Avatar() {
  const me = useMe()
  const url = me.data?.images?.[0]?.url
  const initial = (me.data?.display_name || me.data?.id || '?').slice(0, 1).toUpperCase()
  return (
    <Link to="/einstellungen" className="avatar" aria-label="Profil und Einstellungen" title={me.data?.display_name ?? ''}>
      {url ? <img src={url} alt="" /> : initial}
    </Link>
  )
}

/** Kopfleiste oben im Inhaltsbereich (Zurück/Vor, Titel erscheint beim Scrollen). */
export function TopBar({ title, children }: { title?: string; children?: ReactNode }) {
  const navigate = useNavigate()
  const mobile = useIsMobile()
  const scrolled = useScrolled(mobile ? 220 : 280)
  return (
    <div className={`topbar${scrolled ? ' scrolled' : ''}`}>
      <button type="button" className="round-btn" onClick={() => navigate(-1)} aria-label="Zurück">
        <ChevronLeft size={20} />
      </button>
      {!mobile && (
        <button type="button" className="round-btn" onClick={() => navigate(1)} aria-label="Vor">
          <ChevronRight size={20} />
        </button>
      )}
      {children}
      {title && <div className="topbar-title ellipsis">{title}</div>}
      <div className="topbar-spacer" />
      {!mobile && <Avatar />}
    </div>
  )
}

function Sidebar() {
  const location = useLocation()
  const { setCreatePlaylistOpen } = useUi()
  const playlists = useMyPlaylists()
  const albums = useSavedAlbums()
  const artists = useFollowedArtists()
  const liked = useSavedTracks()
  const likedTotal = liked.data?.pages[0]?.total ?? 0

  const items = useMemo(() => {
    const list: MediaItem[] = [...(playlists.data ?? [])]
    list.push(...(albums.data ?? []).map((a) => a.album))
    list.push(...(artists.data ?? []))
    return list
  }, [playlists.data, albums.data, artists.data])

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-brand">
        <Logo size={30} /> Spukify
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/" end className="nav-link">
          <House size={20} /> Startseite
        </NavLink>
        <NavLink to="/suche" className="nav-link">
          <Search size={20} /> Suchen
        </NavLink>
        <NavLink to="/bibliothek" className="nav-link">
          <Library size={20} /> Bibliothek
        </NavLink>
      </nav>
      <div className="sidebar-library-head">
        <span className="kicker">Deine Sammlung</span>
        <button type="button" className="icon-btn" aria-label="Playlist erstellen" title="Playlist erstellen" onClick={() => setCreatePlaylistOpen(true)}>
          <Plus size={18} />
        </button>
      </div>
      <div className="sidebar-scroll">
        <LibraryRow
          item={{ type: 'liked', name: 'Lieblingssongs', uri: 'liked', total: likedTotal }}
          active={location.pathname === '/lieblingssongs'}
        />
        {items.map((item) => (
          <LibraryRow key={item.uri} item={item} active={location.pathname.endsWith(item.id)} />
        ))}
      </div>
    </aside>
  )
}

function TabBar() {
  return (
    <nav className="tabbar">
      <NavLink to="/" end>
        <House size={22} />
        Start
      </NavLink>
      <NavLink to="/suche">
        <Search size={22} />
        Suche
      </NavLink>
      <NavLink to="/bibliothek">
        <Library size={22} />
        Bibliothek
      </NavLink>
    </nav>
  )
}

export function Layout() {
  const mobile = useIsMobile()
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)

  // Bei Seitenwechsel nach oben scrollen
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <>
      <AmbientBackdrop />
      <div className="app">
        {!mobile && <Sidebar />}
        <main className="main" ref={mainRef}>
          <Outlet />
        </main>
        {!mobile && <Dock />}
      </div>
      {/* Außerhalb von .app, damit der Glas-Effekt den Inhalt dahinter erfasst */}
      {mobile && (
        <>
          <MiniPlayer />
          <TabBar />
        </>
      )}
      <NowPlaying />
      <DevicePicker />
      <TrackMenu />
      <AddToPlaylistSheet />
      <CreatePlaylistDialog />
      <Toasts />
      <div className="grain" aria-hidden="true" />
    </>
  )
}
