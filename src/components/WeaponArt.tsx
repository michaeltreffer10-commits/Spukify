import { memo, useId } from 'react'
import { SHAPES, STICKER_SPOTS, patternMarkup } from '../game/art'
import type { Skin } from '../game/data'

interface Props {
  skin: Skin
  /** Abnutzung 0–1, macht den Skin etwas matter */
  float?: number
  className?: string
}

function WeaponArtImpl({ skin, float, className }: Props) {
  const raw = useId()
  const id = 'w' + raw.replace(/[^a-zA-Z0-9]/g, '')
  const parts = SHAPES[skin.shape]
  const wear = float ?? 0.2
  const style = { filter: `saturate(${1 - wear * 0.35}) brightness(${1 - wear * 0.18})` }

  return (
    <svg className={className} viewBox="0 0 256 112" style={style} aria-hidden="true">
      <defs dangerouslySetInnerHTML={{ __html: patternMarkup(`${id}p`, skin.pattern, skin.colors) }} />
      <defs>
        <linearGradient id={`${id}s`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="112">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id={`${id}h`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff4d4d" />
          <stop offset="0.25" stopColor="#ffe14d" />
          <stop offset="0.5" stopColor="#4dff9a" />
          <stop offset="0.75" stopColor="#4db8ff" />
          <stop offset="1" stopColor="#d44dff" />
        </linearGradient>
      </defs>
      <g stroke="rgba(0,0,0,0.55)" strokeWidth="1.5" strokeLinejoin="round">
        {parts.map((p, i) => (
          <path key={i} d={p.d} fill={`url(#${id}p)`} fillRule={p.evenOdd ? 'evenodd' : 'nonzero'} />
        ))}
      </g>
      <g>
        {parts.map((p, i) => (
          <path key={i} d={p.d} fill={`url(#${id}s)`} fillRule={p.evenOdd ? 'evenodd' : 'nonzero'} />
        ))}
      </g>
      {skin.stickers && (
        <g stroke="#fff" strokeWidth="1.2">
          {STICKER_SPOTS.map(({ x, y, r }) => (
            <g key={x}>
              <circle cx={x} cy={y} r={r} fill={`url(#${id}h)`} />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff" stroke="none">
                R
              </text>
            </g>
          ))}
        </g>
      )}
    </svg>
  )
}

export const WeaponArt = memo(WeaponArtImpl)

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
