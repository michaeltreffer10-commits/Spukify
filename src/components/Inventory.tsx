import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { RARITIES, RARITY_ORDER, getSkin } from '../game/data'
import type { RarityId } from '../game/data'
import { itemValue, rarityRank } from '../game/roll'
import type { Item } from '../game/roll'
import * as sound from '../game/sound'
import { formatCoins, useStore } from '../game/store'
import { ItemCard } from './ItemCard'
import { ItemModal } from './ItemModal'

type Sort = 'neu' | 'wert' | 'selten'
const PAGE = 120

export function Inventory({ onGoCases }: { onGoCases: () => void }) {
  const { state, sell, toast } = useStore()
  const [filter, setFilter] = useState<RarityId | 'alle'>('alle')
  const [sort, setSort] = useState<Sort>('neu')
  const [limit, setLimit] = useState(PAGE)
  const [detail, setDetail] = useState<Item | null>(null)
  const [confirm, setConfirm] = useState<RarityId[] | null>(null)

  const total = useMemo(() => state.items.reduce((s, i) => s + itemValue(i), 0), [state.items])

  const list = useMemo(() => {
    const filtered = filter === 'alle' ? state.items : state.items.filter((i) => getSkin(i.skinId)?.rarity === filter)
    if (sort === 'neu') return filtered
    return [...filtered].sort((a, b) => {
      if (sort === 'wert') return itemValue(b) - itemValue(a)
      const r = rarityRank(getSkin(b.skinId)!.rarity) - rarityRank(getSkin(a.skinId)!.rarity)
      return r !== 0 ? r : itemValue(b) - itemValue(a)
    })
  }, [state.items, filter, sort])

  const counts = useMemo(() => {
    const c: Record<RarityId, number> = { blau: 0, lila: 0, pink: 0, rot: 0, gold: 0, mac: 0 }
    for (const i of state.items) c[getSkin(i.skinId)!.rarity]++
    return c
  }, [state.items])

  const itemsOf = (rarities: RarityId[]) => state.items.filter((i) => rarities.includes(getSkin(i.skinId)!.rarity))

  const bulkSell = (rarities: RarityId[]) => {
    const got = sell(itemsOf(rarities).map((i) => i.uid))
    if (got > 0) {
      sound.coin()
      toast(`+${formatCoins(got)} Münzen`, 'good')
    }
    setConfirm(null)
  }

  if (state.items.length === 0) {
    return (
      <div className="empty">
        <p className="big-emoji">🎒</p>
        <h2>Dein Inventar ist leer</h2>
        <p className="muted">Öffne ein paar Cases, dann landen deine Skins hier.</p>
        <button type="button" className="btn primary" onClick={onGoCases}>
          Zu den Cases
        </button>
      </div>
    )
  }

  return (
    <div className="inventory">
      <div className="inv-head">
        <div>
          <h2 className="section-title">Inventar</h2>
          <p className="muted">
            {formatCoins(state.items.length)} Gegenstände · Gesamtwert <strong>🪙 {formatCoins(total)}</strong>
          </p>
        </div>
        <div className="inv-tools">
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sortieren">
            <option value="neu">Neueste zuerst</option>
            <option value="wert">Wertvollste zuerst</option>
            <option value="selten">Seltenste zuerst</option>
          </select>
          {counts.blau > 0 && (
            <button type="button" className="btn ghost small" onClick={() => setConfirm(['blau'])}>
              Blaue verkaufen
            </button>
          )}
          {counts.lila > 0 && (
            <button type="button" className="btn ghost small" onClick={() => setConfirm(['blau', 'lila'])}>
              Blau + Lila verkaufen
            </button>
          )}
        </div>
      </div>

      <div className="chips filter">
        <button type="button" className={`chip${filter === 'alle' ? ' active' : ''}`} onClick={() => setFilter('alle')}>
          Alle ({formatCoins(state.items.length)})
        </button>
        {RARITY_ORDER.filter((r) => counts[r] > 0).map((r) => (
          <button
            type="button"
            key={r}
            className={`chip${filter === r ? ' active' : ''}`}
            style={{ '--rc': RARITIES[r].color } as CSSProperties}
            onClick={() => setFilter(r)}
          >
            {RARITIES[r].name} ({formatCoins(counts[r])})
          </button>
        ))}
      </div>

      <div className="result-grid">
        {list.slice(0, limit).map((it) => (
          <ItemCard key={it.uid} item={it} onClick={() => setDetail(it)} />
        ))}
      </div>
      {list.length > limit && (
        <button type="button" className="btn ghost wide" onClick={() => setLimit((l) => l + PAGE)}>
          Mehr anzeigen ({formatCoins(list.length - limit)} weitere)
        </button>
      )}

      {detail && <ItemModal item={detail} onClose={() => setDetail(null)} />}

      {confirm && (
        <div className="modal-backdrop" onClick={() => setConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog">
            <h2>Wirklich verkaufen?</h2>
            <p>
              {formatCoins(itemsOf(confirm).length)} Gegenstände ({confirm.map((r) => RARITIES[r].name).join(' + ')}) für{' '}
              <strong>🪙 {formatCoins(itemsOf(confirm).reduce((s, i) => s + itemValue(i), 0))}</strong>
            </p>
            <div className="row">
              <button type="button" className="btn ghost" onClick={() => setConfirm(null)}>
                Abbrechen
              </button>
              <button type="button" className="btn primary" onClick={() => bulkSell(confirm)}>
                Verkaufen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
