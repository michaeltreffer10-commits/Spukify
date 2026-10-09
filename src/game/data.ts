// Alle Spieldaten: Seltenheiten, Chancen, Abnutzung, Skins und Cases.

export type RarityId = 'blau' | 'lila' | 'pink' | 'rot' | 'gold' | 'mac'

export interface Rarity {
  id: RarityId
  name: string
  color: string
  /** Chance pro Case (0–1) */
  chance: number
}

/** Die MAC-10 „Hitzewelle“ – das Easter Egg. 1 zu 50.000. */
export const MAC_CHANCE = 1 / 50_000

export const RARITIES: Record<RarityId, Rarity> = {
  blau: { id: 'blau', name: 'Militärstandard', color: '#4b69ff', chance: 0.85 - MAC_CHANCE },
  lila: { id: 'lila', name: 'Limitiert', color: '#8847ff', chance: 0.12 },
  pink: { id: 'pink', name: 'Klassifiziert', color: '#d32ce6', chance: 0.025 },
  rot: { id: 'rot', name: 'Verdeckt', color: '#eb4b4b', chance: 0.0045 },
  gold: { id: 'gold', name: '★ Außergewöhnlich', color: '#e4ae39', chance: 0.0005 },
  mac: { id: 'mac', name: 'Schmuggelware', color: '#ff7a18', chance: MAC_CHANCE },
}

/** Reihenfolge von häufig nach selten */
export const RARITY_ORDER: RarityId[] = ['blau', 'lila', 'pink', 'rot', 'gold', 'mac']

export interface Wear {
  name: string
  short: string
  min: number
  max: number
  /** Wie oft dieser Zustand gezogen wird */
  chance: number
  /** Einfluss auf den Wert */
  mult: number
}

export const WEARS: Wear[] = [
  { name: 'Fabrikneu', short: 'FN', min: 0, max: 0.07, chance: 0.1, mult: 1.5 },
  { name: 'Minimale Gebrauchsspuren', short: 'MW', min: 0.07, max: 0.15, chance: 0.2, mult: 1.15 },
  { name: 'Einsatzerprobt', short: 'FT', min: 0.15, max: 0.38, chance: 0.4, mult: 1 },
  { name: 'Abgenutzt', short: 'WW', min: 0.38, max: 0.45, chance: 0.15, mult: 0.85 },
  { name: 'Kampfspuren', short: 'BS', min: 0.45, max: 1, chance: 0.15, mult: 0.7 },
]

export function wearOf(float: number): Wear {
  return WEARS.find((w) => float < w.max) ?? WEARS[WEARS.length - 1]
}

export type Shape = 'rifle' | 'sniper' | 'pistol' | 'smg' | 'shotgun' | 'mg' | 'knife' | 'karambit' | 'gloves'
export type Pattern =
  | 'solid'
  | 'stripes'
  | 'camo'
  | 'fade'
  | 'flames'
  | 'digital'
  | 'waves'
  | 'dots'
  | 'marble'
  | 'zebra'
  | 'hex'

export interface Skin {
  id: string
  weapon: string
  name: string
  shape: Shape
  rarity: RarityId
  /** Grundwert in Münzen (bei „Einsatzerprobt“) */
  value: number
  pattern: Pattern
  colors: [string, string, string]
  /** Nur für die MAC-10: vier Holo-Sticker */
  stickers?: boolean
}

type SkinRow = [weapon: string, name: string, shape: Shape, value: number, pattern: Pattern, colors: [string, string, string]]

function makeSkins(caseId: string, rarity: RarityId, rows: SkinRow[]): Skin[] {
  return rows.map(([weapon, name, shape, value, pattern, colors]) => ({
    id: `${caseId}:${weapon}:${name}`.toLowerCase().replace(/[^a-z0-9:]+/g, '-'),
    weapon,
    name,
    shape,
    rarity,
    value,
    pattern,
    colors,
  }))
}

export interface CaseDef {
  id: string
  name: string
  price: number
  /** Farben für die Case-Grafik */
  colors: [string, string]
  description: string
  skins: Skin[]
}

const spuk: CaseDef = {
  id: 'spuk',
  name: 'Spuk-Case',
  price: 100,
  colors: ['#3b2a6b', '#7cf5c8'],
  description: 'Der Klassiker für Einsteiger. Nebel, Geister und ein paar fiese Überraschungen.',
  skins: [
    ...makeSkins('spuk', 'blau', [
      ['Glock-18', 'Nebelschleier', 'pistol', 18, 'waves', ['#5d6b7a', '#9fb3c8', '#e0ecf7']],
      ['P250', 'Grabstein', 'pistol', 15, 'marble', ['#6f6f6f', '#4a4a4a', '#b5b5b5']],
      ['MP9', 'Irrlicht', 'smg', 22, 'dots', ['#163b3b', '#4ff0c9', '#0d2222']],
      ['Nova', 'Spinnweben', 'shotgun', 16, 'hex', ['#2b2b30', '#a9a9b5', '#56565f']],
      ['SSG 08', 'Mondsichel', 'sniper', 30, 'solid', ['#1d2b55', '#30478a', '#0e1530']],
      ['FAMAS', 'Kürbisfeld', 'rifle', 25, 'camo', ['#3d4a22', '#e07b1f', '#1f2410']],
    ]),
    ...makeSkins('spuk', 'lila', [
      ['UMP-45', 'Geisterstunde', 'smg', 120, 'fade', ['#5a2ca0', '#2fd3a0', '#0f0a24']],
      ['Five-SeveN', 'Poltergeist', 'pistol', 95, 'zebra', ['#efeaf7', '#2a1f3d', '#8b6fd0']],
      ['Galil AR', 'Friedhofsnebel', 'rifle', 150, 'waves', ['#2e3540', '#8fa6b8', '#c7d6e2']],
      ['XM1014', 'Knochenbrecher', 'shotgun', 110, 'stripes', ['#f2efe6', '#1a1a1a', '#8a8576']],
    ]),
    ...makeSkins('spuk', 'pink', [
      ['USP-S', 'Spukschloss', 'pistol', 520, 'digital', ['#2a1550', '#7b3fe4', '#c9a6ff']],
      ['M4A1-S', 'Schattenjäger', 'rifle', 780, 'fade', ['#0b0b14', '#4b2a8a', '#b07bff']],
      ['AWP', 'Gespensterblick', 'sniper', 900, 'flames', ['#0d2a1f', '#38f59b', '#c8ffe6']],
    ]),
    ...makeSkins('spuk', 'rot', [
      ['AK-47', 'Seelenfeuer', 'rifle', 2800, 'flames', ['#160a2e', '#9a4dff', '#5ff0ff']],
      ['Desert Eagle', 'Banshee', 'pistol', 1900, 'fade', ['#ff4fa3', '#7a3cff', '#3ff0ff']],
    ]),
    ...makeSkins('spuk', 'gold', [
      ['★ Karambit', 'Mitternacht', 'karambit', 9000, 'fade', ['#0a0a1a', '#3a2a7a', '#9a7bff']],
      ['★ Bajonett', 'Nebelklinge', 'knife', 7500, 'waves', ['#4a5866', '#b9cad8', '#eef6ff']],
      ['★ Sporthandschuhe', 'Irrlicht', 'gloves', 11000, 'dots', ['#123030', '#4ff0c9', '#e8fff8']],
    ]),
  ],
}

const neon: CaseDef = {
  id: 'neon',
  name: 'Neon-Case',
  price: 250,
  colors: ['#14102e', '#ff3df2'],
  description: 'Leuchtende Skins aus der Cyber-Stadt. Teurer, aber die Drops sind mehr wert.',
  skins: [
    ...makeSkins('neon', 'blau', [
      ['Tec-9', 'Pixelregen', 'pistol', 45, 'digital', ['#1a2040', '#3d7bff', '#7ff0ff']],
      ['P90', 'Leuchtreklame', 'smg', 60, 'stripes', ['#1b0f2b', '#ff3df2', '#2b1840']],
      ['MAG-7', 'Kurzschluss', 'shotgun', 50, 'hex', ['#101820', '#ffd23d', '#2a3440']],
      ['Negev', 'Datenstrom', 'mg', 40, 'digital', ['#0c1a12', '#36ff8a', '#0f3a22']],
      ['Glock-18', 'Synthwave', 'pistol', 70, 'fade', ['#ff7a3d', '#ff3d9a', '#5a2cff']],
      ['SG 553', 'Gitterlinie', 'rifle', 55, 'hex', ['#120d26', '#9a5cff', '#2b2350']],
    ]),
    ...makeSkins('neon', 'lila', [
      ['MP7', 'Laserschwert', 'smg', 300, 'stripes', ['#0b0b16', '#ff2b5e', '#2bd9ff']],
      ['CZ75', 'Glitch', 'pistol', 260, 'digital', ['#ff2bd6', '#2bfff0', '#151525']],
      ['M4A4', 'Nachtfahrt', 'rifle', 420, 'waves', ['#0d0d2b', '#ff3df2', '#3dd8ff']],
      ['Dual Berettas', 'Arcade', 'pistol', 280, 'dots', ['#2b0f4a', '#ffe23d', '#ff3d8a']],
    ]),
    ...makeSkins('neon', 'pink', [
      ['AWP', 'Hyperraum', 'sniper', 2200, 'fade', ['#0a0a2a', '#5a3dff', '#ff3df2']],
      ['AK-47', 'Neonviper', 'rifle', 1900, 'zebra', ['#0e0e12', '#39ff6a', '#d6ff3d']],
      ['P2000', 'Hologramm', 'pistol', 1100, 'marble', ['#9ae8ff', '#ff9af0', '#ffffff']],
    ]),
    ...makeSkins('neon', 'rot', [
      ['M4A4', 'Cyberdrache', 'rifle', 7000, 'flames', ['#120018', '#ff2bd6', '#2bf0ff']],
      ['AWP', 'Elektroschock', 'sniper', 8500, 'stripes', ['#0a1a3a', '#3df2ff', '#fff23d']],
    ]),
    ...makeSkins('neon', 'gold', [
      ['★ Butterfly-Messer', 'Neonfade', 'knife', 30000, 'fade', ['#ff3df2', '#7a3dff', '#3df2ff']],
      ['★ Karambit', 'Laser', 'karambit', 26000, 'digital', ['#0b0b1a', '#ff2b5e', '#3dd8ff']],
      ['★ Fahrerhandschuhe', 'Synth', 'gloves', 32000, 'stripes', ['#1b0f2b', '#ff3df2', '#3df2ff']],
    ]),
  ],
}

const inferno: CaseDef = {
  id: 'inferno',
  name: 'Inferno-Case',
  price: 750,
  colors: ['#2a0a00', '#ff9a1f'],
  description: 'Für Profis. Glühende Lava, echtes Gold – und richtig teure Messer.',
  skins: [
    ...makeSkins('inferno', 'blau', [
      ['Sawed-Off', 'Asche', 'shotgun', 120, 'marble', ['#3a3a3a', '#1c1c1c', '#7a7a7a']],
      ['MP5-SD', 'Glut', 'smg', 150, 'dots', ['#2a1208', '#ff7a1f', '#1a0a04']],
      ['P250', 'Vulkan', 'pistol', 130, 'camo', ['#2a1a14', '#a83a12', '#4a2a1a']],
      ['AUG', 'Lavastein', 'rifle', 180, 'marble', ['#1a1210', '#ff5a1f', '#3a2a24']],
      ['SCAR-20', 'Schwefel', 'sniper', 160, 'solid', ['#c9b23a', '#8a7a1f', '#f0e27a']],
      ['Glock-18', 'Funkenflug', 'pistol', 200, 'dots', ['#120a06', '#ffb03d', '#2a1a0a']],
    ]),
    ...makeSkins('inferno', 'lila', [
      ['Galil AR', 'Feuersturm', 'rifle', 900, 'flames', ['#2a0a00', '#ff5a1f', '#ffd23d']],
      ['Desert Eagle', 'Magma', 'pistol', 1100, 'marble', ['#1a0a04', '#ff4a12', '#ffb03d']],
      ['MAC-10', 'Brandherd', 'smg', 800, 'camo', ['#3a1a0a', '#ff7a1f', '#1a0a04']],
      ['FAMAS', 'Höllenhund', 'rifle', 950, 'zebra', ['#1a0804', '#ff3a12', '#ffb03d']],
    ]),
    ...makeSkins('inferno', 'pink', [
      ['AK-47', 'Phönix', 'rifle', 5000, 'flames', ['#3a0a00', '#ff7a1f', '#fff07a']],
      ['USP-S', 'Glutkern', 'pistol', 3600, 'fade', ['#1a0400', '#ff3a12', '#ffd23d']],
      ['M4A1-S', 'Sonnenwind', 'rifle', 4800, 'waves', ['#ffb03d', '#ff5a1f', '#fff3c4']],
    ]),
    ...makeSkins('inferno', 'rot', [
      ['AWP', 'Drachenodem', 'sniper', 22000, 'flames', ['#2a0400', '#ff3a12', '#ffd23d']],
      ['AK-47', 'Inferno-König', 'rifle', 16000, 'fade', ['#ffd23d', '#ff5a1f', '#5a0a00']],
    ]),
    ...makeSkins('inferno', 'gold', [
      ['★ Karambit', 'Goldrausch', 'karambit', 90000, 'marble', ['#e4ae39', '#8a5a12', '#fff3c4']],
      ['★ Butterfly-Messer', 'Lavafluss', 'knife', 75000, 'flames', ['#2a0400', '#ff5a1f', '#ffd23d']],
      ['★ Sporthandschuhe', 'Höllenglut', 'gloves', 110000, 'flames', ['#1a0400', '#ff3a12', '#ffb03d']],
    ]),
  ],
}

export const CASES: CaseDef[] = [spuk, neon, inferno]

/** Das Easter Egg. Kann aus jedem Case kommen. */
export const MAC_SKIN: Skin = {
  id: 'mac10-hitzewelle',
  weapon: 'MAC-10',
  name: 'Hitzewelle (4× Grund-Holo)',
  shape: 'smg',
  rarity: 'mac',
  value: 3000,
  pattern: 'flames',
  colors: ['#5a0a00', '#ff5a12', '#ffd23d'],
  stickers: true,
}

/** Was die MAC-10 „heute“ wert wäre – erscheint erst nach dem Verkauf 💀 */
export const MAC_REGRET_VALUE = 45_000

const SKIN_MAP = new Map<string, Skin>()
for (const c of CASES) for (const s of c.skins) SKIN_MAP.set(s.id, s)
SKIN_MAP.set(MAC_SKIN.id, MAC_SKIN)

export function getSkin(id: string): Skin | undefined {
  return SKIN_MAP.get(id)
}

export function getCase(id: string): CaseDef | undefined {
  return CASES.find((c) => c.id === id)
}

export function skinTitle(s: Skin): string {
  return `${s.weapon} | ${s.name}`
}
