import { useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { HOSTAGE, pickQuip } from '../../game/quips'
import * as sound from '../../game/sound'
import { formatCoins, useStore } from '../../game/store'
import { EndScreen, GameHead } from './common'

const ROUND_MS = 30_000
const HEAD = 30
const BODY = 10
const HOSTAGE_PENALTY = 40

/** Verstecke: Kisten unten und Fenster oben (Angaben in %) */
const SPOTS = [
  { x: 18, y: 78, kind: 'crate' },
  { x: 50, y: 78, kind: 'crate' },
  { x: 82, y: 78, kind: 'crate' },
  { x: 30, y: 36, kind: 'window' },
  { x: 70, y: 36, kind: 'window' },
] as const

interface Enemy {
  id: number
  spot: number
  hostage: boolean
  life: number
  born: number
}

interface Popup {
  id: number
  x: number
  y: number
  text: string
  kind: 'head' | 'body' | 'bad'
}

function mult(streak: number): number {
  return Math.min(2, 1 + Math.floor(streak / 3) * 0.25)
}

function Figure({ hostage }: { hostage: boolean }) {
  return hostage ? (
    <svg viewBox="0 0 80 100" className="figure">
      <path data-part="body" d="M8 100 Q10 52 40 48 Q70 52 72 100 Z" fill="#ff8a1f" />
      <path data-part="body" d="M14 60 L4 22 L12 20 L22 54 Z M66 60 L76 22 L68 20 L58 54 Z" fill="#e8b48a" />
      <circle data-part="head" cx="40" cy="26" r="15" fill="#e8b48a" />
      <path d="M33 24 h3 M44 24 h3 M34 33 q6 4 12 0" stroke="#3a2a1a" strokeWidth="2" fill="none" pointerEvents="none" />
      <text x="40" y="82" textAnchor="middle" fontSize="11" fontWeight="900" fill="#3a1a00" pointerEvents="none">
        GEISEL
      </text>
    </svg>
  ) : (
    <svg viewBox="0 0 80 100" className="figure">
      <path data-part="body" d="M8 100 Q10 52 40 48 Q70 52 72 100 Z" fill="#4a4f3a" />
      <path data-part="body" d="M22 70 L58 70 L58 78 L22 78 Z" fill="#2a2d22" />
      <circle data-part="head" cx="40" cy="26" r="15" fill="#1c1c1f" />
      <rect x="29" y="21" width="22" height="7" rx="3" fill="#d9a77c" pointerEvents="none" />
      <circle cx="35" cy="24.5" r="1.8" fill="#111" pointerEvents="none" />
      <circle cx="45" cy="24.5" r="1.8" fill="#111" pointerEvents="none" />
    </svg>
  )
}

export function HeadshotGame({ onBack }: { onBack: () => void }) {
  const { state, playedGame } = useStore()
  const [phase, setPhase] = useState<'idle' | 'play' | 'end'>('idle')
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [popups, setPopups] = useState<Popup[]>([])
  const [score, setScore] = useState(0)
  const [heads, setHeads] = useState(0)
  const [streak, setStreak] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_MS)
  const [won, setWon] = useState(0)
  const [quip, setQuip] = useState<string | undefined>()
  const nextId = useRef(0)
  const scoreRef = useRef(0)
  const headsRef = useRef(0)
  const hostagesRef = useRef(0)
  const prevBest = useRef(0)
  const arena = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (phase !== 'play') return
    const start = performance.now()
    const spawner = setInterval(() => {
      const elapsed = performance.now() - start
      setEnemies((list) => {
        const used = new Set(list.map((e) => e.spot))
        const free = SPOTS.map((_, i) => i).filter((i) => !used.has(i))
        if (free.length === 0 || list.length >= 2) return list
        const spot = free[Math.floor(Math.random() * free.length)]
        const life = Math.max(750, 1250 - elapsed / 60)
        return [...list, { id: ++nextId.current, spot, hostage: Math.random() < 0.15, life, born: performance.now() }]
      })
    }, 620)
    const clock = setInterval(() => {
      const now = performance.now()
      const left = ROUND_MS - (now - start)
      setTimeLeft(Math.max(0, left))
      setEnemies((list) => list.filter((e) => now - e.born < e.life))
      if (left <= 0) setPhase('end')
    }, 50)
    return () => {
      clearInterval(spawner)
      clearInterval(clock)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'end') return
    setEnemies([])
    const credited = playedGame('headshot', Math.max(0, scoreRef.current), {
      headshots: headsRef.current,
      hostages: hostagesRef.current,
    })
    setWon(credited)
    if (credited > 0) sound.coin()
    setQuip(
      hostagesRef.current >= 3
        ? 'So viele Geiseln … das gibt Ärger.'
        : headsRef.current >= 30
          ? 'Nur Köpfe. Bist du ein Cheater?'
          : headsRef.current === 0
            ? 'Kein einziger Kopfschuss? Zielen ist erlaubt.'
            : undefined,
    )
  }, [phase, playedGame])

  const begin = () => {
    scoreRef.current = 0
    headsRef.current = 0
    hostagesRef.current = 0
    prevBest.current = state.stats.gameBest.headshot
    setScore(0)
    setHeads(0)
    setStreak(0)
    setPopups([])
    setTimeLeft(ROUND_MS)
    setPhase('play')
  }

  const popup = (e: PointerEvent, text: string, kind: Popup['kind']) => {
    const r = arena.current!.getBoundingClientRect()
    const id = ++nextId.current
    setPopups((p) => [...p, { id, x: e.clientX - r.left, y: e.clientY - r.top, text, kind }])
    setTimeout(() => setPopups((p) => p.filter((x) => x.id !== id)), 800)
  }

  const shoot = (e: PointerEvent) => {
    if (phase !== 'play') return
    const target = e.target as Element
    const part = target.getAttribute('data-part')
    const holder = target.closest('[data-enemy]')
    const enemy = holder && enemies.find((x) => x.id === Number(holder.getAttribute('data-enemy')))
    if (!part || !enemy) {
      sound.miss()
      setStreak(0)
      return
    }
    setEnemies((list) => list.filter((x) => x.id !== enemy.id))
    if (enemy.hostage) {
      hostagesRef.current++
      scoreRef.current -= HOSTAGE_PENALTY
      setScore(scoreRef.current)
      setStreak(0)
      sound.error()
      sound.honk()
      popup(e, `−${HOSTAGE_PENALTY} ${pickQuip(HOSTAGE)}`, 'bad')
      return
    }
    if (part === 'head') {
      const gain = Math.round(HEAD * mult(streak))
      scoreRef.current += gain
      headsRef.current++
      setHeads(headsRef.current)
      setStreak((s) => s + 1)
      sound.headshot()
      popup(e, `+${gain} HEADSHOT`, 'head')
    } else {
      scoreRef.current += BODY
      setStreak(0)
      sound.hit()
      popup(e, `+${BODY}`, 'body')
    }
    setScore(scoreRef.current)
  }

  return (
    <div className="aim">
      <GameHead
        title="🪖 Kopfschuss-Training"
        desc={`Gegner tauchen hinter Kisten und Fenstern auf. Kopf = 🪙 ${HEAD}, Körper = 🪙 ${BODY}, Kopfschuss-Serien bis ×2. Triff bloß keine Geisel (−${HOSTAGE_PENALTY})!`}
        onBack={onBack}
        stats={
          <>
            <span>⏱ {(timeLeft / 1000).toFixed(1)} s</span>
            <span>💀 {heads}</span>
            <span>🔥 ×{mult(streak).toLocaleString('de-DE')}</span>
            <span>🪙 {formatCoins(score)}</span>
          </>
        }
      />
      <div className={`arena hs-arena ${phase}`} ref={arena} onPointerDown={shoot}>
        <div className="hs-wall" />
        {SPOTS.map((s, i) => {
          const enemy = enemies.find((e) => e.spot === i)
          return (
            <div key={i} className={`hs-spot ${s.kind}`} style={{ left: `${s.x}%`, top: `${s.y}%` }}>
              <div className="hs-window">
                {enemy && (
                  <div
                    key={enemy.id}
                    data-enemy={enemy.id}
                    className="hs-enemy"
                    style={{ animationDuration: `${enemy.life}ms` }}
                  >
                    <Figure hostage={enemy.hostage} />
                  </div>
                )}
              </div>
              <div className="hs-cover" />
            </div>
          )
        })}
        {popups.map((p) => (
          <span key={p.id} className={`hs-popup ${p.kind}`} style={{ left: p.x, top: p.y }}>
            {p.text}
          </span>
        ))}
        {phase === 'idle' && (
          <div className="arena-overlay">
            <p>Rekord: 🪙 {formatCoins(state.stats.gameBest.headshot)}</p>
            <button type="button" className="btn primary big" onClick={begin}>
              Start
            </button>
          </div>
        )}
        {phase === 'end' && (
          <EndScreen
            title="Runde vorbei!"
            lines={[`${heads} Kopfschüsse · ${hostagesRef.current} Geiseln getroffen`]}
            coins={won}
            record={won > prevBest.current}
            quip={quip}
            onAgain={begin}
          />
        )}
      </div>
    </div>
  )
}
