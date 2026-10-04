// Zentrale Einstellungen von Spukify.

const CLIENT_ID_KEY = 'spukify.clientId'

/** Rechte, die Spukify bei Spotify anfragt. */
export const SCOPES = [
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'user-read-recently-played',
  'user-top-read',
  'user-library-read',
  'user-library-modify',
  'user-follow-read',
  'user-follow-modify',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-private',
  'playlist-modify-public',
]

/**
 * Client ID der Spotify-App. Reihenfolge:
 * 1. In der App unter „Einrichtung“ eingegeben (localStorage)
 * 2. Beim Bauen über VITE_SPOTIFY_CLIENT_ID festgelegt
 */
export function getClientId(): string {
  try {
    const stored = localStorage.getItem(CLIENT_ID_KEY)
    if (stored) return stored
  } catch {
    // localStorage nicht verfügbar
  }
  return (import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined)?.trim() || ''
}

export function setClientId(id: string) {
  try {
    if (id) localStorage.setItem(CLIENT_ID_KEY, id.trim())
    else localStorage.removeItem(CLIENT_ID_KEY)
  } catch {
    // ignorieren
  }
}

/** Die Adresse, an die Spotify nach dem Login zurückleitet. Muss im Spotify Dashboard eingetragen sein. */
export function getRedirectUri(): string {
  return new URL(import.meta.env.BASE_URL, window.location.origin).toString()
}
