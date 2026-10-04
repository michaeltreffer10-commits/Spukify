import { Heart } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { setSaved, useSaved } from '../lib/savedStore'
import { useUi } from '../state/ui'

interface Props {
  uri: string | undefined
  size?: number
  className?: string
  /** Text für Hinweise, z. B. „Lieblingssongs“ oder „Bibliothek“ */
  kind?: 'track' | 'album' | 'playlist' | 'artist'
}

const MESSAGES = {
  track: ['Zu Lieblingssongs hinzugefügt', 'Aus Lieblingssongs entfernt'],
  album: ['Zur Bibliothek hinzugefügt', 'Aus der Bibliothek entfernt'],
  playlist: ['Zur Bibliothek hinzugefügt', 'Aus der Bibliothek entfernt'],
  artist: ['Du folgst jetzt diesem Künstler', 'Du folgst diesem Künstler nicht mehr'],
}

export function useToggleSaved(kind: Props['kind'] = 'track') {
  const queryClient = useQueryClient()
  const { toast } = useUi()
  return async (uri: string, value: boolean) => {
    try {
      await setSaved(uri, value)
      toast(MESSAGES[kind][value ? 0 : 1])
      const keys = { track: ['savedTracks'], album: ['savedAlbums'], playlist: ['myPlaylists'], artist: ['followedArtists'] }[kind]
      queryClient.invalidateQueries({ queryKey: keys })
    } catch {
      toast('Das hat leider nicht geklappt.')
    }
  }
}

export function LikeButton({ uri, size = 18, className = '', kind = 'track' }: Props) {
  const saved = useSaved(uri)
  const toggle = useToggleSaved(kind)
  if (!uri) return null
  return (
    <button
      type="button"
      className={`icon-btn like-btn${saved ? ' on' : ''} ${className}`}
      aria-label={saved ? 'Aus Bibliothek entfernen' : 'Speichern'}
      aria-pressed={!!saved}
      onClick={(e) => {
        e.stopPropagation()
        toggle(uri, !saved)
      }}
    >
      <Heart size={size} fill={saved ? 'currentColor' : 'none'} />
    </button>
  )
}
