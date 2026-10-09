import { useEffect, useRef, useState } from 'react'
import { TOO_EARLY, pickQuip } from '../../game/quips'
import * as sound from '../../game/sound'
import { formatCoins, useStore } from '../../game/store'
import { EndScreen, GameHead } from './common'

const ROUNDS = 5

type Phase = 'idle' | 'wait' | 'go' | 'shown' | 'early' | 'end'

function coinsFor(ms: number): number {
  if (ms < 180) return 150
  if (ms < 220) return 110
  if (ms < 260) return 80
  if (ms < 320) return 55
  if (ms < 400) return 35
  return 15
}

function verdict(ms: number): string {
  if (ms < 180) return 'Unmenschlich! 🤖'
  if (ms < 220) return 'Pro-Reflexe! ⚡'
  if (ms < 260) return 'Sehr schnell!'
  if (ms < 320) return 'Solide.'
  if (ms < 400) return 'Geht so …'
  return 'Eingeschlafen? 😴'
}

export function ReactionGame({ onBack }: { onBack: () => void }) {
  const { state, playedGame } = useStore()
  const [phase, setPhase] = useState<Phase>('idle')
  const [round, setRound] = useState(0)
  const [times, setTimes] = useState<number[]>([])
  const [last, setLast] = useState<number | null>(null)
  const [quip, setQuip] = useState('')
  const [won, setWon] = useState(0)
  const goAt = useRef(0)
  const timer = useRef(0)
  const coinsRef = useRef(0)
  const earlyRef = useRef(0)
  const prevBest = useRef(0)
  const timesRef = useRef<number[]>([])

  useEffect(() => () => clearTimeout(timer.current), [])

  const nextRound = (r: number) => {
    if (r >= ROUNDS) {
      finish()
      return
    }
    setRound(r)
    setPhase('wait')
    timer.current = window.setTimeout(
      () => {
        goAt.current = performance.now()
        setPhase('go')
        sound.readyGo()
      },
      1200 + Math.random() * 2600,
    )
  }

  const finish = () => {
    setPhase('end')
    const t = timesRef.current
    const fastest = t.length ? Math.min(...t) : 0
    const credited = playedGame('reaction', coinsRef.current, { reactionMs: fastest || undefined, early: earlyRef.current })
    setWon(credited)
    if (credited > 0) sound.coin()
  }

  const begin = () => {
    coinsRef.current = 0
    earlyRef.current = 0
    prevBest.current = state.stats.gameBest.reaction
    timesRef.current = []
    setTimes([])
    setLast(null)
    nextRound(0)
  }

  const press = () => {
    if (phase === 'wait') {
      clearTimeout(timer.current)
      earlyRef.current++
      sound.honk()
      setQuip(pickQuip(TOO_EARLY))
      setPhase('early')
      timer.current = window.setTimeout(() => nextRound(round + 1), 1400)
    } else if (phase === 'go') {
      const ms = Math.round(performance.now() - goAt.current)
      coinsRef.current += coinsFor(ms)
      timesRef.current = [...timesRef.current, ms]
      setTimes(timesRef.current)
      setLast(ms)
      sound.hit()
      setPhase('shown')
      timer.current = window.setTimeout(() => nextRound(round + 1), 1100)
    }
  }

  const best = times.length ? Math.min(...times) : 0
  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0

  return (
    <div className="aim">
      <GameHead
        title="⚡ Reaktionstest"
        desc="Warte, bis das Feld grün wird – dann so schnell wie möglich tippen. Unter 180 ms gibt es 🪙 150. Zu früh tippen gibt nichts!"
        onBack={onBack}
        stats={
          <>
            <span>
              Runde {Math.min(round + 1, ROUNDS)}/{ROUNDS}
            </span>
            <span>⚡ {best ? `${best} ms` : '–'}</span>
            <span>🪙 {formatCoins(coinsRef.current)}</span>
          </>
        }
      />
      <div className={`arena reaction ${phase}`} onPointerDown={press}>
        {phase === 'idle' && (
          <div className="arena-overlay">
            <p>Rekord: 🪙 {formatCoins(state.stats.gameBest.reaction)}</p>
            {state.stats.bestReaction > 0 && <p>Schnellste Reaktion: {state.stats.bestReaction} ms</p>}
            <button type="button" className="btn primary big" onClick={begin}>
              Start
            </button>
          </div>
        )}
        {phase === 'wait' && <p className="reaction-text">Warte …</p>}
        {phase === 'go' && <p className="reaction-text">JETZT!</p>}
        {phase === 'shown' && last !== null && (
          <div className="reaction-text">
            <span className="big-ms">{last} ms</span>
            <span>
              {verdict(last)} +🪙 {coinsFor(last)}
            </span>
          </div>
        )}
        {phase === 'early' && (
          <div className="reaction-text">
            <span className="big-ms">🤡</span>
            <span>{quip}</span>
          </div>
        )}
        {phase === 'end' && (
          <EndScreen
            title="Geschafft!"
            lines={[times.length ? `Bestzeit ${best} ms · Schnitt ${avg} ms` : 'Keine einzige gültige Runde …']}
            coins={won}
            record={won > prevBest.current}
            quip={earlyRef.current >= 3 ? 'So viel Ungeduld. Respekt. 🤡' : best && best < 200 ? 'Bist du ein Roboter?' : undefined}
            onAgain={begin}
          />
        )}
      </div>
    </div>
  )
}
