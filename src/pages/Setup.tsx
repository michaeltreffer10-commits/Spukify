import { ChevronLeft, Copy } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getClientId, getRedirectUri, setClientId } from '../config'
import { useSession } from '../state/session'

/** Schritt-für-Schritt-Anleitung, um Spukify mit Spotify zu verbinden. */
export function Setup() {
  const navigate = useNavigate()
  const { login, mode } = useSession()
  const [clientId, setValue] = useState(getClientId())
  const [copied, setCopied] = useState(false)
  const redirectUri = getRedirectUri()
  const valid = /^[0-9a-f]{32}$/i.test(clientId.trim())

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(redirectUri)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Zwischenablage nicht verfügbar
    }
  }

  return (
    <div className="setup">
      <button type="button" className="round-btn" onClick={() => navigate(-1)} aria-label="Zurück">
        <ChevronLeft size={20} />
      </button>
      <h1>Spotify verbinden</h1>
      <p>Damit Spukify auf dein Spotify-Konto zugreifen darf, brauchst du eine kostenlose „App“ im Spotify-Entwicklerbereich. Das dauert etwa 2 Minuten und muss nur einmal gemacht werden.</p>

      <ol className="steps">
        <li>
          Öffne das{' '}
          <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer">
            Spotify Developer Dashboard
          </a>{' '}
          und melde dich mit deinem Spotify-Konto an. Akzeptiere beim ersten Mal die Nutzungsbedingungen.
        </li>
        <li>
          Klicke auf <strong>„Create app“</strong>. Name und Beschreibung sind egal (z. B. „Spukify“). Bei <strong>„Which API/SDKs are you planning to use?“</strong> wähle{' '}
          <strong>Web API</strong>.
        </li>
        <li>
          Trage bei <strong>„Redirect URIs“</strong> genau diese Adresse ein und klicke auf „Add“:
          <div className="copy-field">
            <code>{redirectUri}</code>
            <button type="button" className="pill-btn small secondary" onClick={copy}>
              <Copy size={14} /> {copied ? 'Kopiert!' : 'Kopieren'}
            </button>
          </div>
        </li>
        <li>
          Speichere die App. Öffne danach <strong>„Settings“</strong> und kopiere die <strong>Client ID</strong> (32 Zeichen) hier hinein:
          <input
            className="input"
            style={{ marginTop: 10 }}
            placeholder="z. B. 1a2b3c4d5e6f…"
            value={clientId}
            onChange={(e) => setValue(e.target.value.trim())}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
          />
        </li>
        <li>
          Unter <strong>„User Management“</strong> trägst du alle Spotify-Konten ein, die Spukify nutzen dürfen (deins ist automatisch dabei, insgesamt bis zu 5 Personen).
        </li>
      </ol>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="pill-btn"
          disabled={!valid}
          onClick={() => {
            setClientId(clientId)
            login('/')
          }}
        >
          Speichern & mit Spotify anmelden
        </button>
        {mode !== 'signedOut' && (
          <button type="button" className="pill-btn secondary" onClick={() => navigate(-1)}>
            Abbrechen
          </button>
        )}
      </div>
      {!valid && clientId && <p style={{ color: 'var(--danger)', marginTop: 12 }}>Die Client ID besteht aus 32 Zeichen (Zahlen und Buchstaben a–f).</p>}
      <p className="muted" style={{ marginTop: 24, fontSize: 13 }}>
        Hinweis: Spotify verlangt für solche Apps, dass der Besitzer Spotify Premium hat. Die Client ID ist kein Geheimnis – sie wird nur auf diesem Gerät gespeichert.
      </p>
    </div>
  )
}
