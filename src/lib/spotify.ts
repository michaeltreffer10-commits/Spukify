// Zugriff auf die Spotify Web API (bzw. im Demo-Modus auf Beispieldaten).
// Berücksichtigt die Änderungen vom Februar 2026 für Apps im „Development Mode“:
//  - Bibliothek speichern/entfernen/prüfen nur noch über /me/library mit Spotify-URIs
//  - Playlist-Inhalte heißen „items“ statt „tracks“ und sind nur für eigene Playlists abrufbar
//  - Suche liefert höchstens 10 Ergebnisse pro Typ
//  - „Top-Songs eines Künstlers“ und Sammelabfragen gibt es nicht mehr → Suche als Ersatz

import { AuthError, getAccessToken } from './auth'
import { demoRequest } from './demo'
import { ApiError } from './errors'
import type {
  Album,
  AlbumRef,
  Artist,
  Device,
  Paging,
  PlayHistory,
  PlaybackState,
  Playlist,
  PlaylistEntry,
  QueueState,
  RepeatState,
  SavedAlbum,
  SavedTrack,
  SearchResults,
  Track,
  User,
} from './types'

const API = 'https://api.spotify.com/v1'

let demoMode = false
export function setDemoMode(on: boolean) {
  demoMode = on
}
export function isDemoMode() {
  return demoMode
}

export { ApiError }

type Query = Record<string, string | number | boolean | undefined | null>

interface RequestOptions {
  query?: Query
  body?: unknown
}

function buildQuery(query?: Query) {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
  }
  const s = params.toString()
  return s ? `?${s}` : ''
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function request<T>(method: string, path: string, opts: RequestOptions = {}, attempt = 0): Promise<T> {
  if (demoMode) {
    await sleep(80 + Math.random() * 120)
    return demoRequest(method, path, opts.query ?? {}, opts.body) as T
  }

  const token = await getAccessToken(attempt > 0 && attempt < 2)
  const res = await fetch(API + path + buildQuery(opts.query), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })

  if (res.status === 401 && attempt === 0) return request<T>(method, path, opts, 1)
  if (res.status === 429 && attempt < 2) {
    const wait = Math.min(Number(res.headers.get('Retry-After') || 1), 5)
    await sleep(wait * 1000)
    return request<T>(method, path, opts, 2)
  }

  const text = await res.text()
  let data: unknown = undefined
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    const err = (data as { error?: { message?: string; reason?: string } } | undefined)?.error
    if (res.status === 401) throw new AuthError(err?.message || 'Nicht angemeldet.')
    throw new ApiError(res.status, err?.message || `Spotify-Fehler ${res.status}`, err?.reason)
  }
  return data as T
}

// ---------- Hilfsfunktionen für die neuen Feldnamen ----------

export function playlistTotal(p: Playlist): number {
  return (p.items ?? p.tracks)?.total ?? 0
}

export function entryTrack(e: PlaylistEntry): Track | null {
  return e.item ?? e.track ?? null
}

export function idFromUri(uri: string): string {
  return uri.split(':').pop() || ''
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

// ---------- Profil & Bibliothek ----------

export const api = {
  me: () => request<User>('GET', '/me'),

  myPlaylists: (offset = 0, limit = 50) => request<Paging<Playlist>>('GET', '/me/playlists', { query: { offset, limit } }),

  async allMyPlaylists(): Promise<Playlist[]> {
    const all: Playlist[] = []
    for (let offset = 0; offset < 1000; offset += 50) {
      const page = await api.myPlaylists(offset, 50)
      all.push(...page.items.filter(Boolean))
      if (!page.next) break
    }
    return all
  },

  savedTracks: (offset = 0, limit = 50) => request<Paging<SavedTrack>>('GET', '/me/tracks', { query: { offset, limit } }),

  savedAlbums: (offset = 0, limit = 50) => request<Paging<SavedAlbum>>('GET', '/me/albums', { query: { offset, limit } }),

  async followedArtists(): Promise<Artist[]> {
    const all: Artist[] = []
    let after: string | undefined
    for (let i = 0; i < 10; i++) {
      const res = await request<{ artists: Paging<Artist> & { cursors?: { after?: string } } }>('GET', '/me/following', {
        query: { type: 'artist', limit: 50, after },
      })
      all.push(...res.artists.items)
      after = res.artists.cursors?.after
      if (!res.artists.next || !after) break
    }
    return all
  },

  topArtists: (timeRange = 'short_term', limit = 20) =>
    request<Paging<Artist>>('GET', '/me/top/artists', { query: { time_range: timeRange, limit } }),

  topTracks: (timeRange = 'short_term', limit = 20) =>
    request<Paging<Track>>('GET', '/me/top/tracks', { query: { time_range: timeRange, limit } }),

  recentlyPlayed: (limit = 50) => request<{ items: PlayHistory[] }>('GET', '/me/player/recently-played', { query: { limit } }),

  /** Prüft, welche URIs in der Bibliothek sind (Songs, Alben, Künstler, Playlists). */
  async libraryContains(uris: string[]): Promise<boolean[]> {
    const results: boolean[] = []
    for (const part of chunk(uris, 40)) {
      results.push(...(await request<boolean[]>('GET', '/me/library/contains', { query: { uris: part.join(',') } })))
    }
    return results
  },

  async librarySave(uris: string[]) {
    for (const part of chunk(uris, 40)) {
      try {
        await request('PUT', '/me/library', { query: { uris: part.join(',') } })
      } catch (e) {
        // Playlists folgen klappt laut Berichten über /me/library nicht immer – alter Weg als Rückfall.
        const playlists = part.filter((u) => u.startsWith('spotify:playlist:'))
        if (playlists.length !== part.length) throw e
        for (const u of playlists) await request('PUT', `/playlists/${idFromUri(u)}/followers`)
      }
    }
  },

  async libraryRemove(uris: string[]) {
    for (const part of chunk(uris, 40)) {
      await request('DELETE', '/me/library', { query: { uris: part.join(',') } })
    }
  },

  // ---------- Playlists ----------

  playlist: (id: string) => request<Playlist>('GET', `/playlists/${id}`),

  playlistItems: (id: string, offset = 0, limit = 100) =>
    request<Paging<PlaylistEntry>>('GET', `/playlists/${id}/items`, { query: { offset, limit } }),

  createPlaylist: (name: string, description = '', isPublic = false) =>
    request<Playlist>('POST', '/me/playlists', { body: { name, description, public: isPublic } }),

  addToPlaylist: (id: string, uris: string[]) => request('POST', `/playlists/${id}/items`, { body: { uris } }),

  async removeFromPlaylist(id: string, uris: string[]) {
    const entries = uris.map((uri) => ({ uri }))
    try {
      await request('DELETE', `/playlists/${id}/items`, { body: { items: entries } })
    } catch {
      await request('DELETE', `/playlists/${id}/tracks`, { body: { tracks: entries } })
    }
  },

  // ---------- Alben & Künstler ----------

  album: (id: string) => request<Album>('GET', `/albums/${id}`),

  albumTracks: (id: string, offset = 0, limit = 50) =>
    request<Paging<Track>>('GET', `/albums/${id}/tracks`, { query: { offset, limit } }),

  artist: (id: string) => request<Artist>('GET', `/artists/${id}`),

  /** Alben eines Künstlers – falls Spotify den Endpunkt sperrt, über die Suche. */
  async artistAlbums(artist: Artist): Promise<AlbumRef[]> {
    try {
      const res = await request<Paging<AlbumRef>>('GET', `/artists/${artist.id}/albums`, {
        query: { include_groups: 'album,single', limit: 30 },
      })
      return res.items
    } catch (e) {
      if (!(e instanceof ApiError) || ![403, 404].includes(e.status)) throw e
      const res = await api.search(`artist:"${artist.name}"`, ['album'])
      return (res.albums?.items ?? []).filter((a) => a.artists.some((x) => x.id === artist.id))
    }
  },

  /** „Beliebt“ – Spotify bietet die Top-Songs eines Künstlers nicht mehr an, daher über die Suche. */
  async artistPopularTracks(artist: Artist): Promise<Track[]> {
    const res = await api.search(`artist:"${artist.name}"`, ['track'])
    return (res.tracks?.items ?? []).filter((t) => t.artists.some((x) => x.id === artist.id))
  },

  // ---------- Suche ----------

  search: (q: string, types: string[], offset = 0) =>
    request<SearchResults>('GET', '/search', { query: { q, type: types.join(','), limit: 10, offset } }),

  // ---------- Wiedergabe (Spotify Connect) ----------

  playback: () => request<PlaybackState | undefined>('GET', '/me/player', { query: { additional_types: 'episode' } }),

  devices: () => request<{ devices: Device[] }>('GET', '/me/player/devices'),

  queue: () => request<QueueState>('GET', '/me/player/queue'),

  play: (
    body: { context_uri?: string; uris?: string[]; offset?: { position: number } | { uri: string }; position_ms?: number } = {},
    deviceId?: string,
  ) =>
    request('PUT', '/me/player/play', {
      query: { device_id: deviceId },
      body: Object.keys(body).length ? body : undefined,
    }),

  pause: (deviceId?: string) => request('PUT', '/me/player/pause', { query: { device_id: deviceId } }),
  next: () => request('POST', '/me/player/next'),
  previous: () => request('POST', '/me/player/previous'),
  seek: (positionMs: number) => request('PUT', '/me/player/seek', { query: { position_ms: Math.round(positionMs) } }),
  volume: (percent: number) => request('PUT', '/me/player/volume', { query: { volume_percent: Math.round(percent) } }),
  shuffle: (state: boolean) => request('PUT', '/me/player/shuffle', { query: { state } }),
  repeat: (state: RepeatState) => request('PUT', '/me/player/repeat', { query: { state } }),
  transfer: (deviceId: string, play: boolean) => request('PUT', '/me/player', { body: { device_ids: [deviceId], play } }),
  addToQueue: (uri: string) => request('POST', '/me/player/queue', { query: { uri } }),
}
