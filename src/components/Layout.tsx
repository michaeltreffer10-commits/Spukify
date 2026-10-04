import { ChevronLeft, ChevronRight, House, Library, Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useIsMobile, useScrolled } from '../lib/hooks'
import { useFollowedArtists, useMe, useMyPlaylists, useSavedAlbums, useSavedTracks } from '../lib/queries'
import type { MediaItem } from '../lib/types'
import { useUi } from '../state/ui'
import { LibraryRow } from './Media'
import { Logo } from './Logo'
import { MiniPlayer } from './MiniPlayer'
import { NowPlaying } from './NowPlaying'
import { AddToPlaylistSheet, CreatePlaylistDialog, DevicePicker, Toasts, TrackMenu } from './Overlays'
import { PlayerBar } from './PlayerBar'

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

/** Kopfleiste oben im Inhaltsbereich (Zurück/Vor am PC, Titel beim Scrollen). */
export function TopBar({ title, color, children }: { title?: string; color?: string; children?: ReactNode }) {
  const navigate = useNavigate()
  const mobile = useIsMobile()
  const scrolled = useScrolled(mobile ? 200 : 260)
  return (
    <div className={`topbar${scrolled ? ' scrolled' : ''}`} style={{ backgroundColor: scrolled ? color ?? '#121212' : 'transparent' }}>
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
    <aside className="sidebar">
      <nav className="sidebar-box sidebar-nav">
        <div className="sidebar-brand">
          <Logo size={28} /> Spukify
        </div>
        <NavLink to="/" end>
          <House size={24} /> Startseite
        </NavLink>
        <NavLink to="/suche">
          <Search size={24} /> Suchen
        </NavLink>
      </nav>
      <div className="sidebar-box sidebar-library">
        <div className="sidebar-library-head">
          <Link to="/bibliothek">
            <Library size={24} /> Bibliothek
          </Link>
          <button type="button" className="icon-btn" aria-label="Playlist erstellen" onClick={() => setCreatePlaylistOpen(true)}>
            <Plus size={20} />
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
      </div>
    </aside>
  )
}

function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end>
        <House size={24} />
        Start
      </NavLink>
      <NavLink to="/suche">
        <Search size={24} />
        Suche
      </NavLink>
      <NavLink to="/bibliothek">
        <Library size={24} />
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
    <div className="app">
      {!mobile && <Sidebar />}
      <main className="main" ref={mainRef}>
        <Outlet />
      </main>
      {mobile ? (
        <>
          <MiniPlayer />
          <BottomNav />
        </>
      ) : (
        <PlayerBar />
      )}
      <NowPlaying />
      <DevicePicker />
      <TrackMenu />
      <AddToPlaylistSheet />
      <CreatePlaylistDialog />
      <Toasts />
    </div>
  )
}
