import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { CASES, RARITIES, RARITY_ORDER, getSkin } from '../game/data'
import type { RarityId } from '../game/data'
import { itemValue, rarityRank, stickerValue } from '../game/roll'
import type { Item, StickerItem } from '../game/roll'
import * as sound from '../game/sound'
import { CAPSULES, capsuleLabel, getSticker } from '../game/stickers'
import { formatCoins, useStore } from '../game/store'
import type { Focus } from './CasesView'
import { ItemCard, StickerCard } from './ItemCard'
import { ItemModal } from './ItemModal'
import { StickerModal } from './StickerModal'
import { CapsuleArt, CaseArt, KeyArt } from './WeaponArt'

type Sort = 'neu' | 'wert' | 'selten'
const PAGE = 120

type InvTab = 'waffen' | 'sticker' | 'kisten'

export function Inventory({ onGoCases, onOpen }: { onGoCases: () => void; onOpen: (f: Focus) => void }) {
  const { state, sell, toast } = useStore()
  const [tab, setTab] = useState<InvTab>('waffen')
  const [stickerDetail, setStickerDetail] = useState<StickerItem | null>(null)
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

  const tabs = (
    <div className="shop-tabs">
      <button type="button" className={tab === 'waffen' ? 'active' : ''} onClick={() => setTab('waffen')}>
        🔫 Waffen ({formatCoins(state.items.length)})
      </button>
      <button type="button" className={tab === 'sticker' ? 'active' : ''} onClick={() => setTab('sticker')}>
        🏷️ Sticker ({formatCoins(state.stickers.length)})
      </button>
      <button type="button" className={tab === 'kisten' ? 'active' : ''} onClick={() => setTab('kisten')}>
        📦 Kisten
      </button>
    </div>
  )

  if (tab === 'sticker') {
    return (
      <div className="inventory">
        {tabs}
        <StickerList items={state.stickers} onSelect={setStickerDetail} />
        {stickerDetail && <StickerModal item={stickerDetail} onClose={() => setStickerDetail(null)} />}
      </div>
    )
  }

  if (tab === 'kisten') {
    const cases = CASES.filter((c) => (state.cases[c.id] ?? 0) > 0 || (state.keys[c.id] ?? 0) > 0)
    const caps = CAPSULES.filter((c) => (state.capsules[c.id] ?? 0) > 0)
    return (
      <div className="inventory">
        {tabs}
        {cases.length === 0 && caps.length === 0 && (
          <p className="muted">
            Keine Kisten. Cases droppen beim Minispielen, beim Stunden-Bonus und beim Level-Up – oder du kaufst sie im Shop.
          </p>
        )}
        <div className="crate-grid">
          {cases.map((c) => (
            <button type="button" key={c.id} className="crate" onClick={() => onOpen({ kind: 'case', id: c.id })}>
              <CaseArt colors={c.colors} label={c.name.replace('-Case', '').toUpperCase()} className="crate-art" />
              <strong>{c.name}</strong>
              <span>
                📦 {state.cases[c.id] ?? 0} · <KeyArt color={c.colors[1]} className="key-icon" /> {state.keys[c.id] ?? 0}
              </span>
              <span className="crate-open">Öffnen →</span>
            </button>
          ))}
          {caps.map((c) => (
            <button type="button" key={c.id} className="crate" onClick={() => onOpen({ kind: 'capsule', id: c.id })}>
              <CapsuleArt colors={c.colors} label={capsuleLabel(c)} className="crate-art" />
              <strong>{c.name}</strong>
              <span>💊 {state.capsules[c.id]}</span>
              <span className="crate-open">Öffnen →</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (state.items.length === 0) {
    return (
      <div className="empty">
        {tabs}
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
      {tabs}
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

const STICKER_PAGE = 120

function StickerList({ items, onSelect }: { items: StickerItem[]; onSelect: (s: StickerItem) => void }) {
  const { sell, toast } = useStore()
  const [limit, setLimit] = useState(STICKER_PAGE)
  const sorted = useMemo(() => [...items].sort((a, b) => stickerValue(b) - stickerValue(a)), [items])
  const papers = items.filter((x) => getSticker(x.stickerId)?.finish === 'papier')
  const total = items.reduce((s, x) => s + stickerValue(x), 0)
  if (items.length === 0) {
    return <p className="muted">Noch keine Sticker. Öffne Sticker-Kapseln im Shop – die erste Meme-Kapsel hast du schon!</p>
  }
  return (
    <>
      <div className="inv-head">
        <p className="muted">
          {formatCoins(items.length)} Sticker · Gesamtwert <strong>🪙 {formatCoins(total)}</strong>
        </p>
        {papers.length > 0 && (
          <button
            type="button"
            className="btn ghost small"
            onClick={() => {
              const got = sell(papers.map((x) => x.uid))
              sound.coin()
              toast(`+${formatCoins(got)} Münzen`, 'good')
            }}
          >
            Alle Papier-Sticker verkaufen
          </button>
        )}
      </div>
      <div className="result-grid">
        {sorted.slice(0, limit).map((x) => (
          <StickerCard key={x.uid} item={x} onClick={() => onSelect(x)} />
        ))}
      </div>
      {sorted.length > limit && (
        <button type="button" className="btn ghost wide" onClick={() => setLimit((l) => l + STICKER_PAGE)}>
          Mehr anzeigen
        </button>
      )}
    </>
  )
}
