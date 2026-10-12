import { useEffect } from 'react'
import * as sound from '../game/sound'
import { TITAN_CLIP, getSticker } from '../game/stickers'
import { StickerArt } from './WeaponArt'

/** Die große Show, wenn jemand den Titan (Holo) zieht 📢 */
export function TitanReveal({ onContinue }: { onContinue: () => void }) {
  const titan = getSticker('legenden:titan-holo')!
  useEffect(() => {
    sound.playClip(TITAN_CLIP.url, TITAN_CLIP.from)
  }, [])
  return (
    <div className="titan-reveal" role="dialog" aria-label="Titan Holo gezogen">
      <div className="titan-bg" />
      <div className="titan-content">
        <p className="mac-kicker">KATOWICE 2014 · 1 ZU 10.000 · SCHMUGGELWARE</p>
        <StickerArt sticker={titan} className="titan-sticker" />
        <h2>📢 TITAN HOLO 📢</h2>
        <p className="mac-sub">Der Sticker, bei dem jeder schreit.</p>
        <p className="mac-warn">Jetzt bitte laut schreien. Danach: niemals verkaufen.</p>
        <button type="button" className="btn primary big" onClick={onContinue}>
          AAAAAAH!
        </button>
      </div>
    </div>
  )
}
