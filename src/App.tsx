import { HashRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Layout } from './components/Layout'
import { AlbumPage } from './pages/Album'
import { ArtistPage } from './pages/Artist'
import { Home } from './pages/Home'
import { LikedSongs } from './pages/LikedSongs'
import { Library } from './pages/Library'
import { PlaylistPage } from './pages/Playlist'
import { QueuePage } from './pages/Queue'
import { Search } from './pages/Search'
import { SettingsPage } from './pages/Settings'
import { Setup } from './pages/Setup'
import { Welcome } from './pages/Welcome'
import { PlayerProvider } from './state/player'
import { useSession } from './state/session'
import { UiProvider } from './state/ui'

function ReturnTo({ path }: { path?: string }) {
  const navigate = useNavigate()
  useEffect(() => {
    if (path && path !== '/') navigate(path, { replace: true })
  }, [path, navigate])
  return null
}

export function App({ authError, returnTo }: { authError?: string; returnTo?: string }) {
  const { mode } = useSession()

  if (mode === 'signedOut') {
    return (
      <HashRouter>
        <Routes>
          <Route path="/einrichtung" element={<Setup />} />
          <Route path="*" element={<Welcome error={authError} />} />
        </Routes>
      </HashRouter>
    )
  }

  return (
    <HashRouter>
      <UiProvider>
        <PlayerProvider>
          <ReturnTo path={returnTo} />
          <Routes>
            <Route path="/einrichtung" element={<Setup />} />
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="suche" element={<Search />} />
              <Route path="bibliothek" element={<Library />} />
              <Route path="lieblingssongs" element={<LikedSongs />} />
              <Route path="playlist/:id" element={<PlaylistPage />} />
              <Route path="album/:id" element={<AlbumPage />} />
              <Route path="kuenstler/:id" element={<ArtistPage />} />
              <Route path="warteschlange" element={<QueuePage />} />
              <Route path="einstellungen" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </PlayerProvider>
      </UiProvider>
    </HashRouter>
  )
}
