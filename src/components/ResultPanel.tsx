import { Suspense, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { RARITIES, RARITY_ORDER, getSkin, wearOf } from '../game/data'
import type { CaseDef } from '../game/data'
import { itemSeed, itemValue, rarityRank, stickerValue } from '../game/roll'
import type { Item, StickerItem } from '../game/roll'
import * as sound from '../game/sound'
import { FINISHES, getSticker, stickerRarityName } from '../game/stickers'
import type { CapsuleDef, StickerFinish } from '../game/stickers'
import { formatCoins, useStore } from '../game/store'
import { Confetti } from './Confetti'
import { ItemCard, StickerCard } from './ItemCard'
import { StickerArt, WeaponArt } from './WeaponArt'
import { quipForOpen } from '../game/quips'
import { Inspect3D } from '../three/lazy'

interface Props {
  caseDef: CaseDef
  items: Item[]
  /** Was die Cases gekostet haben (0 bei Gratis-Cases) */
  cost: number
  best: Item
  /** Bei wenigen Gegenständen nach Seltenheit sortieren */
  sorted: boolean
  onClose: () => void
  onAgain: () => void
  onSelect: (item: Item) => void
}

export function ResultPanel({ caseDef, items, cost, best, sorted, onClose, onAgain, onSelect }: Props) {
  const { state, sell, toast, openCost } = useStore()
  const [quip] = useState(() => quipForOpen(items, cost, state.stats.blueStreak, state.coins))
  const owned = useMemo(() => new Set(state.items.map((i) => i.uid)), [state.items])
  const still = items.filter((i) => owned.has(i.uid))

  const list = useMemo(() => {
    if (!sorted) return items
    return [...items].sort((a, b) => {
      const r = rarityRank(getSkin(b.skinId)!.rarity) - rarityRank(getSkin(a.skinId)!.rarity)
      return r !== 0 ? r : itemValue(b) - itemValue(a)
    })
  }, [items, sorted])

  const total = items.reduce((s, i) => s + itemValue(i), 0)
  const againCost = openCost(caseDef.id, items.length)
  const counts = RARITY_ORDER.map((r) => ({ r, n: items.filter((i) => getSkin(i.skinId)!.rarity === r).length })).filter(
    (x) => x.n > 0,
  )

  const sellable = still.filter((i) => getSkin(i.skinId)!.rarity !== 'mac')
  const blues = sellable.filter((i) => getSkin(i.skinId)!.rarity === 'blau')
  const sum = (list: Item[]) => list.reduce((s, i) => s + itemValue(i), 0)

  const doSell = (list: Item[]) => {
    const got = sell(list.map((i) => i.uid))
    if (got > 0) {
      sound.coin()
      toast(`+${formatCoins(got)} Münzen`, 'good')
    }
  }

  const bestSkin = getSkin(best.skinId)!
  const bestRarity = RARITIES[bestSkin.rarity]
  const canAgain = state.coins >= againCost
  const party = ['pink', 'rot', 'gold', 'mac'].includes(bestSkin.rarity)

  return (
    <div className={`result r-${bestSkin.rarity}`} style={{ '--rc': bestRarity.color } as CSSProperties}>
      {party && <Confetti colors={[bestRarity.color, '#ffffff', '#ffd23d']} amount={bestSkin.rarity === 'pink' ? 90 : 200} />}
      <div className="result-hero">
        <div className="hero-glow" />
        {party && <div className="hero-rays" />}
        <Suspense fallback={<WeaponArt skin={bestSkin} float={best.float} className="hero-art" />}>
          <Inspect3D
            key={best.uid}
            skin={bestSkin}
            float={best.float}
            seed={itemSeed(best)}
            stickers={best.stickers}
            className="hero-art hero-3d"
          />
        </Suspense>
        <div className="hero-text">
          <span className="rarity-label">{items.length > 1 ? `Bester Drop · ${bestRarity.name}` : bestRarity.name}</span>
          <h2>
            {bestSkin.weapon} <span>| {bestSkin.name}</span>
          </h2>
          <p className="muted">
            {wearOf(best.float).name} · Float {best.float.toFixed(4)} · 🪙 {formatCoins(itemValue(best))}
          </p>
          <p className="drag-hint">↻ Ziehen zum Drehen</p>
        </div>
      </div>
      <div className="quip">
        <span className="quip-icon">🎙️</span>
        <p>{quip}</p>
      </div>

      {items.length > 1 && (
        <div className="result-summary">
          <div className="chips">
            {counts.map(({ r, n }) => (
              <span key={r} className="chip" style={{ '--rc': RARITIES[r].color } as CSSProperties}>
                {n}× {RARITIES[r].name}
              </span>
            ))}
          </div>
          <p>
            Gesamtwert <strong>🪙 {formatCoins(total)}</strong>{' '}
            {cost > 0 ? (
              <span className={total >= cost ? 'plus' : 'minus'}>
                ({total >= cost ? '+' : ''}
                {formatCoins(total - cost)} gegenüber dem Preis)
              </span>
            ) : (
              <span className="plus">(aus deinem Inventar)</span>
            )}
          </p>
        </div>
      )}

      <div className="result-actions">
        {items.length === 1 && still.length === 0 && <span className="sold-note">✓ Verkauft</span>}
        {sellable.length > 0 && (
          <button type="button" className="btn" onClick={() => doSell(sellable)}>
            {items.length > 1 ? 'Alles verkaufen' : 'Verkaufen'} (+{formatCoins(sum(sellable))})
          </button>
        )}
        {items.length > 1 && blues.length > 0 && blues.length < sellable.length && (
          <button type="button" className="btn ghost" onClick={() => doSell(blues)}>
            Nur Blaue verkaufen (+{formatCoins(sum(blues))})
          </button>
        )}
        <button type="button" className="btn primary" disabled={!canAgain} onClick={onAgain}>
          Nochmal {items.length > 1 ? `×${items.length} ` : ''}
          {againCost === 0 ? '(aus Inventar 📦🔑)' : `(🪙 ${formatCoins(againCost)})`}
        </button>
        <button type="button" className="btn ghost" onClick={onClose}>
          Fertig
        </button>
      </div>
      {still.some((i) => getSkin(i.skinId)!.rarity === 'mac') && (
        <p className="mac-note">Die MAC-10 wird beim Sammelverkauf nicht mitverkauft. Man weiß ja nie … 💀</p>
      )}

      {items.length > 1 && (
        <div className="result-grid">
          {list.map((it) => (
            <div key={it.uid} className={owned.has(it.uid) ? undefined : 'sold'}>
              <ItemCard item={it} onClick={owned.has(it.uid) ? () => onSelect(it) : undefined} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface StickerProps {
  capsule: CapsuleDef
  stickers: StickerItem[]
  best: StickerItem
  cost: number
  onClose: () => void
  onAgain: () => void
  onSelect: (s: StickerItem) => void
}

/** Ergebnis nach dem Öffnen von Kapseln */
export function StickerResults({ capsule, stickers, best, cost, onClose, onAgain, onSelect }: StickerProps) {
  const { state, sell, toast, capsuleCost } = useStore()
  const owned = useMemo(() => new Set(state.stickers.map((x) => x.uid)), [state.stickers])
  const still = stickers.filter((x) => owned.has(x.uid))
  const bestDef = getSticker(best.stickerId)!
  const rarity = RARITIES[bestDef.rarity]
  const total = stickers.reduce((s, x) => s + stickerValue(x), 0)
  const againCost = capsuleCost(capsule.id, stickers.length)
  // Der Titan wird nie im Sammelverkauf mitverkauft
  const sellable = still.filter((x) => !getSticker(x.stickerId)?.special)
  const keepsTitan = sellable.length < still.length
  const papers = still.filter((x) => getSticker(x.stickerId)?.finish === 'papier')
  const sum = (list: StickerItem[]) => list.reduce((s, x) => s + stickerValue(x), 0)
  const party = bestDef.finish === 'holo' || bestDef.finish === 'gold' || !!bestDef.special
  const counts = (['gold', 'holo', 'glitzer', 'papier'] as StickerFinish[])
    .map((f) => ({ f, n: stickers.filter((x) => getSticker(x.stickerId)?.finish === f).length }))
    .filter((x) => x.n > 0)
  const sorted = [...stickers].sort((a, b) => stickerValue(b) - stickerValue(a))

  const doSell = (list: StickerItem[]) => {
    const got = sell(list.map((x) => x.uid))
    if (got > 0) {
      sound.coin()
      toast(`+${formatCoins(got)} Münzen`, 'good')
    }
  }

  return (
    <div className={`result r-${bestDef.rarity}`} style={{ '--rc': rarity.color } as CSSProperties}>
      {party && <Confetti colors={[rarity.color, '#ffffff', '#ffd23d']} amount={bestDef.finish === 'gold' ? 200 : 100} />}
      <div className="result-hero">
        <div className="hero-glow" />
        {party && <div className="hero-rays" />}
        <StickerArt sticker={bestDef} className="hero-sticker" />
        <div className="hero-text">
          <span className="rarity-label">
            {stickers.length > 1 ? 'Bester Sticker · ' : ''}
            {stickerRarityName(bestDef)} · {FINISHES[bestDef.finish].name}
          </span>
          <h2>
            Sticker <span>| {bestDef.name}</span>
          </h2>
          <p className="muted">🪙 {formatCoins(bestDef.value)} · Aufkleben im Inventar über eine Waffe</p>
        </div>
      </div>

      {stickers.length > 1 && (
        <div className="result-summary">
          <div className="chips">
            {counts.map(({ f, n }) => (
              <span key={f} className="chip" style={{ '--rc': RARITIES[FINISHES[f].rarity].color } as CSSProperties}>
                {n}× {FINISHES[f].name}
              </span>
            ))}
          </div>
          <p>
            Gesamtwert <strong>🪙 {formatCoins(total)}</strong>{' '}
            {cost > 0 && (
              <span className={total >= cost ? 'plus' : 'minus'}>
                ({total >= cost ? '+' : ''}
                {formatCoins(total - cost)} gegenüber dem Preis)
              </span>
            )}
          </p>
        </div>
      )}

      <div className="result-actions">
        {sellable.length > 0 && (
          <button type="button" className="btn" onClick={() => doSell(sellable)}>
            {stickers.length > 1 ? 'Alle verkaufen' : 'Verkaufen'} (+{formatCoins(sum(sellable))})
          </button>
        )}
        {stickers.length > 1 && papers.length > 0 && papers.length < sellable.length && (
          <button type="button" className="btn ghost" onClick={() => doSell(papers)}>
            Nur Papier verkaufen (+{formatCoins(sum(papers))})
          </button>
        )}
        <button type="button" className="btn primary" disabled={state.coins < againCost} onClick={onAgain}>
          Nochmal {stickers.length > 1 ? `×${stickers.length} ` : ''}
          {againCost === 0 ? '(aus Inventar)' : `(🪙 ${formatCoins(againCost)})`}
        </button>
        <button type="button" className="btn ghost" onClick={onClose}>
          Fertig
        </button>
      </div>

      {keepsTitan && <p className="mac-note">Den Titan Holo verkaufst du hier nicht. Wenn überhaupt, dann einzeln im Inventar … 📢</p>}

      {stickers.length > 1 && (
        <div className="result-grid">
          {sorted.map((x) => (
            <div key={x.uid} className={owned.has(x.uid) ? undefined : 'sold'}>
              <StickerCard item={x} onClick={owned.has(x.uid) ? () => onSelect(x) : undefined} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
