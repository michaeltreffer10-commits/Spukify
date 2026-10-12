// Detaillierte Waffenmodelle im CS2-Stil (selbst gezeichnet, Format 256 × 112, Mündung nach rechts).
// Jedes Teil hat ein Material: „paint“ trägt das Skin-Muster, „metal“ ist unlackiertes Metall,
// „dark“ ist schwarzer Kunststoff/Gummi.

export type Mat = 'paint' | 'metal' | 'dark'

export interface ModelPart {
  d: string
  mat?: Mat
  evenOdd?: boolean
  /** Dicke im 3D-Modell */
  depth?: number
  /** SVG-Transform, z. B. für die zweite Beretta */
  t?: string
}

export interface WeaponModel {
  parts: ModelPart[]
  /** Feine Linien (Fugen, Rillen, Auswurffenster) */
  details?: string
  /** Wo Sticker kleben können */
  stickers?: { x: number; y: number }[]
}

export type ModelId =
  | 'ak47'
  | 'm4a4'
  | 'm4a1s'
  | 'awp'
  | 'ssg08'
  | 'scar20'
  | 'famas'
  | 'galil'
  | 'sg553'
  | 'aug'
  | 'deagle'
  | 'glock'
  | 'usps'
  | 'p250'
  | 'p2000'
  | 'fiveseven'
  | 'tec9'
  | 'cz75'
  | 'dualies'
  | 'mp9'
  | 'mac10'
  | 'ump45'
  | 'p90'
  | 'mp7'
  | 'mp5sd'
  | 'nova'
  | 'xm1014'
  | 'mag7'
  | 'sawedoff'
  | 'negev'
  | 'karambit'
  | 'butterfly'
  | 'bayonet'
  | 'sportgloves'
  | 'drivergloves'

// ---------- Hilfsfunktionen ----------

function rr(x: number, y: number, w: number, h: number, r: number): string {
  return `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`
}

function circle(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy} Z`
}

/** Senkrechte Rillen, z. B. Griffrillen am Schlitten */
function vlines(x0: number, x1: number, y0: number, y1: number, step: number): string {
  let s = ''
  for (let x = x0; x <= x1; x += step) s += `M${x} ${y0} V${y1} `
  return s
}

/** Kerben einer Picatinny-Schiene */
function rail(x0: number, x1: number, y: number, h: number): string {
  let s = ''
  for (let x = x0; x <= x1; x += 4) s += `M${x} ${y} V${y + h} `
  return s
}

// ---------- Gewehre ----------

const ak47: WeaponModel = {
  parts: [
    { d: 'M5 47 C5 45 6 44 8 44 L70 39 L73 52 L58 56 L13 70 C9 71 5 70 5 67 Z', depth: 10 },
    { d: 'M2 45 L7 44 L8 69 L3 70 Z', mat: 'dark', depth: 11 },
    { d: 'M68 38 L148 37 L150 53 L70 55 Z', depth: 14 },
    { d: 'M136 31 L150 31 L152 37 L136 37 Z', mat: 'metal', depth: 8 },
    { d: 'M150 36 L194 37 L194 42 L150 42 Z', depth: 10 },
    { d: 'M150 42 L198 43 Q199 50 194 52 L152 54 Z', depth: 12 },
    { d: 'M193 35 L203 35 L203 45 L193 45 Z', mat: 'metal', depth: 9 },
    { d: 'M198 44 L238 44 L238 48 L198 48 Z', mat: 'metal', depth: 5 },
    { d: 'M224 34 L230 34 L232 44 L223 44 Z', mat: 'metal', depth: 4 },
    { d: 'M236 42 L251 41 L251 50 L236 50 Z', mat: 'metal', depth: 7 },
    { d: 'M108 54 L127 54 C129 68 135 82 146 92 L130 101 C118 88 111 72 108 54 Z', depth: 10 },
    { d: 'M84 54 L98 54 L95 80 C94 85 90 87 85 86 L80 85 Z', mat: 'dark', depth: 11 },
    { d: 'M97 54 L111 54 L111 57 C110 66 104 68 99 68 L96 64 C101 64 106 62 106 57 L98 57 Z', mat: 'metal', depth: 4 },
  ],
  details:
    'M100 40 H126 V45 H100 Z M76 47 L122 47 M152 39.5 H192 M155 47 H195 M155 50 H193 M16 62 L66 49 M112 60 C114 72 120 84 132 94 M74 41 C90 40 120 40 146 39',
  stickers: [
    { x: 84, y: 46 },
    { x: 132, y: 46 },
    { x: 34, y: 54 },
    { x: 172, y: 47 },
  ],
}

const m4Base: ModelPart[] = [
  { d: 'M8 44 L46 41 L48 61 L40 63 C30 60 18 63 12 67 L8 67 Z', depth: 12 },
  { d: 'M4 42 L9 42 L9 68 L4 68 Z', mat: 'dark', depth: 13 },
  { d: 'M44 44 L74 44 L74 53 L44 53 Z', mat: 'metal', depth: 8 },
  { d: 'M72 46 L128 46 L130 54 L124 61 L78 61 Z', depth: 13 },
  { d: 'M70 35 L142 35 L142 47 L72 47 Z', depth: 14 },
  { d: 'M104 61 L121 61 Q123 78 126 93 L109 95 Q107 78 104 61 Z', depth: 10 },
  { d: 'M80 59 L93 59 L88 85 C87 88 83 89 80 88 L75 86 Z', mat: 'dark', depth: 11 },
  { d: 'M93 60 L106 60 L106 64 L93 64 Z', mat: 'metal', depth: 4 },
  { d: 'M64 37 L72 37 L72 42 L64 42 Z', mat: 'metal', depth: 6 },
]
const m4Details = 'M100 39 H124 V44 H100 Z M76 50 H122 M128 45 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M14 60 C24 56 36 56 46 58'

const m4a4: WeaponModel = {
  parts: [
    ...m4Base,
    { d: 'M72 31 L190 31 L190 35 L72 35 Z', mat: 'metal', depth: 10 },
    { d: 'M140 35 L198 35 L198 55 L140 55 Z', depth: 14 },
    { d: 'M182 22 L188 22 L194 31 L178 31 Z', mat: 'metal', depth: 4 },
    { d: 'M78 24 L92 24 L94 31 L76 31 Z', mat: 'metal', depth: 6 },
    { d: 'M198 41 L238 41 L238 46 L198 46 Z', mat: 'metal', depth: 5 },
    { d: 'M236 38.5 L251 38.5 L251 48.5 L236 48.5 Z', mat: 'metal', depth: 7 },
  ],
  details: m4Details + rail(74, 188, 31, 4) + ' M144 40 H194 M144 45 H194 M144 50 H194 ' + vlines(150, 190, 38, 52, 10),
  stickers: [
    { x: 86, y: 41 },
    { x: 112, y: 54 },
    { x: 26, y: 52 },
    { x: 166, y: 45 },
  ],
}

const m4a1s: WeaponModel = {
  parts: [
    ...m4Base,
    { d: 'M72 31 L140 31 L140 35 L72 35 Z', mat: 'metal', depth: 10 },
    { d: 'M140 37 L186 37 L186 53 L140 53 Z', depth: 13 },
    { d: rr(184, 36.5, 68, 16, 6), mat: 'dark', depth: 14 },
    { d: 'M78 24 L92 24 L94 31 L76 31 Z', mat: 'metal', depth: 6 },
  ],
  details: m4Details + rail(74, 138, 31, 4) + ' M144 45 H182 M190 40 V50 M246 40 V50',
  stickers: [
    { x: 86, y: 41 },
    { x: 112, y: 54 },
    { x: 26, y: 52 },
    { x: 162, y: 45 },
  ],
}

const sniperScope = (x: number, y: number, len: number, r: number): ModelPart[] => [
  { d: rr(x, y, len, r * 2, r), mat: 'dark', depth: r * 2 },
  { d: `M${x - 14} ${y - 3} L${x + 2} ${y - 1} L${x + 2} ${y + r * 2 + 1} L${x - 14} ${y + r * 2 + 3} Z`, mat: 'dark', depth: r * 2 + 4 },
  { d: `M${x + len - 2} ${y - 1} L${x + len + 16} ${y - 5} L${x + len + 16} ${y + r * 2 + 5} L${x + len - 2} ${y + r * 2 + 1} Z`, mat: 'dark', depth: r * 2 + 6 },
  { d: rr(x + len / 2 - 5, y - 6, 10, 6, 1.5), mat: 'metal', depth: 8 },
]

const awp: WeaponModel = {
  parts: [
    {
      d: 'M4 50 L60 44 L66 58 L56 62 L50 78 L12 80 Q4 76 4 68 Z M30 58 L46 56 L44 70 L30 70 Z',
      evenOdd: true,
      depth: 12,
    },
    { d: 'M58 42 L158 42 L158 60 L66 60 Z', depth: 15 },
    { d: 'M156 46 L238 46 L238 51.5 L156 52 Z', mat: 'metal', depth: 6 },
    { d: 'M236 43.5 L252 43.5 L252 53.5 L236 53.5 Z', mat: 'metal', depth: 9 },
    ...sniperScope(84, 24, 62, 5),
    { d: 'M96 34 L102 34 L102 42 L96 42 Z M126 34 L132 34 L132 42 L126 42 Z', mat: 'metal', depth: 6 },
    { d: 'M112 60 L130 60 L130 74 L112 74 Z', mat: 'dark', depth: 10 },
    { d: 'M70 42 L74 33 L80 33 L78 42 Z', mat: 'metal', depth: 5 },
    { d: circle(77, 31, 3.5), mat: 'metal', depth: 7 },
    { d: 'M80 60 L96 60 Q96 70 86 70 L82 66 Q90 66 90 62 L80 62 Z', mat: 'metal', depth: 4 },
  ],
  details: 'M62 50 H156 M160 48.5 H234 M240 46 V51 M245 46 V51 M10 72 L48 70 M66 46 C64 52 66 56 70 58',
  stickers: [
    { x: 88, y: 51 },
    { x: 116, y: 51 },
    { x: 142, y: 51 },
    { x: 24, y: 64 },
  ],
}

const ssg08: WeaponModel = {
  parts: [
    { d: 'M6 50 L64 46 L68 58 L54 60 L46 74 L12 76 C6 74 6 70 6 66 Z M26 60 L44 58 L40 68 L24 69 Z', evenOdd: true, depth: 10 },
    { d: 'M62 45 L150 45 L150 57 L66 58 Z', depth: 12 },
    { d: 'M148 48 L244 48 L244 52 L148 53 Z', mat: 'metal', depth: 4 },
    { d: 'M242 46.5 L252 46.5 L252 53.5 L242 53.5 Z', mat: 'metal', depth: 6 },
    ...sniperScope(86, 30, 50, 4),
    { d: 'M98 38 L104 38 L104 45 L98 45 Z M118 38 L124 38 L124 45 L118 45 Z', mat: 'metal', depth: 5 },
    { d: 'M110 57 L124 57 L124 68 L110 68 Z', mat: 'dark', depth: 8 },
    { d: 'M72 45 L76 37 L82 37 L80 45 Z', mat: 'metal', depth: 4 },
  ],
  details: 'M66 51 H148 M12 70 L44 68 M152 50 H240',
  stickers: [
    { x: 90, y: 51 },
    { x: 132, y: 51 },
    { x: 20, y: 56 },
    { x: 60, y: 54 },
  ],
}

const scar20: WeaponModel = {
  parts: [
    { d: 'M6 42 L44 40 L46 64 L10 70 L6 66 Z', depth: 12 },
    { d: 'M44 38 L156 38 L156 58 L48 58 Z', depth: 15 },
    { d: 'M48 34 L160 34 L160 38 L48 38 Z', mat: 'metal', depth: 10 },
    ...sniperScope(70, 16, 62, 5.5),
    { d: 'M86 27 L92 27 L92 34 L86 34 Z M114 27 L120 27 L120 34 L114 34 Z', mat: 'metal', depth: 6 },
    { d: 'M154 43 L234 43 L234 50 L154 50 Z', mat: 'metal', depth: 6 },
    { d: 'M232 40 L250 40 L250 53 L232 53 Z', mat: 'metal', depth: 9 },
    { d: 'M154 40 L196 40 L196 56 L154 56 Z', depth: 13 },
    { d: 'M100 58 L124 58 L127 86 L103 88 Z', depth: 12 },
    { d: 'M64 56 L78 56 L74 84 L60 82 Z', mat: 'dark', depth: 11 },
  ],
  details: rail(50, 158, 34, 4) + ' M52 48 H150 M158 48 H192 ' + vlines(162, 190, 42, 54, 7),
  stickers: [
    { x: 64, y: 47 },
    { x: 92, y: 47 },
    { x: 130, y: 47 },
    { x: 24, y: 54 },
  ],
}

const famas: WeaponModel = {
  parts: [
    { d: 'M8 48 L150 44 L156 56 L120 60 L60 62 L14 68 C9 68 8 64 8 60 Z', depth: 14 },
    { d: 'M40 44 L46 25 L150 25 L156 44 L148 44 L145 31 L51 31 L48 44 Z', depth: 10 },
    { d: 'M154 46.5 L236 46.5 L236 51 L154 51 Z', mat: 'metal', depth: 5 },
    { d: 'M234 44 L250 44 L250 53 L234 53 Z', mat: 'metal', depth: 8 },
    { d: 'M150 44 L196 44 L196 54 L156 56 Z', depth: 12 },
    { d: 'M66 60 L82 60 L84 88 L68 90 Z', depth: 10 },
    { d: 'M112 58 L124 58 L120 84 L108 82 Z', mat: 'dark', depth: 11 },
    { d: 'M124 60 L140 60 Q140 70 130 70 L126 66 Q134 66 134 62 L124 62 Z', mat: 'metal', depth: 4 },
    { d: 'M3 47 L9 47 L9 66 L3 66 Z', mat: 'dark', depth: 14 },
  ],
  details: 'M54 31 V44 M90 31 V44 M60 50 L148 47 M20 58 L60 56 M160 49 H192',
  stickers: [
    { x: 30, y: 54 },
    { x: 94, y: 52 },
    { x: 130, y: 51 },
    { x: 100, y: 28 },
  ],
}

const galil: WeaponModel = {
  parts: [
    { d: 'M4 44 L66 40 L68 58 L8 66 L4 62 Z M14 48 L58 46 L58 54 L16 58 Z', evenOdd: true, depth: 8 },
    { d: 'M64 37 L150 36 L152 54 L66 55 Z', depth: 14 },
    { d: 'M140 30 L152 30 L154 36 L140 36 Z', mat: 'metal', depth: 7 },
    { d: 'M150 37 L200 38 L200 53 L152 54 Z', depth: 12 },
    { d: 'M198 43 L238 43 L238 48 L198 48 Z', mat: 'metal', depth: 5 },
    { d: 'M226 34 L232 34 L234 43 L225 43 Z', mat: 'metal', depth: 4 },
    { d: 'M236 41 L251 41 L251 50 L236 50 Z', mat: 'metal', depth: 7 },
    { d: 'M108 55 L126 55 C128 68 132 80 140 90 L124 97 C116 84 110 70 108 55 Z', depth: 10 },
    { d: 'M82 54 L96 54 L92 82 L78 80 Z', mat: 'dark', depth: 11 },
  ],
  details: 'M98 40 H122 V45 H98 Z M72 48 L146 47 ' + vlines(156, 196, 40, 52, 6),
  stickers: [
    { x: 80, y: 44 },
    { x: 134, y: 45 },
    { x: 36, y: 50 },
    { x: 176, y: 46 },
  ],
}

const sg553: WeaponModel = {
  parts: [
    { d: 'M6 44 L62 42 L64 60 L10 66 L6 62 Z M16 49 L54 48 L54 56 L18 59 Z', evenOdd: true, depth: 8 },
    { d: 'M60 36 L150 36 L152 56 L64 56 Z', depth: 14 },
    ...sniperScope(80, 18, 48, 5),
    { d: 'M94 28 L100 28 L100 36 L94 36 Z M114 28 L120 28 L120 36 L114 36 Z', mat: 'metal', depth: 6 },
    { d: 'M150 38 L198 38 L198 54 L152 55 Z', depth: 12 },
    { d: 'M196 42.5 L236 42.5 L236 47.5 L196 47.5 Z', mat: 'metal', depth: 5 },
    { d: 'M234 40 L250 40 L250 50 L234 50 Z', mat: 'metal', depth: 8 },
    { d: 'M106 56 L124 56 C126 70 130 80 138 90 L122 96 C114 84 108 70 106 56 Z', mat: 'dark', depth: 10 },
    { d: 'M80 54 L94 54 L90 82 L76 80 Z', mat: 'dark', depth: 11 },
  ],
  details: 'M68 46 H148 ' + vlines(156, 194, 41, 52, 6),
  stickers: [
    { x: 74, y: 46 },
    { x: 134, y: 46 },
    { x: 34, y: 52 },
    { x: 176, y: 46 },
  ],
}

const aug: WeaponModel = {
  parts: [
    { d: 'M8 50 C8 45 12 42 18 42 L140 40 L146 58 L100 62 L60 64 L16 66 C10 66 8 62 8 58 Z', depth: 15 },
    { d: rr(66, 22, 84, 12, 6), mat: 'dark', depth: 12 },
    { d: 'M86 34 L134 34 L134 40 L86 40 Z', depth: 10 },
    { d: 'M144 46 L236 46 L236 51 L144 51 Z', mat: 'metal', depth: 5 },
    { d: 'M234 43.5 L250 43.5 L250 53.5 L234 53.5 Z', mat: 'metal', depth: 8 },
    { d: 'M150 52 L162 52 L160 84 L148 84 Z', mat: 'dark', depth: 10 },
    { d: 'M50 62 L66 62 L68 92 L52 94 Z', mat: 'dark', depth: 10 },
    { d: 'M100 58 L140 58 L136 86 L104 86 Z M108 62 L130 62 L127 80 L110 80 Z', evenOdd: true, depth: 12 },
  ],
  details: 'M20 52 L138 50 M70 28 H146',
  stickers: [
    { x: 30, y: 54 },
    { x: 80, y: 52 },
    { x: 120, y: 48 },
    { x: 106, y: 37 },
  ],
}

// ---------- Pistolen (füllen das Bild stärker aus) ----------

const deagle: WeaponModel = {
  parts: [
    { d: 'M40 22 L224 22 L226 26 L226 46 L40 46 Z', depth: 16 },
    { d: 'M210 18 L218 18 L218 22 L210 22 Z', mat: 'metal', depth: 5 },
    { d: 'M44 46 L164 46 L164 56 L52 56 Z', depth: 14 },
    { d: 'M48 52 L102 52 L96 104 C95 107 92 108 88 108 L50 108 C46 108 44 105 44 102 L42 98 Z', depth: 16 },
    { d: 'M100 54 L150 54 L150 62 Q150 82 128 82 L104 82 Z M108 60 L142 60 Q142 75 128 75 L110 75 Z', evenOdd: true, depth: 8 },
    { d: 'M30 26 L42 20 L46 32 Z', mat: 'metal', depth: 6 },
    { d: 'M116 62 L122 62 L120 74 L115 74 Z', mat: 'metal', depth: 4 },
  ],
  details: vlines(48, 72, 26, 44, 4) + ' M80 34 H220 M54 50 H160 M56 62 L94 62 M54 72 L92 72 M52 82 L90 82 M50 92 L88 92',
  stickers: [
    { x: 100, y: 34 },
    { x: 140, y: 34 },
    { x: 180, y: 34 },
    { x: 70, y: 80 },
  ],
}

const glock: WeaponModel = {
  parts: [
    { d: 'M46 26 L210 26 Q216 26 216 32 L216 48 L46 48 Z', depth: 15 },
    { d: 'M204 21 L210 21 L210 26 L204 26 Z M52 21 L62 21 L62 26 L52 26 Z', mat: 'metal', depth: 5 },
    { d: 'M54 48 L194 48 L192 58 L62 58 Z', mat: 'dark', depth: 13 },
    { d: 'M58 54 L108 54 L100 104 C99 107 96 108 92 108 L58 108 C54 108 52 105 52 102 L50 98 Z', depth: 15 },
    { d: 'M106 56 L152 56 L152 62 Q150 82 128 82 L106 82 Z M112 62 L144 62 Q142 76 128 76 L112 76 Z', evenOdd: true, mat: 'dark', depth: 8 },
    { d: 'M120 62 L126 62 L124 74 L119 74 Z', mat: 'metal', depth: 4 },
  ],
  details: vlines(54, 74, 30, 46, 4) + ' M120 29 H152 V37 H120 Z M62 66 L98 66 M60 76 L96 76 M58 86 L94 86 M58 96 L92 96',
  stickers: [
    { x: 96, y: 37 },
    { x: 170, y: 37 },
    { x: 134, y: 37 },
    { x: 78, y: 86 },
  ],
}

const usps: WeaponModel = {
  parts: [
    { d: 'M36 30 L162 30 L164 50 L36 50 Z', depth: 15 },
    { d: rr(160, 31, 90, 18, 7), mat: 'dark', depth: 16 },
    { d: 'M40 50 L150 50 L150 60 L48 60 Z', mat: 'dark', depth: 13 },
    { d: 'M44 56 L92 56 L86 104 C85 107 82 108 78 108 L46 108 C42 108 40 105 40 102 L38 98 Z', depth: 15 },
    { d: 'M90 58 L132 58 L132 64 Q130 82 112 82 L92 82 Z M96 64 L124 64 Q122 76 112 76 L96 76 Z', evenOdd: true, mat: 'dark', depth: 8 },
    { d: 'M28 32 L38 28 L40 38 Z', mat: 'metal', depth: 6 },
    { d: 'M42 25 L52 25 L52 30 L42 30 Z M150 25 L156 25 L156 30 L150 30 Z', mat: 'metal', depth: 5 },
  ],
  details: vlines(42, 60, 33, 48, 4) + ' M96 33 H126 V40 H96 Z M168 34 V46 M244 34 V46 M48 70 L82 70 M46 82 L80 82 M44 94 L78 94',
  stickers: [
    { x: 76, y: 40 },
    { x: 140, y: 40 },
    { x: 200, y: 40 },
    { x: 62, y: 86 },
  ],
}

const p250: WeaponModel = {
  parts: [
    { d: 'M56 30 Q56 26 62 26 L196 26 Q204 26 204 34 L204 48 L56 48 Z', depth: 15 },
    { d: 'M60 48 L184 48 L182 58 L68 58 Z', mat: 'dark', depth: 13 },
    { d: 'M64 54 L114 54 L106 102 C105 105 102 106 98 106 L64 106 C60 106 58 103 58 100 L56 96 Z', depth: 15 },
    { d: 'M112 56 L156 56 L156 62 Q154 80 134 80 L112 80 Z M118 62 L148 62 Q146 74 134 74 L118 74 Z', evenOdd: true, mat: 'dark', depth: 8 },
    { d: 'M48 32 L58 28 L60 38 Z', mat: 'metal', depth: 6 },
    { d: 'M194 21 L200 21 L200 26 L194 26 Z', mat: 'metal', depth: 5 },
  ],
  details: vlines(62, 80, 30, 46, 4) + ' M124 29 H154 V37 H124 Z M68 68 L104 68 M66 80 L102 80 M64 92 L100 92',
  stickers: [
    { x: 100, y: 37 },
    { x: 172, y: 37 },
    { x: 140, y: 37 },
    { x: 82, y: 86 },
  ],
}

const p2000: WeaponModel = {
  parts: [
    { d: 'M44 28 L212 28 Q218 28 218 34 L218 48 L44 48 Z', depth: 15 },
    { d: 'M48 48 L196 48 L194 58 L56 58 Z', mat: 'dark', depth: 13 },
    { d: 'M52 54 L102 54 L95 104 C94 107 91 108 87 108 L54 108 C50 108 48 105 48 102 L46 98 Z', depth: 15 },
    { d: 'M100 56 L144 56 L144 62 Q142 80 122 80 L100 80 Z M106 62 L136 62 Q134 74 122 74 L106 74 Z', evenOdd: true, mat: 'dark', depth: 8 },
    { d: 'M36 30 L46 26 L48 36 Z', mat: 'metal', depth: 6 },
    { d: 'M206 23 L212 23 L212 28 L206 28 Z M50 23 L60 23 L60 28 L50 28 Z', mat: 'metal', depth: 5 },
  ],
  details: vlines(50, 70, 31, 46, 4) + ' M116 31 H148 V38 H116 Z M56 68 L92 68 M54 80 L90 80 M52 92 L88 92',
  stickers: [
    { x: 92, y: 38 },
    { x: 172, y: 38 },
    { x: 134, y: 38 },
    { x: 72, y: 86 },
  ],
}

const fiveseven: WeaponModel = {
  parts: [
    { d: 'M42 30 L220 30 L222 34 L222 46 L42 46 Z', depth: 14 },
    { d: 'M46 46 L200 46 L198 56 L54 56 Z', depth: 12 },
    { d: 'M50 52 L96 52 L92 106 C91 108 88 109 85 109 L52 109 C48 109 46 106 46 103 L44 98 Z', depth: 14 },
    { d: 'M94 54 L134 54 L134 60 L124 80 L96 80 Z M100 60 L128 60 L120 74 L100 74 Z', evenOdd: true, mat: 'dark', depth: 8 },
    { d: 'M212 25 L218 25 L218 30 L212 30 Z', mat: 'metal', depth: 5 },
  ],
  details: vlines(48, 68, 33, 44, 4) + ' M116 33 H150 V39 H116 Z M54 64 L88 64 M52 76 L88 76 M52 88 L86 88 M50 100 L86 100',
  stickers: [
    { x: 92, y: 38 },
    { x: 180, y: 38 },
    { x: 140, y: 38 },
    { x: 70, y: 84 },
  ],
}

const tec9: WeaponModel = {
  parts: [
    { d: 'M36 34 L170 34 L170 56 L40 56 Z', depth: 15 },
    { d: `M168 36 L238 36 L238 52 L168 52 Z ${circle(180, 44, 3)} ${circle(192, 44, 3)} ${circle(204, 44, 3)} ${circle(216, 44, 3)} ${circle(228, 44, 3)}`, evenOdd: true, mat: 'metal', depth: 12 },
    { d: 'M236 39 L248 39 L248 49 L236 49 Z', mat: 'metal', depth: 8 },
    { d: 'M58 54 L90 54 L84 102 L56 102 Z', depth: 14 },
    { d: 'M120 56 L140 56 L142 106 L122 106 Z', mat: 'dark', depth: 12 },
    { d: 'M90 56 L120 56 L120 74 L96 74 Z M96 60 L114 60 L114 70 L99 70 Z', evenOdd: true, mat: 'dark', depth: 8 },
    { d: 'M44 28 L54 28 L54 34 L44 34 Z M150 28 L156 28 L156 34 L150 34 Z', mat: 'metal', depth: 5 },
  ],
  details: 'M44 44 H164 M60 66 L86 66 M58 78 L84 78 M58 90 L84 90 ' + vlines(124, 138, 60, 102, 7),
  stickers: [
    { x: 70, y: 45 },
    { x: 104, y: 45 },
    { x: 140, y: 45 },
    { x: 72, y: 84 },
  ],
}

const cz75: WeaponModel = {
  parts: [
    { d: 'M44 28 Q44 26 48 26 L206 26 Q212 26 212 32 L212 44 L44 44 Z', depth: 14 },
    { d: 'M46 42 L204 42 L204 56 L60 56 Z', depth: 14 },
    { d: 'M52 52 L102 52 L96 102 C95 106 92 108 88 108 L56 108 C50 108 48 104 48 98 Z', depth: 15 },
    { d: 'M100 56 L146 56 Q148 80 124 80 L102 80 Z M106 62 L138 62 Q138 74 124 74 L106 74 Z', evenOdd: true, depth: 8 },
    { d: 'M36 30 L46 26 L48 36 Z', mat: 'metal', depth: 6 },
    { d: 'M200 21 L206 21 L206 26 L200 26 Z', mat: 'metal', depth: 5 },
  ],
  details: vlines(50, 68, 29, 42, 4) + ' M116 29 H148 V36 H116 Z M58 66 L92 66 M56 78 L90 78 M54 90 L88 90',
  stickers: [
    { x: 92, y: 35 },
    { x: 172, y: 35 },
    { x: 134, y: 49 },
    { x: 72, y: 86 },
  ],
}

const berettaParts = (t?: string, mat: Mat = 'paint'): ModelPart[] => [
  { d: 'M40 30 L200 30 L204 34 L204 46 L40 46 Z', mat, depth: 12, t },
  { d: 'M196 25 L201 25 L201 30 L196 30 Z', mat: 'metal', depth: 4, t },
  { d: 'M44 46 L180 46 L178 54 L52 54 Z', mat, depth: 11, t },
  { d: 'M52 50 L88 50 L80 98 C79 101 76 102 72 102 L54 102 C50 102 48 99 49 95 Z', mat: 'dark', depth: 13, t },
  { d: 'M92 52 L132 52 Q132 74 112 74 L94 74 Z M98 57 L126 57 Q126 69 112 69 L98 69 Z', evenOdd: true, mat, depth: 7, t },
]

const dualies: WeaponModel = {
  parts: [...berettaParts('translate(-14 -20) scale(0.82)'), ...berettaParts('translate(46 18) scale(0.82)')],
  details: '',
  stickers: [
    { x: 140, y: 49 },
    { x: 196, y: 49 },
    { x: 60, y: 11 },
    { x: 116, y: 11 },
  ],
}

// ---------- Maschinenpistolen ----------

const mp9: WeaponModel = {
  parts: [
    { d: 'M24 34 L72 34 L72 38 L30 38 L30 50 L72 50 L72 54 L24 54 Z', mat: 'metal', depth: 6 },
    { d: 'M70 30 L190 30 L190 52 L74 52 Z', depth: 16 },
    { d: 'M80 26 L180 26 L180 30 L80 30 Z', mat: 'metal', depth: 10 },
    { d: 'M188 37 L224 37 L224 45 L188 45 Z', mat: 'metal', depth: 7 },
    { d: 'M100 50 L120 50 L118 106 L98 106 Z', depth: 12 },
    { d: 'M150 50 L162 50 L160 78 L150 78 Z', mat: 'dark', depth: 10 },
    { d: 'M120 52 L140 52 Q140 64 130 64 L124 60 Q132 60 132 55 L120 55 Z', mat: 'metal', depth: 4 },
  ],
  details: rail(82, 178, 26, 4) + ' M140 34 H170 V40 H140 Z M78 44 H186 M102 64 H116 M101 78 H116 M100 92 H117',
  stickers: [
    { x: 96, y: 40 },
    { x: 170, y: 46 },
    { x: 108, y: 82 },
    { x: 130, y: 40 },
  ],
}

const mac10: WeaponModel = {
  parts: [
    { d: rr(66, 32, 116, 28, 3), depth: 16 },
    { d: 'M180 39 L214 39 L214 51 L180 51 Z', mat: 'metal', depth: 9 },
    { d: 'M212 37 L222 37 L222 53 L212 53 Z', mat: 'metal', depth: 11 },
    { d: 'M98 58 L124 58 L122 106 L96 106 Z', depth: 13 },
    { d: 'M30 36 L68 36 L68 41 L36 41 L36 54 L68 54 L68 59 L30 59 Z', mat: 'metal', depth: 4 },
    { d: 'M150 58 L166 58 L166 72 L160 72 L160 64 L156 64 L156 72 L150 72 Z', mat: 'dark', depth: 6 },
    { d: 'M118 25 L130 25 L130 32 L118 32 Z', mat: 'metal', depth: 6 },
    { d: 'M72 27 L82 27 L82 32 L72 32 Z M170 27 L176 27 L176 32 L170 32 Z', mat: 'metal', depth: 4 },
  ],
  details: 'M70 46 H178 M140 36 H168 V42 H140 Z ' + vlines(184, 210, 40, 50, 4) + ' M100 70 H120 M99 82 H120 M98 94 H121',
  stickers: [
    { x: 86, y: 46 },
    { x: 110, y: 46 },
    { x: 134, y: 46 },
    { x: 158, y: 46 },
  ],
}

const ump45: WeaponModel = {
  parts: [
    { d: 'M6 40 L60 38 L62 62 L10 66 L6 62 Z M16 46 L52 45 L52 56 L18 58 Z', evenOdd: true, depth: 8 },
    { d: 'M58 34 L190 34 L192 56 L62 56 Z', depth: 16 },
    { d: 'M64 30 L186 30 L186 34 L64 34 Z', mat: 'metal', depth: 10 },
    { d: 'M190 40 L230 40 L230 47 L190 47 Z', mat: 'metal', depth: 6 },
    { d: 'M228 38 L244 38 L244 49 L228 49 Z', mat: 'metal', depth: 9 },
    { d: 'M118 56 L138 56 L142 98 L122 100 Z', depth: 12 },
    { d: 'M80 54 L94 54 L90 82 L76 80 Z', mat: 'dark', depth: 11 },
    { d: 'M94 56 L112 56 Q112 68 102 68 L98 64 Q106 64 106 59 L94 59 Z', mat: 'metal', depth: 4 },
  ],
  details: rail(66, 184, 30, 4) + ' M66 46 H186 M150 38 H180 V44 H150 Z',
  stickers: [
    { x: 80, y: 44 },
    { x: 110, y: 44 },
    { x: 140, y: 49 },
    { x: 130, y: 76 },
  ],
}

const p90: WeaponModel = {
  parts: [
    {
      d: 'M10 54 C10 40 24 32 44 32 L200 32 C210 32 214 38 214 46 L214 60 C214 70 206 74 196 74 L120 76 L110 92 L70 92 C62 92 58 86 60 78 L40 76 C20 74 10 66 10 54 Z M72 60 L104 60 L100 82 L74 82 Z',
      evenOdd: true,
      depth: 18,
    },
    { d: 'M60 24 L196 24 L196 32 L60 32 Z', mat: 'dark', depth: 14 },
    { d: 'M212 46 L240 46 L240 53 L212 53 Z', mat: 'metal', depth: 7 },
    { d: 'M238 44 L248 44 L248 55 L238 55 Z', mat: 'metal', depth: 9 },
    { d: rr(118, 13, 32, 11, 3), mat: 'dark', depth: 10 },
  ],
  details: 'M26 52 C40 46 120 44 200 46 M66 28 H192 M150 60 C170 62 190 62 206 60',
  stickers: [
    { x: 40, y: 54 },
    { x: 140, y: 56 },
    { x: 180, y: 56 },
    { x: 100, y: 44 },
  ],
}

const mp7: WeaponModel = {
  parts: [
    { d: 'M30 36 L66 36 L66 40 L36 40 L36 50 L66 50 L66 54 L30 54 Z', mat: 'metal', depth: 6 },
    { d: 'M64 32 L184 32 L184 54 L70 54 Z', depth: 16 },
    { d: 'M70 28 L180 28 L180 32 L70 32 Z', mat: 'metal', depth: 10 },
    { d: 'M182 40 L216 40 L216 47 L182 47 Z', mat: 'metal', depth: 7 },
    { d: 'M214 38 L226 38 L226 49 L214 49 Z', mat: 'metal', depth: 9 },
    { d: 'M98 52 L118 52 L114 100 L94 100 Z', depth: 13 },
    { d: 'M140 54 L172 54 L172 60 L140 60 Z', mat: 'dark', depth: 8 },
  ],
  details: rail(72, 178, 28, 4) + ' M70 44 H180 M140 36 H170 V42 H140 Z M98 66 H114 M97 78 H113',
  stickers: [
    { x: 88, y: 43 },
    { x: 120, y: 43 },
    { x: 156, y: 47 },
    { x: 104, y: 84 },
  ],
}

const mp5sd: WeaponModel = {
  parts: [
    { d: 'M14 40 L54 40 L54 44 L20 44 L20 54 L54 54 L54 58 L14 58 Z', mat: 'metal', depth: 6 },
    { d: 'M52 34 L160 34 L160 54 L56 54 Z', depth: 15 },
    { d: rr(158, 33, 84, 20, 8), mat: 'dark', depth: 17 },
    { d: 'M110 54 L126 54 C128 70 132 82 140 92 L126 98 C118 84 112 70 110 54 Z', depth: 10 },
    { d: 'M74 52 L88 52 L84 80 L70 78 Z', mat: 'dark', depth: 11 },
    { d: 'M60 28 L72 28 L72 34 L60 34 Z M144 28 L152 28 L152 34 L144 34 Z', mat: 'metal', depth: 5 },
  ],
  details: 'M58 44 H156 M162 38 V48 M236 38 V48 ' + vlines(176, 226, 36, 50, 10),
  stickers: [
    { x: 76, y: 44 },
    { x: 104, y: 44 },
    { x: 136, y: 44 },
    { x: 120, y: 70 },
  ],
}

// ---------- Schrotflinten ----------

const nova: WeaponModel = {
  parts: [
    { d: 'M5 50 L66 44 L70 58 L50 64 L44 82 L28 82 L32 66 L14 76 C8 77 5 73 5 70 Z', depth: 12 },
    { d: 'M64 41 L134 41 L134 57 L68 59 Z', depth: 14 },
    { d: 'M132 43 L250 43 L250 49 L132 49 Z', mat: 'metal', depth: 7 },
    { d: 'M132 51 L230 51 L230 57 L132 57 Z', mat: 'metal', depth: 6 },
    { d: rr(150, 48, 56, 15, 4), depth: 13 },
    { d: 'M242 38 L246 38 L246 43 L242 43 Z', mat: 'metal', depth: 4 },
    { d: 'M74 58 L90 58 Q90 68 80 68 L76 64 Q84 64 84 60 L74 60 Z', mat: 'metal', depth: 4 },
  ],
  details: 'M70 50 H130 ' + vlines(158, 200, 50, 61, 6),
  stickers: [
    { x: 86, y: 49 },
    { x: 116, y: 49 },
    { x: 20, y: 60 },
    { x: 178, y: 55 },
  ],
}

const xm1014: WeaponModel = {
  parts: [
    { d: 'M8 44 L48 42 L50 64 L12 68 L8 64 Z', depth: 12 },
    { d: 'M48 46 L64 46 L64 54 L48 54 Z', mat: 'metal', depth: 8 },
    { d: 'M62 40 L140 40 L140 56 L66 58 Z', depth: 15 },
    { d: 'M138 42 L246 42 L246 48 L138 48 Z', mat: 'metal', depth: 7 },
    { d: 'M138 50 L214 50 L214 56 L138 56 Z', mat: 'metal', depth: 6 },
    { d: 'M140 44 L200 44 L200 60 L140 60 Z', depth: 13 },
    { d: 'M72 56 L86 56 L82 82 L68 80 Z', mat: 'dark', depth: 11 },
    { d: 'M76 34 L86 34 L86 40 L76 40 Z M236 36 L242 36 L242 42 L236 42 Z', mat: 'metal', depth: 5 },
  ],
  details: 'M70 48 H136 M98 43 H126 V48 H98 Z ' + vlines(146, 196, 47, 58, 7),
  stickers: [
    { x: 82, y: 50 },
    { x: 118, y: 52 },
    { x: 26, y: 54 },
    { x: 170, y: 52 },
  ],
}

const mag7: WeaponModel = {
  parts: [
    { d: 'M40 40 Q40 36 46 36 L180 36 L180 62 L46 62 Q40 62 40 56 Z', depth: 18 },
    { d: 'M178 42 L232 42 L232 52 L178 52 Z', mat: 'metal', depth: 10 },
    { d: 'M150 62 L166 62 L164 92 L150 92 Z', mat: 'dark', depth: 11 },
    { d: 'M80 60 L104 60 L100 106 L76 106 Z', depth: 13 },
    { d: 'M20 40 L42 40 L42 44 L26 44 L26 54 L42 54 L42 58 L20 58 Z', mat: 'metal', depth: 5 },
    { d: 'M60 30 L70 30 L70 36 L60 36 Z M166 30 L174 30 L174 36 L166 36 Z', mat: 'metal', depth: 5 },
  ],
  details: 'M46 48 H176 M120 40 H160 V46 H120 Z M82 72 H100 M81 84 H100 M80 96 H100',
  stickers: [
    { x: 70, y: 49 },
    { x: 104, y: 49 },
    { x: 140, y: 52 },
    { x: 90, y: 84 },
  ],
}

const sawedoff: WeaponModel = {
  parts: [
    { d: 'M10 62 C10 52 20 48 30 48 L70 44 L76 58 L52 64 L40 86 L22 88 C14 88 10 80 14 72 Z', depth: 13 },
    { d: 'M68 42 L136 42 L136 58 L72 60 Z', depth: 14 },
    { d: 'M134 44 L206 44 L206 51 L134 51 Z', mat: 'metal', depth: 8 },
    { d: 'M134 53 L196 53 L196 58 L134 58 Z', mat: 'metal', depth: 6 },
    { d: rr(148, 50, 40, 14, 4), depth: 13 },
    { d: 'M78 58 L94 58 Q94 68 84 68 L80 64 Q88 64 88 60 L78 60 Z', mat: 'metal', depth: 4 },
  ],
  details: 'M74 50 H132 M204 44 V51 ' + vlines(154, 182, 52, 62, 6),
  stickers: [
    { x: 90, y: 50 },
    { x: 118, y: 50 },
    { x: 34, y: 58 },
    { x: 168, y: 57 },
  ],
}

const negev: WeaponModel = {
  parts: [
    { d: 'M8 46 L58 40 L60 62 L12 70 Z', depth: 12 },
    { d: 'M56 36 L162 36 L162 58 L58 58 Z', depth: 17 },
    { d: 'M160 42 L250 42 L250 48 L160 48 Z', mat: 'metal', depth: 6 },
    { d: 'M160 37 L214 37 L214 53 L160 53 Z', depth: 14 },
    { d: rr(96, 58, 44, 34, 3), mat: 'dark', depth: 20 },
    { d: 'M70 58 L84 58 L80 82 L66 80 Z', mat: 'dark', depth: 11 },
    { d: 'M108 26 L144 26 L144 30 L136 30 L136 36 L116 36 L116 30 L108 30 Z', mat: 'metal', depth: 6 },
    { d: 'M220 48 L224 48 L238 92 L234 93 Z M220 48 L224 48 L210 92 L206 91 Z', mat: 'metal', depth: 4 },
  ],
  details: 'M62 46 H158 ' + vlines(166, 210, 40, 51, 6) + ' M100 70 H136 M100 80 H136',
  stickers: [
    { x: 76, y: 47 },
    { x: 106, y: 47 },
    { x: 140, y: 47 },
    { x: 34, y: 54 },
  ],
}

// ---------- Messer ----------

const karambit: WeaponModel = {
  parts: [
    { d: `${circle(26, 56, 18)} ${circle(26, 56, 9)}`, evenOdd: true, mat: 'dark', depth: 10 },
    { d: 'M40 46 C70 42 100 44 124 46 L124 64 C100 66 70 68 42 68 Z', mat: 'dark', depth: 14 },
    { d: 'M120 43 C170 28 222 46 242 84 C244 92 238 96 232 92 C208 62 170 56 124 64 Z', depth: 4 },
  ],
  details: 'M52 50 V64 M64 49 V64 M76 48 V64 M88 48 V64 M100 48 V64 M112 48 V64 M128 50 C172 42 210 56 236 88',
}

const butterfly: WeaponModel = {
  parts: [
    { d: 'M118 47 L226 41 C242 41 252 47 250 51 C236 60 208 62 118 62 Z', depth: 4 },
    { d: 'M18 44 L120 45 L120 54 L20 54 Q14 49 18 44 Z M30 47 L110 47.5 L110 51 L32 51 Z', evenOdd: true, mat: 'metal', depth: 8 },
    { d: 'M18 56 L120 56 L120 65 L20 66 Q14 61 18 56 Z M30 59 L110 59 L110 62 L32 63 Z', evenOdd: true, mat: 'metal', depth: 8 },
    { d: circle(116, 55, 4), mat: 'metal', depth: 12 },
  ],
  details: 'M126 55 L240 49',
}

const bayonet: WeaponModel = {
  parts: [
    { d: 'M112 48 L208 44 L222 40 L251 52 L222 63 L112 64 Z', depth: 4 },
    { d: 'M100 34 L113 34 L113 78 L100 78 Z', mat: 'metal', depth: 16 },
    { d: 'M26 48 L100 46 L100 66 L26 68 Z', mat: 'dark', depth: 16 },
    { d: `M8 46 L28 46 L28 70 L8 70 Z ${circle(16, 58, 4)}`, evenOdd: true, mat: 'metal', depth: 14 },
  ],
  details:
    'M120 47 L126 44 L132 47 L138 44 L144 47 L150 44 L156 47 L162 44 L168 47 M116 58 L246 52 M38 47 V67 M50 47 V67 M62 47 V67 M74 47 V67 M86 47 V67',
}

// ---------- Handschuhe ----------

const sportgloves: WeaponModel = {
  parts: [
    { d: rr(92, 82, 72, 26, 5), mat: 'dark', depth: 24 },
    { d: 'M90 46 Q88 86 100 86 L156 86 Q166 86 166 54 L166 46 Z', depth: 22 },
    { d: rr(91, 12, 16, 42, 8), depth: 15 },
    { d: rr(109, 5, 16, 48, 8), depth: 15 },
    { d: rr(127, 7, 16, 46, 8), depth: 15 },
    { d: rr(145, 15, 15, 38, 7.5), depth: 15 },
    { d: 'M162 60 Q184 40 196 48 Q200 58 168 82 Z', depth: 15 },
  ],
  details: 'M96 90 H160 M96 100 H160 M100 60 Q128 70 158 60 M99 24 V40 M117 18 V36 M135 20 V38 M152 26 V40',
}

const drivergloves: WeaponModel = {
  parts: [
    { d: rr(94, 84, 68, 22, 5), depth: 22 },
    { d: `M90 46 Q88 86 100 86 L156 86 Q166 86 166 54 L166 46 Z ${circle(128, 64, 7)}`, evenOdd: true, depth: 22 },
    { d: rr(91, 14, 16, 40, 8), depth: 15 },
    { d: rr(109, 8, 16, 46, 8), depth: 15 },
    { d: rr(127, 10, 16, 44, 8), depth: 15 },
    { d: rr(145, 18, 15, 36, 7.5), mat: 'dark', depth: 15 },
    { d: 'M162 60 Q184 40 196 48 Q200 58 168 82 Z', depth: 15 },
  ],
  details: 'M96 96 H158 M99 26 V40 M117 20 V36 M135 22 V38',
}

export const MODELS: Record<ModelId, WeaponModel> = {
  ak47,
  m4a4,
  m4a1s,
  awp,
  ssg08,
  scar20,
  famas,
  galil,
  sg553,
  aug,
  deagle,
  glock,
  usps,
  p250,
  p2000,
  fiveseven,
  tec9,
  cz75,
  dualies,
  mp9,
  mac10,
  ump45,
  p90,
  mp7,
  mp5sd,
  nova,
  xm1014,
  mag7,
  sawedoff,
  negev,
  karambit,
  butterfly,
  bayonet,
  sportgloves,
  drivergloves,
}

/** Welches Modell zu welchem Waffennamen gehört */
export const WEAPON_MODEL: Record<string, ModelId> = {
  'AK-47': 'ak47',
  M4A4: 'm4a4',
  'M4A1-S': 'm4a1s',
  AWP: 'awp',
  'SSG 08': 'ssg08',
  'SCAR-20': 'scar20',
  FAMAS: 'famas',
  'Galil AR': 'galil',
  'SG 553': 'sg553',
  AUG: 'aug',
  'Desert Eagle': 'deagle',
  'Glock-18': 'glock',
  'USP-S': 'usps',
  P250: 'p250',
  P2000: 'p2000',
  'Five-SeveN': 'fiveseven',
  'Tec-9': 'tec9',
  CZ75: 'cz75',
  'Dual Berettas': 'dualies',
  MP9: 'mp9',
  'MAC-10': 'mac10',
  'UMP-45': 'ump45',
  P90: 'p90',
  MP7: 'mp7',
  'MP5-SD': 'mp5sd',
  Nova: 'nova',
  XM1014: 'xm1014',
  'MAG-7': 'mag7',
  'Sawed-Off': 'sawedoff',
  Negev: 'negev',
  '★ Karambit': 'karambit',
  '★ Butterfly-Messer': 'butterfly',
  '★ Bajonett': 'bayonet',
  '★ Sporthandschuhe': 'sportgloves',
  '★ Fahrerhandschuhe': 'drivergloves',
}

/** Farben der unlackierten Teile */
export const MAT_COLORS: Record<Exclude<Mat, 'paint'>, [string, string]> = {
  metal: ['#5b616b', '#23262c'],
  dark: ['#33363c', '#141518'],
}
