import type { ReactNode } from 'react'
import { formatCoins } from '../../game/store'

interface HeadProps {
  title: string
  desc: string
  onBack: () => void
  stats?: ReactNode
}

export function GameHead({ title, desc, onBack, stats }: HeadProps) {
  return (
    <div className="aim-head">
      <div>
        <button type="button" className="btn ghost small back" onClick={onBack}>
          ← Alle Minispiele
        </button>
        <h2 className="section-title">{title}</h2>
        <p className="muted">{desc}</p>
      </div>
      {stats && <div className="aim-stats">{stats}</div>}
    </div>
  )
}

interface EndProps {
  title: string
  lines: string[]
  coins: number
  record: boolean
  quip?: string
  onAgain: () => void
}

export function EndScreen({ title, lines, coins, record, quip, onAgain }: EndProps) {
  return (
    <div className="arena-overlay">
      <h3>{title}</h3>
      {lines.map((l) => (
        <p key={l}>{l}</p>
      ))}
      <p className="won">+🪙 {formatCoins(coins)}</p>
      {record && <p className="record">🏆 Neuer Rekord!</p>}
      {quip && <p className="game-quip">🎙️ {quip}</p>}
      <button type="button" className="btn primary big" onClick={onAgain}>
        Nochmal
      </button>
    </div>
  )
}
