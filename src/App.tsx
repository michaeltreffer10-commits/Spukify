import { useEffect, useRef, useState } from 'react'
import { CasesView } from './components/CasesView'
import { Inventory } from './components/Inventory'
import { ProgressView } from './components/ProgressView'
import { EarnView } from './components/games/EarnView'
import { EVENTS, activeEvent } from './game/progress'
import * as sound from './game/sound'
import { DAILY_BONUS, DAILY_COOLDOWN, formatCoins, useStore } from './game/store'
import type { EventId } from './game/types'

type Tab = 'cases' | 'inventar' | 'verdienen' | 'fortschritt'

const TABS: { id: Tab; label: string; short: string; icon: string }[] = [
  { id: 'cases', label: 'Cases', short: 'Cases', icon: '📦' },
  { id: 'inventar', label: 'Inventar', short: 'Inventar', icon: '🎒' },
  { id: 'verdienen', label: 'Münzen verdienen', short: 'Verdienen', icon: '🎯' },
  { id: 'fortschritt', label: 'Fortschritt', short: 'Fortschritt', icon: '🏆' },
]

/** Wie oft welches Zufalls-Ereignis kommt */
const EVENT_WEIGHTS: [EventId, number][] = [
  ['regen', 30],
  ['glueck', 20],
  ['rabatt', 20],
  ['xp', 15],
  ['haendler', 15],
]

function useNow(interval: number) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(t)
  }, [interval])
  return now
}

function DailyButton() {
  const { state, claimDaily, toast } = useStore()
  const now = useNow(30_000)
  const wait = state.lastDaily + DAILY_COOLDOWN - now
  if (wait > 0) {
    const h = Math.floor(wait / 3_600_000)
    const m = Math.ceil((wait % 3_600_000) / 60_000)
    return (
      <span className="daily wait" title="Der nächste Tagesbonus kommt bald">
        🎁 {h > 0 ? `${h}h ${m}m` : `${m}m`}
      </span>
    )
  }
  return (
    <button
      type="button"
      className="daily ready"
      onClick={() => {
        if (claimDaily()) {
          sound.coin()
          toast(`🎁 Tagesbonus: +${formatCoins(DAILY_BONUS)} Münzen`, 'good')
        }
      }}
    >
      🎁 +{formatCoins(DAILY_BONUS)}
    </button>
  )
}

function EventBanner() {
  const { state } = useStore()
  const now = useNow(1000)
  const ev = state.event
  if (!ev || ev.until <= now || ev.id === 'regen') return null
  const def = EVENTS[ev.id]
  const left = Math.ceil((ev.until - now) / 1000)
  return (
    <div className={`event-banner ev-${ev.id}`}>
      <span className="ev-icon">{def.icon}</span>
      <strong>{def.name}</strong>
      <span className="ev-desc">{def.desc}</span>
      <span className="ev-time">
        {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
      </span>
    </div>
  )
}

interface FallingCoin {
  id: number
  x: number
  dur: number
}

/** Münzregen: fallende Münzen zum Antippen */
function CoinRain() {
  const { state, collectRain } = useStore()
  const [coins, setCoins] = useState<FallingCoin[]>([])
  const [pops, setPops] = useState<{ id: number; x: number; y: number; n: number }[]>([])
  const id = useRef(0)
  const active = state.event?.id === 'regen' && state.event.until > Date.now()

  useEffect(() => {
    if (!active) return
    const t = setInterval(() => {
      const c = { id: ++id.current, x: 4 + Math.random() * 88, dur: 2200 + Math.random() * 1600 }
      setCoins((list) => [...list, c])
      setTimeout(() => setCoins((list) => list.filter((x) => x.id !== c.id)), c.dur)
    }, 180)
    return () => clearInterval(t)
  }, [active])

  if (coins.length === 0 && pops.length === 0) return null
  return (
    <div className="coin-rain">
      {coins.map((c) => (
        <button
          type="button"
          key={c.id}
          className="falling-coin"
          style={{ left: `${c.x}%`, animationDuration: `${c.dur}ms` }}
          onPointerDown={(e) => {
            const n = collectRain()
            sound.coin()
            const p = { id: ++id.current, x: e.clientX, y: e.clientY, n }
            setPops((list) => [...list, p])
            setTimeout(() => setPops((list) => list.filter((x) => x.id !== p.id)), 700)
            setCoins((list) => list.filter((x) => x.id !== c.id))
          }}
          aria-label="Münze einsammeln"
        >
          🪙
        </button>
      ))}
      {pops.map((p) => (
        <span key={p.id} className="coin-pop" style={{ left: p.x, top: p.y }}>
          +{p.n}
        </span>
      ))}
    </div>
  )
}

function Settings({ onClose }: { onClose: () => void }) {
  const { state, setSetting } = useStore()
  const rows: { key: 'sound' | 'meme' | 'voice' | 'fast'; label: string; desc: string }[] = [
    { key: 'sound', label: '🔊 Sounds', desc: 'Alle Geräusche an oder aus' },
    { key: 'meme', label: '📯 Meme-Sounds', desc: 'Airhorn, trauriges Posaunen-Wah-wah, Clown-Hupe' },
    { key: 'voice', label: '🗣️ Sprachansagen', desc: '„Terroristen gewinnen“, „Bombe entschärft“ und mehr' },
    { key: 'fast', label: '⏩ Schnell öffnen', desc: 'Cases ohne Animation öffnen' },
  ]
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Einstellungen">
        <button type="button" className="close" onClick={onClose} aria-label="Schließen">
          ✕
        </button>
        <h2>Einstellungen</h2>
        <div className="settings">
          {rows.map((r) => (
            <label key={r.key} className="setting">
              <span>
                <strong>{r.label}</strong>
                <span className="muted">{r.desc}</span>
              </span>
              <input
                type="checkbox"
                className="switch"
                checked={state[r.key]}
                onChange={(e) => {
                  setSetting(r.key, e.target.checked)
                  if (r.key === 'meme' && e.target.checked) setTimeout(sound.airhorn, 50)
                }}
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

export function App() {
  const { state, level, toasts, dismissToast, startEvent, tickClock } = useStore()
  const [tab, setTab] = useState<Tab>('cases')
  const [settings, setSettings] = useState(false)
  const started = useRef(Date.now())

  // Uhr: abgelaufene Ereignisse beenden, neuer Tag → neue Missionen
  useEffect(() => {
    const t = setInterval(tickClock, 2000)
    return () => clearInterval(t)
  }, [tickClock])

  // Ab und zu ein Zufalls-Ereignis (im Schnitt etwa alle 5–6 Minuten)
  const stateRef = useRef(state)
  stateRef.current = state
  useEffect(() => {
    const t = setInterval(() => {
      const s = stateRef.current
      if (document.visibilityState !== 'visible' || Date.now() - started.current < 60_000) return
      if (s.event && s.event.until > Date.now()) return
      if (Math.random() > 0.07) return
      const total = EVENT_WEIGHTS.reduce((a, [, w]) => a + w, 0)
      let r = Math.random() * total
      for (const [id, w] of EVENT_WEIGHTS) {
        r -= w
        if (r <= 0) {
          startEvent(id)
          break
        }
      }
    }, 20_000)
    return () => clearInterval(t)
  }, [startEvent])

  const go = (t: Tab) => {
    setTab(t)
    window.scrollTo({ top: 0 })
  }

  const claimable = state.missions.list.filter((m) => m.progress >= m.target && !m.claimed).length
  const luck = activeEvent(state, 'glueck')

  return (
    <div className={`app${luck ? ' lucky' : ''}`}>
      <header className="topbar">
        <div className="logo" aria-label="CO3">
          CO<span>3</span>
        </div>
        <nav className="tabs desktop">
          {TABS.map((t) => (
            <button type="button" key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => go(t.id)}>
              {t.icon} {t.label}
              {t.id === 'inventar' && state.items.length > 0 && <span className="badge">{formatCoins(state.items.length)}</span>}
              {t.id === 'fortschritt' && claimable > 0 && <span className="badge">{claimable}</span>}
            </button>
          ))}
        </nav>
        <div className="top-right">
          <button type="button" className="level-chip" onClick={() => go('fortschritt')} title="Level & Missionen">
            Lv {level.level}
          </button>
          <DailyButton />
          <span className="coins" title="Deine Münzen">
            🪙 {formatCoins(state.coins)}
          </span>
          <button type="button" className="icon-btn" onClick={() => setSettings(true)} aria-label="Einstellungen">
            ⚙️
          </button>
        </div>
        <div className="xp-line" title={`${formatCoins(level.into)} / ${formatCoins(level.need)} XP`}>
          <div style={{ width: `${(level.into / level.need) * 100}%` }} />
        </div>
      </header>

      <EventBanner />

      <main className="content">
        {tab === 'cases' && <CasesView />}
        {tab === 'inventar' && <Inventory onGoCases={() => go('cases')} />}
        {tab === 'verdienen' && <EarnView />}
        {tab === 'fortschritt' && <ProgressView />}
      </main>

      <nav className="tabs mobile">
        {TABS.map((t) => (
          <button type="button" key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => go(t.id)}>
            <span className="tab-icon">
              {t.icon}
              {t.id === 'fortschritt' && claimable > 0 && <span className="dot-badge" />}
            </span>
            <span>{t.short}</span>
          </button>
        ))}
      </nav>

      <CoinRain />
      {settings && <Settings onClose={() => setSettings(false)} />}

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`} onClick={() => dismissToast(t.id)}>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  )
}
