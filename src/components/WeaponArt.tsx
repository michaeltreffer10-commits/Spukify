import { memo, useId } from 'react'
import type { ReactNode } from 'react'
import type { Pattern, Shape, Skin } from '../game/data'

// Alle Waffen sind selbst gezeichnete Silhouetten im Format 256 × 112.

interface Part {
  d: string
  evenOdd?: boolean
}

function rr(x: number, y: number, w: number, h: number, r: number): string {
  return `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`
}

const SHAPES: Record<Shape, Part[]> = {
  rifle: [
    { d: 'M8 46 L64 40 L70 52 L66 60 L14 74 L8 68 Z' },
    { d: 'M62 38 L150 38 L152 55 L64 57 Z' },
    { d: 'M148 40 L198 41 L198 52 L150 55 Z' },
    { d: 'M196 43 L248 43 L248 48 L196 48 Z' },
    { d: 'M232 36 L238 36 L238 43 L232 43 Z' },
    { d: 'M136 32 L150 32 L150 38 L136 38 Z' },
    { d: 'M108 55 L126 55 Q130 75 142 92 L124 99 Q112 80 108 55 Z' },
    { d: 'M78 55 L92 55 L86 84 L72 82 Z' },
    { d: 'M92 56 L104 56 Q104 70 92 70 L90 66 Q98 66 98 60 L92 60 Z' },
  ],
  sniper: [
    { d: 'M6 48 L58 43 L64 58 L50 60 L44 76 L10 78 L6 70 Z' },
    { d: 'M58 42 L152 42 L152 58 L62 60 Z' },
    { d: 'M150 46 L252 46 L252 51 L150 52 Z' },
    { d: rr(84, 25, 60, 10, 3) },
    { d: 'M72 22 L86 24 L86 36 L72 38 Z' },
    { d: 'M142 24 L158 20 L158 40 L142 36 Z' },
    { d: 'M98 35 L104 35 L104 42 L98 42 Z' },
    { d: 'M124 35 L130 35 L130 42 L124 42 Z' },
    { d: 'M106 58 L122 58 L122 74 L106 74 Z' },
    { d: 'M70 58 L84 58 L80 84 L66 82 Z' },
  ],
  pistol: [
    { d: rr(54, 26, 150, 26, 4) },
    { d: 'M58 50 L150 50 L150 60 L64 60 Z' },
    { d: 'M60 56 L110 56 L102 102 L58 102 L52 96 Z' },
    { d: 'M108 58 L146 58 Q148 80 120 80 L108 80 Z M114 63 L138 63 Q138 74 120 74 L114 74 Z', evenOdd: true },
    { d: 'M190 20 L198 20 L198 26 L190 26 Z' },
  ],
  smg: [
    { d: rr(66, 32, 116, 28, 3) },
    { d: 'M180 39 L222 39 L222 51 L180 51 Z' },
    { d: 'M98 58 L122 58 L120 106 L96 106 Z' },
    { d: 'M30 36 L68 36 L68 41 L36 41 L36 54 L68 54 L68 59 L30 59 Z' },
    { d: 'M152 58 L164 58 L164 70 L152 70 Z' },
    { d: 'M72 26 L82 26 L82 32 L72 32 Z' },
    { d: 'M170 26 L176 26 L176 32 L170 32 Z' },
  ],
  shotgun: [
    { d: 'M6 52 L66 44 L70 58 L14 76 L6 70 Z' },
    { d: 'M64 42 L132 42 L132 58 L68 60 Z' },
    { d: 'M130 44 L250 44 L250 50 L130 50 Z' },
    { d: 'M130 52 L228 52 L228 57 L130 57 Z' },
    { d: rr(154, 49, 54, 14, 4) },
    { d: 'M80 58 L94 58 L88 82 L74 80 Z' },
  ],
  mg: [
    { d: 'M8 46 L58 40 L60 62 L12 70 Z' },
    { d: 'M56 36 L162 36 L162 58 L58 58 Z' },
    { d: 'M160 42 L250 42 L250 48 L160 48 Z' },
    { d: 'M160 38 L212 38 L212 53 L160 53 Z' },
    { d: rr(98, 58, 40, 32, 3) },
    { d: 'M70 58 L84 58 L80 82 L66 80 Z' },
    { d: 'M108 26 L144 26 L144 30 L136 30 L136 36 L116 36 L116 30 L108 30 Z' },
    { d: 'M220 48 L224 48 L238 92 L234 93 Z M220 48 L224 48 L210 92 L206 91 Z' },
  ],
  knife: [
    { d: 'M112 50 L222 38 Q244 38 252 50 Q238 62 210 63 L112 66 Z' },
    { d: rr(100, 38, 14, 40, 3) },
    { d: 'M18 52 L100 48 L100 68 L22 74 Q8 64 18 52 Z' },
  ],
  karambit: [
    { d: 'M10 54 A18 18 0 1 0 46 54 A18 18 0 1 0 10 54 Z M19 54 A9 9 0 1 0 37 54 A9 9 0 1 0 19 54 Z', evenOdd: true },
    { d: 'M44 44 L124 46 L124 62 L44 66 Z' },
    { d: 'M122 44 Q186 26 236 74 Q242 88 230 90 Q192 56 124 62 Z' },
  ],
  gloves: [
    { d: rr(92, 82, 70, 24, 4) },
    { d: 'M92 46 Q90 84 100 84 L154 84 Q164 84 164 52 L164 46 Z' },
    { d: rr(93, 12, 15, 40, 7) },
    { d: rr(110, 6, 15, 46, 7) },
    { d: rr(127, 8, 15, 44, 7) },
    { d: rr(144, 16, 15, 36, 7) },
    { d: 'M160 60 Q182 40 194 48 Q198 58 166 80 Z' },
  ],
}

function PatternDef({ id, pattern, c }: { id: string; pattern: Pattern; c: [string, string, string] }): ReactNode {
  const [a, b, d] = c
  switch (pattern) {
    case 'solid':
      return (
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="112">
          <stop offset="0" stopColor={b} />
          <stop offset="1" stopColor={a} />
        </linearGradient>
      )
    case 'fade':
      return (
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="10" y1="0" x2="250" y2="60">
          <stop offset="0" stopColor={a} />
          <stop offset="0.5" stopColor={b} />
          <stop offset="1" stopColor={d} />
        </linearGradient>
      )
    case 'stripes':
      return (
        <pattern id={id} patternUnits="userSpaceOnUse" width="18" height="18" patternTransform="rotate(35)">
          <rect width="18" height="18" fill={a} />
          <rect width="7" height="18" fill={b} />
          <rect x="7" width="2" height="18" fill={d} />
        </pattern>
      )
    case 'camo':
      return (
        <pattern id={id} patternUnits="userSpaceOnUse" width="64" height="48">
          <rect width="64" height="48" fill={a} />
          <ellipse cx="14" cy="12" rx="13" ry="8" fill={b} />
          <ellipse cx="46" cy="30" rx="15" ry="9" fill={d} />
          <ellipse cx="54" cy="6" rx="9" ry="6" fill={b} />
          <ellipse cx="20" cy="38" rx="10" ry="7" fill={d} />
          <ellipse cx="34" cy="16" rx="6" ry="4" fill={d} />
        </pattern>
      )
    case 'flames':
      return (
        <pattern id={id} patternUnits="userSpaceOnUse" width="44" height="112">
          <rect width="44" height="112" fill={a} />
          <path d="M0 112 Q2 70 12 82 Q10 40 24 60 Q30 24 36 66 Q44 50 44 112 Z" fill={b} />
          <path d="M8 112 Q10 86 18 92 Q20 66 28 84 Q34 74 36 112 Z" fill={d} />
        </pattern>
      )
    case 'digital':
      return (
        <pattern id={id} patternUnits="userSpaceOnUse" width="24" height="24">
          <rect width="24" height="24" fill={a} />
          <rect width="6" height="6" fill={b} />
          <rect x="12" y="6" width="6" height="6" fill={d} />
          <rect x="6" y="12" width="6" height="6" fill={b} />
          <rect x="18" y="18" width="6" height="6" fill={d} />
          <rect x="0" y="18" width="6" height="6" fill={b} opacity="0.6" />
        </pattern>
      )
    case 'waves':
      return (
        <pattern id={id} patternUnits="userSpaceOnUse" width="40" height="16">
          <rect width="40" height="16" fill={a} />
          <path d="M0 8 Q10 0 20 8 T40 8" fill="none" stroke={b} strokeWidth="3" />
          <path d="M0 14 Q10 6 20 14 T40 14" fill="none" stroke={d} strokeWidth="1.5" opacity="0.7" />
        </pattern>
      )
    case 'dots':
      return (
        <pattern id={id} patternUnits="userSpaceOnUse" width="14" height="14">
          <rect width="14" height="14" fill={a} />
          <circle cx="4" cy="4" r="3" fill={b} />
          <circle cx="11" cy="11" r="1.6" fill={d} />
        </pattern>
      )
    case 'marble':
      return (
        <pattern id={id} patternUnits="userSpaceOnUse" width="90" height="60">
          <rect width="90" height="60" fill={a} />
          <path d="M0 10 Q20 30 40 14 T90 20" fill="none" stroke={b} strokeWidth="5" opacity="0.8" />
          <path d="M0 40 Q30 24 50 46 T90 38" fill="none" stroke={d} strokeWidth="2" />
          <path d="M10 60 Q30 50 44 30" fill="none" stroke={d} strokeWidth="1" opacity="0.7" />
        </pattern>
      )
    case 'zebra':
      return (
        <pattern id={id} patternUnits="userSpaceOnUse" width="30" height="112">
          <rect width="30" height="112" fill={a} />
          <path d="M4 0 Q14 28 6 56 Q0 84 10 112 L18 112 Q8 84 14 56 Q22 28 12 0 Z" fill={b} />
          <path d="M22 0 Q26 20 24 34 L27 34 Q29 20 26 0 Z" fill={d} />
        </pattern>
      )
    case 'hex':
      return (
        <pattern id={id} patternUnits="userSpaceOnUse" width="24" height="42">
          <rect width="24" height="42" fill={a} />
          <path d="M12 0 L24 7 L24 21 L12 28 L0 21 L0 7 Z M12 28 V42" fill="none" stroke={b} strokeWidth="1.6" />
          <circle cx="12" cy="14" r="2" fill={d} />
        </pattern>
      )
  }
}

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
      <defs>
        <PatternDef id={`${id}p`} pattern={skin.pattern} c={skin.colors} />
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
          {[86, 110, 134, 158].map((x) => (
            <g key={x}>
              <circle cx={x} cy={46} r={9} fill={`url(#${id}h)`} />
              <text x={x} y={50} textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff" stroke="none">
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
