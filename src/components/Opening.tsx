import { useEffect, useMemo, useRef, useState } from 'react'
import { getSkin } from '../game/data'
import type { CaseDef, Skin } from '../game/data'
import { fillerSkin, itemValue, random, rarityRank } from '../game/roll'
import type { Item } from '../game/roll'
import * as sound from '../game/sound'
import { ItemCard, StripCard } from './ItemCard'
import { ResultPanel } from './ResultPanel'
import { MacReveal } from './MacReveal'

const STRIP_LENGTH = 60
const WIN_INDEX = 52
const GAP = 4

interface StripProps {
  caseDef: CaseDef
  winner: Skin
  cardWidth: number
  duration: number
  ticking: boolean
  onEnd: () => void
}

/** Ein Band, das durchläuft und auf dem Gewinn stehen bleibt */
function Strip({ caseDef, winner, cardWidth, duration, ticking, onEnd }: StripProps) {
  const box = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [done, setDone] = useState(false)
  const cards = useMemo(() => {
    const list = Array.from({ length: STRIP_LENGTH }, () => fillerSkin(caseDef))
    list[WIN_INDEX] = winner
    return list
  }, [caseDef, winner])

  const endRef = useRef(onEnd)
  endRef.current = onEnd

  useEffect(() => {
    const el = box.current
    const tr = track.current
    if (!el || !tr) return
    const step = cardWidth + GAP
    const half = el.clientWidth / 2
    const target = WIN_INDEX * step + cardWidth * (0.12 + random() * 0.76) - half
    const start = performance.now()
    let lastIndex = -1
    let frame = 0
    const ease = (t: number) => 1 - Math.pow(1 - t, 4)
    const loop = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const x = target * ease(t)
      tr.style.transform = `translate3d(${-x}px,0,0)`
      const index = Math.floor((x + half) / step)
      if (index !== lastIndex) {
        if (ticking && lastIndex !== -1) sound.tick()
        lastIndex = index
      }
      if (t < 1) frame = requestAnimationFrame(loop)
      else {
        setDone(true)
        endRef.current()
      }
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [cardWidth, duration, ticking])

  return (
    <div className={`strip${done ? ' done' : ''}`} ref={box}>
      <div className="strip-track" ref={track} style={{ gap: GAP }}>
        {cards.map((s, i) => (
          <div key={i} className={i === WIN_INDEX && done ? 'win' : undefined}>
            <StripCard skin={s} width={cardWidth} />
          </div>
        ))}
      </div>
      <div className="strip-marker" />
    </div>
  )
}

/** Bei 100 Cases: alle Karten drehen sich nacheinander um */
function FlipGrid({ items, onEnd }: { items: Item[]; onEnd: () => void }) {
  const per = Math.max(12, Math.min(30, 2500 / items.length))
  useEffect(() => {
    const iv = setInterval(sound.tick, per)
    const t = setTimeout(() => {
      clearInterval(iv)
      onEnd()
    }, items.length * per + 450)
    return () => {
      clearInterval(iv)
      clearTimeout(t)
    }
    // Nur einmal beim Start
  }, [])
  return (
    <div className="result-grid flipping">
      {items.map((it, i) => (
        <ItemCard key={it.uid} item={it} delay={i * per} />
      ))}
    </div>
  )
}

interface Props {
  caseDef: CaseDef
  items: Item[]
  fast: boolean
  onClose: () => void
  onAgain: () => void
  onSelect: (item: Item) => void
}

type Phase = 'spin' | 'mac' | 'done'

export function Opening({ caseDef, items, fast, onClose, onAgain, onSelect }: Props) {
  const hasMac = items.some((i) => getSkin(i.skinId)?.rarity === 'mac')
  const [phase, setPhase] = useState<Phase>(fast ? (hasMac ? 'mac' : 'done') : 'spin')
  const left = useRef(items.length)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
  const mode = items.length === 1 ? 'single' : items.length <= 10 ? 'multi' : 'grid'

  const best = useMemo(
    () =>
      items.reduce((a, b) => {
        const ra = rarityRank(getSkin(a.skinId)!.rarity)
        const rb = rarityRank(getSkin(b.skinId)!.rarity)
        if (rb !== ra) return rb > ra ? b : a
        return itemValue(b) > itemValue(a) ? b : a
      }),
    [items],
  )

  // Sound beim Ergebnis
  useEffect(() => {
    if (phase === 'done') sound.reveal(getSkin(best.skinId)!.rarity)
    if (phase === 'mac') sound.reveal('mac')
  }, [phase, best])

  const finish = () => setPhase(hasMac ? 'mac' : 'done')
  const stripEnded = () => {
    left.current--
    if (left.current === 0) setTimeout(finish, 450)
  }

  const durations = useMemo(() => items.map(() => (mode === 'single' ? 6000 : 4200 + random() * 900)), [items, mode])

  if (phase === 'mac') return <MacReveal onContinue={() => setPhase('done')} />

  if (phase === 'done') {
    return (
      <ResultPanel
        caseDef={caseDef}
        items={items}
        best={best}
        sorted={mode !== 'grid'}
        onClose={onClose}
        onAgain={onAgain}
        onSelect={onSelect}
      />
    )
  }

  return (
    <div className="opening">
      <div className="opening-head">
        <h2>
          {caseDef.name} {items.length > 1 && <span className="muted">× {items.length}</span>}
        </h2>
        <button type="button" className="btn ghost small" onClick={finish}>
          Überspringen ⏭
        </button>
      </div>
      {mode === 'grid' ? (
        <FlipGrid items={items} onEnd={finish} />
      ) : (
        <div className={`strips ${mode}`}>
          {items.map((it, i) => (
            <Strip
              key={it.uid}
              caseDef={caseDef}
              winner={getSkin(it.skinId)!}
              cardWidth={mode === 'single' ? (isMobile ? 130 : 170) : isMobile ? 84 : 110}
              duration={durations[i]}
              ticking={i === 0}
              onEnd={stripEnded}
            />
          ))}
        </div>
      )}
    </div>
  )
}
