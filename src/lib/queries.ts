// React-Query-Hooks: laden Daten von Spotify und halten sie im Zwischenspeicher.

import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { api, entryTrack } from './spotify'
import type { Artist, Paging, PlaylistEntry, SavedTrack } from './types'

const nextOffset = <T,>(page: Paging<T>) => (page.next ? page.offset + page.limit : undefined)

export const useMe = () => useQuery({ queryKey: ['me'], queryFn: api.me, staleTime: Infinity })

export const useMyPlaylists = () =>
  useQuery({ queryKey: ['myPlaylists'], queryFn: api.allMyPlaylists, staleTime: 60_000 })

export const useSavedTracks = () =>
  useInfiniteQuery({
    queryKey: ['savedTracks'],
    queryFn: ({ pageParam }) => api.savedTracks(pageParam, 50),
    initialPageParam: 0,
    getNextPageParam: (page: Paging<SavedTrack>) => nextOffset(page),
    staleTime: 30_000,
  })

export const useSavedAlbums = () =>
  useQuery({
    queryKey: ['savedAlbums'],
    queryFn: async () => {
      const first = await api.savedAlbums(0, 50)
      const items = [...first.items]
      for (let offset = 50; offset < Math.min(first.total, 300); offset += 50) items.push(...(await api.savedAlbums(offset, 50)).items)
      return items
    },
    staleTime: 60_000,
  })

export const useFollowedArtists = () =>
  useQuery({ queryKey: ['followedArtists'], queryFn: api.followedArtists, staleTime: 60_000 })

export const useTopArtists = () =>
  useQuery({ queryKey: ['topArtists'], queryFn: () => api.topArtists('short_term', 20), staleTime: 10 * 60_000, retry: false })

export const useTopTracks = () =>
  useQuery({ queryKey: ['topTracks'], queryFn: () => api.topTracks('short_term', 20), staleTime: 10 * 60_000, retry: false })

export const useRecentlyPlayed = () =>
  useQuery({ queryKey: ['recentlyPlayed'], queryFn: () => api.recentlyPlayed(50), staleTime: 60_000, retry: false })

export const usePlaylist = (id: string | undefined) =>
  useQuery({ queryKey: ['playlist', id], queryFn: () => api.playlist(id!), enabled: !!id, staleTime: 30_000 })

export const usePlaylistItems = (id: string | undefined, enabled = true) =>
  useInfiniteQuery({
    queryKey: ['playlistItems', id],
    queryFn: ({ pageParam }) => api.playlistItems(id!, pageParam, 100),
    initialPageParam: 0,
    getNextPageParam: (page: Paging<PlaylistEntry>) => nextOffset(page),
    enabled: !!id && enabled,
    staleTime: 30_000,
    retry: false,
    select: (data) => ({
      ...data,
      entries: data.pages.flatMap((p) => p.items).filter((e) => entryTrack(e)),
    }),
  })

export const useAlbum = (id: string | undefined) =>
  useQuery({
    queryKey: ['album', id],
    queryFn: async () => {
      const album = await api.album(id!)
      // Lange Alben: restliche Songs nachladen
      const tracks = album.tracks
      if (tracks && tracks.next) {
        for (let offset = tracks.items.length; offset < tracks.total; offset += 50) {
          tracks.items.push(...(await api.albumTracks(id!, offset, 50)).items)
        }
      }
      return album
    },
    enabled: !!id,
    staleTime: 5 * 60_000,
  })

export const useArtist = (id: string | undefined) =>
  useQuery({ queryKey: ['artist', id], queryFn: () => api.artist(id!), enabled: !!id, staleTime: 5 * 60_000 })

export const useArtistAlbums = (artist: Artist | undefined) =>
  useQuery({
    queryKey: ['artistAlbums', artist?.id],
    queryFn: () => api.artistAlbums(artist!),
    enabled: !!artist,
    staleTime: 5 * 60_000,
    retry: false,
  })

export const useArtistPopular = (artist: Artist | undefined) =>
  useQuery({
    queryKey: ['artistPopular', artist?.id],
    queryFn: () => api.artistPopularTracks(artist!),
    enabled: !!artist,
    staleTime: 5 * 60_000,
    retry: false,
  })

export const useSearch = (q: string, types: string[], enabled = true) =>
  useQuery({
    queryKey: ['search', q, types.join(',')],
    queryFn: () => api.search(q, types),
    enabled: enabled && q.trim().length > 0,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  })

export const useQueue = (enabled: boolean) =>
  useQuery({ queryKey: ['queue'], queryFn: api.queue, enabled, refetchInterval: 5000, retry: false })

export const useDevices = (enabled: boolean) =>
  useQuery({ queryKey: ['devices'], queryFn: api.devices, enabled, refetchInterval: enabled ? 4000 : false })
