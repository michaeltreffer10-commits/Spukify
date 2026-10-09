import { useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import * as sound from '../game/sound'
import { formatCoins, useStore } from '../game/store'

const ROUND_MS = 30_000
const TARGET_LIFE = 1300
const COINS_PER_HIT = 10

interface Target {
  id: number
  x: number
  y: number
  born: number
}

function multiplier(combo: number): number {
  return Math.min(3, 1 + Math.floor(combo / 5) * 0.5)
}

export function AimGame() {
  const { state, earn, setAimBest, toast } = useStore()
  const [phase, setPhase] = useState<'idle' | 'play' | 'end'>('idle')
  const [targets, setTargets] = useState<Target[]>([])
  const [score, setScore] = useState(0)
  const [hits, setHits] = useState(0)
  const [shots, setShots] = useState(0)
  const [combo, setCombo] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_MS)
  const nextId = useRef(0)
  const scoreRef = useRef(0)
  const prevBest = useRef(0)

  useEffect(() => {
    if (phase !== 'play') return
    const start = performance.now()
    const spawn = () => {
      const id = ++nextId.current
      setTargets((t) => [...t, { id, x: 6 + Math.random() * 88, y: 8 + Math.random() * 84, born: performance.now() }])
    }
    spawn()
    const spawner = setInterval(spawn, 620)
    const clock = setInterval(() => {
      const now = performance.now()
      const left = ROUND_MS - (now - start)
      setTimeLeft(Math.max(0, left))
      // Abgelaufene Ziele entfernen – das zählt als verpasst
      setTargets((t) => {
        const alive = t.filter((x) => now - x.born < TARGET_LIFE)
        if (alive.length < t.length) setCombo(0)
        return alive
      })
      if (left <= 0) setPhase('end')
    }, 50)
    return () => {
      clearInterval(spawner)
      clearInterval(clock)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'end') return
    setTargets([])
    const won = scoreRef.current
    if (won > 0) {
      earn(won)
      sound.coin()
      toast(`+${formatCoins(won)} Münzen aus dem Aim-Training`, 'good')
    }
    setAimBest(won)
  }, [phase, earn, setAimBest, toast])

  const begin = () => {
    scoreRef.current = 0
    prevBest.current = state.stats.aimBest
    setScore(0)
    setHits(0)
    setShots(0)
    setCombo(0)
    setTimeLeft(ROUND_MS)
    setPhase('play')
  }

  const shoot = (e: PointerEvent) => {
    if (phase !== 'play') return
    setShots((s) => s + 1)
    const id = Number((e.target as HTMLElement).dataset.target)
    if (id) {
      const gain = Math.round(COINS_PER_HIT * multiplier(combo))
      scoreRef.current += gain
      setScore(scoreRef.current)
      setHits((h) => h + 1)
      setCombo((c) => c + 1)
      setTargets((t) => t.filter((x) => x.id !== id))
      sound.hit()
    } else {
      setCombo(0)
      sound.miss()
    }
  }

  const accuracy = shots > 0 ? Math.round((hits / shots) * 100) : 0

  return (
    <div className="aim">
      <div className="aim-head">
        <div>
          <h2 className="section-title">Aim-Training</h2>
          <p className="muted">
            Triff in 30 Sekunden so viele Ziele wie möglich. Jeder Treffer gibt 🪙 {COINS_PER_HIT}, Treffer-Serien bis zu
            ×3. Daneben schießen bricht die Serie.
          </p>
        </div>
        <div className="aim-stats">
          <span>⏱ {(timeLeft / 1000).toFixed(1)} s</span>
          <span>🎯 {hits}</span>
          <span>🔥 ×{multiplier(combo).toLocaleString('de-DE')}</span>
          <span>🪙 {formatCoins(score)}</span>
        </div>
      </div>

      <div className={`arena ${phase}`} onPointerDown={shoot}>
        {phase === 'play' &&
          targets.map((t) => (
            <span
              key={t.id}
              data-target={t.id}
              className="target"
              style={{ left: `${t.x}%`, top: `${t.y}%`, animationDuration: `${TARGET_LIFE}ms` }}
            />
          ))}
        {phase === 'idle' && (
          <div className="arena-overlay">
            <p>Rekord: 🪙 {formatCoins(state.stats.aimBest)}</p>
            <button type="button" className="btn primary big" onClick={begin}>
              Start
            </button>
          </div>
        )}
        {phase === 'end' && (
          <div className="arena-overlay">
            <h3>Vorbei!</h3>
            <p>
              {hits} Treffer · {accuracy} % Genauigkeit
            </p>
            <p className="won">+🪙 {formatCoins(score)}</p>
            {score > prevBest.current && <p className="record">🏆 Neuer Rekord!</p>}
            <button type="button" className="btn primary big" onClick={begin}>
              Nochmal
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
