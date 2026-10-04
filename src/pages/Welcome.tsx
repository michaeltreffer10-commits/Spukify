import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { getClientId } from '../config'
import { StaticAurora } from '../state/ambient'
import { useSession } from '../state/session'

export function Welcome({ error }: { error?: string }) {
  const { login, startDemo } = useSession()
  const hasClientId = !!getClientId()

  return (
    <>
      <StaticAurora />
      <div className="welcome">
        <div className="welcome-logo">
          <Logo size={96} />
        </div>
        <div className="kicker">Spukify</div>
        <h1>
          Deine Musik, <em>wie im Kino.</em>
        </h1>
        <p>Melde dich mit deinem Spotify-Konto an. Deine Playlists, Lieblingssongs und Alben leuchten dann in den Farben ihrer Cover – direkt auf deinem Home-Bildschirm.</p>
        {error && <div className="welcome-error">{error}</div>}
        <div className="welcome-actions">
          {hasClientId ? (
            <button type="button" className="pill-btn brand" onClick={() => login()}>
              Mit Spotify anmelden
            </button>
          ) : (
            <Link to="/einrichtung" className="pill-btn brand">
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
        <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
          Zum Abspielen brauchst du Spotify Premium. Spukify ist ein privates Projekt und nicht mit Spotify verbunden.
        </p>
      </div>
      <div className="grain" aria-hidden="true" />
    </>
  )
}
