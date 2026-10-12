import { Suspense, useState } from 'react'
import type { CSSProperties } from 'react'
import { MAC_REGRET_VALUE, RARITIES, getCase, getSkin, wearOf } from '../game/data'
import { MODELS } from '../game/models'
import { FINISHES, getSticker, stickerBonus } from '../game/stickers'
import { itemValue } from '../game/roll'
import type { Item } from '../game/roll'
import * as sound from '../game/sound'
import { formatCoins, useStore } from '../game/store'
import { StickerArt, WeaponArt } from './WeaponArt'
import { Inspect3D } from '../three/lazy'
import { SELL_BONUS, activeEvent } from '../game/progress'

export function ItemModal({ item, onClose }: { item: Item; onClose: () => void }) {
  const { state, sell, toast, applySticker, scrapeSticker } = useStore()
  const [confirm, setConfirm] = useState(false)
  const [picking, setPicking] = useState(false)
  const [scrape, setScrape] = useState<number | null>(null)
  // Immer den aktuellen Stand der Waffe zeigen (Sticker können sich ändern)
  item = state.items.find((i) => i.uid === item.uid) ?? item
  const skin = getSkin(item.skinId)
  if (!skin) return null
  const rarity = RARITIES[skin.rarity]
  const wear = wearOf(item.float)
  const bonus = activeEvent(state, 'haendler')
  const value = Math.round(itemValue(item) * (bonus ? SELL_BONUS : 1))
  const isMac = skin.rarity === 'mac'
  const spots = skin.builtInStickers ? 0 : (MODELS[skin.model].stickers?.length ?? 0)
  const slots = Array.from({ length: spots }, (_, i) => item.stickers?.[i] ?? null)
  const hasFree = slots.some((x) => !x)

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
          <Suspense fallback={<WeaponArt skin={skin} float={item.float} className="art" />}>
            <Inspect3D skin={skin} float={item.float} stickers={item.stickers} className="art art-3d" />
          </Suspense>
          <span className="drag-hint">↻ Ziehen zum Drehen</span>
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

        {spots > 0 && (
          <div className="sticker-slots">
            <div className="slots-head">
              <strong>Sticker</strong>
              {hasFree && state.stickers.length > 0 && (
                <button type="button" className="btn small" onClick={() => setPicking((x) => !x)}>
                  {picking ? 'Fertig' : '🏷️ Sticker aufkleben'}
                </button>
              )}
            </div>
            <div className="slots">
              {slots.map((id, i) => {
                const st = id ? getSticker(id) : undefined
                return (
                  <button
                    type="button"
                    key={i}
                    className={`slot${st ? ' filled' : ''}`}
                    onClick={() => (st ? setScrape(i) : state.stickers.length && setPicking(true))}
                    title={st ? `${st.name} – antippen zum Abkratzen` : 'Freier Platz'}
                  >
                    {st ? <StickerArt sticker={st} /> : <span>+</span>}
                  </button>
                )
              })}
            </div>
            {scrape !== null && slots[scrape] && (
              <div className="mac-confirm">
                <p>
                  <strong>{getSticker(slots[scrape]!)?.name}</strong> abkratzen? Der Sticker wird dabei zerstört.
                </p>
                <div className="row">
                  <button type="button" className="btn ghost" onClick={() => setScrape(null)}>
                    Lieber nicht
                  </button>
                  <button
                    type="button"
                    className="btn danger"
                    onClick={() => {
                      scrapeSticker(item.uid, scrape)
                      setScrape(null)
                    }}
                  >
                    Abkratzen
                  </button>
                </div>
              </div>
            )}
            {picking && hasFree && state.stickers.length > 0 && (
              <div className="sticker-picker">
                {[...state.stickers]
                  .sort((a, b) => (getSticker(b.stickerId)?.value ?? 0) - (getSticker(a.stickerId)?.value ?? 0))
                  .slice(0, 60)
                  .map((x) => {
                    const st = getSticker(x.stickerId)
                    if (!st) return null
                    return (
                      <button
                        type="button"
                        key={x.uid}
                        className="pick"
                        title={`${st.name} (${FINISHES[st.finish].name}) · +${stickerBonus(st)} Wert`}
                        onClick={() => {
                          if (applySticker(item.uid, x.uid)) toast(`🏷️ ${st.name} aufgeklebt!`, 'good')
                        }}
                      >
                        <StickerArt sticker={st} />
                        <span>{st.name}</span>
                      </button>
                    )
                  })}
              </div>
            )}
          </div>
        )}

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
            Verkaufen für 🪙 {formatCoins(value)} {bonus && '🤑 +25 %'}
          </button>
        )}
      </div>
    </div>
  )
}
