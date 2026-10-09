// Formen und Muster der Skins – gemeinsam genutzt von den 2D-Bildern und den 3D-Modellen.
import type { Pattern, Shape } from './data'

/** Alle Waffen sind selbst gezeichnete Silhouetten im Format 256 × 112 */
export interface Part {
  d: string
  evenOdd?: boolean
  /** Dicke im 3D-Modell (Standard 12) */
  depth?: number
}

function rr(x: number, y: number, w: number, h: number, r: number): string {
  return `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`
}

export const SHAPES: Record<Shape, Part[]> = {
  rifle: [
    { d: 'M8 46 L64 40 L70 52 L66 60 L14 74 L8 68 Z', depth: 10 },
    { d: 'M62 38 L150 38 L152 55 L64 57 Z', depth: 14 },
    { d: 'M148 40 L198 41 L198 52 L150 55 Z', depth: 12 },
    { d: 'M196 43 L248 43 L248 48 L196 48 Z', depth: 5 },
    { d: 'M232 36 L238 36 L238 43 L232 43 Z', depth: 4 },
    { d: 'M136 32 L150 32 L150 38 L136 38 Z', depth: 6 },
    { d: 'M108 55 L126 55 Q130 75 142 92 L124 99 Q112 80 108 55 Z', depth: 9 },
    { d: 'M78 55 L92 55 L86 84 L72 82 Z', depth: 10 },
    { d: 'M92 56 L104 56 Q104 70 92 70 L90 66 Q98 66 98 60 L92 60 Z', depth: 4 },
  ],
  sniper: [
    { d: 'M6 48 L58 43 L64 58 L50 60 L44 76 L10 78 L6 70 Z', depth: 10 },
    { d: 'M58 42 L152 42 L152 58 L62 60 Z', depth: 14 },
    { d: 'M150 46 L252 46 L252 51 L150 52 Z', depth: 5 },
    { d: rr(84, 25, 60, 10, 3), depth: 10 },
    { d: 'M72 22 L86 24 L86 36 L72 38 Z', depth: 14 },
    { d: 'M142 24 L158 20 L158 40 L142 36 Z', depth: 16 },
    { d: 'M98 35 L104 35 L104 42 L98 42 Z', depth: 5 },
    { d: 'M124 35 L130 35 L130 42 L124 42 Z', depth: 5 },
    { d: 'M106 58 L122 58 L122 74 L106 74 Z', depth: 9 },
    { d: 'M70 58 L84 58 L80 84 L66 82 Z', depth: 10 },
  ],
  pistol: [
    { d: rr(54, 26, 150, 26, 4), depth: 14 },
    { d: 'M58 50 L150 50 L150 60 L64 60 Z', depth: 12 },
    { d: 'M60 56 L110 56 L102 102 L58 102 L52 96 Z', depth: 14 },
    { d: 'M108 58 L146 58 Q148 80 120 80 L108 80 Z M114 63 L138 63 Q138 74 120 74 L114 74 Z', evenOdd: true, depth: 6 },
    { d: 'M190 20 L198 20 L198 26 L190 26 Z', depth: 4 },
  ],
  smg: [
    { d: rr(66, 32, 116, 28, 3), depth: 16 },
    { d: 'M180 39 L222 39 L222 51 L180 51 Z', depth: 8 },
    { d: 'M98 58 L122 58 L120 106 L96 106 Z', depth: 12 },
    { d: 'M30 36 L68 36 L68 41 L36 41 L36 54 L68 54 L68 59 L30 59 Z', depth: 4 },
    { d: 'M152 58 L164 58 L164 70 L152 70 Z', depth: 6 },
    { d: 'M72 26 L82 26 L82 32 L72 32 Z', depth: 4 },
    { d: 'M170 26 L176 26 L176 32 L170 32 Z', depth: 4 },
  ],
  shotgun: [
    { d: 'M6 52 L66 44 L70 58 L14 76 L6 70 Z', depth: 10 },
    { d: 'M64 42 L132 42 L132 58 L68 60 Z', depth: 14 },
    { d: 'M130 44 L250 44 L250 50 L130 50 Z', depth: 6 },
    { d: 'M130 52 L228 52 L228 57 L130 57 Z', depth: 5 },
    { d: rr(154, 49, 54, 14, 4), depth: 12 },
    { d: 'M80 58 L94 58 L88 82 L74 80 Z', depth: 10 },
  ],
  mg: [
    { d: 'M8 46 L58 40 L60 62 L12 70 Z', depth: 10 },
    { d: 'M56 36 L162 36 L162 58 L58 58 Z', depth: 16 },
    { d: 'M160 42 L250 42 L250 48 L160 48 Z', depth: 6 },
    { d: 'M160 38 L212 38 L212 53 L160 53 Z', depth: 12 },
    { d: rr(98, 58, 40, 32, 3), depth: 18 },
    { d: 'M70 58 L84 58 L80 82 L66 80 Z', depth: 10 },
    { d: 'M108 26 L144 26 L144 30 L136 30 L136 36 L116 36 L116 30 L108 30 Z', depth: 5 },
    { d: 'M220 48 L224 48 L238 92 L234 93 Z M220 48 L224 48 L210 92 L206 91 Z', depth: 4 },
  ],
  knife: [
    { d: 'M112 50 L222 38 Q244 38 252 50 Q238 62 210 63 L112 66 Z', depth: 4 },
    { d: rr(100, 38, 14, 40, 3), depth: 14 },
    { d: 'M18 52 L100 48 L100 68 L22 74 Q8 64 18 52 Z', depth: 14 },
  ],
  karambit: [
    { d: 'M10 54 A18 18 0 1 0 46 54 A18 18 0 1 0 10 54 Z M19 54 A9 9 0 1 0 37 54 A9 9 0 1 0 19 54 Z', evenOdd: true, depth: 10 },
    { d: 'M44 44 L124 46 L124 62 L44 66 Z', depth: 14 },
    { d: 'M122 44 Q186 26 236 74 Q242 88 230 90 Q192 56 124 62 Z', depth: 4 },
  ],
  gloves: [
    { d: rr(92, 82, 70, 24, 4), depth: 22 },
    { d: 'M92 46 Q90 84 100 84 L154 84 Q164 84 164 52 L164 46 Z', depth: 20 },
    { d: rr(93, 12, 15, 40, 7), depth: 14 },
    { d: rr(110, 6, 15, 46, 7), depth: 14 },
    { d: rr(127, 8, 15, 44, 7), depth: 14 },
    { d: rr(144, 16, 15, 36, 7), depth: 14 },
    { d: 'M160 60 Q182 40 194 48 Q198 58 166 80 Z', depth: 14 },
  ],
}

/** Positionen der vier Holo-Sticker auf der MAC-10 */
export const STICKER_SPOTS = [86, 110, 134, 158].map((x) => ({ x, y: 46, r: 9 }))

/** Das Muster eines Skins als SVG-Text (für <defs>) */
export function patternMarkup(id: string, pattern: Pattern, c: [string, string, string]): string {
  const [a, b, d] = c
  switch (pattern) {
    case 'solid':
      return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="112"><stop offset="0" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></linearGradient>`
    case 'fade':
      return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="10" y1="0" x2="250" y2="60"><stop offset="0" stop-color="${a}"/><stop offset="0.5" stop-color="${b}"/><stop offset="1" stop-color="${d}"/></linearGradient>`
    case 'stripes':
      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="18" height="18" patternTransform="rotate(35)"><rect width="18" height="18" fill="${a}"/><rect width="7" height="18" fill="${b}"/><rect x="7" width="2" height="18" fill="${d}"/></pattern>`
    case 'camo':
      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="64" height="48"><rect width="64" height="48" fill="${a}"/><ellipse cx="14" cy="12" rx="13" ry="8" fill="${b}"/><ellipse cx="46" cy="30" rx="15" ry="9" fill="${d}"/><ellipse cx="54" cy="6" rx="9" ry="6" fill="${b}"/><ellipse cx="20" cy="38" rx="10" ry="7" fill="${d}"/><ellipse cx="34" cy="16" rx="6" ry="4" fill="${d}"/></pattern>`
    case 'flames':
      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="44" height="112"><rect width="44" height="112" fill="${a}"/><path d="M0 112 Q2 70 12 82 Q10 40 24 60 Q30 24 36 66 Q44 50 44 112 Z" fill="${b}"/><path d="M8 112 Q10 86 18 92 Q20 66 28 84 Q34 74 36 112 Z" fill="${d}"/></pattern>`
    case 'digital':
      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="24" height="24"><rect width="24" height="24" fill="${a}"/><rect width="6" height="6" fill="${b}"/><rect x="12" y="6" width="6" height="6" fill="${d}"/><rect x="6" y="12" width="6" height="6" fill="${b}"/><rect x="18" y="18" width="6" height="6" fill="${d}"/><rect x="0" y="18" width="6" height="6" fill="${b}" opacity="0.6"/></pattern>`
    case 'waves':
      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="40" height="16"><rect width="40" height="16" fill="${a}"/><path d="M0 8 Q10 0 20 8 T40 8" fill="none" stroke="${b}" stroke-width="3"/><path d="M0 14 Q10 6 20 14 T40 14" fill="none" stroke="${d}" stroke-width="1.5" opacity="0.7"/></pattern>`
    case 'dots':
      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="14" height="14"><rect width="14" height="14" fill="${a}"/><circle cx="4" cy="4" r="3" fill="${b}"/><circle cx="11" cy="11" r="1.6" fill="${d}"/></pattern>`
    case 'marble':
      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="90" height="60"><rect width="90" height="60" fill="${a}"/><path d="M0 10 Q20 30 40 14 T90 20" fill="none" stroke="${b}" stroke-width="5" opacity="0.8"/><path d="M0 40 Q30 24 50 46 T90 38" fill="none" stroke="${d}" stroke-width="2"/><path d="M10 60 Q30 50 44 30" fill="none" stroke="${d}" stroke-width="1" opacity="0.7"/></pattern>`
    case 'zebra':
      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="30" height="112"><rect width="30" height="112" fill="${a}"/><path d="M4 0 Q14 28 6 56 Q0 84 10 112 L18 112 Q8 84 14 56 Q22 28 12 0 Z" fill="${b}"/><path d="M22 0 Q26 20 24 34 L27 34 Q29 20 26 0 Z" fill="${d}"/></pattern>`
    case 'hex':
      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="24" height="42"><rect width="24" height="42" fill="${a}"/><path d="M12 0 L24 7 L24 21 L12 28 L0 21 L0 7 Z M12 28 V42" fill="none" stroke="${b}" stroke-width="1.6"/><circle cx="12" cy="14" r="2" fill="${d}"/></pattern>`
  }
}
