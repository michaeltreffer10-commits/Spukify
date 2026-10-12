import type { CSSProperties } from 'react'
import { RARITIES } from '../game/data'
import { stickerValue } from '../game/roll'
import type { StickerItem } from '../game/roll'
import * as sound from '../game/sound'
import { FINISHES, getCapsule, getSticker, stickerBonus } from '../game/stickers'
import { SELL_BONUS, activeEvent } from '../game/progress'
import { formatCoins, useStore } from '../game/store'
import { StickerArt } from './WeaponArt'

export function StickerModal({ item, onClose }: { item: StickerItem; onClose: () => void }) {
  const { state, sell, toast } = useStore()
  const def = getSticker(item.stickerId)
  if (!def) return null
  const rarity = RARITIES[def.rarity]
  const bonus = activeEvent(state, 'haendler')
  const value = Math.round(stickerValue(item) * (bonus ? SELL_BONUS : 1))

  const doSell = () => {
    const got = sell([item.uid])
    sound.coin()
    toast(`+${formatCoins(got)} Münzen`, 'good')
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal item-modal r-${def.rarity}`}
        style={{ '--rc': rarity.color } as CSSProperties}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={def.name}
      >
        <button type="button" className="close" onClick={onClose} aria-label="Schließen">
          ✕
        </button>
        <div className="modal-art sticker-modal-art">
          <StickerArt sticker={def} className="sticker-big" />
        </div>
        <span className="rarity-label">
          {FINISHES[def.finish].rarityName} · {FINISHES[def.finish].name}
        </span>
        <h2>
          Sticker <span>| {def.name}</span>
        </h2>
        <dl className="details">
          <dt>Aus</dt>
          <dd>{getCapsule(def.capsuleId)?.name ?? '–'}</dd>
          <dt>Wert</dt>
          <dd>🪙 {formatCoins(def.value)}</dd>
          <dt>Aufgeklebt bringt er</dt>
          <dd>+🪙 {formatCoins(stickerBonus(def))} Waffenwert</dd>
        </dl>
        <p className="muted small">Zum Aufkleben öffne eine Waffe im Inventar und tippe auf „Sticker aufkleben“.</p>
        <button type="button" className="btn primary wide" onClick={doSell}>
          Verkaufen für 🪙 {formatCoins(value)} {bonus && '🤑 +25 %'}
        </button>
      </div>
    </div>
  )
}
