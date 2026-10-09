// Level, Missionen, Erfolge, Sammelalbum und Zufalls-Ereignisse.
import { CASES, MAC_SKIN } from './data'
import type { CaseDef } from './data'
import type { EventId, Mission, MissionType, SaveState } from './types'

// ---------- Level ----------

/** XP, die man von Level n bis Level n+1 braucht */
export function needXp(level: number): number {
  return Math.round(100 * Math.pow(level, 1.35))
}

export function levelInfo(xp: number): { level: number; into: number; need: number } {
  let level = 1
  let rest = xp
  while (rest >= needXp(level)) {
    rest -= needXp(level)
    level++
  }
  return { level, into: rest, need: needXp(level) }
}

export function levelReward(level: number): { coins: number; caseId: string } {
  return {
    coins: 250 * level,
    caseId: level % 10 === 0 ? 'inferno' : level % 5 === 0 ? 'neon' : 'spuk',
  }
}

/** Bonus auf Minispiel-Münzen: +2 % pro Level, höchstens +100 % */
export function gameBonus(level: number): number {
  return Math.min(1, (level - 1) * 0.02)
}

export function xpForCase(c: CaseDef): number {
  return Math.round(c.price / 10)
}

// ---------- Missionen ----------

interface MissionTemplate {
  type: MissionType
  targets: number[]
  reward: (target: number) => number
  text: (m: Mission) => string
}

export const MISSION_TEMPLATES: MissionTemplate[] = [
  { type: 'open', targets: [15, 30, 60], reward: (n) => n * 20, text: (m) => `Öffne ${m.target} Cases` },
  {
    type: 'rare',
    targets: [2, 4, 6],
    reward: (n) => n * 150,
    text: (m) => `Ziehe ${m.target} Skins der Stufe „Limitiert“ oder besser`,
  },
  { type: 'sell', targets: [10, 25, 50], reward: (n) => n * 10, text: (m) => `Verkaufe ${m.target} Skins` },
  { type: 'games', targets: [3, 5, 8], reward: (n) => n * 80, text: (m) => `Spiele ${m.target} Runden Minispiele` },
  {
    type: 'gameCoins',
    targets: [500, 1000, 2000],
    reward: (n) => Math.round(n * 0.3),
    text: (m) => `Verdiene ${m.target.toLocaleString('de-DE')} Münzen in Minispielen`,
  },
  { type: 'bomb', targets: [2, 3, 5], reward: (n) => n * 120, text: (m) => `Entschärfe ${m.target} Bomben` },
  { type: 'headshots', targets: [10, 20, 35], reward: (n) => n * 12, text: (m) => `Schaffe ${m.target} Kopfschüsse` },
  { type: 'aimHits', targets: [30, 60, 100], reward: (n) => n * 6, text: (m) => `Triff ${m.target} Ziele im Aim-Training` },
  {
    type: 'reaction',
    targets: [320, 280, 250],
    reward: (ms) => Math.round(150000 / ms),
    text: (m) => `Reagiere schneller als ${m.param} ms`,
  },
]

export function missionText(m: Mission): string {
  return MISSION_TEMPLATES.find((t) => t.type === m.type)?.text(m) ?? ''
}

export const MISSION_BONUS = { coins: 500, caseId: 'neon' }

export function dayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Jeden Tag die gleichen 3 Missionen (je nach Datum) */
export function missionsFor(day: string): Mission[] {
  let seed = 0
  for (const ch of day) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 2 ** 32
  }
  const pool = [...MISSION_TEMPLATES]
  const list: Mission[] = []
  for (let i = 0; i < 3; i++) {
    const t = pool.splice(Math.floor(rnd() * pool.length), 1)[0]
    const target = t.targets[Math.floor(rnd() * t.targets.length)]
    const reward = t.reward(target)
    const isReaction = t.type === 'reaction'
    list.push({
      id: `${day}-${t.type}`,
      type: t.type,
      target: isReaction ? 1 : target,
      param: isReaction ? target : undefined,
      progress: 0,
      reward,
      xp: Math.round(reward / 2),
      claimed: false,
    })
  }
  return list
}

// ---------- Sammelalbum ----------

export function albumProgress(s: SaveState, c: CaseDef) {
  const base = c.skins.filter((x) => x.rarity !== 'gold')
  const gold = c.skins.filter((x) => x.rarity === 'gold')
  const has = (id: string) => (s.album[id] ?? 0) > 0
  return {
    baseHave: base.filter((x) => has(x.id)).length,
    baseTotal: base.length,
    goldHave: gold.filter((x) => has(x.id)).length,
    goldTotal: gold.length,
  }
}

export function albumRewards(c: CaseDef) {
  return { base: c.price * 15, full: c.price * 100 }
}

function albumComplete(s: SaveState, c: CaseDef, full: boolean): boolean {
  const p = albumProgress(s, c)
  return p.baseHave === p.baseTotal && (!full || p.goldHave === p.goldTotal)
}

// ---------- Erfolge ----------

export interface Achievement {
  id: string
  icon: string
  name: string
  desc: string
  reward: number
  secret?: boolean
  check: (s: SaveState) => boolean
}

const lvl = (s: SaveState) => levelInfo(s.xp).level

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', icon: '🎉', name: 'Erste Schritte', desc: 'Öffne dein erstes Case', reward: 100, check: (s) => s.stats.opened >= 1 },
  { id: 'c100', icon: '📦', name: 'Hunderter', desc: 'Öffne 100 Cases', reward: 500, check: (s) => s.stats.opened >= 100 },
  { id: 'c1000', icon: '🫠', name: 'Süchtig?', desc: 'Öffne 1.000 Cases', reward: 5000, check: (s) => s.stats.opened >= 1000 },
  { id: 'c10000', icon: '🆘', name: 'Hilfe holen', desc: 'Öffne 10.000 Cases', reward: 50000, check: (s) => s.stats.opened >= 10000 },
  { id: 'bulk', icon: '🏭', name: 'Massenproduktion', desc: 'Öffne 100 Cases auf einmal', reward: 1000, check: (s) => s.stats.bulk100 >= 1 },
  { id: 'blue10', icon: '🔵', name: 'Blau ist auch eine Farbe', desc: '10 blaue Skins in Folge', reward: 300, check: (s) => s.stats.bestBlueStreak >= 10 },
  { id: 'blue25', icon: '🐦', name: 'Pechvogel', desc: '25 blaue Skins in Folge', reward: 1500, check: (s) => s.stats.bestBlueStreak >= 25 },
  { id: 'blue50', icon: '📉', name: 'Statistisch unmöglich', desc: '50 blaue Skins in Folge', reward: 10000, check: (s) => s.stats.bestBlueStreak >= 50 },
  { id: 'lila', icon: '💜', name: 'Lila Laune', desc: 'Ziehe deinen ersten „Limitiert“-Skin', reward: 100, check: (s) => s.stats.drops.lila >= 1 },
  { id: 'pink', icon: '🩷', name: 'Pink Panther', desc: 'Ziehe deinen ersten „Klassifiziert“-Skin', reward: 300, check: (s) => s.stats.drops.pink >= 1 },
  { id: 'rot', icon: '🟥', name: 'Rot sehen', desc: 'Ziehe deinen ersten „Verdeckt“-Skin', reward: 1000, check: (s) => s.stats.drops.rot >= 1 },
  { id: 'gold', icon: '🔪', name: 'Messerstecher', desc: 'Ziehe dein erstes Messer oder Handschuhe', reward: 5000, check: (s) => s.stats.drops.gold >= 1 },
  { id: 'gold5', icon: '🗡️', name: 'Messersammler', desc: 'Ziehe 5 ★-Gegenstände', reward: 20000, check: (s) => s.stats.drops.gold >= 5 },
  { id: 'mac', icon: '🔥', name: 'Der Vorfall', desc: `Ziehe die ${MAC_SKIN.weapon} | Hitzewelle`, reward: 10000, secret: true, check: (s) => s.stats.drops.mac >= 1 },
  { id: 'macSold', icon: '💀', name: 'Bereuen lernen', desc: 'Verkaufe die MAC-10. Warum?!', reward: 3000, secret: true, check: (s) => s.stats.macSold >= 1 },
  { id: 'fn', icon: '✨', name: 'Frisch aus der Fabrik', desc: 'Ziehe einen Skin mit Float unter 0,01', reward: 500, check: (s) => s.stats.lowFloat < 0.01 },
  { id: 'bs', icon: '🗑️', name: 'Aus dem Mülleimer', desc: 'Ziehe einen Skin mit Float über 0,99', reward: 500, check: (s) => s.stats.highFloat > 0.99 },
  { id: 'broke', icon: '🪫', name: 'Pleite', desc: 'Hab weniger als 10 Münzen', reward: 200, check: (s) => s.stats.wasBroke },
  { id: 'rich', icon: '🦆', name: 'Dagobert', desc: 'Besitze 100.000 Münzen auf einmal', reward: 5000, check: (s) => s.coins >= 100000 },
  { id: 'bomb10', icon: '✂️', name: 'Entschärfer', desc: 'Entschärfe 10 Bomben', reward: 1000, check: (s) => s.stats.bombsDefused >= 10 },
  { id: 'boom', icon: '💥', name: 'Falscher Draht', desc: 'Lass eine Bombe explodieren', reward: 100, check: (s) => s.stats.bombsExploded >= 1 },
  { id: 'boom10', icon: '💣', name: 'Terroristen gewinnen', desc: 'Lass 10 Bomben explodieren', reward: 500, check: (s) => s.stats.bombsExploded >= 10 },
  { id: 'aim50', icon: '🦅', name: 'Adlerauge', desc: 'Triff 50 Ziele in einer Aim-Runde', reward: 1000, check: (s) => s.stats.aimHitsBest >= 50 },
  { id: 'hs100', icon: '🎯', name: 'Kopfgeldjäger', desc: 'Schaffe 100 Kopfschüsse', reward: 1500, check: (s) => s.stats.headshots >= 100 },
  { id: 'hostage', icon: '😱', name: 'Ups, eine Geisel', desc: 'Triff eine Geisel', reward: 50, check: (s) => s.stats.hostages >= 1 },
  { id: 'react200', icon: '⚡', name: 'Blitzmerker', desc: 'Reagiere in unter 200 ms', reward: 1000, check: (s) => s.stats.bestReaction > 0 && s.stats.bestReaction < 200 },
  { id: 'early', icon: '🤡', name: 'Zu ungeduldig', desc: 'Klicke 5-mal zu früh beim Reaktionstest', reward: 100, check: (s) => s.stats.earlyClicks >= 5 },
  { id: 'lvl5', icon: '⭐', name: 'Aufsteiger', desc: 'Erreiche Level 5', reward: 500, check: (s) => lvl(s) >= 5 },
  { id: 'lvl10', icon: '🌟', name: 'Veteran', desc: 'Erreiche Level 10', reward: 2000, check: (s) => lvl(s) >= 10 },
  { id: 'lvl25', icon: '💫', name: 'Profi', desc: 'Erreiche Level 25', reward: 10000, check: (s) => lvl(s) >= 25 },
  { id: 'lvl50', icon: '👑', name: 'Legende', desc: 'Erreiche Level 50', reward: 50000, check: (s) => lvl(s) >= 50 },
  { id: 'album1', icon: '📒', name: 'Sammler', desc: 'Vervollständige ein Album (ohne ★)', reward: 2000, check: (s) => CASES.some((c) => albumComplete(s, c, false)) },
  { id: 'albumAll', icon: '🏆', name: 'Komplettist', desc: 'Vervollständige alle Alben mit allen ★', reward: 100000, check: (s) => CASES.every((c) => albumComplete(s, c, true)) },
  { id: 'event', icon: '🍀', name: 'Glückspilz', desc: 'Erlebe ein Zufalls-Ereignis', reward: 200, check: (s) => s.stats.events >= 1 },
  { id: 'daily7', icon: '📅', name: 'Stammgast', desc: 'Hol dir 7-mal den Tagesbonus', reward: 2000, check: (s) => s.stats.dailies >= 7 },
  { id: 'missions10', icon: '✅', name: 'Pflichtbewusst', desc: 'Erledige 10 Missionen', reward: 1500, check: (s) => s.stats.missionsDone >= 10 },
  { id: 'sell1000', icon: '🏪', name: 'Großhändler', desc: 'Verkaufe 1.000 Skins', reward: 3000, check: (s) => s.stats.soldCount >= 1000 },
]

// ---------- Zufalls-Ereignisse ----------

export interface GameEventDef {
  id: EventId
  icon: string
  name: string
  desc: string
  duration: number
}

export const EVENTS: Record<EventId, GameEventDef> = {
  glueck: { id: 'glueck', icon: '🍀', name: 'Glücksstunde', desc: 'Doppelte Chance auf seltene Skins!', duration: 90_000 },
  rabatt: { id: 'rabatt', icon: '🏷️', name: 'Rabattaktion', desc: 'Alle Cases 30 % billiger!', duration: 120_000 },
  xp: { id: 'xp', icon: '⚡', name: 'Doppel-XP', desc: 'Doppelte XP für alles!', duration: 180_000 },
  haendler: { id: 'haendler', icon: '🤑', name: 'Händler-Wahnsinn', desc: 'Verkaufspreise +25 %!', duration: 120_000 },
  regen: { id: 'regen', icon: '🌧️', name: 'Münzregen', desc: 'Schnapp dir die fallenden Münzen!', duration: 12_000 },
}

export function activeEvent(s: SaveState, id: EventId): boolean {
  return s.event?.id === id && s.event.until > Date.now()
}

export const CASE_DISCOUNT = 0.7
export const SELL_BONUS = 1.25
