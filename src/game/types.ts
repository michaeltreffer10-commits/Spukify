import type { RarityId } from './data'
import type { Item, StickerItem } from './roll'
import type { StickerFinish } from './stickers'

export type GameId = 'aim' | 'bomb' | 'reaction' | 'headshot'

export type MissionType =
  | 'open'
  | 'rare'
  | 'sell'
  | 'games'
  | 'gameCoins'
  | 'bomb'
  | 'headshots'
  | 'aimHits'
  | 'reaction'
  | 'capsules'
  | 'stickers'

export interface Mission {
  id: string
  type: MissionType
  target: number
  /** Zusatzwert, z. B. die Millisekunden beim Reaktionstest */
  param?: number
  progress: number
  reward: number
  xp: number
  claimed: boolean
}

export type EventId = 'glueck' | 'rabatt' | 'xp' | 'haendler' | 'regen'

export interface Stats {
  opened: number
  spent: number
  /** Münzen aus Verkäufen */
  sold: number
  soldCount: number
  /** Münzen aus Minispielen, Bonus, Missionen usw. */
  earned: number
  drops: Record<RarityId, number>
  best?: { skinId: string; float: number; value: number }
  /** Wie oft die MAC-10 verkauft wurde 💀 */
  macSold: number
  blueStreak: number
  bestBlueStreak: number
  games: number
  gameCoins: number
  gameBest: Record<GameId, number>
  aimHitsBest: number
  bombsDefused: number
  bombsExploded: number
  headshots: number
  hostages: number
  /** Schnellste Reaktion in ms (0 = noch keine) */
  bestReaction: number
  earlyClicks: number
  bulk100: number
  lowFloat: number
  highFloat: number
  events: number
  dailies: number
  missionsDone: number
  wasBroke: boolean
  capsulesOpened: number
  stickerDrops: Record<StickerFinish, number>
  stickersApplied: number
  casesDropped: number
  pressCollected: number
  hourlies: number
  /** Wie oft der Titan (Holo) gezogen wurde 📢 */
  titans: number
}

/** Die Geldpresse: druckt Münzen, auch wenn das Spiel zu ist */
export interface PressState {
  /** Druckgeschwindigkeit (Stufe 1–50) */
  speed: number
  /** Goldtinte: ×1,25 pro Stufe */
  ink: number
  /** Tresor: +1 Stunde Speicher pro Stufe */
  vault: number
  /** Seit wann gedruckt wird */
  last: number
}

export interface SaveState {
  coins: number
  items: Item[]
  lastDaily: number
  sound: boolean
  meme: boolean
  voice: boolean
  fast: boolean
  /** Leertaste spammen, um Kisten aufzubrechen */
  spamOpen: boolean
  xp: number
  /** Kisten im Inventar */
  cases: Record<string, number>
  keys: Record<string, number>
  capsules: Record<string, number>
  stickers: StickerItem[]
  press: PressState
  lastHourly: number
  /** Welche Skins man schon einmal gezogen hat (und wie oft) */
  album: Record<string, number>
  albumClaimed: string[]
  achievements: Record<string, number>
  missions: { day: string; list: Mission[]; bonusClaimed: boolean }
  event: { id: EventId; until: number } | null
  stats: Stats
}
