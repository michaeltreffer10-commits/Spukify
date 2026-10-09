import { useState } from 'react'
import { gameBonus } from '../../game/progress'
import { formatCoins, useStore } from '../../game/store'
import type { GameId } from '../../game/types'
import { AimGame } from './AimGame'
import { BombGame } from './BombGame'
import { HeadshotGame } from './HeadshotGame'
import { ReactionGame } from './ReactionGame'

const GAMES: { id: GameId; icon: string; name: string; desc: string; time: string }[] = [
  { id: 'aim', icon: '🎯', name: 'Aim-Training', desc: 'So viele Ziele wie möglich treffen. Serien bringen bis zu ×3.', time: '30 Sek.' },
  { id: 'headshot', icon: '🪖', name: 'Kopfschuss-Training', desc: 'Gegner tauchen auf – ziel auf den Kopf. Aber Vorsicht vor Geiseln!', time: '30 Sek.' },
  { id: 'bomb', icon: '💣', name: 'Bombe entschärfen', desc: 'Den richtigen Draht schneiden, bevor es knallt. Die Schrift lügt!', time: '15 Sek.' },
  { id: 'reaction', icon: '⚡', name: 'Reaktionstest', desc: 'Tippen, sobald es grün wird. Je schneller, desto mehr Münzen.', time: '5 Runden' },
]

export function EarnView() {
  const { state, level } = useStore()
  const [game, setGame] = useState<GameId | null>(null)
  const back = () => setGame(null)

  if (game === 'aim') return <AimGame onBack={back} />
  if (game === 'bomb') return <BombGame onBack={back} />
  if (game === 'reaction') return <ReactionGame onBack={back} />
  if (game === 'headshot') return <HeadshotGame onBack={back} />

  const bonus = Math.round(gameBonus(level.level) * 100)

  return (
    <div className="earn">
      <h2 className="section-title">Münzen verdienen</h2>
      <p className="muted">Jedes Spiel bringt Münzen und XP. Je höher dein Level, desto mehr gibt es.</p>
      <div className="bonus-banner">
        <span className="bonus-num">+{bonus} %</span>
        <span>
          Dein Level-Bonus auf alle Minispiele (Level {level.level}). Pro Level gibt es +2 %, höchstens +100 %.
        </span>
      </div>
      <div className="game-grid">
        {GAMES.map((g) => (
          <button type="button" key={g.id} className="game-card" onClick={() => setGame(g.id)}>
            <span className="game-icon">{g.icon}</span>
            <span className="game-name">{g.name}</span>
            <span className="muted game-desc">{g.desc}</span>
            <span className="game-meta">
              <span>⏱ {g.time}</span>
              <span>🏆 {formatCoins(state.stats.gameBest[g.id])}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
