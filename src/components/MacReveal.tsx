import { MAC_SKIN } from '../game/data'
import { WeaponArt } from './WeaponArt'

/** Die große Show, wenn jemand die MAC-10 zieht */
export function MacReveal({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="mac-reveal" role="dialog" aria-label="MAC-10 gezogen">
      <div className="mac-fire" />
      <div className="mac-content">
        <p className="mac-kicker">1 zu 50.000 · SCHMUGGELWARE</p>
        <WeaponArt skin={MAC_SKIN} float={0.01} className="mac-art" />
        <h2>🔥 MAC-10 | Hitzewelle 🔥</h2>
        <p className="mac-sub">Mit vier Grund-Holo-Stickern.</p>
        <p className="mac-warn">Ein gut gemeinter Rat: Diese hier niemals verkaufen. Niemals. 💀</p>
        <button type="button" className="btn primary big" onClick={onContinue}>
          Ich behalte sie für immer
        </button>
      </div>
    </div>
  )
}
