import { MAC_CHANCE, MAC_SKIN, RARITIES, RARITY_ORDER, WEARS, getSkin, wearOf } from './data'
import type { CaseDef, RarityId, Skin } from './data'
import { CAPSULE_ODDS, TITAN_CHANCE, getSticker, stickerBonus } from './stickers'
import type { CapsuleDef, StickerDef, StickerFinish } from './stickers'

/** Ein gezogener Gegenstand im Inventar */
export interface Item {
  uid: string
  skinId: string
  float: number
  caseId: string
  at: number
  /** Aufgeklebte Sticker (4 Plätze, `null` = frei) */
  stickers?: (string | null)[]
}

/** Ein Sticker im Inventar */
export interface StickerItem {
  uid: string
  stickerId: string
  at: number
}

const buf = new Uint32Array(1)

/** Zufallszahl zwischen 0 (inklusive) und 1 (exklusive) */
export function random(): number {
  crypto.getRandomValues(buf)
  return buf[0] / 2 ** 32
}

function pick<T>(list: T[]): T {
  return list[Math.floor(random() * list.length)]
}

function skinsOf(c: CaseDef, rarity: RarityId): Skin[] {
  return c.skins.filter((s) => s.rarity === rarity)
}

/** Würfelt die Seltenheit nach den echten Chancen. `luck` = 2 verdoppelt alle seltenen Chancen. */
function rollRarity(luck: number): RarityId {
  if (random() < MAC_CHANCE * luck) return 'mac'
  const r = random()
  let acc = 0
  for (const id of ['gold', 'rot', 'pink', 'lila'] as const) {
    acc += RARITIES[id].chance * luck
    if (r < acc) return id
  }
  return 'blau'
}

function rollFloat(): number {
  let r = random()
  for (const w of WEARS) {
    if (r < w.chance) return w.min + random() * (w.max - w.min)
    r -= w.chance
  }
  return 0.5
}

let counter = 0
function uid(): string {
  counter = (counter + 1) % 1e6
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.floor(random() * 1e9).toString(36)}`
}

export function openCase(c: CaseDef, luck = 1): Item {
  const rarity = rollRarity(luck)
  const skin = rarity === 'mac' ? MAC_SKIN : pick(skinsOf(c, rarity))
  return { uid: uid(), skinId: skin.id, float: rollFloat(), caseId: c.id, at: Date.now() }
}

/**
 * Füll-Gegenstände für das Band. Seltene Sachen kommen hier öfter vor
 * als in echt – damit es spannend aussieht. Die echte Chance gilt nur
 * für den Gegenstand, der am Ende in der Mitte stehen bleibt.
 */
export function fillerSkin(c: CaseDef): Skin {
  const r = random()
  const rarity: RarityId = r < 0.012 ? 'gold' : r < 0.05 ? 'rot' : r < 0.14 ? 'pink' : r < 0.36 ? 'lila' : 'blau'
  return pick(skinsOf(c, rarity))
}

export function itemValue(item: Item): number {
  const skin = getSkin(item.skinId)
  if (!skin) return 0
  if (skin.rarity === 'mac') return skin.value
  let value = Math.max(1, Math.round(skin.value * wearOf(item.float).mult))
  for (const id of item.stickers ?? []) {
    const st = id ? getSticker(id) : undefined
    if (st) value += stickerBonus(st)
  }
  return value
}

export function stickerValue(item: StickerItem): number {
  return getSticker(item.stickerId)?.value ?? 0
}

function rollFinish(luck: number): StickerFinish {
  const r = random()
  if (r < CAPSULE_ODDS.gold * luck) return 'gold'
  if (r < (CAPSULE_ODDS.gold + CAPSULE_ODDS.holo) * luck) return 'holo'
  if (r < (CAPSULE_ODDS.gold + CAPSULE_ODDS.holo + CAPSULE_ODDS.glitzer) * luck) return 'glitzer'
  return 'papier'
}

export function openCapsule(c: CapsuleDef, luck = 1): StickerItem {
  const special = c.stickers.find((s) => s.special)
  if (special && random() < TITAN_CHANCE * luck) return { uid: uid(), stickerId: special.id, at: Date.now() }
  const finish = rollFinish(luck)
  const pool = c.stickers.filter((s) => s.finish === finish && !s.special)
  const def = pick(pool.length ? pool : c.stickers)
  return { uid: uid(), stickerId: def.id, at: Date.now() }
}

/** Füll-Sticker für das Band (seltene öfter, damit es spannend aussieht) */
export function fillerSticker(c: CapsuleDef): StickerDef {
  const r = random()
  const finish: StickerFinish = r < 0.04 ? 'gold' : r < 0.12 ? 'holo' : r < 0.32 ? 'glitzer' : 'papier'
  const pool = c.stickers.filter((s) => s.finish === finish && !s.special)
  return pick(pool.length ? pool : c.stickers)
}

/** Zufällig gewichtete Auswahl, z. B. für Case-Drops */
export function weighted<T extends { dropWeight: number }>(list: T[]): T {
  const total = list.reduce((a, x) => a + x.dropWeight, 0)
  let r = random() * total
  for (const x of list) {
    r -= x.dropWeight
    if (r <= 0) return x
  }
  return list[list.length - 1]
}

export function rarityRank(id: RarityId): number {
  return RARITY_ORDER.indexOf(id)
}
