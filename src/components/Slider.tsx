import { useRef, useState } from 'react'

interface Props {
  value: number
  max: number
  onCommit: (value: number) => void
  onPreview?: (value: number | null) => void
  label: string
  alwaysThumb?: boolean
  disabled?: boolean
}

/** Schieberegler im Spotify-Stil (Fortschritt, Lautstärke). Funktioniert mit Maus und Finger. */
export function Slider({ value, max, onCommit, onPreview, label, alwaysThumb, disabled }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<number | null>(null)
  const shown = drag ?? value
  const pct = max > 0 ? Math.min(100, Math.max(0, (shown / max) * 100)) : 0

  const valueAt = (clientX: number) => {
    const rect = ref.current!.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    return ratio * max
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || max <= 0) return
    e.preventDefault()
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    const v = valueAt(e.clientX)
    setDrag(v)
    onPreview?.(v)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (drag === null) return
    const v = valueAt(e.clientX)
    setDrag(v)
    onPreview?.(v)
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (drag === null) return
    const v = valueAt(e.clientX)
    setDrag(null)
    onPreview?.(null)
    onCommit(v)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    const step = max / 20
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onCommit(Math.min(max, value + step))
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onCommit(Math.max(0, value - step))
    else return
    e.preventDefault()
  }

  return (
    <div
      ref={ref}
      className={`slider${drag !== null ? ' dragging' : ''}${alwaysThumb ? ' always-thumb' : ''}`}
      style={{ '--pct': `${pct}%` } as React.CSSProperties}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(shown)}
      aria-disabled={disabled}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        setDrag(null)
        onPreview?.(null)
      }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={onKeyDown}
    >
      <div className="slider-track">
        <div className="slider-fill" />
      </div>
      <div className="slider-thumb" />
    </div>
  )
}
