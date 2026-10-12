// Alle Spieldaten: Seltenheiten, Chancen, Abnutzung, Skins und Cases.
import { WEAPON_MODEL } from './models'
import type { ModelId } from './models'

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
  model: ModelId
  rarity: RarityId
  /** Grundwert in Münzen (bei „Einsatzerprobt“) */
  value: number
  pattern: Pattern
  colors: [string, string, string]
  /** Fest aufgeklebte Sticker (nur die MAC-10 💀) */
  builtInStickers?: string[]
}

type SkinRow = [weapon: string, name: string, value: number, pattern: Pattern, colors: [string, string, string]]

function makeSkins(caseId: string, rarity: RarityId, rows: SkinRow[]): Skin[] {
  return rows.map(([weapon, name, value, pattern, colors]) => ({
    id: `${caseId}:${weapon}:${name}`.toLowerCase().replace(/[^a-z0-9:]+/g, '-'),
    weapon,
    name,
    model: WEAPON_MODEL[weapon] ?? 'ak47',
    rarity,
    value,
    pattern,
    colors,
  }))
}

export interface CaseDef {
  id: string
  name: string
  /** Gesamtpreis: Case + Schlüssel */
  price: number
  /** Preis nur für das Case (der Rest ist der Schlüssel) */
  casePrice: number
  keyPrice: number
  /** Wie oft das Case beim Spielen droppt (Gewicht) */
  dropWeight: number
  /** Farben für die Case-Grafik */
  colors: [string, string]
  description: string
  skins: Skin[]
}

const spuk: CaseDef = {
  id: 'spuk',
  name: 'Spuk-Case',
  price: 100,
  casePrice: 20,
  keyPrice: 80,
  dropWeight: 30,
  colors: ['#3b2a6b', '#7cf5c8'],
  description: 'Der Klassiker für Einsteiger. Nebel, Geister und ein paar fiese Überraschungen.',
  skins: [
    ...makeSkins('spuk', 'blau', [
      ['Glock-18', 'Nebelschleier', 18, 'waves', ['#5d6b7a', '#9fb3c8', '#e0ecf7']],
      ['P250', 'Grabstein', 15, 'marble', ['#6f6f6f', '#4a4a4a', '#b5b5b5']],
      ['MP9', 'Irrlicht', 22, 'dots', ['#163b3b', '#4ff0c9', '#0d2222']],
      ['Nova', 'Spinnweben', 16, 'hex', ['#2b2b30', '#a9a9b5', '#56565f']],
      ['SSG 08', 'Mondsichel', 30, 'solid', ['#1d2b55', '#30478a', '#0e1530']],
      ['FAMAS', 'Kürbisfeld', 25, 'camo', ['#3d4a22', '#e07b1f', '#1f2410']],
    ]),
    ...makeSkins('spuk', 'lila', [
      ['UMP-45', 'Geisterstunde', 120, 'fade', ['#5a2ca0', '#2fd3a0', '#0f0a24']],
      ['Five-SeveN', 'Poltergeist', 95, 'zebra', ['#efeaf7', '#2a1f3d', '#8b6fd0']],
      ['Galil AR', 'Friedhofsnebel', 150, 'waves', ['#2e3540', '#8fa6b8', '#c7d6e2']],
      ['XM1014', 'Knochenbrecher', 110, 'stripes', ['#f2efe6', '#1a1a1a', '#8a8576']],
    ]),
    ...makeSkins('spuk', 'pink', [
      ['USP-S', 'Spukschloss', 520, 'digital', ['#2a1550', '#7b3fe4', '#c9a6ff']],
      ['M4A1-S', 'Schattenjäger', 780, 'fade', ['#0b0b14', '#4b2a8a', '#b07bff']],
      ['AWP', 'Gespensterblick', 900, 'flames', ['#0d2a1f', '#38f59b', '#c8ffe6']],
    ]),
    ...makeSkins('spuk', 'rot', [
      ['AK-47', 'Seelenfeuer', 2800, 'flames', ['#160a2e', '#9a4dff', '#5ff0ff']],
      ['Desert Eagle', 'Banshee', 1900, 'fade', ['#ff4fa3', '#7a3cff', '#3ff0ff']],
    ]),
    ...makeSkins('spuk', 'gold', [
      ['★ Karambit', 'Mitternacht', 9000, 'fade', ['#0a0a1a', '#3a2a7a', '#9a7bff']],
      ['★ Bajonett', 'Nebelklinge', 7500, 'waves', ['#4a5866', '#b9cad8', '#eef6ff']],
      ['★ Sporthandschuhe', 'Irrlicht', 11000, 'dots', ['#123030', '#4ff0c9', '#e8fff8']],
    ]),
  ],
}

const neon: CaseDef = {
  id: 'neon',
  name: 'Neon-Case',
  price: 250,
  casePrice: 50,
  keyPrice: 200,
  dropWeight: 12,
  colors: ['#14102e', '#ff3df2'],
  description: 'Leuchtende Skins aus der Cyber-Stadt. Teurer, aber die Drops sind mehr wert.',
  skins: [
    ...makeSkins('neon', 'blau', [
      ['Tec-9', 'Pixelregen', 45, 'digital', ['#1a2040', '#3d7bff', '#7ff0ff']],
      ['P90', 'Leuchtreklame', 60, 'stripes', ['#1b0f2b', '#ff3df2', '#2b1840']],
      ['MAG-7', 'Kurzschluss', 50, 'hex', ['#101820', '#ffd23d', '#2a3440']],
      ['Negev', 'Datenstrom', 40, 'digital', ['#0c1a12', '#36ff8a', '#0f3a22']],
      ['Glock-18', 'Synthwave', 70, 'fade', ['#ff7a3d', '#ff3d9a', '#5a2cff']],
      ['SG 553', 'Gitterlinie', 55, 'hex', ['#120d26', '#9a5cff', '#2b2350']],
    ]),
    ...makeSkins('neon', 'lila', [
      ['MP7', 'Laserschwert', 300, 'stripes', ['#0b0b16', '#ff2b5e', '#2bd9ff']],
      ['CZ75', 'Glitch', 260, 'digital', ['#ff2bd6', '#2bfff0', '#151525']],
      ['M4A4', 'Nachtfahrt', 420, 'waves', ['#0d0d2b', '#ff3df2', '#3dd8ff']],
      ['Dual Berettas', 'Arcade', 280, 'dots', ['#2b0f4a', '#ffe23d', '#ff3d8a']],
    ]),
    ...makeSkins('neon', 'pink', [
      ['AWP', 'Hyperraum', 2200, 'fade', ['#0a0a2a', '#5a3dff', '#ff3df2']],
      ['AK-47', 'Neonviper', 1900, 'zebra', ['#0e0e12', '#39ff6a', '#d6ff3d']],
      ['P2000', 'Hologramm', 1100, 'marble', ['#9ae8ff', '#ff9af0', '#ffffff']],
    ]),
    ...makeSkins('neon', 'rot', [
      ['M4A4', 'Cyberdrache', 7000, 'flames', ['#120018', '#ff2bd6', '#2bf0ff']],
      ['AWP', 'Elektroschock', 8500, 'stripes', ['#0a1a3a', '#3df2ff', '#fff23d']],
    ]),
    ...makeSkins('neon', 'gold', [
      ['★ Butterfly-Messer', 'Neonfade', 30000, 'fade', ['#ff3df2', '#7a3dff', '#3df2ff']],
      ['★ Karambit', 'Laser', 26000, 'digital', ['#0b0b1a', '#ff2b5e', '#3dd8ff']],
      ['★ Fahrerhandschuhe', 'Synth', 32000, 'stripes', ['#1b0f2b', '#ff3df2', '#3df2ff']],
    ]),
  ],
}

const inferno: CaseDef = {
  id: 'inferno',
  name: 'Inferno-Case',
  price: 750,
  casePrice: 150,
  keyPrice: 600,
  dropWeight: 4,
  colors: ['#2a0a00', '#ff9a1f'],
  description: 'Für Profis. Glühende Lava, echtes Gold – und richtig teure Messer.',
  skins: [
    ...makeSkins('inferno', 'blau', [
      ['Sawed-Off', 'Asche', 120, 'marble', ['#3a3a3a', '#1c1c1c', '#7a7a7a']],
      ['MP5-SD', 'Glut', 150, 'dots', ['#2a1208', '#ff7a1f', '#1a0a04']],
      ['P250', 'Vulkan', 130, 'camo', ['#2a1a14', '#a83a12', '#4a2a1a']],
      ['AUG', 'Lavastein', 180, 'marble', ['#1a1210', '#ff5a1f', '#3a2a24']],
      ['SCAR-20', 'Schwefel', 160, 'solid', ['#c9b23a', '#8a7a1f', '#f0e27a']],
      ['Glock-18', 'Funkenflug', 200, 'dots', ['#120a06', '#ffb03d', '#2a1a0a']],
    ]),
    ...makeSkins('inferno', 'lila', [
      ['Galil AR', 'Feuersturm', 900, 'flames', ['#2a0a00', '#ff5a1f', '#ffd23d']],
      ['Desert Eagle', 'Magma', 1100, 'marble', ['#1a0a04', '#ff4a12', '#ffb03d']],
      ['MAC-10', 'Brandherd', 800, 'camo', ['#3a1a0a', '#ff7a1f', '#1a0a04']],
      ['FAMAS', 'Höllenhund', 950, 'zebra', ['#1a0804', '#ff3a12', '#ffb03d']],
    ]),
    ...makeSkins('inferno', 'pink', [
      ['AK-47', 'Phönix', 5000, 'flames', ['#3a0a00', '#ff7a1f', '#fff07a']],
      ['USP-S', 'Glutkern', 3600, 'fade', ['#1a0400', '#ff3a12', '#ffd23d']],
      ['M4A1-S', 'Sonnenwind', 4800, 'waves', ['#ffb03d', '#ff5a1f', '#fff3c4']],
    ]),
    ...makeSkins('inferno', 'rot', [
      ['AWP', 'Drachenodem', 22000, 'flames', ['#2a0400', '#ff3a12', '#ffd23d']],
      ['AK-47', 'Inferno-König', 16000, 'fade', ['#ffd23d', '#ff5a1f', '#5a0a00']],
    ]),
    ...makeSkins('inferno', 'gold', [
      ['★ Karambit', 'Goldrausch', 90000, 'marble', ['#e4ae39', '#8a5a12', '#fff3c4']],
      ['★ Butterfly-Messer', 'Lavafluss', 75000, 'flames', ['#2a0400', '#ff5a1f', '#ffd23d']],
      ['★ Sporthandschuhe', 'Höllenglut', 110000, 'flames', ['#1a0400', '#ff3a12', '#ffb03d']],
    ]),
  ],
}

const pixel: CaseDef = {
  id: 'pixel',
  name: 'Pixel-Case',
  price: 125,
  casePrice: 25,
  keyPrice: 100,
  dropWeight: 26,
  colors: ['#1a1033', '#ffe23d'],
  description: 'Retro-Skins aus der Spielhalle. 8-Bit, Kassetten und Highscores.',
  skins: [
    ...makeSkins('pixel', 'blau', [
      ['Glock-18', '8-Bit', 22, 'digital', ['#ff3d3d', '#3d8bff', '#ffe23d']],
      ['Nova', 'Handheld', 18, 'solid', ['#8bac0f', '#9bbc0f', '#306230']],
      ['MP7', 'Kassette', 24, 'stripes', ['#2a2a2a', '#ff7a3d', '#d9d9d9']],
      ['P250', 'Joystick', 20, 'dots', ['#1a1033', '#ff3d9a', '#3dffd8']],
      ['Negev', 'Klötzchen', 26, 'digital', ['#3dffd8', '#ff3d9a', '#ffe23d']],
      ['SG 553', 'Pong', 30, 'solid', ['#2a2a2a', '#ffffff', '#111111']],
    ]),
    ...makeSkins('pixel', 'lila', [
      ['MAC-10', 'Highscore', 150, 'digital', ['#1a1033', '#ffe23d', '#ff3d9a']],
      ['CZ75', 'Pixelherz', 130, 'dots', ['#ff3d6a', '#ffd0dc', '#ffffff']],
      ['Galil AR', 'Röhrenfernseher', 170, 'waves', ['#2a3a2a', '#8aff8a', '#0a1a0a']],
      ['Sawed-Off', 'Cheatcode', 140, 'hex', ['#0a0a0a', '#3dff6a', '#1a3a1a']],
    ]),
    ...makeSkins('pixel', 'pink', [
      ['USP-S', 'Endgegner', 800, 'flames', ['#1a0a2a', '#ff3d9a', '#ffe23d']],
      ['M4A4', 'Speedrun', 900, 'stripes', ['#1a1033', '#3dffd8', '#ff3d9a']],
      ['P90', 'Game Over', 650, 'digital', ['#000000', '#ff2b2b', '#ffffff']],
    ]),
    ...makeSkins('pixel', 'rot', [
      ['AK-47', 'Level 99', 3600, 'digital', ['#ffe23d', '#ff3d3d', '#1a1033']],
      ['AWP', 'Extraleben', 4000, 'fade', ['#ff3d9a', '#ffe23d', '#3dffd8']],
    ]),
    ...makeSkins('pixel', 'gold', [
      ['★ Karambit', 'Pixelklinge', 11000, 'digital', ['#3dffd8', '#ff3d9a', '#ffe23d']],
      ['★ Butterfly-Messer', 'Arcade', 10000, 'dots', ['#1a1033', '#ff3d9a', '#3dffd8']],
      ['★ Sporthandschuhe', 'Konsole', 13000, 'stripes', ['#2a2a2a', '#ffe23d', '#ff3d3d']],
    ]),
  ],
}

const frost: CaseDef = {
  id: 'frost',
  name: 'Frost-Case',
  price: 150,
  casePrice: 30,
  keyPrice: 120,
  dropWeight: 22,
  colors: ['#0d2433', '#7fe3ff'],
  description: 'Eiskalte Skins aus der Arktis. Raureif, Gletscher und Nordlichter.',
  skins: [
    ...makeSkins('frost', 'blau', [
      ['Glock-18', 'Raureif', 25, 'waves', ['#9fc9de', '#e8f7ff', '#5b8aa3']],
      ['P2000', 'Eiszapfen', 22, 'stripes', ['#1d3b52', '#bfe9ff', '#5aa3c9']],
      ['MP7', 'Polarnacht', 28, 'solid', ['#0e1a2b', '#2a4466', '#0a1220']],
      ['Nova', 'Schneesturm', 24, 'dots', ['#9bb3c2', '#ffffff', '#d7e6ef']],
      ['AUG', 'Gletscher', 35, 'marble', ['#bfe3f0', '#7fb8d1', '#ffffff']],
      ['Tec-9', 'Frostbiss', 26, 'hex', ['#14304a', '#8fd8ff', '#0a1a2a']],
    ]),
    ...makeSkins('frost', 'lila', [
      ['M4A1-S', 'Nordlicht', 220, 'fade', ['#0b1d3a', '#2fd39a', '#9a5cff']],
      ['Five-SeveN', 'Kristall', 160, 'hex', ['#a8e6ff', '#ffffff', '#5ab0d9']],
      ['SG 553', 'Lawine', 180, 'camo', ['#e6f2f8', '#9fc0d1', '#5d7f94']],
      ['MAG-7', 'Eisbrecher', 150, 'stripes', ['#0d2433', '#7fe3ff', '#ffffff']],
    ]),
    ...makeSkins('frost', 'pink', [
      ['AWP', 'Permafrost', 1300, 'marble', ['#d9f3ff', '#5ab0d9', '#ffffff']],
      ['AK-47', 'Eiskönigin', 1100, 'fade', ['#ffffff', '#7fe3ff', '#5a3dff']],
      ['USP-S', 'Kälteschock', 700, 'digital', ['#0a1a2a', '#7fe3ff', '#ffffff']],
    ]),
    ...makeSkins('frost', 'rot', [
      ['M4A4', 'Yeti', 4200, 'zebra', ['#f2f8fb', '#5d7f94', '#7fe3ff']],
      ['Desert Eagle', 'Frostdrache', 3500, 'flames', ['#0a1a2a', '#7fe3ff', '#ffffff']],
    ]),
    ...makeSkins('frost', 'gold', [
      ['★ Bajonett', 'Eiskristall', 16000, 'marble', ['#e8f7ff', '#7fe3ff', '#ffffff']],
      ['★ Karambit', 'Polarlicht', 18000, 'fade', ['#0b1d3a', '#2fd39a', '#9a5cff']],
      ['★ Fahrerhandschuhe', 'Schneeflocke', 20000, 'dots', ['#2a4466', '#ffffff', '#7fe3ff']],
    ]),
  ],
}

const dschungel: CaseDef = {
  id: 'dschungel',
  name: 'Dschungel-Case',
  price: 200,
  casePrice: 40,
  keyPrice: 160,
  dropWeight: 18,
  colors: ['#0f2a12', '#9cff57'],
  description: 'Wilde Skins aus dem Regenwald. Pfeilgiftfrösche, Jaguare und Schlangen.',
  skins: [
    ...makeSkins('dschungel', 'blau', [
      ['P250', 'Lianen', 30, 'waves', ['#1f3d1a', '#5aa83a', '#0f2410']],
      ['MP9', 'Tarnfrosch', 35, 'camo', ['#3a5a1f', '#8fd14f', '#1f3010']],
      ['Sawed-Off', 'Baumrinde', 28, 'marble', ['#4a3520', '#2a1d10', '#7a5a3a']],
      ['Galil AR', 'Farn', 40, 'hex', ['#1a3318', '#6fbf4a', '#0d1a0c']],
      ['SSG 08', 'Moos', 38, 'solid', ['#3a5a2a', '#5a7a3a', '#1f3315']],
      ['UMP-45', 'Bambus', 33, 'stripes', ['#c9b26a', '#6a7a2a', '#e8d9a0']],
    ]),
    ...makeSkins('dschungel', 'lila', [
      ['P90', 'Pfeilgiftfrosch', 260, 'dots', ['#1a1a1a', '#ffcc00', '#2aa8ff']],
      ['Glock-18', 'Tukan', 240, 'fade', ['#1a1a1a', '#ff8a1f', '#ffe23d']],
      ['XM1014', 'Python', 230, 'zebra', ['#3a2a10', '#c9a03a', '#1a1408']],
      ['FAMAS', 'Regenwald', 280, 'camo', ['#0f3a1a', '#2a7a3a', '#7acf5a']],
    ]),
    ...makeSkins('dschungel', 'pink', [
      ['AK-47', 'Jaguar', 1700, 'dots', ['#d9a03a', '#1a1408', '#7a4a10']],
      ['M4A1-S', 'Mamba', 1500, 'zebra', ['#1a3a10', '#9cff57', '#0a1a08']],
      ['Desert Eagle', 'Gorilla', 1000, 'camo', ['#2a2a2a', '#4a4a4a', '#1a1a1a']],
    ]),
    ...makeSkins('dschungel', 'rot', [
      ['AWP', 'Dschungelkönig', 6500, 'flames', ['#0f2a12', '#9cff57', '#ffe23d']],
      ['AK-47', 'Smaragdschlange', 5200, 'fade', ['#0a3a1a', '#2aff8a', '#d6ff3d']],
    ]),
    ...makeSkins('dschungel', 'gold', [
      ['★ Butterfly-Messer', 'Smaragd', 26000, 'fade', ['#0a3a1a', '#2aff8a', '#d6ff3d']],
      ['★ Bajonett', 'Tigerzahn', 22000, 'zebra', ['#ff8a1f', '#1a1a1a', '#ffcc5a']],
      ['★ Sporthandschuhe', 'Viper', 28000, 'zebra', ['#1a3a10', '#9cff57', '#0a1a08']],
    ]),
  ],
}

const galaxie: CaseDef = {
  id: 'galaxie',
  name: 'Galaxie-Case',
  price: 500,
  casePrice: 100,
  keyPrice: 400,
  dropWeight: 7,
  colors: ['#090620', '#8a7bff'],
  description: 'Skins aus den Tiefen des Alls. Nebel, Kometen und schwarze Löcher.',
  skins: [
    ...makeSkins('galaxie', 'blau', [
      ['Five-SeveN', 'Sternenstaub', 80, 'dots', ['#0a0a2a', '#ffffff', '#8a7bff']],
      ['MP9', 'Mondgestein', 70, 'marble', ['#6a6a7a', '#3a3a4a', '#a0a0b0']],
      ['XM1014', 'Meteor', 85, 'flames', ['#1a1a2a', '#ff7a3d', '#ffd23d']],
      ['FAMAS', 'Orbit', 90, 'waves', ['#0a0a2a', '#5a7bff', '#a0b0ff']],
      ['SCAR-20', 'Raumstation', 75, 'hex', ['#d9d9e6', '#5a5a7a', '#ffffff']],
      ['P2000', 'Satellit', 65, 'stripes', ['#2a2a4a', '#c0c0d9', '#5a5a7a']],
    ]),
    ...makeSkins('galaxie', 'lila', [
      ['UMP-45', 'Nebula', 500, 'fade', ['#2a0a4a', '#ff3df2', '#3dd8ff']],
      ['Desert Eagle', 'Schwarzes Loch', 600, 'fade', ['#000000', '#3a1a6a', '#ff9a3d']],
      ['MP5-SD', 'Komet', 450, 'flames', ['#0a0a2a', '#3dd8ff', '#ffffff']],
      ['AUG', 'Supernova', 550, 'fade', ['#ffd23d', '#ff3d7a', '#3a0a6a']],
    ]),
    ...makeSkins('galaxie', 'pink', [
      ['AK-47', 'Kosmos', 3000, 'dots', ['#090620', '#8a7bff', '#ffffff']],
      ['M4A1-S', 'Milchstraße', 2800, 'marble', ['#1a0a3a', '#c9b8ff', '#ffffff']],
      ['Glock-18', 'Alien', 1800, 'hex', ['#0a1a0a', '#3dff6a', '#a0ffb0']],
    ]),
    ...makeSkins('galaxie', 'rot', [
      ['AWP', 'Galaxie', 12000, 'fade', ['#090620', '#8a7bff', '#ff3df2']],
      ['M4A4', 'Ereignishorizont', 10000, 'zebra', ['#000000', '#8a7bff', '#ff9a3d']],
    ]),
    ...makeSkins('galaxie', 'gold', [
      ['★ Karambit', 'Doppler', 55000, 'fade', ['#1a0a4a', '#ff3df2', '#3dd8ff']],
      ['★ Butterfly-Messer', 'Saphir', 50000, 'fade', ['#0a1a6a', '#3d6aff', '#a0d0ff']],
      ['★ Fahrerhandschuhe', 'Sternbild', 60000, 'dots', ['#090620', '#ffffff', '#8a7bff']],
    ]),
  ],
}

const gold: CaseDef = {
  id: 'gold',
  name: 'Gold-Case',
  price: 2000,
  casePrice: 400,
  keyPrice: 1600,
  dropWeight: 1,
  colors: ['#2a1f00', '#ffd23d'],
  description: 'Das teuerste Case. Pures Gold, Diamanten und Messer für über 200.000 Münzen.',
  skins: [
    ...makeSkins('gold', 'blau', [
      ['Glock-18', 'Goldbarren', 400, 'solid', ['#e4ae39', '#fff3c4', '#8a5a12']],
      ['P250', 'Tresor', 350, 'hex', ['#3a3a3a', '#e4ae39', '#1a1a1a']],
      ['MP7', 'Dukaten', 380, 'dots', ['#8a5a12', '#ffd23d', '#5a3a08']],
      ['Nova', 'Kronjuwel', 420, 'marble', ['#5a0a2a', '#ffd23d', '#ff3d7a']],
      ['SSG 08', 'Champagner', 450, 'fade', ['#fff3c4', '#e4ae39', '#ffffff']],
      ['Tec-9', 'Bling', 360, 'digital', ['#ffd23d', '#ffffff', '#8a5a12']],
    ]),
    ...makeSkins('gold', 'lila', [
      ['M4A1-S', 'Königlich', 2500, 'stripes', ['#2a0a4a', '#ffd23d', '#5a1a8a']],
      ['USP-S', 'Juwelier', 2200, 'marble', ['#0a3a2a', '#ffd23d', '#2aff9a']],
      ['Galil AR', 'Schatzkarte', 2000, 'camo', ['#c9a86a', '#8a5a2a', '#e8d9a0']],
      ['Dual Berettas', 'Diamant', 2300, 'hex', ['#d9f3ff', '#ffffff', '#7fd3ff']],
    ]),
    ...makeSkins('gold', 'pink', [
      ['AK-47', 'Goldrausch Elite', 12000, 'marble', ['#e4ae39', '#8a5a12', '#fff3c4']],
      ['Desert Eagle', 'Midas', 10000, 'fade', ['#8a5a12', '#ffd23d', '#fff3c4']],
      ['P90', 'Kaiser', 8000, 'zebra', ['#1a1a1a', '#ffd23d', '#8a5a12']],
    ]),
    ...makeSkins('gold', 'rot', [
      ['AWP', 'Königsdrache', 50000, 'flames', ['#2a1f00', '#ffd23d', '#ffffff']],
      ['M4A4', 'Sonnenkönig', 40000, 'fade', ['#fff3c4', '#ffd23d', '#ff7a1f']],
    ]),
    ...makeSkins('gold', 'gold', [
      ['★ Karambit', 'Gold-Doppler', 220000, 'fade', ['#8a5a12', '#ffd23d', '#ff3d7a']],
      ['★ Butterfly-Messer', '24 Karat', 180000, 'solid', ['#ffd23d', '#fff3c4', '#8a5a12']],
      ['★ Sporthandschuhe', 'Pharao', 250000, 'stripes', ['#0a2a6a', '#ffd23d', '#3d6aff']],
    ]),
  ],
}

export const CASES: CaseDef[] = [spuk, pixel, frost, dschungel, neon, galaxie, inferno, gold]

/** Das Easter Egg. Kann aus jedem Case kommen. */
export const MAC_SKIN: Skin = {
  id: 'mac10-hitzewelle',
  weapon: 'MAC-10',
  name: 'Hitzewelle (4× Grund-Holo)',
  model: 'mac10',
  rarity: 'mac',
  value: 3000,
  pattern: 'flames',
  colors: ['#5a0a00', '#ff5a12', '#ffd23d'],
  builtInStickers: ['legenden:grund-holo', 'legenden:grund-holo', 'legenden:grund-holo', 'legenden:grund-holo'],
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
