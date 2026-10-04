// Demo-Modus: ein kleines, erfundenes „Spotify“ im Browser.
// Damit lässt sich Spukify ausprobieren, bevor es mit einem echten Spotify-Konto verbunden ist.
// Die Antworten haben dieselbe Form wie die echte Spotify Web API.

import { ApiError } from './errors'
import { hashHue } from './format'
import type {
  AlbumRef,
  Artist,
  ArtistRef,
  Device,
  PlaybackState,
  Playlist,
  RepeatState,
  SpotifyImage,
  Track,
  User,
} from './types'

// ---------- Zufall mit festem Startwert (damit die Demo immer gleich aussieht) ----------

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20261004)
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
const between = (min: number, max: number) => Math.floor(min + rand() * (max - min + 1))

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!)
}

function cover(seed: string, label: string, style: 'square' | 'artist' = 'square'): SpotifyImage[] {
  const hue = hashHue(seed)
  const hue2 = (hue + 50) % 360
  const shape =
    style === 'artist'
      ? `<circle cx='150' cy='120' r='58' fill='rgba(255,255,255,.22)'/><ellipse cx='150' cy='290' rx='110' ry='90' fill='rgba(255,255,255,.22)'/>`
      : `<circle cx='${between(170, 260)}' cy='${between(40, 130)}' r='${between(50, 110)}' fill='rgba(255,255,255,.14)'/>
         <circle cx='${between(30, 120)}' cy='${between(120, 200)}' r='${between(30, 70)}' fill='rgba(0,0,0,.14)'/>`
  const text =
    style === 'artist'
      ? ''
      : `<text x='22' y='272' font-family='Arial,Helvetica,sans-serif' font-weight='700' font-size='30' fill='rgba(255,255,255,.95)'>${escapeXml(
          label.length > 16 ? label.slice(0, 15) + '…' : label,
        )}</text>`
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'><defs><linearGradient id='a' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${hue},68%,52%)'/><stop offset='1' stop-color='hsl(${hue2},62%,24%)'/></linearGradient></defs><rect width='300' height='300' fill='url(#a)'/>${shape}${text}</svg>`
  return [{ url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace(/\s+/g, ' ')), width: 300, height: 300 }]
}

// ---------- Erfundene Musik ----------

const ARTIST_NAMES = [
  'Nachtfalter',
  'Luna Kessler',
  'Die Spukgestalten',
  'Kiez Kollektiv',
  'Aurora Blau',
  'MC Nebel',
  'Synthwelle',
  'Paula Sommer',
]
const GENRES = ['pop', 'indie', 'deutschrap', 'elektro', 'rock', 'chill', 'synthwave', 'singer-songwriter']

const SONG_NAMES = [
  'Mitternacht', 'Neonlichter', 'Kein Zurück', 'Sommerregen', 'Geisterstunde', 'Herzschlag', 'Stadt aus Glas',
  'Wolkenkratzer', 'Nachtzug', 'Echo', 'Unter Strom', 'Goldene Stunde', 'Wellenreiter', 'Fernweh', 'Blaue Stunde',
  'Satellit', 'Leise laut', 'Sternenstaub', 'Bis zum Morgen', 'Funkenflug', 'Rückspiegel', 'Polaroid', 'Gänsehaut',
  'Mondlicht', 'Asphalt', 'Zeitlupe', 'Kaleidoskop', 'Ozean', 'Feuerwerk', 'Schwerelos', 'Nordlicht', 'Vinyl',
  'Hinterhof', 'Spukschloss', 'Nebelmeer', 'Kopfkino', 'Lichterkette', 'Paradies', 'Taumel', 'Tanz im Regen',
  'Achterbahn', 'Glühwürmchen', 'Kompass', 'Sonnenfinsternis', 'Papierflieger', 'Kartenhaus', 'Großstadtkind',
  'Gegenwind', 'Morgengrauen', 'Lautlos',
]
const SUFFIXES = ['', '', '', '', ' (Remix)', ' – Akustik', ' Pt. II', ' (Live)']
const ALBUM_NAMES = [
  'Zwischen den Welten', 'Neon & Nebel', 'Spätschicht', 'Lichtjahre', 'Unterwegs', 'Nachtschwärmer', 'Kopf hoch',
  'Bunte Tage', 'Mondphasen', 'Analog', 'Wolkenlos', 'Echo Park', 'Rauschen', 'Heimweg', 'Polarlicht', 'Funkstille',
]

const ME: User = { id: 'demo-michi', display_name: 'Michi', images: [] }

const artists: Artist[] = ARTIST_NAMES.map((name, i) => ({
  id: `demoartist${i}`,
  name,
  uri: `spotify:artist:demoartist${i}`,
  type: 'artist',
  genres: [GENRES[i]],
  images: cover(name, name, 'artist'),
}))
const ref = (a: Artist): ArtistRef => ({ id: a.id, name: a.name, uri: a.uri })

const albums: (AlbumRef & { trackIds: string[] })[] = []
const tracks = new Map<string, Track>()
let songCounter = 0

artists.forEach((artist, ai) => {
  for (let k = 0; k < 2; k++) {
    const id = `demoalbum${ai}_${k}`
    const name = ALBUM_NAMES[(ai * 2 + k) % ALBUM_NAMES.length]
    const isSingle = k === 1 && ai % 3 === 0
    const count = isSingle ? 2 : between(6, 10)
    const featuring = rand() > 0.6 ? artists[(ai + 3) % artists.length] : null
    const songNames = Array.from({ length: count }, () => SONG_NAMES[songCounter++ % SONG_NAMES.length] + pick(SUFFIXES))
    const album = {
      id,
      name: isSingle ? songNames[0] : name,
      uri: `spotify:album:${id}`,
      type: 'album' as const,
      album_type: isSingle ? 'single' : 'album',
      release_date: `${2019 + ((ai + k * 3) % 7)}-0${1 + ((ai + k) % 9)}-1${k}`,
      total_tracks: count,
      artists: [ref(artist)],
      images: cover(id + name, name),
      trackIds: [] as string[],
    }
    const { trackIds: _ids, ...plainAlbum } = album
    for (let n = 0; n < count; n++) {
      const tid = `demotrack${tracks.size}`
      tracks.set(tid, {
        id: tid,
        name: songNames[n],
        uri: `spotify:track:${tid}`,
        duration_ms: between(135, 260) * 1000,
        explicit: artist.genres?.[0] === 'deutschrap' && rand() > 0.4,
        artists: n === 2 && featuring ? [ref(artist), ref(featuring)] : [ref(artist)],
        album: plainAlbum,
        track_number: n + 1,
        is_playable: true,
        type: 'track',
      })
      album.trackIds.push(tid)
    }
    albums.push(album)
  }
})

const allTrackIds = [...tracks.keys()]
const shuffled = <T,>(arr: T[]) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface DemoPlaylist {
  id: string
  name: string
  description: string
  owner: { id: string; display_name: string }
  trackIds: { id: string; added_at: string }[]
  image: SpotifyImage[]
}

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000 - between(0, 80_000_000)).toISOString()

const playlists: DemoPlaylist[] = [
  ['Lieblings-Mix', 'Alles, was gerade läuft.'],
  ['Chill am Abend', 'Runterkommen nach einem langen Tag.'],
  ['Workout Power', 'Für die letzten Wiederholungen.'],
  ['Deutschrap Mix', 'Die besten Zeilen auf Deutsch.'],
  ['Roadtrip', 'Fenster runter, Lautstärke hoch.'],
  ['Fokus', 'Konzentriert arbeiten ohne Ablenkung.'],
  ['Spuk-Party', 'Gespenstisch gute Laune.'],
].map(([name, description], i) => ({
  id: `demoplaylist${i}`,
  name,
  description,
  owner: { id: ME.id, display_name: ME.display_name! },
  trackIds: shuffled(allTrackIds)
    .slice(0, between(12, 28))
    .map((id) => ({ id, added_at: daysAgo(between(0, 200)) })),
  image: cover(`pl${i}${name}`, name),
}))

const library = new Set<string>([
  ...shuffled(allTrackIds).slice(0, 34).map((id) => `spotify:track:${id}`),
  ...shuffled(albums).slice(0, 5).map((a) => a.uri),
  ...artists.slice(0, 6).map((a) => a.uri),
])
const libraryAddedAt = new Map<string, string>()
;[...library].forEach((uri) => libraryAddedAt.set(uri, daysAgo(between(0, 300))))

const recent = shuffled(allTrackIds)
  .slice(0, 24)
  .map((id, i) => ({ id, played_at: new Date(Date.now() - i * 4 * 60_000 - 20 * 60_000).toISOString() }))

// ---------- Objekte im Spotify-Format ----------

function playlistObject(p: DemoPlaylist, withItems = false): Playlist {
  const base: Playlist = {
    id: p.id,
    name: p.name,
    uri: `spotify:playlist:${p.id}`,
    description: p.description,
    images: p.trackIds.length ? p.image : [],
    owner: p.owner,
    public: false,
    collaborative: false,
    type: 'playlist',
    items: { total: p.trackIds.length },
  }
  if (withItems) base.items = paging(entriesOf(p), 0, 100)
  return base
}

function entriesOf(p: DemoPlaylist) {
  return p.trackIds.map((t) => ({ added_at: t.added_at, item: tracks.get(t.id)! }))
}

function albumObject(a: (typeof albums)[number]) {
  const { trackIds, ...rest } = a
  return { ...rest, tracks: paging(trackIds.map((id) => simpleTrack(tracks.get(id)!)), 0, 50) }
}

function simpleTrack(t: Track): Track {
  const { album: _album, ...rest } = t
  return rest
}

function albumRef(a: (typeof albums)[number]): AlbumRef {
  const { trackIds: _ids, ...rest } = a
  return rest
}

function paging<T>(all: T[], offset: number, limit: number) {
  const items = all.slice(offset, offset + limit)
  return {
    items,
    total: all.length,
    limit,
    offset,
    next: offset + limit < all.length ? `demo?offset=${offset + limit}` : null,
    href: 'demo',
  }
}

// ---------- Wiedergabe-Simulation ----------

const devices: Device[] = [
  { id: 'demo-phone', name: 'iPhone von Michi', type: 'Smartphone', is_active: true, volume_percent: 100, supports_volume: false },
  { id: 'demo-pc', name: 'Michis PC', type: 'Computer', is_active: false, volume_percent: 70, supports_volume: true },
  { id: 'demo-speaker', name: 'Wohnzimmer', type: 'Speaker', is_active: false, volume_percent: 45, supports_volume: true },
]

const player = {
  deviceId: 'demo-phone' as string | null,
  playing: false,
  contextUri: `spotify:playlist:${playlists[0].id}` as string | null,
  list: playlists[0].trackIds.map((t) => t.id),
  index: 0,
  currentId: playlists[0].trackIds[0].id,
  pos: 47_000,
  startedAt: Date.now(),
  shuffle: false,
  repeat: 'off' as RepeatState,
  userQueue: [] as string[],
}

function currentDuration() {
  return tracks.get(player.currentId)?.duration_ms ?? 180_000
}

function sync() {
  const now = Date.now()
  if (player.playing) {
    player.pos += now - player.startedAt
    let guard = 0
    while (player.pos >= currentDuration() && guard++ < 50) {
      player.pos -= currentDuration()
      if (!goNext(true)) {
        player.pos = 0
        player.playing = false
        break
      }
    }
  }
  player.startedAt = now
}

function goNext(auto = false): boolean {
  if (auto && player.repeat === 'track') return true
  if (player.userQueue.length) {
    player.currentId = player.userQueue.shift()!
    return true
  }
  if (!player.list.length) return false
  let next = player.shuffle ? Math.floor(Math.random() * player.list.length) : player.index + 1
  if (player.shuffle && player.list.length > 1 && next === player.index) next = (next + 1) % player.list.length
  if (next >= player.list.length) {
    if (player.repeat === 'off' && auto) return false
    next = 0
  }
  player.index = next
  player.currentId = player.list[next]
  return true
}

function contextTrackIds(uri: string): string[] {
  const [, type, id] = uri.split(':')
  if (type === 'playlist') return playlists.find((p) => p.id === id)?.trackIds.map((t) => t.id) ?? []
  if (type === 'album') return albums.find((a) => a.id === id)?.trackIds ?? []
  if (type === 'artist') return albums.filter((a) => a.artists[0].id === id).flatMap((a) => a.trackIds)
  if (uri.endsWith(':collection')) return savedTrackIds()
  return []
}

function savedTrackIds() {
  return [...library]
    .filter((u) => u.startsWith('spotify:track:'))
    .sort((a, b) => (libraryAddedAt.get(b) ?? '').localeCompare(libraryAddedAt.get(a) ?? ''))
    .map((u) => u.split(':')[2])
}

function playbackState(): PlaybackState | undefined {
  sync()
  const device = devices.find((d) => d.id === player.deviceId)
  if (!device) return undefined
  const ctxType = player.contextUri?.endsWith(':collection') ? 'collection' : player.contextUri?.split(':')[1]
  return {
    device: { ...device, is_active: true },
    is_playing: player.playing,
    shuffle_state: player.shuffle,
    repeat_state: player.repeat,
    progress_ms: Math.round(player.pos),
    timestamp: Date.now(),
    item: tracks.get(player.currentId) ?? null,
    context: player.contextUri ? { uri: player.contextUri, type: ctxType ?? 'playlist' } : null,
    currently_playing_type: 'track',
  }
}

function requireDevice(deviceId?: string) {
  if (deviceId) {
    if (!devices.some((d) => d.id === deviceId)) throw new ApiError(404, 'Device not found')
    activate(deviceId)
  }
  if (!player.deviceId) throw new ApiError(404, 'No active device found', 'NO_ACTIVE_DEVICE')
}

function activate(deviceId: string) {
  player.deviceId = deviceId
  devices.forEach((d) => (d.is_active = d.id === deviceId))
}

// ---------- Suche ----------

function matches(text: string, q: string) {
  return text.toLowerCase().includes(q)
}

function search(qRaw: string, types: string[], offset: number) {
  const artistFilter = /artist:"([^"]+)"/i.exec(qRaw)?.[1]?.toLowerCase()
  const q = qRaw.replace(/artist:"[^"]+"/i, '').trim().toLowerCase()
  const result: Record<string, unknown> = {}
  const fits = (name: string, artistsOf: ArtistRef[]) =>
    (!artistFilter || artistsOf.some((a) => a.name.toLowerCase() === artistFilter)) &&
    (!q || matches(name, q) || artistsOf.some((a) => matches(a.name, q)))

  if (types.includes('track')) result.tracks = paging([...tracks.values()].filter((t) => fits(t.name, t.artists)), offset, 10)
  if (types.includes('artist'))
    result.artists = paging(
      artists.filter((a) => (artistFilter ? a.name.toLowerCase() === artistFilter : matches(a.name, q) || a.genres!.some((g) => matches(g, q)))),
      offset,
      10,
    )
  if (types.includes('album')) result.albums = paging(albums.filter((a) => fits(a.name, a.artists)).map(albumRef), offset, 10)
  if (types.includes('playlist'))
    result.playlists = paging(
      playlists.filter((p) => !artistFilter && (matches(p.name, q) || matches(p.description, q))).map((p) => playlistObject(p)),
      offset,
      10,
    )
  return result
}

// ---------- Anfragen beantworten ----------

type Q = Record<string, unknown>

export function demoRequest(method: string, path: string, query: Q, body: unknown): unknown {
  const num = (k: string, d: number) => (query[k] !== undefined ? Number(query[k]) : d)
  const offset = num('offset', 0)
  const limit = num('limit', 20)
  const b = (body ?? {}) as Record<string, unknown>
  let m: RegExpExecArray | null

  const route = `${method} ${path}`

  if (route === 'GET /me') return ME
  if (route === 'GET /me/playlists') return paging(playlists.map((p) => playlistObject(p)), offset, limit)
  if (route === 'POST /me/playlists') {
    const p: DemoPlaylist = {
      id: `demoplaylist${playlists.length}`,
      name: String(b.name || 'Neue Playlist'),
      description: String(b.description || ''),
      owner: { id: ME.id, display_name: ME.display_name! },
      trackIds: [],
      image: cover(`new${playlists.length}`, String(b.name || 'Neue Playlist')),
    }
    playlists.unshift(p)
    return playlistObject(p)
  }
  if (route === 'GET /me/tracks') {
    const items = savedTrackIds().map((id) => ({ added_at: libraryAddedAt.get(`spotify:track:${id}`)!, track: tracks.get(id)! }))
    return paging(items, offset, limit)
  }
  if (route === 'GET /me/albums') {
    const items = albums
      .filter((a) => library.has(a.uri))
      .map((a) => ({ added_at: libraryAddedAt.get(a.uri)!, album: albumObject(a) }))
    return paging(items, offset, limit)
  }
  if (route === 'GET /me/following') {
    const items = artists.filter((a) => library.has(a.uri))
    return { artists: { ...paging(items, 0, 50), next: null, cursors: {} } }
  }
  if (route === 'GET /me/top/artists') return paging(shuffled(artists), 0, limit)
  if (route === 'GET /me/top/tracks') return paging(shuffled(allTrackIds).map((id) => tracks.get(id)!), 0, limit)
  if (route === 'GET /me/player/recently-played')
    return { items: recent.map((r) => ({ track: tracks.get(r.id)!, played_at: r.played_at, context: null })) }

  if (route === 'GET /me/library/contains') return String(query.uris || '').split(',').map((u) => library.has(u))
  if (route === 'PUT /me/library' || route === 'DELETE /me/library') {
    for (const uri of String(query.uris || '').split(',').filter(Boolean)) {
      if (method === 'PUT') {
        library.add(uri)
        libraryAddedAt.set(uri, new Date().toISOString())
      } else library.delete(uri)
    }
    return undefined
  }

  if ((m = /^GET \/playlists\/([^/]+)$/.exec(route))) {
    const p = playlists.find((x) => x.id === m![1])
    if (!p) throw new ApiError(404, 'Playlist nicht gefunden')
    return playlistObject(p, true)
  }
  if ((m = /^(GET|POST|DELETE) \/playlists\/([^/]+)\/items$/.exec(route))) {
    const p = playlists.find((x) => x.id === m![2])
    if (!p) throw new ApiError(404, 'Playlist nicht gefunden')
    if (method === 'GET') return paging(entriesOf(p), offset, num('limit', 100))
    if (method === 'POST') {
      for (const uri of (b.uris as string[]) ?? []) p.trackIds.push({ id: uri.split(':')[2], added_at: new Date().toISOString() })
      return { snapshot_id: String(Date.now()) }
    }
    const remove = new Set(((b.items as { uri: string }[]) ?? []).map((x) => x.uri.split(':')[2]))
    p.trackIds = p.trackIds.filter((t) => !remove.has(t.id))
    return { snapshot_id: String(Date.now()) }
  }

  if ((m = /^GET \/albums\/([^/]+)(\/tracks)?$/.exec(route))) {
    const a = albums.find((x) => x.id === m![1])
    if (!a) throw new ApiError(404, 'Album nicht gefunden')
    return m[2] ? albumObject(a).tracks : albumObject(a)
  }
  if ((m = /^GET \/artists\/([^/]+)(\/albums)?$/.exec(route))) {
    const a = artists.find((x) => x.id === m![1])
    if (!a) throw new ApiError(404, 'Künstler nicht gefunden')
    return m[2] ? paging(albums.filter((x) => x.artists[0].id === a.id).map(albumRef), 0, 50) : a
  }
  if (route === 'GET /search') return search(String(query.q || ''), String(query.type || '').split(','), offset)

  // Wiedergabe
  if (route === 'GET /me/player') return playbackState()
  if (route === 'GET /me/player/devices') return { devices: devices.map((d) => ({ ...d, is_active: d.id === player.deviceId })) }
  if (route === 'GET /me/player/queue') {
    sync()
    const upcoming = [...player.userQueue, ...player.list.slice(player.index + 1), ...player.list.slice(0, player.index)].slice(0, 20)
    return { currently_playing: tracks.get(player.currentId) ?? null, queue: upcoming.map((id) => tracks.get(id)!) }
  }
  if (route === 'PUT /me/player') {
    const id = (b.device_ids as string[])[0]
    sync()
    activate(id)
    if (b.play) player.playing = true
    return undefined
  }
  if (route === 'PUT /me/player/play') {
    requireDevice(query.device_id as string | undefined)
    sync()
    if (b.context_uri || b.uris) {
      const uris = b.uris as string[] | undefined
      player.contextUri = (b.context_uri as string) ?? null
      player.list = uris ? uris.map((u) => u.split(':')[2]) : contextTrackIds(b.context_uri as string)
      const off = b.offset as { position?: number; uri?: string } | undefined
      let index = off?.uri ? player.list.indexOf(off.uri.split(':')[2]) : (off?.position ?? 0)
      if (player.shuffle && !off) index = Math.floor(Math.random() * player.list.length)
      player.index = Math.max(0, index)
      player.currentId = player.list[player.index]
      player.pos = Number(b.position_ms ?? 0)
    }
    player.playing = true
    player.startedAt = Date.now()
    return undefined
  }
  if (route === 'PUT /me/player/pause') {
    requireDevice()
    sync()
    player.playing = false
    return undefined
  }
  if (route === 'POST /me/player/next' || route === 'POST /me/player/previous') {
    requireDevice()
    sync()
    if (method === 'POST' && path.endsWith('next')) goNext()
    else if (player.pos > 3000 || player.index === 0) player.pos = 0
    else {
      player.index -= 1
      player.currentId = player.list[player.index]
    }
    player.pos = 0
    return undefined
  }
  if (route === 'PUT /me/player/seek') {
    requireDevice()
    sync()
    player.pos = Math.min(num('position_ms', 0), currentDuration() - 1000)
    return undefined
  }
  if (route === 'PUT /me/player/volume') {
    requireDevice()
    const d = devices.find((x) => x.id === player.deviceId)!
    if (!d.supports_volume) throw new ApiError(403, 'Cannot control device volume', 'VOLUME_CONTROL_DISALLOW')
    d.volume_percent = num('volume_percent', 50)
    return undefined
  }
  if (route === 'PUT /me/player/shuffle') {
    player.shuffle = query.state === true || query.state === 'true'
    return undefined
  }
  if (route === 'PUT /me/player/repeat') {
    player.repeat = (query.state as RepeatState) ?? 'off'
    return undefined
  }
  if (route === 'POST /me/player/queue') {
    requireDevice()
    player.userQueue.push(String(query.uri).split(':')[2])
    return undefined
  }

  throw new ApiError(404, `Demo kennt ${route} nicht`)
}
