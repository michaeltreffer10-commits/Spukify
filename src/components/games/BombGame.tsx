import { useEffect, useRef, useState } from 'react'
import { BOMB_BOOM, BOMB_DEFUSED, pickQuip } from '../../game/quips'
import * as sound from '../../game/sound'
import { formatCoins, useStore } from '../../game/store'
import { EndScreen, GameHead } from './common'

const TIME_MS = 15_000
const STEPS = 3

interface WireColor {
  name: string
  hex: string
}

const COLORS: WireColor[] = [
  { name: 'ROT', hex: '#e53935' },
  { name: 'BLAU', hex: '#1e88e5' },
  { name: 'GELB', hex: '#fdd835' },
  { name: 'GRÜN', hex: '#43a047' },
  { name: 'WEISS', hex: '#f5f5f5' },
  { name: 'SCHWARZ', hex: '#2b2b2b' },
]

interface Step {
  wires: WireColor[]
  /** Text vor dem farbigen Wort */
  before: string
  /** Das Wort – absichtlich in einer anderen Farbe geschrieben */
  word?: { text: string; color: string }
  after?: string
  answer: number
}

function shuffle<T>(list: T[]): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function otherColor(c: WireColor): string {
  return shuffle(COLORS.filter((x) => x !== c && x.name !== 'SCHWARZ'))[0].hex
}

function makeStep(): Step {
  const kind = Math.floor(Math.random() * 4)
  if (kind === 0) {
    const wires = shuffle(COLORS).slice(0, 5)
    const target = wires[Math.floor(Math.random() * 5)]
    return { wires, before: 'Schneide:', word: { text: target.name, color: otherColor(target) }, answer: wires.indexOf(target) }
  }
  if (kind === 1) {
    const wires = Array.from({ length: 5 }, () => COLORS[Math.floor(Math.random() * COLORS.length)])
    const n = 1 + Math.floor(Math.random() * 5)
    return { wires, before: `Schneide den ${n}. Draht von links`, answer: n - 1 }
  }
  if (kind === 2) {
    const [a, b, u] = shuffle(COLORS)
    const wires = shuffle([a, a, b, b, u])
    return { wires, before: 'Schneide den Draht, dessen Farbe nur EINMAL vorkommt', answer: wires.indexOf(u) }
  }
  const [x, odd] = shuffle(COLORS)
  const wires = shuffle([x, x, x, x, odd])
  return {
    wires,
    before: 'Schneide den Draht, der NICHT',
    word: { text: x.name, color: otherColor(x) },
    after: 'ist',
    answer: wires.indexOf(odd),
  }
}

type Phase = 'idle' | 'play' | 'boom' | 'defused'

export function BombGame({ onBack }: { onBack: () => void }) {
  const { state, playedGame } = useStore()
  const [phase, setPhase] = useState<Phase>('idle')
  const [step, setStep] = useState<Step>(makeStep)
  const [stepNo, setStepNo] = useState(0)
  const [cut, setCut] = useState<number[]>([])
  const [left, setLeft] = useState(TIME_MS)
  const [won, setWon] = useState(0)
  const [quip, setQuip] = useState('')
  const [streak, setStreak] = useState(0)
  const endAt = useRef(0)
  const prevBest = useRef(0)
  /** Verhindert, dass eine Bombe zweimal endet */
  const over = useRef(false)

  // Uhr und Piepen – je weniger Zeit, desto schneller
  useEffect(() => {
    if (phase !== 'play') return
    let beep = 0
    const clock = setInterval(() => {
      const l = endAt.current - performance.now()
      setLeft(Math.max(0, l))
      if (l <= 0) explode()
    }, 50)
    const doBeep = () => {
      const l = endAt.current - performance.now()
      if (l <= 0) return
      sound.bombBeep(l < 3000)
      beep = window.setTimeout(doBeep, 110 + (l / TIME_MS) * 850)
    }
    doBeep()
    return () => {
      clearInterval(clock)
      clearTimeout(beep)
    }
    // Die Uhr soll nur beim Wechsel der Phase neu starten
  }, [phase])

  const begin = () => {
    prevBest.current = state.stats.gameBest.bomb
    setStep(makeStep())
    setStepNo(0)
    setCut([])
    over.current = false
    endAt.current = performance.now() + TIME_MS
    setLeft(TIME_MS)
    setPhase('play')
  }

  const explode = () => {
    if (over.current) return
    over.current = true
    setPhase('boom')
    setStreak(0)
    sound.explosion()
    setTimeout(() => sound.speak('Terroristen gewinnen.', 0.8), 900)
    setQuip(pickQuip(BOMB_BOOM))
    setWon(playedGame('bomb', 0, { exploded: true }))
  }

  const cutWire = (i: number) => {
    if (phase !== 'play' || over.current || cut.includes(i)) return
    sound.wireCut()
    setCut((c) => [...c, i])
    if (i !== step.answer) {
      setTimeout(explode, 250)
      return
    }
    if (stepNo + 1 < STEPS) {
      setTimeout(() => {
        setStep(makeStep())
        setStepNo((n) => n + 1)
        setCut([])
      }, 350)
      return
    }
    // Entschärft!
    over.current = true
    const secs = Math.max(0, (endAt.current - performance.now()) / 1000)
    const coins = Math.round(80 + secs * 12 + Math.min(100, streak * 20))
    setPhase('defused')
    setStreak((s) => s + 1)
    sound.defused()
    setTimeout(() => sound.speak('Bombe entschärft.'), 300)
    setQuip(pickQuip(BOMB_DEFUSED))
    const credited = playedGame('bomb', coins, { defused: true })
    setWon(credited)
    setTimeout(sound.coin, 600)
  }

  const secs = (left / 1000).toFixed(1)

  return (
    <div className="aim">
      <GameHead
        title="💣 Bombe entschärfen"
        desc="Lies die Anweisung genau und schneide den richtigen Draht – 3-mal, bevor die Zeit abläuft. Achtung: Die Farbe der Schrift lügt manchmal!"
        onBack={onBack}
        stats={
          <>
            <span>
              Schritt {Math.min(stepNo + 1, STEPS)}/{STEPS}
            </span>
            <span>🔥 Serie {streak}</span>
          </>
        }
      />
      <div className={`arena bomb-arena ${phase}`}>
        {phase !== 'idle' && (
          <div className="bomb">
            <div className="bomb-top">
              <span className={`bomb-led${phase === 'play' ? ' blink' : ''}`} />
              <span className={`bomb-timer${left < 3000 ? ' urgent' : ''}`}>{phase === 'defused' ? '--.-' : secs}</span>
              <span className="bomb-code">7355608</span>
            </div>
            <div className="bomb-instr">
              {step.before} {step.word && <strong style={{ color: step.word.color }}>{step.word.text}</strong>} {step.after}
            </div>
            <svg className="wires" viewBox="0 0 300 150" role="group" aria-label="Drähte">
              {step.wires.map((w, i) => {
                const x = 30 + i * 60
                const isCut = cut.includes(i)
                return (
                  <g key={i} className="wire" onPointerDown={() => cutWire(i)}>
                    <rect x={x - 14} y={0} width={28} height={150} fill="transparent" />
                    {isCut ? (
                      <>
                        <path d={`M${x} 6 C ${x - 14} 40, ${x + 14} 50, ${x - 4} 66`} stroke={w.hex} strokeWidth={9} fill="none" strokeLinecap="round" />
                        <path d={`M${x + 4} 86 C ${x + 14} 100, ${x - 14} 120, ${x} 144`} stroke={w.hex} strokeWidth={9} fill="none" strokeLinecap="round" />
                      </>
                    ) : (
                      <path
                        d={`M${x} 6 C ${x - 14} 50, ${x + 14} 100, ${x} 144`}
                        stroke={w.hex}
                        strokeWidth={9}
                        fill="none"
                        strokeLinecap="round"
                      />
                    )}
                    <circle cx={x} cy={6} r={7} fill="#555" />
                    <circle cx={x} cy={144} r={7} fill="#555" />
                  </g>
                )
              })}
            </svg>
          </div>
        )}
        {phase === 'boom' && <div className="boom-flash" />}
        {phase === 'idle' && (
          <div className="arena-overlay">
            <p className="bomb-code big">7355608</p>
            <p>Rekord: 🪙 {formatCoins(state.stats.gameBest.bomb)}</p>
            <button type="button" className="btn primary big" onClick={begin}>
              Bombe holen
            </button>
          </div>
        )}
        {(phase === 'boom' || phase === 'defused') && (
          <EndScreen
            title={phase === 'boom' ? '💥 BOOM!' : '✅ Entschärft!'}
            lines={phase === 'boom' ? ['Die Bombe ist explodiert.'] : [`Mit ${secs} Sekunden übrig.`]}
            coins={won}
            record={phase === 'defused' && won > prevBest.current}
            quip={quip}
            onAgain={begin}
          />
        )}
      </div>
    </div>
  )
}
