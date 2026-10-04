// Ausklapp-Menüs („Sheets“) und Dialoge: Geräteauswahl, Song-Menü, Playlist-Auswahl, Hinweise.

import { Check, Disc3, ExternalLink, Heart, Link2, ListEnd, ListPlus, Plus, RefreshCw, Smartphone, Trash2, UserRound } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { artistNames } from '../lib/format'
import { useDevices, useMe, useMyPlaylists } from '../lib/queries'
import { useSaved } from '../lib/savedStore'
import { api, isDemoMode } from '../lib/spotify'
import { usePlayer } from '../state/player'
import { useUi } from '../state/ui'
import { Cover } from './Cover'
import { useToggleSaved } from './LikeButton'
import { DeviceIcon } from './PlayerControls'

export function Sheet({ onClose, children, label }: { onClose: () => void; children: ReactNode; label: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={label} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        {children}
      </div>
    </div>
  )
}

/** Öffnet die Spotify-App (Handy) bzw. die Desktop-App, damit sie als Gerät erscheint. */
export function openSpotifyApp() {
  window.location.href = 'spotify:'
}

export function DevicePicker() {
  const { devicePickerOpen, devicePickerHint, closeDevicePicker } = useUi()
  const player = usePlayer()
  const devices = useDevices(devicePickerOpen)
  if (!devicePickerOpen) return null
  const list = devices.data?.devices ?? []
  const activeId = player.state?.device.id

  return (
    <Sheet onClose={closeDevicePicker} label="Gerät auswählen">
      <div className="sheet-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Mit einem Gerät verbinden
        <button type="button" className="icon-btn" aria-label="Aktualisieren" onClick={() => devices.refetch()}>
          <RefreshCw size={18} className={devices.isFetching ? 'spin' : ''} />
        </button>
      </div>
      {devicePickerHint && <div className="sheet-hint">{devicePickerHint}</div>}
      {devices.isLoading && (
        <div className="center" style={{ padding: 24 }}>
          <div className="spinner" />
        </div>
      )}
      {list.map((d) => {
        const active = d.id === activeId || (!activeId && d.is_active)
        return (
          <button
            key={d.id ?? d.name}
            type="button"
            className={`menu-item${active ? ' active' : ''}`}
            disabled={!d.id || d.is_restricted}
            onClick={async () => {
              if (!d.id) return
              closeDevicePicker()
              if (!active) await player.transferTo(d.id, true)
            }}
          >
            <DeviceIcon type={d.type} size={24} />
            <div className="menu-item-text">
              <div className="ellipsis">{d.name}</div>
              <div className="menu-item-sub">
                {active ? 'Aktuelles Gerät' : d.is_restricted ? 'Kann nicht ferngesteuert werden' : 'Spotify Connect'}
              </div>
            </div>
            {active && <Check size={20} />}
          </button>
        )
      })}
      {!devices.isLoading && list.length === 0 && (
        <div className="sheet-hint">
          Keine Geräte gefunden. Öffne Spotify auf deinem Handy, PC oder Lautsprecher – danach taucht das Gerät hier auf.
        </div>
      )}
      {!isDemoMode() && (
        <button type="button" className="menu-item" onClick={openSpotifyApp}>
          <Smartphone size={24} />
          <div className="menu-item-text">
            <div>Spotify-App öffnen</div>
            <div className="menu-item-sub">Danach hierher zurückkehren und das Gerät wählen</div>
          </div>
        </button>
      )}
      <div className="sheet-hint" style={{ marginTop: 8, marginBottom: 0 }}>
        Tipp: Lossless stellst du in der Spotify-App unter Einstellungen → Audioqualität ein. Spukify steuert die App nur –
        die Qualität bleibt erhalten.
      </div>
    </Sheet>
  )
}

export function TrackMenu() {
  const { trackMenu, closeTrackMenu, openAddToPlaylist, toast } = useUi()
  const player = usePlayer()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const saved = useSaved(trackMenu?.track.uri)
  const toggleSaved = useToggleSaved('track')
  if (!trackMenu) return null
  const { track, playlistId } = trackMenu

  const go = (to: string) => {
    closeTrackMenu()
    navigate(to)
  }
  const shareUrl = `https://open.spotify.com/track/${track.id}`

  return (
    <Sheet onClose={closeTrackMenu} label="Song-Optionen">
      <div className="sheet-head">
        <Cover images={track.album?.images} size={64} />
        <div style={{ minWidth: 0 }}>
          <div className="ellipsis" style={{ fontWeight: 600 }}>
            {track.name}
          </div>
          <div className="ellipsis muted" style={{ fontSize: 13 }}>
            {artistNames(track.artists)}
          </div>
        </div>
      </div>
      <button
        type="button"
        className="menu-item"
        onClick={() => {
          closeTrackMenu()
          toggleSaved(track.uri, !saved)
        }}
      >
        <Heart size={22} fill={saved ? 'var(--accent)' : 'none'} color={saved ? 'var(--accent)' : undefined} />
        {saved ? 'Aus Lieblingssongs entfernen' : 'Zu Lieblingssongs hinzufügen'}
      </button>
      <button type="button" className="menu-item" onClick={() => openAddToPlaylist(track)}>
        <ListPlus size={22} /> Zu Playlist hinzufügen
      </button>
      {playlistId && (
        <button
          type="button"
          className="menu-item"
          onClick={async () => {
            closeTrackMenu()
            try {
              await api.removeFromPlaylist(playlistId, [track.uri])
              toast('Aus der Playlist entfernt')
              queryClient.invalidateQueries({ queryKey: ['playlistItems', playlistId] })
              queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] })
            } catch {
              toast('Entfernen hat nicht geklappt.')
            }
          }}
        >
          <Trash2 size={22} /> Aus dieser Playlist entfernen
        </button>
      )}
      <button
        type="button"
        className="menu-item"
        onClick={() => {
          closeTrackMenu()
          player.addToQueue(track.uri)
        }}
      >
        <ListEnd size={22} /> Zur Warteschlange hinzufügen
      </button>
      {track.artists[0]?.id && (
        <button type="button" className="menu-item" onClick={() => go(`/kuenstler/${track.artists[0].id}`)}>
          <UserRound size={22} /> Zum Künstler
        </button>
      )}
      {track.album?.id && (
        <button type="button" className="menu-item" onClick={() => go(`/album/${track.album!.id}`)}>
          <Disc3 size={22} /> Zum Album
        </button>
      )}
      {!isDemoMode() && (
        <>
          <button
            type="button"
            className="menu-item"
            onClick={async () => {
              closeTrackMenu()
              try {
                if (navigator.share) await navigator.share({ title: track.name, url: shareUrl })
                else {
                  await navigator.clipboard.writeText(shareUrl)
                  toast('Link kopiert')
                }
              } catch {
                // Teilen abgebrochen
              }
            }}
          >
            <Link2 size={22} /> Teilen / Link kopieren
          </button>
          <a className="menu-item" href={`spotify:track:${track.id}`} onClick={closeTrackMenu}>
            <ExternalLink size={22} /> In Spotify öffnen
          </a>
        </>
      )}
    </Sheet>
  )
}

export function AddToPlaylistSheet() {
  const { addToPlaylist, closeAddToPlaylist, toast, setCreatePlaylistOpen } = useUi()
  const me = useMe()
  const playlists = useMyPlaylists()
  const queryClient = useQueryClient()
  if (!addToPlaylist) return null
  const own = (playlists.data ?? []).filter((p) => p.owner?.id === me.data?.id || p.collaborative)

  return (
    <Sheet onClose={closeAddToPlaylist} label="Zu Playlist hinzufügen">
      <div className="sheet-title">Zu Playlist hinzufügen</div>
      <button
        type="button"
        className="menu-item"
        onClick={() => {
          setCreatePlaylistOpen(true)
        }}
      >
        <div className="cover" style={{ width: 48, height: 48 }}>
          <Plus size={24} />
        </div>
        Neue Playlist
      </button>
      {playlists.isLoading && (
        <div className="center" style={{ padding: 24 }}>
          <div className="spinner" />
        </div>
      )}
      {own.map((p) => (
        <button
          key={p.id}
          type="button"
          className="menu-item"
          onClick={async () => {
            closeAddToPlaylist()
            try {
              await api.addToPlaylist(p.id, [addToPlaylist.uri])
              toast(`Zu „${p.name}“ hinzugefügt`)
              queryClient.invalidateQueries({ queryKey: ['playlistItems', p.id] })
              queryClient.invalidateQueries({ queryKey: ['playlist', p.id] })
              queryClient.invalidateQueries({ queryKey: ['myPlaylists'] })
            } catch {
              toast('Hinzufügen hat nicht geklappt.')
            }
          }}
        >
          <Cover images={p.images} size={64} className="" />
          <div className="menu-item-text ellipsis">{p.name}</div>
        </button>
      ))}
    </Sheet>
  )
}

export function CreatePlaylistDialog() {
  const { createPlaylistOpen, setCreatePlaylistOpen, addToPlaylist, closeAddToPlaylist, toast } = useUi()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  if (!createPlaylistOpen) return null

  const close = () => {
    setCreatePlaylistOpen(false)
    setName('')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const playlist = await api.createPlaylist(name.trim() || 'Meine Playlist')
      if (addToPlaylist) {
        await api.addToPlaylist(playlist.id, [addToPlaylist.uri])
        closeAddToPlaylist()
        toast(`„${playlist.name}“ erstellt und Song hinzugefügt`)
      } else {
        toast(`„${playlist.name}“ erstellt`)
        navigate(`/playlist/${playlist.id}`)
      }
      queryClient.invalidateQueries({ queryKey: ['myPlaylists'] })
      close()
    } catch {
      toast('Die Playlist konnte nicht erstellt werden.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet onClose={close} label="Neue Playlist">
      <form onSubmit={submit} style={{ padding: '8px 16px 8px' }}>
        <div className="sheet-title" style={{ padding: '8px 0 16px' }}>
          Neue Playlist
        </div>
        <input
          className="input"
          autoFocus
          placeholder="Name der Playlist"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
        />
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" className="pill-btn secondary small" onClick={close}>
            Abbrechen
          </button>
          <button type="submit" className="pill-btn small" disabled={busy}>
            Erstellen
          </button>
        </div>
      </form>
    </Sheet>
  )
}

export function Toasts() {
  const { toasts } = useUi()
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          {t.text}
        </div>
      ))}
    </div>
  )
}
