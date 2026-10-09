import { useState } from 'react'
import type { CSSProperties } from 'react'
import { MAC_REGRET_VALUE, RARITIES, getCase, getSkin, wearOf } from '../game/data'
import { itemValue } from '../game/roll'
import type { Item } from '../game/roll'
import * as sound from '../game/sound'
import { formatCoins, useStore } from '../game/store'
import { WeaponArt } from './WeaponArt'

export function ItemModal({ item, onClose }: { item: Item; onClose: () => void }) {
  const { sell, toast } = useStore()
  const [confirm, setConfirm] = useState(false)
  const skin = getSkin(item.skinId)
  if (!skin) return null
  const rarity = RARITIES[skin.rarity]
  const wear = wearOf(item.float)
  const value = itemValue(item)
  const isMac = skin.rarity === 'mac'

  const doSell = () => {
    const got = sell([item.uid])
    sound.coin()
    toast(`+${formatCoins(got)} Münzen`, 'good')
    if (isMac) {
      setTimeout(
        () =>
          toast(
            `📈 Marktwert-Update: Die MAC-10 | Hitzewelle ist jetzt ${formatCoins(MAC_REGRET_VALUE)} Münzen wert. Du hast sie für ${formatCoins(got)} verkauft. 💀`,
            'mac',
            9000,
          ),
        2500,
      )
    }
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal item-modal r-${skin.rarity}`}
        style={{ '--rc': rarity.color } as CSSProperties}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`${skin.weapon} | ${skin.name}`}
      >
        <button type="button" className="close" onClick={onClose} aria-label="Schließen">
          ✕
        </button>
        <div className="modal-art">
          <WeaponArt skin={skin} float={item.float} className="art" />
        </div>
        <span className="rarity-label">{rarity.name}</span>
        <h2>
          {skin.weapon} <span>| {skin.name}</span>
        </h2>
        <dl className="details">
          <dt>Zustand</dt>
          <dd>{wear.name}</dd>
          <dt>Float</dt>
          <dd>{item.float.toFixed(6)}</dd>
          <dt>Aus</dt>
          <dd>{getCase(item.caseId)?.name ?? '–'}</dd>
          <dt>Gezogen am</dt>
          <dd>{new Date(item.at).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}</dd>
          <dt>Wert</dt>
          <dd>🪙 {formatCoins(value)}</dd>
        </dl>

        {confirm ? (
          <div className="mac-confirm">
            <p>
              <strong>Bist du dir wirklich sicher?</strong> Jemand hat genau so eine MAC-10 schon mal für 3.000 verkauft … und
              bereut es bis heute. 💀
            </p>
            <div className="row">
              <button type="button" className="btn primary" onClick={() => setConfirm(false)}>
                Behalten (schlau)
              </button>
              <button type="button" className="btn danger" onClick={doSell}>
                Trotzdem verkaufen
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn primary wide" onClick={isMac ? () => setConfirm(true) : doSell}>
            Verkaufen für 🪙 {formatCoins(value)}
          </button>
        )}
      </div>
    </div>
  )
}
