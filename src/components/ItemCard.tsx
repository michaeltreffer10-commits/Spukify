import { memo } from 'react'
import type { CSSProperties } from 'react'
import { RARITIES, getSkin, wearOf } from '../game/data'
import type { Skin } from '../game/data'
import { itemValue, stickerValue } from '../game/roll'
import type { Item, StickerItem } from '../game/roll'
import { FINISHES, getSticker } from '../game/stickers'
import type { StickerDef } from '../game/stickers'
import { formatCoins } from '../game/store'
import { StarArt, StickerArt, WeaponArt } from './WeaponArt'

/** Karte im Band: ★-Gegenstände und die MAC-10 bleiben bis zum Schluss geheim */
export const StripCard = memo(function StripCard({ skin, width }: { skin: Skin; width: number }) {
  const color = RARITIES[skin.rarity].color
  const hidden = skin.rarity === 'gold' || skin.rarity === 'mac'
  return (
    <div className="strip-card" style={{ '--rc': color, width } as CSSProperties}>
      {hidden ? <StarArt className="art" /> : <WeaponArt skin={skin} className="art" />}
      <div className="strip-name">
        {hidden ? (
          <span className="weapon">{skin.rarity === 'mac' ? '???' : '★ Seltener Gegenstand'}</span>
        ) : (
          <>
            <span className="weapon">{skin.weapon}</span>
            <span className="skin">{skin.name}</span>
          </>
        )}
      </div>
    </div>
  )
})

interface ItemCardProps {
  item: Item
  onClick?: () => void
  selected?: boolean
  delay?: number
}

export const ItemCard = memo(function ItemCard({ item, onClick, selected, delay }: ItemCardProps) {
  const skin = getSkin(item.skinId)
  if (!skin) return null
  const rarity = RARITIES[skin.rarity]
  const wear = wearOf(item.float)
  return (
    <button
      type="button"
      className={`item-card r-${skin.rarity}${selected ? ' selected' : ''}`}
      style={{ '--rc': rarity.color, animationDelay: delay ? `${delay}ms` : undefined } as CSSProperties}
      onClick={onClick}
    >
      <WeaponArt skin={skin} float={item.float} stickers={item.stickers} className="art" />
      <div className="item-info">
        <span className="weapon">{skin.weapon}</span>
        <span className="skin">{skin.name}</span>
        <span className="meta">
          <span className="wear" title={wear.name}>
            {wear.short}
          </span>
          <span className="value">🪙 {formatCoins(itemValue(item))}</span>
        </span>
      </div>
    </button>
  )
})

/** Sticker-Karte im Band (Gold-Sticker bleiben bis zum Schluss geheim) */
export const StickerStripCard = memo(function StickerStripCard({ sticker, width }: { sticker: StickerDef; width: number }) {
  const color = RARITIES[sticker.rarity].color
  const hidden = sticker.finish === 'gold'
  return (
    <div className="strip-card sticker-strip" style={{ '--rc': color, width } as CSSProperties}>
      {hidden ? <StarArt className="art" /> : <StickerArt sticker={sticker} className="art sticker-art" />}
      <div className="strip-name">
        <span className="weapon">{hidden ? '★ Seltener Sticker' : FINISHES[sticker.finish].name}</span>
        {!hidden && <span className="skin">{sticker.name}</span>}
      </div>
    </div>
  )
})

/** Sticker im Inventar und in den Ergebnissen */
export const StickerCard = memo(function StickerCard({
  item,
  onClick,
  delay,
}: {
  item: StickerItem
  onClick?: () => void
  delay?: number
}) {
  const def = getSticker(item.stickerId)
  if (!def) return null
  return (
    <button
      type="button"
      className={`item-card sticker-card r-${def.rarity}`}
      style={{ '--rc': RARITIES[def.rarity].color, animationDelay: delay ? `${delay}ms` : undefined } as CSSProperties}
      onClick={onClick}
    >
      <StickerArt sticker={def} className="art sticker-art" />
      <div className="item-info">
        <span className="weapon">Sticker · {FINISHES[def.finish].name}</span>
        <span className="skin">{def.name}</span>
        <span className="meta">
          <span className="wear">{FINISHES[def.finish].rarityName}</span>
          <span className="value">🪙 {formatCoins(stickerValue(item))}</span>
        </span>
      </div>
    </button>
  )
})
