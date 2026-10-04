import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { getClientId } from '../config'
import { useSession } from '../state/session'

export function Welcome({ error }: { error?: string }) {
  const { login, startDemo } = useSession()
  const hasClientId = !!getClientId()

  return (
    <div className="welcome">
      <Logo size={88} />
      <h1>Deine Musik. Dein Spukify.</h1>
      <p>Melde dich mit deinem Spotify-Konto an und höre deine Playlists, Lieblingssongs und Alben – im Spotify-Look, als App auf deinem Home-Bildschirm.</p>
      {error && <div className="welcome-error">{error}</div>}
      <div className="welcome-actions">
        {hasClientId ? (
          <button type="button" className="pill-btn" onClick={() => login()}>
            Mit Spotify anmelden
          </button>
        ) : (
          <Link to="/einrichtung" className="pill-btn">
            Spotify verbinden
          </Link>
        )}
        <button type="button" className="pill-btn secondary" onClick={startDemo}>
          Demo ansehen
        </button>
        {hasClientId && (
          <Link to="/einrichtung" className="muted" style={{ fontSize: 13, marginTop: 8 }}>
            Einrichtung ändern
          </Link>
        )}
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Zum Abspielen brauchst du Spotify Premium. Spukify ist nicht mit Spotify verbunden oder von Spotify unterstützt.</p>
    </div>
  )
}
