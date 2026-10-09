import { useEffect, useState } from 'react'
import { AimGame } from './components/AimGame'
import { CasesView } from './components/CasesView'
import { Inventory } from './components/Inventory'
import { StatsView } from './components/StatsView'
import * as sound from './game/sound'
import { DAILY_BONUS, DAILY_COOLDOWN, formatCoins, useStore } from './game/store'

type Tab = 'cases' | 'inventar' | 'aim' | 'stats'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'cases', label: 'Cases', icon: '📦' },
  { id: 'inventar', label: 'Inventar', icon: '🎒' },
  { id: 'aim', label: 'Münzen verdienen', icon: '🎯' },
  { id: 'stats', label: 'Statistik', icon: '📊' },
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
        🎁 {h > 0 ? `${h} Std. ${m} Min.` : `${m} Min.`}
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

export function App() {
  const { state, setSound, toasts } = useStore()
  const [tab, setTab] = useState<Tab>('cases')

  const go = (t: Tab) => {
    setTab(t)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo" aria-label="CO3">
          CO<span>3</span>
        </div>
        <nav className="tabs desktop">
          {TABS.map((t) => (
            <button type="button" key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => go(t.id)}>
              {t.icon} {t.label}
              {t.id === 'inventar' && state.items.length > 0 && <span className="badge">{formatCoins(state.items.length)}</span>}
            </button>
          ))}
        </nav>
        <div className="top-right">
          <DailyButton />
          <span className="coins" title="Deine Münzen">
            🪙 {formatCoins(state.coins)}
          </span>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setSound(!state.sound)}
            aria-label={state.sound ? 'Ton aus' : 'Ton an'}
          >
            {state.sound ? '🔊' : '🔇'}
          </button>
        </div>
      </header>

      <main className="content">
        {tab === 'cases' && <CasesView />}
        {tab === 'inventar' && <Inventory onGoCases={() => go('cases')} />}
        {tab === 'aim' && <AimGame />}
        {tab === 'stats' && <StatsView />}
      </main>

      <nav className="tabs mobile">
        {TABS.map((t) => (
          <button type="button" key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => go(t.id)}>
            <span className="tab-icon">{t.icon}</span>
            <span>{t.id === 'aim' ? 'Verdienen' : t.label}</span>
          </button>
        ))}
      </nav>

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  )
}
