import { MAC_CHANCE, MAC_SKIN, RARITIES, RARITY_ORDER, WEARS, getSkin, wearOf } from './data'
import type { CaseDef, RarityId, Skin } from './data'

/** Ein gezogener Gegenstand im Inventar */
export interface Item {
  uid: string
  skinId: string
  float: number
  caseId: string
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
  return Math.max(1, Math.round(skin.value * wearOf(item.float).mult))
}

export function rarityRank(id: RarityId): number {
  return RARITY_ORDER.indexOf(id)
}
