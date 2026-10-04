// Spotify-Login mit „Authorization Code + PKCE“ – komplett im Browser, ohne eigenen Server.

import { SCOPES, getClientId, getRedirectUri } from '../config'

const TOKEN_KEY = 'spukify.token'
const VERIFIER_KEY = 'spukify.pkceVerifier'
const STATE_KEY = 'spukify.authState'
const RETURN_KEY = 'spukify.returnTo'

const AUTHORIZE_URL = 'https://accounts.spotify.com/authorize'
const TOKEN_URL = 'https://accounts.spotify.com/api/token'

interface StoredToken {
  access_token: string
  refresh_token: string
  expires_at: number
  scope?: string
}

function randomString(length = 64): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const values = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(values, (v) => chars[v % chars.length]).join('')
}

async function sha256Base64Url(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function readToken(): StoredToken | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    return raw ? (JSON.parse(raw) as StoredToken) : null
  } catch {
    return null
  }
}

function saveToken(data: { access_token: string; refresh_token?: string; expires_in: number; scope?: string }) {
  const previous = readToken()
  const token: StoredToken = {
    access_token: data.access_token,
    // Spotify liefert beim Erneuern manchmal keinen neuen Refresh-Token – dann den alten behalten.
    refresh_token: data.refresh_token ?? previous?.refresh_token ?? '',
    expires_at: Date.now() + data.expires_in * 1000,
    scope: data.scope,
  }
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token))
}

export function isLoggedIn(): boolean {
  return !!readToken()?.refresh_token
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
}

/** Leitet zu Spotify weiter, damit sich der Nutzer anmeldet. */
export async function login(returnTo?: string) {
  const clientId = getClientId()
  if (!clientId) throw new Error('Es ist noch keine Spotify Client ID eingerichtet.')

  const verifier = randomString(64)
  const state = randomString(16)
  sessionStorage.setItem(VERIFIER_KEY, verifier)
  sessionStorage.setItem(STATE_KEY, state)
  // localStorage als Rückfall: iOS-PWAs öffnen den Login manchmal in einem anderen Kontext.
  localStorage.setItem(VERIFIER_KEY, verifier)
  localStorage.setItem(STATE_KEY, state)
  if (returnTo) localStorage.setItem(RETURN_KEY, returnTo)

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    code_challenge_method: 'S256',
    code_challenge: await sha256Base64Url(verifier),
    scope: SCOPES.join(' '),
    state,
  })
  window.location.assign(`${AUTHORIZE_URL}?${params}`)
}

function takeAuthItem(key: string): string | null {
  const value = sessionStorage.getItem(key) ?? localStorage.getItem(key)
  sessionStorage.removeItem(key)
  localStorage.removeItem(key)
  return value
}

/**
 * Prüft beim Start, ob wir gerade von Spotify zurückkommen (?code=…),
 * tauscht den Code gegen Tokens und räumt die Adresse auf.
 * Gibt die Seite zurück, zu der danach navigiert werden soll.
 */
export async function handleRedirectCallback(): Promise<{ returnTo?: string; error?: string } | null> {
  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  if (!code && !error) return null

  const cleanUrl = () => {
    url.searchParams.delete('code')
    url.searchParams.delete('state')
    url.searchParams.delete('error')
    window.history.replaceState(null, '', url.pathname + url.search + url.hash)
  }

  if (error) {
    cleanUrl()
    takeAuthItem(VERIFIER_KEY)
    takeAuthItem(STATE_KEY)
    return { error: error === 'access_denied' ? 'Du hast den Zugriff bei Spotify abgelehnt.' : `Spotify-Fehler: ${error}` }
  }

  const returnedState = url.searchParams.get('state')
  const verifier = takeAuthItem(VERIFIER_KEY)
  const expectedState = takeAuthItem(STATE_KEY)
  const returnTo = localStorage.getItem(RETURN_KEY) ?? undefined
  localStorage.removeItem(RETURN_KEY)
  cleanUrl()

  if (!verifier || (expectedState && expectedState !== returnedState)) {
    return { error: 'Die Anmeldung ist abgelaufen. Bitte versuche es noch einmal.' }
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: getClientId(),
      grant_type: 'authorization_code',
      code: code!,
      redirect_uri: getRedirectUri(),
      code_verifier: verifier,
    }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { error: `Anmeldung fehlgeschlagen: ${body.error_description || body.error || res.status}` }
  }
  saveToken(await res.json())
  return { returnTo }
}

let refreshing: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const token = readToken()
  if (!token?.refresh_token) throw new AuthError('Nicht angemeldet.')
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: getClientId(),
      grant_type: 'refresh_token',
      refresh_token: token.refresh_token,
    }),
  })
  if (!res.ok) {
    if (res.status === 400 || res.status === 401) {
      logout()
      throw new AuthError('Deine Anmeldung ist abgelaufen. Bitte melde dich neu an.')
    }
    throw new Error(`Token konnte nicht erneuert werden (${res.status}).`)
  }
  const data = await res.json()
  saveToken(data)
  return data.access_token as string
}

/** Liefert einen gültigen Access Token und erneuert ihn bei Bedarf automatisch. */
export async function getAccessToken(forceRefresh = false): Promise<string> {
  const token = readToken()
  if (!token) throw new AuthError('Nicht angemeldet.')
  if (!forceRefresh && token.expires_at - Date.now() > 60_000) return token.access_token
  if (!refreshing) {
    refreshing = refreshAccessToken().finally(() => {
      refreshing = null
    })
  }
  return refreshing
}

export class AuthError extends Error {}
