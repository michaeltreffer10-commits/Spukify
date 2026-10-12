import { memo, useId } from 'react'
import { patternMarkup } from '../game/art'
import type { Skin } from '../game/data'
import { MAT_COLORS, MODELS } from '../game/models'
import { getSticker, stickerMarkup } from '../game/stickers'
import type { StickerDef } from '../game/stickers'

interface Props {
  skin: Skin
  /** Abnutzung 0–1, macht den Skin etwas matter */
  float?: number
  /** Aufgeklebte Sticker (bis zu 4, `null` = leerer Platz) */
  stickers?: (string | null)[]
  className?: string
}

function cleanId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, '')
}

function WeaponArtImpl({ skin, float, stickers, className }: Props) {
  const id = 'w' + cleanId(useId())
  const model = MODELS[skin.model]
  const wear = float ?? 0.2
  const style = { filter: `saturate(${1 - wear * 0.35}) brightness(${1 - wear * 0.15})` }
  const applied = skin.builtInStickers ?? stickers ?? []
  const spots = model.stickers ?? []

  const fill = (mat: string | undefined) => (mat === 'metal' ? `url(#${id}m)` : mat === 'dark' ? `url(#${id}d)` : `url(#${id}p)`)

  return (
    <svg className={className} viewBox="0 0 256 112" style={style} aria-hidden="true">
      <defs dangerouslySetInnerHTML={{ __html: patternMarkup(`${id}p`, skin.pattern, skin.colors) }} />
      <defs>
        <linearGradient id={`${id}m`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={MAT_COLORS.metal[0]} />
          <stop offset="1" stopColor={MAT_COLORS.metal[1]} />
        </linearGradient>
        <linearGradient id={`${id}d`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={MAT_COLORS.dark[0]} />
          <stop offset="1" stopColor={MAT_COLORS.dark[1]} />
        </linearGradient>
        <linearGradient id={`${id}s`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="112">
          <stop offset="0" stopColor="#fff" stopOpacity="0.32" />
          <stop offset="0.42" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="0.6" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <g stroke="rgba(0,0,0,0.65)" strokeWidth="1.1" strokeLinejoin="round">
        {model.parts.map((p, i) => (
          <path key={i} d={p.d} transform={p.t} fill={fill(p.mat)} fillRule={p.evenOdd ? 'evenodd' : 'nonzero'} />
        ))}
      </g>
      <g pointerEvents="none">
        {model.parts.map((p, i) => (
          <path key={i} d={p.d} transform={p.t} fill={`url(#${id}s)`} fillRule={p.evenOdd ? 'evenodd' : 'nonzero'} />
        ))}
      </g>
      {model.details && (
        <path d={model.details} fill="none" stroke="rgba(0,0,0,0.42)" strokeWidth="0.9" strokeLinecap="round" pointerEvents="none" />
      )}
      {spots.map((spot, i) => {
        const sticker = applied[i] ? getSticker(applied[i]!) : undefined
        if (!sticker) return null
        return <StickerOnWeapon key={i} sticker={sticker} x={spot.x} y={spot.y} prefix={`${id}st${i}`} />
      })}
    </svg>
  )
}

function StickerOnWeapon({ sticker, x, y, prefix }: { sticker: StickerDef; x: number; y: number; prefix: string }) {
  const size = 17
  return (
    <g
      transform={`translate(${x - size / 2} ${y - size / 2}) scale(${size / 64})`}
      className={sticker.finish === 'holo' ? 'holo-shift' : undefined}
      dangerouslySetInnerHTML={{ __html: stickerMarkup(sticker, prefix) }}
    />
  )
}

export const WeaponArt = memo(WeaponArtImpl)

/** Ein einzelner Sticker */
export const StickerArt = memo(function StickerArt({ sticker, className }: { sticker: StickerDef; className?: string }) {
  const id = 'k' + cleanId(useId())
  return (
    <svg
      className={`${className ?? ''}${sticker.finish === 'holo' ? ' holo-shift' : ''}`}
      viewBox="-2 -2 68 68"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: stickerMarkup(sticker, id) }}
    />
  )
})

/** Eine Sticker-Kapsel */
export function CapsuleArt({ colors, label, className }: { colors: [string, string]; label: string; className?: string }) {
  const id = 'q' + cleanId(useId())
  const [dark, glow] = colors
  return (
    <svg className={className} viewBox="0 0 200 150" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={dark} />
          <stop offset="0.45" stopColor={glow} stopOpacity="0.85" />
          <stop offset="0.55" stopColor={glow} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="136" rx="62" ry="8" fill="#000" opacity="0.45" />
      <rect x="44" y="20" width="112" height="108" rx="40" fill={`url(#${id}b)`} stroke={glow} strokeWidth="2" />
      <rect x="44" y="66" width="112" height="14" fill="#0b0b10" opacity="0.7" />
      <rect x="54" y="26" width="92" height="30" rx="15" fill={`url(#${id}g)`} />
      <text x="100" y="78" textAnchor="middle" fontSize="13" fontWeight="900" fill="#fff" letterSpacing="1">
        {label}
      </text>
    </svg>
  )
}

/** Der Schlüssel */
export function KeyArt({ color, className }: { color: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="20" cy="32" r="13" fill="none" stroke={color} strokeWidth="7" />
      <path d="M32 29 H58 V35 H54 V42 H48 V35 H44 V40 H38 V35 H32 Z" fill={color} />
    </svg>
  )
}

/** Der goldene Stern für unbekannte ★-Gegenstände im Band */
export function StarArt({ className }: { className?: string }) {
  const raw = useId()
  const id = 's' + raw.replace(/[^a-zA-Z0-9]/g, '')
  return (
    <svg className={className} viewBox="0 0 256 112" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset="0.5" stopColor="#e4ae39" />
          <stop offset="1" stopColor="#8a5a12" />
        </linearGradient>
      </defs>
      <path
        d="M128 8 L141 42 L178 44 L149 67 L159 103 L128 82 L97 103 L107 67 L78 44 L115 42 Z"
        fill={`url(#${id})`}
        stroke="rgba(0,0,0,0.4)"
        strokeWidth="2"
      />
    </svg>
  )
}

/** Die Grafik einer Kiste */
export function CaseArt({ colors, label, className }: { colors: [string, string]; label: string; className?: string }) {
  const raw = useId()
  const id = 'c' + raw.replace(/[^a-zA-Z0-9]/g, '')
  const [dark, glow] = colors
  return (
    <svg className={className} viewBox="0 0 200 150" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={glow} stopOpacity="0.55" />
          <stop offset="0.35" stopColor={dark} />
          <stop offset="1" stopColor="#050508" />
        </linearGradient>
        <radialGradient id={`${id}g`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={glow} stopOpacity="0.9" />
          <stop offset="1" stopColor={glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="134" rx="80" ry="10" fill="#000" opacity="0.45" />
      <path d="M22 52 L178 52 L170 132 L30 132 Z" fill={`url(#${id}b)`} stroke={glow} strokeOpacity="0.6" strokeWidth="2" />
      <path d="M14 34 L186 34 L182 56 L18 56 Z" fill={dark} stroke={glow} strokeWidth="2" />
      <rect x="86" y="44" width="28" height="22" rx="4" fill="#0b0b10" stroke={glow} strokeWidth="2" />
      <circle cx="100" cy="55" r="4" fill={glow} />
      <circle cx="100" cy="95" r="28" fill={`url(#${id}g)`} opacity="0.5" />
      <text x="100" y="102" textAnchor="middle" fontSize="20" fontWeight="900" fill="#fff" letterSpacing="1">
        {label}
      </text>
      <path d="M30 70 L170 70" stroke={glow} strokeOpacity="0.35" strokeWidth="1.5" />
      <path d="M34 120 L166 120" stroke={glow} strokeOpacity="0.35" strokeWidth="1.5" />
    </svg>
  )
}
