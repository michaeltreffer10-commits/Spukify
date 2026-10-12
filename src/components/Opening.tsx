import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { RARITIES, getSkin } from '../game/data'
import type { CaseDef, RarityId } from '../game/data'
import { fillerSkin, fillerSticker, itemValue, random, rarityRank, stickerValue } from '../game/roll'
import type { Item, StickerItem } from '../game/roll'
import * as sound from '../game/sound'
import { capsuleLabel, getSticker } from '../game/stickers'
import type { CapsuleDef, StickerDef } from '../game/stickers'
import { useStore } from '../game/store'
import { Case3D } from '../three/lazy'
import { ItemCard, StickerCard, StickerStripCard, StripCard } from './ItemCard'
import { MacReveal } from './MacReveal'
import { TitanReveal } from './TitanReveal'
import { ResultPanel, StickerResults } from './ResultPanel'
import { CapsuleArt, CaseArt } from './WeaponArt'

export type Run =
  | { kind: 'case'; caseDef: CaseDef; items: Item[]; cost: number; key: number }
  | { kind: 'capsule'; capsule: CapsuleDef; stickers: StickerItem[]; cost: number; key: number }

const STRIP_LENGTH = 62
const WIN_INDEX = 52
const GAP = 4

interface Card {
  rarity: RarityId
  node: ReactNode
}

interface StripProps {
  cards: Card[]
  cardWidth: number
  duration: number
  ticking: boolean
  blur: boolean
  onEnd: () => void
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 4.5)

/** Ein Band, das durchläuft und wie in CS2 langsam ausrollt */
function Strip({ cards, cardWidth, duration, ticking, blur, onEnd }: StripProps) {
  const box = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const marker = useRef<HTMLDivElement>(null)
  const [done, setDone] = useState(false)
  const endRef = useRef(onEnd)
  endRef.current = onEnd

  useEffect(() => {
    const el = box.current
    const tr = track.current
    if (!el || !tr) return
    const step = cardWidth + GAP
    const half = el.clientWidth / 2
    const target = WIN_INDEX * step + cardWidth * (0.06 + random() * 0.88) - half
    const start = performance.now()
    let lastIndex = -1
    let lastX = 0
    let frame = 0
    if (ticking) sound.whoosh()
    const loop = (now: number) => {
      const t = now - start
      const x = target * easeOut(Math.min(1, t / duration))
      tr.style.transform = `translate3d(${-x}px,0,0)`
      if (blur) {
        const speed = Math.abs(x - lastX)
        tr.style.filter = speed > 6 ? `blur(${Math.min(4, speed / 10).toFixed(1)}px)` : ''
      }
      lastX = x
      const index = Math.floor((x + half) / step)
      if (index !== lastIndex) {
        if (ticking && lastIndex !== -1) sound.tick()
        lastIndex = index
        const card = cards[index]
        if (marker.current && card) marker.current.style.setProperty('--mc', RARITIES[card.rarity].color)
      }
      if (t < duration) frame = requestAnimationFrame(loop)
      else {
        tr.style.filter = ''
        setDone(true)
        endRef.current()
      }
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [cardWidth, duration, ticking, blur, cards])

  return (
    <div className={`strip${done ? ' done' : ''}`} ref={box}>
      <div className="strip-track" ref={track} style={{ gap: GAP }}>
        {cards.map((c, i) => (
          <div key={i} className={i === WIN_INDEX && done ? 'win' : undefined} style={{ '--rc': RARITIES[c.rarity].color } as CSSProperties}>
            {c.node}
          </div>
        ))}
      </div>
      <div className="strip-marker" ref={marker} />
    </div>
  )
}

/** Baut die Karten für ein Band: Füller, der Gewinn und manchmal ein fieser Beinahe-Treffer */
function buildCards(win: Card, filler: () => Card, tease: () => Card): Card[] {
  const list = Array.from({ length: STRIP_LENGTH }, filler)
  list[WIN_INDEX] = win
  const winRank = rarityRank(win.rarity)
  if (winRank < rarityRank('rot') && random() < 0.35) list[WIN_INDEX + (random() < 0.5 ? 1 : -1)] = tease()
  return list
}

/** Bei vielen auf einmal: alle Karten drehen sich nacheinander um */
function FlipGrid({ children, count, onEnd }: { children: ReactNode; count: number; onEnd: () => void }) {
  const per = Math.max(12, Math.min(30, 2500 / count))
  const endRef = useRef(onEnd)
  endRef.current = onEnd
  useEffect(() => {
    const iv = setInterval(sound.tick, per)
    const t = setTimeout(() => {
      clearInterval(iv)
      endRef.current()
    }, count * per + 450)
    return () => {
      clearInterval(iv)
      clearTimeout(t)
    }
  }, [count, per])
  return <div className="result-grid flipping" style={{ '--per': `${per}ms` } as CSSProperties}>{children}</div>
}

/** Kapsel: aufbrechen per Leertaste/Tippen oder automatisch */
function CapsuleGate({ capsule, count, spam, onDone }: { capsule: CapsuleDef; count: number; spam: boolean; onDone: () => void }) {
  const [charge, setCharge] = useState(0)
  const [kick, setKick] = useState(0)
  const [popped, setPopped] = useState(false)
  const chargeRef = useRef(0)
  const lastHit = useRef(0)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  const finish = () => {
    if (popped) return
    setPopped(true)
    sound.caseOpen()
    setTimeout(() => doneRef.current(), 450)
  }
  const finishRef = useRef(finish)
  finishRef.current = finish

  const hit = (touch = false) => {
    if (!spam || popped) return
    lastHit.current = performance.now()
    chargeRef.current = Math.min(1, chargeRef.current + (touch ? 0.12 : 0.095))
    setCharge(chargeRef.current)
    setKick((k) => k + 1)
    sound.caseHit(chargeRef.current)
    if (chargeRef.current >= 1) finishRef.current()
  }
  const hitRef = useRef(hit)
  hitRef.current = hit

  useEffect(() => {
    if (!spam) {
      let k = 0
      const iv = setInterval(() => {
        k += 0.1
        setCharge(Math.min(1, k))
        setKick((x) => x + 1)
        sound.caseRattle(k)
        if (k >= 1) {
          clearInterval(iv)
          finishRef.current()
        }
      }, 100)
      return () => clearInterval(iv)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ') return
      e.preventDefault()
      hitRef.current()
    }
    window.addEventListener('keydown', onKey)
    const decay = setInterval(() => {
      if (chargeRef.current <= 0 || performance.now() - lastHit.current < 600) return
      chargeRef.current = Math.max(0, chargeRef.current - 0.012)
      setCharge(chargeRef.current)
    }, 100)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearInterval(decay)
    }
  }, [spam])

  const touch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  const angle = (kick % 2 ? 1 : -1) * (2 + charge * 8)
  return (
    <div className="case3d capsule-gate" onPointerDown={(e) => hitRef.current(e.pointerType === 'touch')}>
      <div className={`capsule-shake${popped ? ' popped' : ''}`} style={{ transform: popped ? undefined : `rotate(${angle}deg) scale(${1 + charge * 0.15})` }}>
        <CapsuleArt colors={capsule.colors} label={count > 1 ? `× ${count}` : capsuleLabel(capsule)} className="capsule-big" />
      </div>
      <div className="capsule-glow" style={{ opacity: charge, background: `radial-gradient(circle, ${capsule.colors[1]}, transparent 60%)` }} />
      {spam && !popped && (
        <div className="spam-ui">
          <p className="spam-hint">{touch ? 'TIPPEN, TIPPEN, TIPPEN!' : 'LEERTASTE SPAMMEN!'}</p>
          <div className="spam-bar">
            <div style={{ width: `${charge * 100}%` }} />
          </div>
        </div>
      )}
      {popped && <div className="case3d-flash pop" />}
    </div>
  )
}

interface Props {
  run: Run
  fast: boolean
  spam: boolean
  onClose: () => void
  onAgain: () => void
  onSelect: (item: Item) => void
  onSelectSticker: (s: StickerItem) => void
}

type Phase = 'gate' | 'spin' | 'mac' | 'done'

export function Opening({ run, fast, spam, onClose, onAgain, onSelect, onSelectSticker }: Props) {
  const { state, releaseNews } = useStore()
  const isCase = run.kind === 'case'
  const count = isCase ? run.items.length : run.stickers.length
  const hasMac = isCase
    ? run.items.some((i) => getSkin(i.skinId)?.rarity === 'mac')
    : run.stickers.some((x) => getSticker(x.stickerId)?.special)
  const [phase, setPhase] = useState<Phase>(fast ? (hasMac ? 'mac' : 'done') : 'gate')
  const left = useRef(count)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
  const mode = count === 1 ? 'single' : count <= 10 ? 'multi' : 'grid'

  /** Seltenheit jedes Gewinns, in Reihenfolge */
  const winRarities: RarityId[] = useMemo(
    () => (isCase ? run.items.map((i) => getSkin(i.skinId)!.rarity) : run.stickers.map((x) => getSticker(x.stickerId)!.rarity)),
    [run, isCase],
  )

  const bestRarity = winRarities.reduce((a, b) => (rarityRank(b) > rarityRank(a) ? b : a))

  // Ergebnis-Sound, Meldungen und Meme-Sounds erst, wenn alles aufgedeckt ist
  const revealed = useRef(false)
  const blueStreak = state.stats.blueStreak
  const coins = state.coins
  useEffect(() => {
    if (phase === 'mac' && isCase) sound.reveal('mac')
    if ((phase !== 'done' && phase !== 'mac') || revealed.current) return
    revealed.current = true
    if (phase === 'done') sound.reveal(bestRarity)
    releaseNews()
    if (bestRarity === 'mac') {
      // Beim Titan läuft der Schrei schon in der Titan-Show
      if (isCase) {
        sound.airhorn()
        sound.speak('Nicht verkaufen! Niemals!')
      }
    } else if (bestRarity === 'gold') {
      setTimeout(sound.airhorn, 400)
      sound.speak('Was?! Ein Messer! Kein Witz!', 1.2)
    } else if (bestRarity === 'rot') {
      sound.speak(isCase ? 'Verdeckt! Wie geil!' : 'Gold-Sticker! Wie geil!')
    } else if (isCase && bestRarity === 'blau' && Math.floor(blueStreak / 10) > Math.floor((blueStreak - count) / 10)) {
      setTimeout(sound.sadTrombone, 500)
    } else if (coins < 100) {
      setTimeout(sound.sadTrombone, 500)
    }
  }, [phase, bestRarity, releaseNews, blueStreak, coins, count, isCase])

  // Falls man vorher wegklickt, die Meldungen trotzdem zeigen
  useEffect(() => () => releaseNews(), [releaseNews])

  const finish = () => setPhase(hasMac ? 'mac' : 'done')
  const stripEnded = () => {
    left.current--
    if (left.current === 0) setTimeout(finish, 650)
  }

  const cardWidth = mode === 'single' ? (isMobile ? 130 : 170) : isMobile ? 84 : 110
  const durations = useMemo(() => Array.from({ length: count }, () => (mode === 'single' ? 6800 : 4400 + random() * 900)), [count, mode])

  // Die Karten aller Bänder (einmal pro Öffnen)
  const strips = useMemo(() => {
    if (mode === 'grid') return []
    if (run.kind === 'case') {
      const c = run.caseDef
      const skinCard = (s: ReturnType<typeof fillerSkin>): Card => ({ rarity: s.rarity, node: <StripCard skin={s} width={cardWidth} /> })
      const goldSkins = c.skins.filter((s) => s.rarity === 'gold')
      return run.items.map((it) =>
        buildCards(
          skinCard(getSkin(it.skinId)!),
          () => skinCard(fillerSkin(c)),
          () => skinCard(goldSkins[Math.floor(random() * goldSkins.length)]),
        ),
      )
    }
    const cap = run.capsule
    const stCard = (s: StickerDef): Card => ({ rarity: s.rarity, node: <StickerStripCard sticker={s} width={cardWidth} /> })
    const golds = cap.stickers.filter((s) => s.finish === 'gold')
    return run.stickers.map((x) =>
      buildCards(
        stCard(getSticker(x.stickerId)!),
        () => stCard(fillerSticker(cap)),
        () => stCard(golds[Math.floor(random() * golds.length)] ?? fillerSticker(cap)),
      ),
    )
  }, [run, mode, cardWidth])

  if (phase === 'mac')
    return isCase ? <MacReveal onContinue={() => setPhase('done')} /> : <TitanReveal onContinue={() => setPhase('done')} />

  if (phase === 'done') {
    if (run.kind === 'case') {
      const best = run.items.reduce((a, b) => {
        const ra = rarityRank(getSkin(a.skinId)!.rarity)
        const rb = rarityRank(getSkin(b.skinId)!.rarity)
        if (rb !== ra) return rb > ra ? b : a
        return itemValue(b) > itemValue(a) ? b : a
      })
      return (
        <ResultPanel
          caseDef={run.caseDef}
          items={run.items}
          cost={run.cost}
          best={best}
          sorted={mode !== 'grid'}
          onClose={onClose}
          onAgain={onAgain}
          onSelect={onSelect}
        />
      )
    }
    const bestSticker = run.stickers.reduce((a, b) => (stickerValue(b) > stickerValue(a) ? b : a))
    return (
      <StickerResults
        capsule={run.capsule}
        stickers={run.stickers}
        best={bestSticker}
        cost={run.cost}
        onClose={onClose}
        onAgain={onAgain}
        onSelect={onSelectSticker}
      />
    )
  }

  const title = isCase ? run.caseDef.name : run.capsule.name

  return (
    <div className="opening">
      <div className="opening-head">
        <h2>
          {title} {count > 1 && <span className="muted">× {count}</span>}
        </h2>
        <button type="button" className="btn ghost small" onClick={finish}>
          Überspringen ⏭
        </button>
      </div>
      {phase === 'gate' ? (
        run.kind === 'case' ? (
          <Suspense
            fallback={
              <div className="case3d">
                <CaseArt colors={run.caseDef.colors} label={run.caseDef.name.replace('-Case', '').toUpperCase()} className="case-fallback" />
              </div>
            }
          >
            <Case3D caseDef={run.caseDef} count={count} spam={spam} onDone={() => setPhase('spin')} />
          </Suspense>
        ) : (
          <CapsuleGate capsule={run.capsule} count={count} spam={spam} onDone={() => setPhase('spin')} />
        )
      ) : mode === 'grid' ? (
        <FlipGrid count={count} onEnd={finish}>
          {run.kind === 'case'
            ? run.items.map((it, i) => <ItemCard key={it.uid} item={it} delay={i * Math.max(12, Math.min(30, 2500 / count))} />)
            : run.stickers.map((x, i) => <StickerCard key={x.uid} item={x} delay={i * Math.max(12, Math.min(30, 2500 / count))} />)}
        </FlipGrid>
      ) : (
        <div className={`strips ${mode}`}>
          {strips.map((cards, i) => (
            <Strip
              key={i}
              cards={cards}
              cardWidth={cardWidth}
              duration={durations[i]}
              ticking={i === 0}
              blur={mode === 'single'}
              onEnd={stripEnded}
            />
          ))}
        </div>
      )}
    </div>
  )
}
