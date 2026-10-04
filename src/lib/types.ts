// Schlanke Typen für die Teile der Spotify Web API, die Spukify nutzt.

export interface SpotifyImage {
  url: string
  width?: number | null
  height?: number | null
}

export interface ArtistRef {
  id: string
  name: string
  uri: string
}

export interface Artist extends ArtistRef {
  images?: SpotifyImage[]
  genres?: string[]
  type: 'artist'
}

export interface AlbumRef {
  id: string
  name: string
  uri: string
  images: SpotifyImage[]
  artists: ArtistRef[]
  album_type?: string
  release_date?: string
  total_tracks?: number
  type: 'album'
}

export interface Album extends AlbumRef {
  tracks?: Paging<Track>
}

export interface Track {
  id: string
  name: string
  uri: string
  duration_ms: number
  explicit?: boolean
  artists: ArtistRef[]
  album?: AlbumRef
  track_number?: number
  is_playable?: boolean
  is_local?: boolean
  type: 'track' | 'episode'
}

export interface Paging<T> {
  items: T[]
  total: number
  limit: number
  offset: number
  next: string | null
}

export interface User {
  id: string
  display_name: string | null
  images?: SpotifyImage[]
}

export interface PlaylistItemsRef {
  total: number
  href?: string
}

export interface Playlist {
  id: string
  name: string
  uri: string
  description?: string | null
  images: SpotifyImage[] | null
  owner: { id: string; display_name: string | null }
  collaborative?: boolean
  public?: boolean | null
  // Seit Februar 2026 heißt das Feld "items" (früher "tracks").
  items?: PlaylistItemsRef | Paging<PlaylistEntry>
  tracks?: PlaylistItemsRef | Paging<PlaylistEntry>
  type: 'playlist'
}

export interface PlaylistEntry {
  added_at?: string
  // Seit Februar 2026 heißt das Feld "item" (früher "track").
  item?: Track | null
  track?: Track | null
}

export interface SavedTrack {
  added_at: string
  track: Track
}

export interface SavedAlbum {
  added_at: string
  album: Album
}

export interface PlayHistory {
  track: Track
  played_at: string
  context?: { uri: string; type: string } | null
}

export interface Device {
  id: string | null
  name: string
  type: string
  is_active: boolean
  is_restricted?: boolean
  volume_percent: number | null
  supports_volume?: boolean
}

export type RepeatState = 'off' | 'context' | 'track'

export interface PlaybackState {
  device: Device
  is_playing: boolean
  shuffle_state: boolean
  repeat_state: RepeatState
  progress_ms: number | null
  timestamp?: number
  item: Track | null
  context?: { uri: string; type: string } | null
  currently_playing_type?: string
}

export interface QueueState {
  currently_playing: Track | null
  queue: Track[]
}

export interface SearchResults {
  tracks?: Paging<Track>
  artists?: Paging<Artist>
  albums?: Paging<AlbumRef>
  playlists?: Paging<Playlist | null>
}

/** Alles, was als Karte/Kachel angezeigt werden kann. */
export type MediaItem = Playlist | AlbumRef | Artist
