// Sticker und Kapseln. Alle Designs sind selbst gezeichnet, die Teams sind ausgedacht.
import type { RarityId } from './data'

export type StickerFinish = 'papier' | 'glitzer' | 'holo' | 'gold'
export type StickerShape = 'circle' | 'shield' | 'star' | 'hex' | 'badge'
export type IconId =
  | 'skull'
  | 'crown'
  | 'flame'
  | 'heart'
  | 'ghost'
  | 'bolt'
  | 'star'
  | 'clown'
  | 'trophy'
  | 'rocket'
  | 'eye'
  | 'toaster'
  | 'cactus'
  | 'crow'

export interface StickerDef {
  id: string
  name: string
  capsuleId: string
  rarity: Exclude<RarityId, 'gold' | 'mac'>
  finish: StickerFinish
  shape: StickerShape
  icon?: IconId
  text?: string
  /** Hintergrund, Vordergrund, Akzent */
  colors: [string, string, string]
  value: number
}

export interface CapsuleDef {
  id: string
  name: string
  price: number
  colors: [string, string]
  description: string
  dropWeight: number
  stickers: StickerDef[]
}

export const FINISHES: Record<StickerFinish, { name: string; rarity: StickerDef['rarity']; rarityName: string }> = {
  papier: { name: 'Papier', rarity: 'blau', rarityName: 'Hochwertig' },
  glitzer: { name: 'Glitzer', rarity: 'lila', rarityName: 'Bemerkenswert' },
  holo: { name: 'Holo', rarity: 'pink', rarityName: 'Exotisch' },
  gold: { name: 'Gold', rarity: 'rot', rarityName: 'Außergewöhnlich' },
}

/** Chancen in einer Kapsel */
export const CAPSULE_ODDS: Record<StickerFinish, number> = { papier: 0.8, glitzer: 0.16, holo: 0.032, gold: 0.008 }

type Row = [id: string, name: string, finish: StickerFinish, shape: StickerShape, art: string, colors: [string, string, string], value: number]

function makeStickers(capsuleId: string, rows: Row[]): StickerDef[] {
  return rows.map(([id, name, finish, shape, art, colors, value]) => {
    const isIcon = art.startsWith('icon:')
    return {
      id: `${capsuleId}:${id}`,
      name,
      capsuleId,
      rarity: FINISHES[finish].rarity,
      finish,
      shape,
      icon: isIcon ? (art.slice(5) as IconId) : undefined,
      text: isIcon ? undefined : art,
      colors,
      value,
    }
  })
}

export const CAPSULES: CapsuleDef[] = [
  {
    id: 'meme',

    name: 'Meme-Kapsel',
    price: 60,
    colors: ['#2a1a4a', '#ff3d9a'],
    description: 'GG, EZ, W, L und ein Clown. Alles, was man im Chat so schreibt.',
    dropWeight: 10,
    stickers: makeStickers('meme', [
      ['gg', 'GG', 'papier', 'circle', 'GG', ['#2a2a2a', '#ffffff', '#3dd8ff'], 8],
      ['ez', 'EZ', 'papier', 'badge', 'EZ', ['#e53935', '#ffffff', '#ffe23d'], 8],
      ['w', 'W', 'papier', 'circle', 'W', ['#2fd17a', '#ffffff', '#0a3a1a'], 6],
      ['l', 'L', 'papier', 'circle', 'L', ['#e53935', '#ffffff', '#3a0a0a'], 6],
      ['nt', 'NT', 'papier', 'hex', 'NT', ['#1e88e5', '#ffffff', '#0a2a5a'], 7],
      ['bruh', 'Bruh', 'papier', 'badge', 'BRUH', ['#7a5aff', '#ffffff', '#2a1a6a'], 9],
      ['totenkopf', 'Totenkopf', 'glitzer', 'circle', 'icon:skull', ['#111111', '#ffffff', '#ff3d3d'], 45],
      ['clown', 'Clown', 'glitzer', 'circle', 'icon:clown', ['#3dd8ff', '#ffffff', '#ff2b2b'], 40],
      ['one-tap', '1 TAP', 'holo', 'shield', '1TAP', ['#0a0a2a', '#ffffff', '#3dd8ff'], 260],
      ['rakete', 'Rakete', 'holo', 'circle', 'icon:rocket', ['#1a1033', '#ffffff', '#ff7a1f'], 220],
      ['king', 'King', 'gold', 'shield', 'icon:crown', ['#2a1f00', '#ffd23d', '#ffffff'], 1800],
    ]),
  },
  {
    id: 'legenden',
    name: 'Legenden-Kapsel 2014',
    price: 150,
    colors: ['#1a1a1a', '#ffd23d'],
    description: 'Logos legendärer (ausgedachter) Teams. Die Holo-Sticker sind heiß begehrt …',
    dropWeight: 4,
    stickers: makeStickers('legenden', [
      ['grund', 'Grund Gaming', 'papier', 'circle', 'R', ['#0d47a1', '#ffffff', '#ffd23d'], 12],
      ['nebelkraehen', 'Nebelkrähen', 'papier', 'shield', 'icon:crow', ['#263238', '#cfd8dc', '#90a4ae'], 10],
      ['toaster', 'Team Toaster', 'papier', 'badge', 'icon:toaster', ['#ff7043', '#ffffff', '#4e342e'], 10],
      ['piraten', 'Pixelpiraten', 'papier', 'hex', 'icon:skull', ['#000000', '#ffffff', '#ff3d3d'], 11],
      ['kaktus', 'Kaktus Klan', 'papier', 'circle', 'icon:cactus', ['#2e7d32', '#a5d6a7', '#1b5e20'], 10],
      ['spukify', 'Spukify', 'papier', 'circle', 'icon:ghost', ['#4a148c', '#e1bee7', '#ffffff'], 12],
      ['toaster-glitzer', 'Team Toaster (Glitzer)', 'glitzer', 'badge', 'icon:toaster', ['#ff7043', '#ffffff', '#4e342e'], 70],
      ['kaktus-glitzer', 'Kaktus Klan (Glitzer)', 'glitzer', 'circle', 'icon:cactus', ['#2e7d32', '#a5d6a7', '#1b5e20'], 65],
      ['grund-holo', 'Grund Gaming (Holo)', 'holo', 'circle', 'R', ['#0d47a1', '#ffffff', '#ffd23d'], 800],
      ['spukify-holo', 'Spukify (Holo)', 'holo', 'circle', 'icon:ghost', ['#4a148c', '#e1bee7', '#ffffff'], 400],
      ['grund-gold', 'Grund Gaming (Gold)', 'gold', 'circle', 'R', ['#0d47a1', '#ffffff', '#ffd23d'], 6000],
    ]),
  },
  {
    id: 'symbol',
    name: 'Symbol-Kapsel',
    price: 90,
    colors: ['#0a2a3a', '#3dd8ff'],
    description: 'Herzen, Sterne, Blitze und Flammen – für jede Waffe das passende Symbol.',
    dropWeight: 7,
    stickers: makeStickers('symbol', [
      ['herz', 'Herz', 'papier', 'circle', 'icon:heart', ['#ff3d6a', '#ffffff', '#ffd0dc'], 7],
      ['stern', 'Stern', 'papier', 'circle', 'icon:star', ['#1e88e5', '#ffe23d', '#ffffff'], 7],
      ['blitz', 'Blitz', 'papier', 'hex', 'icon:bolt', ['#222222', '#ffe23d', '#ffffff'], 8],
      ['auge', 'Auge', 'papier', 'badge', 'icon:eye', ['#4a148c', '#ffffff', '#3dd8ff'], 8],
      ['flamme', 'Flamme', 'papier', 'shield', 'icon:flame', ['#1a0a00', '#ff7a1f', '#ffd23d'], 9],
      ['geist', 'Geist', 'papier', 'circle', 'icon:ghost', ['#0a2a3a', '#ffffff', '#3dd8ff'], 8],
      ['herz-glitzer', 'Herz (Glitzer)', 'glitzer', 'circle', 'icon:heart', ['#ff3d6a', '#ffffff', '#ffd0dc'], 50],
      ['stern-glitzer', 'Stern (Glitzer)', 'glitzer', 'star', 'icon:star', ['#1e88e5', '#ffe23d', '#ffffff'], 55],
      ['flamme-holo', 'Flamme (Holo)', 'holo', 'shield', 'icon:flame', ['#1a0a00', '#ff7a1f', '#ffd23d'], 300],
      ['auge-holo', 'Auge (Holo)', 'holo', 'badge', 'icon:eye', ['#4a148c', '#ffffff', '#3dd8ff'], 280],
      ['pokal', 'Pokal (Gold)', 'gold', 'shield', 'icon:trophy', ['#2a1f00', '#ffd23d', '#ffffff'], 2500],
    ]),
  },
]

const STICKER_MAP = new Map<string, StickerDef>()
for (const c of CAPSULES) for (const s of c.stickers) STICKER_MAP.set(s.id, s)

export function getSticker(id: string): StickerDef | undefined {
  return STICKER_MAP.get(id)
}

export function getCapsule(id: string): CapsuleDef | undefined {
  return CAPSULES.find((c) => c.id === id)
}

/** Wie viel ein aufgeklebter Sticker den Wert einer Waffe erhöht */
export function stickerBonus(s: StickerDef): number {
  const share = s.finish === 'papier' ? 0.1 : s.finish === 'glitzer' ? 0.2 : 0.5
  return Math.round(s.value * share)
}

// ---------- Zeichnungen ----------

interface Layer {
  d: string
  fill: 'fg' | 'accent' | 'bg' | string
  evenOdd?: boolean
}

function ring(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy} Z`
}

const ICONS: Record<IconId, Layer[]> = {
  skull: [
    {
      d: `M32 9 C19 9 11 18 11 30 C11 38 15 43 20 45 L20 54 L44 54 L44 45 C49 43 53 38 53 30 C53 18 45 9 32 9 Z ${ring(23, 31, 6)} ${ring(41, 31, 6)} M32 37 L28 44 L36 44 Z`,
      fill: 'fg',
      evenOdd: true,
    },
    { d: 'M26 48 V54 M32 48 V54 M38 48 V54', fill: 'none' },
  ],
  crown: [
    { d: 'M10 46 L13 18 L24 32 L32 12 L40 32 L51 18 L54 46 Z', fill: 'fg' },
    { d: 'M10 46 H54 V53 H10 Z', fill: 'accent' },
    { d: `${ring(32, 39, 3)} ${ring(21, 40, 2.5)} ${ring(43, 40, 2.5)}`, fill: 'accent' },
  ],
  flame: [
    {
      d: 'M32 5 C40 17 50 25 48 40 C47 52 38 58 32 58 C24 58 15 52 16 40 C17 31 24 27 26 19 C30 25 30 31 34 33 C36 25 34 15 32 5 Z',
      fill: 'fg',
    },
    { d: 'M32 30 C36 37 41 41 40 48 C39 54 35 56 32 56 C28 56 24 53 24 48 C24 42 29 40 32 30 Z', fill: 'accent' },
  ],
  heart: [
    { d: 'M32 54 C14 42 8 32 8 23 C8 14 15 9 22 9 C27 9 30 12 32 15 C34 12 37 9 42 9 C49 9 56 14 56 23 C56 32 50 42 32 54 Z', fill: 'fg' },
    { d: 'M18 18 C16 20 15 23 16 26', fill: 'none' },
  ],
  ghost: [
    { d: `M14 55 L14 29 C14 17 22 9 32 9 C42 9 50 17 50 29 L50 55 L44 49 L38 55 L32 49 L26 55 L20 49 Z ${ring(25, 28, 4.5)} ${ring(39, 28, 4.5)}`, fill: 'fg', evenOdd: true },
    { d: ring(32, 40, 3.5), fill: 'bg' },
  ],
  bolt: [{ d: 'M37 4 L14 36 L29 36 L25 60 L50 26 L35 26 Z', fill: 'fg' }],
  star: [{ d: 'M32 6 L39 24 L58 24 L43 36 L49 56 L32 44 L15 56 L21 36 L6 24 L25 24 Z', fill: 'fg' }],
  clown: [
    { d: ring(32, 33, 19), fill: 'fg' },
    { d: `${ring(14, 22, 8)} ${ring(50, 22, 8)}`, fill: 'accent' },
    { d: `${ring(25, 29, 3)} ${ring(39, 29, 3)}`, fill: '#111' },
    { d: ring(32, 36, 5), fill: '#ff2b2b' },
    { d: 'M22 43 Q32 52 42 43 Q32 48 22 43 Z', fill: '#ff2b2b' },
  ],
  trophy: [
    { d: 'M18 9 H46 V23 C46 33 40 40 32 40 C24 40 18 33 18 23 Z', fill: 'fg' },
    { d: 'M18 13 H9 C9 25 14 29 20 30 L19 26 C15 25 13 21 13 17 H18 Z M46 13 H55 C55 25 50 29 44 30 L45 26 C49 25 51 21 51 17 H46 Z', fill: 'fg' },
    { d: 'M28 40 H36 V48 H28 Z M20 48 H44 V55 H20 Z', fill: 'fg' },
    { d: 'M26 15 V27', fill: 'none' },
  ],
  rocket: [
    { d: 'M32 4 C43 12 45 26 42 42 L22 42 C19 26 21 12 32 4 Z', fill: 'fg' },
    { d: 'M22 30 L12 44 L22 42 Z M42 30 L52 44 L42 42 Z', fill: 'accent' },
    { d: ring(32, 22, 5), fill: 'bg' },
    { d: 'M25 42 L32 58 L39 42 Z', fill: 'accent' },
  ],
  eye: [
    { d: 'M5 32 C15 15 49 15 59 32 C49 49 15 49 5 32 Z', fill: 'fg' },
    { d: ring(32, 32, 11), fill: 'accent' },
    { d: ring(32, 32, 5), fill: '#111' },
    { d: ring(36, 28, 2.5), fill: '#fff' },
  ],
  toaster: [
    { d: 'M10 26 Q10 20 16 20 H48 Q54 20 54 26 V52 H10 Z', fill: 'fg' },
    { d: 'M18 12 H30 V22 H18 Z M34 9 H46 V22 H34 Z', fill: 'accent' },
    { d: 'M17 22 H31 V25 H17 Z M33 22 H47 V25 H33 Z', fill: '#333' },
    { d: 'M50 34 H58 V38 H50 Z', fill: 'fg' },
  ],
  cactus: [
    { d: 'M26 56 V14 C26 7 38 7 38 14 V56 Z', fill: 'fg' },
    { d: 'M26 36 H18 C14 36 12 33 12 29 V22 C12 18 18 18 18 22 V30 H26 Z M38 30 H46 V18 C46 14 52 14 52 18 V27 C52 32 49 34 45 34 H38 Z', fill: 'fg' },
    { d: 'M18 52 H46 V58 H18 Z', fill: 'accent' },
  ],
  crow: [
    {
      d: 'M8 40 C14 30 24 24 34 24 C38 16 46 12 54 14 L48 20 C52 22 54 26 52 30 C46 30 44 34 42 38 C38 46 28 50 18 50 L8 54 L14 46 Z',
      fill: 'fg',
    },
    { d: ring(46, 20, 2.2), fill: 'bg' },
    { d: 'M54 16 L62 18 L54 22 Z', fill: 'accent' },
  ],
}

const SHAPE_PATH: Record<StickerShape, string> = {
  circle: ring(32, 32, 29),
  shield: 'M32 3 L58 12 V30 C58 46 46 56 32 61 C18 56 6 46 6 30 V12 Z',
  star: 'M32 2 L40 20 L60 22 L45 36 L50 58 L32 47 L14 58 L19 36 L4 22 L24 20 Z',
  hex: 'M32 3 L57 17.5 V46.5 L32 61 L7 46.5 V17.5 Z',
  badge: 'M14 6 H50 Q58 6 58 14 V50 Q58 58 50 58 H14 Q6 58 6 50 V14 Q6 6 14 6 Z',
}

/**
 * Der Inhalt eines Stickers als SVG-Text (Koordinaten 0–64).
 * `p` ist ein Präfix für die IDs, damit mehrere Sticker auf einer Seite nicht kollidieren.
 */
export function stickerMarkup(s: StickerDef, p: string): string {
  const [bg, fg, accent] = s.colors
  const gold = s.finish === 'gold'
  const col = (c: string) =>
    c === 'bg' ? (gold ? `url(#${p}gd)` : bg) : c === 'fg' ? (gold ? `url(#${p}gl)` : fg) : c === 'accent' ? (gold ? `url(#${p}gd)` : accent) : c
  const defs = `<defs>
<linearGradient id="${p}gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6cf"/><stop offset="0.45" stop-color="#ffd23d"/><stop offset="1" stop-color="#9a6a12"/></linearGradient>
<linearGradient id="${p}gd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a5208"/><stop offset="1" stop-color="#3a2604"/></linearGradient>
<linearGradient id="${p}h" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff4d4d"/><stop offset="0.2" stop-color="#ffe14d"/><stop offset="0.4" stop-color="#4dff9a"/><stop offset="0.6" stop-color="#4db8ff"/><stop offset="0.8" stop-color="#d44dff"/><stop offset="1" stop-color="#ff4d9a"/></linearGradient>
<pattern id="${p}gz" patternUnits="userSpaceOnUse" width="8" height="8"><circle cx="2" cy="2" r="0.9" fill="#fff" opacity="0.9"/><circle cx="6" cy="5" r="0.6" fill="#fff" opacity="0.7"/><circle cx="4" cy="7" r="0.5" fill="${accent}" opacity="0.9"/></pattern>
<clipPath id="${p}c"><path d="${SHAPE_PATH[s.shape]}"/></clipPath>
</defs>`
  let body = `<path d="${SHAPE_PATH[s.shape]}" fill="#fff"/>`
  body += `<g clip-path="url(#${p}c)" transform="translate(32 32) scale(0.9) translate(-32 -32)">`
  body += `<path d="${SHAPE_PATH[s.shape]}" fill="${gold ? `url(#${p}gd)` : bg}"/>`
  if (s.finish === 'holo') body += `<path d="${SHAPE_PATH[s.shape]}" fill="url(#${p}h)" opacity="0.55"/>`
  if (s.icon) {
    for (const l of ICONS[s.icon]) {
      if (l.fill === 'none') body += `<path d="${l.d}" fill="none" stroke="${col('bg')}" stroke-width="2.5" stroke-linecap="round"/>`
      else body += `<path d="${l.d}" fill="${col(l.fill)}"${l.evenOdd ? ' fill-rule="evenodd"' : ''} transform="translate(32 32) scale(0.78) translate(-32 -32)"/>`
    }
  } else if (s.text) {
    const size = s.text.length <= 1 ? 40 : s.text.length <= 2 ? 30 : s.text.length <= 3 ? 22 : 17
    body += `<text x="32" y="${32 + size * 0.36}" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="${size}" fill="${col('fg')}" stroke="${col('accent')}" stroke-width="1.2" paint-order="stroke">${s.text}</text>`
  }
  if (s.finish === 'glitzer') body += `<rect width="64" height="64" fill="url(#${p}gz)"/>`
  if (s.finish === 'holo') body += `<path d="M-10 20 L30 -10 L44 -10 L4 20 Z M10 60 L64 14 L74 22 L20 68 Z" fill="#fff" opacity="0.28"/>`
  if (gold) body += `<path d="M-10 24 L34 -10 L44 -10 L0 24 Z" fill="#fff" opacity="0.35"/>`
  body += `</g>`
  return defs + body
}

/** Kurzer Name für die Kapsel-Grafik, z. B. „MEME“ */
export function capsuleLabel(c: CapsuleDef): string {
  return c.name.split(' ')[0].replace('-Kapsel', '').toUpperCase()
}
