import { Suspense, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { RARITIES, RARITY_ORDER, getSkin, wearOf } from '../game/data'
import type { CaseDef } from '../game/data'
import { itemValue, rarityRank } from '../game/roll'
import type { Item } from '../game/roll'
import * as sound from '../game/sound'
import { formatCoins, useStore } from '../game/store'
import { ItemCard } from './ItemCard'
import { WeaponArt } from './WeaponArt'
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
  const { state, sell, toast, casePrice } = useStore()
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
  const againCost = casePrice(caseDef) * items.length
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
  const freeLeft = state.freeCases[caseDef.id] ?? 0
  const canAgain = state.coins >= againCost || freeLeft >= items.length

  return (
    <div className={`result r-${bestSkin.rarity}`} style={{ '--rc': bestRarity.color } as CSSProperties}>
      <div className="result-hero">
        <div className="hero-glow" />
        <Suspense fallback={<WeaponArt skin={bestSkin} float={best.float} className="hero-art" />}>
          <Inspect3D key={best.uid} skin={bestSkin} float={best.float} className="hero-art hero-3d" />
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
              <span className="plus">(gratis geöffnet)</span>
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
          {freeLeft >= items.length ? '(gratis 🎁)' : `(🪙 ${formatCoins(againCost)})`}
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
