import { memo } from 'react'
import type { CSSProperties } from 'react'
import { RARITIES, getSkin, wearOf } from '../game/data'
import type { Skin } from '../game/data'
import { itemValue } from '../game/roll'
import type { Item } from '../game/roll'
import { formatCoins } from '../game/store'
import { StarArt, WeaponArt } from './WeaponArt'

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
      <WeaponArt skin={skin} float={item.float} className="art" />
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
