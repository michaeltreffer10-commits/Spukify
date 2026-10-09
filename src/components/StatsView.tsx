import { useState } from 'react'
import type { CSSProperties } from 'react'
import { MAC_REGRET_VALUE, MAC_SKIN, RARITIES, RARITY_ORDER, getSkin, skinTitle, wearOf } from '../game/data'
import { formatCoins, useStore } from '../game/store'
import { WeaponArt } from './WeaponArt'

export function StatsView() {
  const { state, reset, toast } = useStore()
  const [confirmReset, setConfirmReset] = useState(false)
  const s = state.stats
  const best = s.best && getSkin(s.best.skinId)

  return (
    <div className="stats">
            <div className="stat-tiles">
        <div className="tile">
          <span className="label">Cases geöffnet</span>
          <span className="num">{formatCoins(s.opened)}</span>
        </div>
        <div className="tile">
          <span className="label">Für Cases ausgegeben</span>
          <span className="num">🪙 {formatCoins(s.spent)}</span>
        </div>
        <div className="tile">
          <span className="label">Durch Verkäufe bekommen</span>
          <span className="num">🪙 {formatCoins(s.sold)}</span>
        </div>
        <div className="tile">
          <span className="label">Verdient (Aim & Bonus)</span>
          <span className="num">🪙 {formatCoins(s.earned)}</span>
        </div>
        <div className="tile">
          <span className="label">Minispiele gespielt</span>
          <span className="num">{formatCoins(s.games)}</span>
        </div>
        <div className="tile">
          <span className="label">Längste Blau-Serie</span>
          <span className="num">{formatCoins(s.bestBlueStreak)}</span>
        </div>
        <div className="tile">
          <span className="label">Bomben entschärft / explodiert</span>
          <span className="num">
            {formatCoins(s.bombsDefused)} / {formatCoins(s.bombsExploded)}
          </span>
        </div>
        <div className="tile">
          <span className="label">Schnellste Reaktion</span>
          <span className="num">{s.bestReaction ? `${s.bestReaction} ms` : '–'}</span>
        </div>
      </div>

      {best && s.best && (
        <div className="best-drop" style={{ '--rc': RARITIES[best.rarity].color } as CSSProperties}>
          <WeaponArt skin={best} float={s.best.float} className="art" />
          <div>
            <span className="rarity-label">Bester Drop aller Zeiten</span>
            <h3>{skinTitle(best)}</h3>
            <p className="muted">
              {wearOf(s.best.float).name} · 🪙 {formatCoins(s.best.value)}
            </p>
          </div>
        </div>
      )}

      <h3>Deine Drops</h3>
      <table className="drop-table">
        <thead>
          <tr>
            <th>Seltenheit</th>
            <th>Gezogen</th>
            <th>Dein Anteil</th>
            <th>Chance</th>
          </tr>
        </thead>
        <tbody>
          {RARITY_ORDER.map((r) => (
            <tr key={r} style={{ '--rc': RARITIES[r].color } as CSSProperties}>
              <td>
                <span className="dot" /> {RARITIES[r].name}
              </td>
              <td>{formatCoins(s.drops[r])}</td>
              <td>
                {s.opened > 0
                  ? `${((s.drops[r] / s.opened) * 100).toLocaleString('de-DE', { maximumFractionDigits: 3 })} %`
                  : '–'}
              </td>
              <td>{(RARITIES[r].chance * 100).toLocaleString('de-DE', { maximumFractionDigits: 3 })} %</td>
            </tr>
          ))}
        </tbody>
      </table>

      {s.macSold > 0 && (
        <div className="regret">
          <WeaponArt skin={MAC_SKIN} float={0.01} className="art" />
          <p>
            Du hast die MAC-10 | Hitzewelle {s.macSold > 1 ? `${s.macSold}-mal ` : ''}für 🪙 3.000 verkauft. Heutiger Wert: 🪙{' '}
            {formatCoins(MAC_REGRET_VALUE)}. 💀
          </p>
        </div>
      )}

      <div className="danger-zone">
        {confirmReset ? (
          <>
            <p>Wirklich alles löschen? Münzen, Inventar und Statistik sind dann weg.</p>
            <div className="row">
              <button type="button" className="btn ghost" onClick={() => setConfirmReset(false)}>
                Abbrechen
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={() => {
                  reset()
                  setConfirmReset(false)
                  toast('Spielstand zurückgesetzt', 'info')
                }}
              >
                Ja, alles zurücksetzen
              </button>
            </div>
          </>
        ) : (
          <button type="button" className="btn ghost small" onClick={() => setConfirmReset(true)}>
            Spielstand zurücksetzen
          </button>
        )}
      </div>
    </div>
  )
}
