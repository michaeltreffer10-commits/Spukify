import { ChevronRight, Download, Info, LogOut, MonitorSpeaker, Smartphone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TopBar } from '../components/Layout'
import { DeviceIcon } from '../components/PlayerControls'
import { getClientId } from '../config'
import { useMe } from '../lib/queries'
import { usePlayer } from '../state/player'
import { useSession } from '../state/session'
import { useUi } from '../state/ui'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
}

function useInstallPrompt() {
  const [event, setEvent] = useState<InstallPromptEvent | null>(null)
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setEvent(e as InstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])
  return event
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export function SettingsPage() {
  const me = useMe()
  const { mode, logout } = useSession()
  const { openDevicePicker } = useUi()
  const player = usePlayer()
  const install = useInstallPrompt()
  const clientId = getClientId()
  const device = player.state?.device

  return (
    <div className="page">
      <TopBar title="Einstellungen" />
      <div className="page-pad" style={{ maxWidth: 760 }}>
        <h1 className="page-title">Einstellungen</h1>

        <div className="settings-card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16 }}>
          <div className="avatar" style={{ width: 56, height: 56, fontSize: 22, border: 0 }}>
            {me.data?.images?.[0]?.url ? <img src={me.data.images[0].url} alt="" /> : (me.data?.display_name ?? '?').slice(0, 1).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 700 }} className="ellipsis">
              {me.data?.display_name ?? '…'}
            </div>
            <div className="muted" style={{ fontSize: 13 }}>
              {mode === 'demo' ? 'Demo-Modus – keine echten Spotify-Daten' : 'Mit Spotify verbunden'}
            </div>
          </div>
        </div>

        <div className="settings-group">
          <h2>Wiedergabe</h2>
          <div className="settings-card">
            <button type="button" className="settings-row" onClick={() => openDevicePicker()}>
              {device ? <DeviceIcon type={device.type} size={22} /> : <MonitorSpeaker size={22} />}
              <div className="settings-row-text">
                Gerät
                <small>{device ? `Läuft auf: ${device.name}` : 'Kein Gerät aktiv'}</small>
              </div>
              <ChevronRight size={18} className="muted" />
            </button>
            <div className="settings-row">
              <Info size={22} />
              <div className="settings-row-text">
                Audioqualität & Lossless
                <small>
                  Spukify steuert die Spotify-App per Spotify Connect. Die Qualität (auch Lossless) stellst du in der Spotify-App ein: Einstellungen →
                  Audioqualität.
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-group">
          <h2>App</h2>
          <div className="settings-card">
            {install ? (
              <button type="button" className="settings-row" onClick={() => install.prompt()}>
                <Download size={22} />
                <div className="settings-row-text">
                  Spukify installieren
                  <small>Als App auf dem Home-Bildschirm / Desktop</small>
                </div>
              </button>
            ) : (
              <div className="settings-row">
                <Smartphone size={22} />
                <div className="settings-row-text">
                  {isStandalone() ? 'Spukify ist als App installiert' : 'Zum Home-Bildschirm hinzufügen'}
                  {!isStandalone() && (
                    <small>
                      {isIos()
                        ? 'In Safari unten auf „Teilen“ tippen → „Zum Home-Bildschirm“.'
                        : 'Im Browser-Menü (⋮) → „App installieren“ bzw. „Zum Startbildschirm hinzufügen“.'}
                    </small>
                  )}
                </div>
              </div>
            )}
            {mode === 'live' && (
              <Link to="/einrichtung" className="settings-row">
                <Info size={22} />
                <div className="settings-row-text">
                  Spotify-Verbindung
                  <small>Client ID: {clientId ? `${clientId.slice(0, 6)}…${clientId.slice(-4)}` : '–'}</small>
                </div>
                <ChevronRight size={18} className="muted" />
              </Link>
            )}
          </div>
        </div>

        <div className="settings-group">
          <div className="settings-card">
            <button type="button" className="settings-row" onClick={logout}>
              <LogOut size={22} />
              <div className="settings-row-text">{mode === 'demo' ? 'Demo beenden' : 'Abmelden'}</div>
            </button>
          </div>
        </div>

        <p className="muted" style={{ fontSize: 12, marginTop: 28 }}>
          Spukify {__APP_VERSION__} · Inhalte und Wiedergabe von Spotify. Spukify ist nicht mit Spotify verbunden oder von Spotify unterstützt.
        </p>
      </div>
    </div>
  )
}
