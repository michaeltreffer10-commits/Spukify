import { useEffect, useState } from 'react'
import { PRESS_MAX, pressCap, pressRate, pressStored, pressUpgradeCost } from '../../game/progress'
import { formatCoins, useStore } from '../../game/store'

function hours(secs: number): string {
  const h = secs / 3600
  return `${h.toLocaleString('de-DE', { maximumFractionDigits: 1 })} Std.`
}

/** Die Geldpresse: druckt passiv Münzen, auch wenn das Spiel zu ist */
export function MoneyPress() {
  const { state, pressCollect, pressUpgrade, toast } = useStore()
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [])

  const p = state.press
  const stored = pressStored(p, now)
  const cap = pressCap(p)
  const full = Math.min(1, (now - p.last) / 1000 / cap)
  const rate = pressRate(p)

  const upgrades: { kind: keyof typeof PRESS_MAX; icon: string; name: string; desc: string; level: number }[] = [
    { kind: 'speed', icon: '⚙️', name: 'Druckwerk', desc: `+${formatCoins(Math.round(1800 * Math.pow(1.25, p.ink)))} Münzen pro Stunde`, level: p.speed },
    { kind: 'ink', icon: '🟡', name: 'Goldtinte', desc: 'Alles ×1,25', level: p.ink },
    { kind: 'vault', icon: '🏦', name: 'Tresor', desc: '+1 Stunde Speicher', level: p.vault },
  ]

  return (
    <div className="press">
      <div className="press-main">
        <div className={`press-machine${full < 1 ? ' running' : ''}`}>
          <span className="press-icon">🖨️</span>
          {full < 1 && (
            <>
              <span className="bill b1">💵</span>
              <span className="bill b2">💵</span>
              <span className="bill b3">💵</span>
            </>
          )}
        </div>
        <div className="press-info">
          <h3>Geldpresse</h3>
          <p className="press-amount">🪙 {formatCoins(stored)}</p>
          <p className="muted small">
            {formatCoins(Math.round(rate * 3600))} Münzen pro Stunde · druckt auch, wenn das Spiel zu ist (bis {hours(cap)})
          </p>
          <div className="xp-bar press-bar" title="Tresor-Füllstand">
            <div style={{ width: `${full * 100}%` }} />
          </div>
          <p className="muted small">{full >= 1 ? '🔒 Tresor voll – jetzt einsammeln!' : `Tresor ${Math.round(full * 100)} % voll`}</p>
          <button
            type="button"
            className="btn primary"
            disabled={stored <= 0}
            onClick={() => {
              const got = pressCollect()
              if (got > 0) toast(`🖨️ +${formatCoins(got)} Münzen aus der Geldpresse`, 'good')
            }}
          >
            Einsammeln
          </button>
        </div>
      </div>
      <div className="press-upgrades">
        {upgrades.map((u) => {
          const maxed = u.level >= PRESS_MAX[u.kind]
          const cost = pressUpgradeCost(u.kind, p)
          return (
            <button
              type="button"
              key={u.kind}
              className="press-up"
              disabled={maxed || state.coins + stored < cost}
              onClick={() => {
                if (pressUpgrade(u.kind)) toast(`${u.icon} ${u.name} verbessert!`, 'good')
              }}
            >
              <span className="up-icon">{u.icon}</span>
              <span className="up-text">
                <strong>
                  {u.name} · Stufe {u.level}
                </strong>
                <span className="muted">{u.desc}</span>
              </span>
              <span className="up-cost">{maxed ? 'MAX' : `🪙 ${formatCoins(cost)}`}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
