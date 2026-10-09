import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { getCase, getSkin } from './data'
import type { RarityId } from './data'
import { itemValue, openCase, rarityRank } from './roll'
import type { Item } from './roll'
import { setSoundEnabled } from './sound'

export const START_COINS = 2500
export const DAILY_BONUS = 1000
export const DAILY_COOLDOWN = 24 * 60 * 60 * 1000

export interface Stats {
  opened: number
  spent: number
  /** Münzen aus Verkäufen */
  sold: number
  /** Münzen aus Minispiel und Tagesbonus */
  earned: number
  drops: Record<RarityId, number>
  best?: { skinId: string; float: number; value: number }
  aimBest: number
  /** Wie oft die MAC-10 verkauft wurde 💀 */
  macSold: number
}

export interface SaveState {
  coins: number
  items: Item[]
  lastDaily: number
  sound: boolean
  fast: boolean
  stats: Stats
}

const KEY = 'co3-save-v1'

function freshState(): SaveState {
  return {
    coins: START_COINS,
    items: [],
    lastDaily: 0,
    sound: true,
    fast: false,
    stats: {
      opened: 0,
      spent: 0,
      sold: 0,
      earned: 0,
      drops: { blau: 0, lila: 0, pink: 0, rot: 0, gold: 0, mac: 0 },
      aimBest: 0,
      macSold: 0,
    },
  }
}

function load(): SaveState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return freshState()
    const saved = JSON.parse(raw) as Partial<SaveState>
    const base = freshState()
    return {
      ...base,
      ...saved,
      items: (saved.items ?? []).filter((i) => getSkin(i.skinId)),
      stats: { ...base.stats, ...saved.stats, drops: { ...base.stats.drops, ...saved.stats?.drops } },
    }
  } catch {
    return freshState()
  }
}

export interface Toast {
  id: number
  text: string
  kind: 'info' | 'good' | 'bad' | 'mac'
}

interface Store {
  state: SaveState
  /** Öffnet `count` Cases. Gibt die gezogenen Gegenstände zurück, oder null bei zu wenig Münzen. */
  open: (caseId: string, count: number) => Item[] | null
  /** Verkauft Gegenstände und gibt die Münzen zurück */
  sell: (uids: string[]) => number
  earn: (amount: number) => void
  setAimBest: (score: number) => void
  claimDaily: () => boolean
  setSound: (on: boolean) => void
  setFast: (on: boolean) => void
  reset: () => void
  toasts: Toast[]
  toast: (text: string, kind?: Toast['kind'], ms?: number) => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SaveState>(load)
  const ref = useRef(state)
  ref.current = state

  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(state))
      } catch {
        // Speicher voll oder gesperrt – dann eben ohne Speichern weiterspielen.
      }
    }, 250)
    return () => clearTimeout(t)
  }, [state])

  useEffect(() => setSoundEnabled(state.sound), [state.sound])

  const update = useCallback((fn: (s: SaveState) => SaveState) => {
    ref.current = fn(ref.current)
    setState(ref.current)
  }, [])

  const toast = useCallback((text: string, kind: Toast['kind'] = 'info', ms = 3500) => {
    const id = ++toastId.current
    setToasts((t) => [...t, { id, text, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ms)
  }, [])

  const open = useCallback(
    (caseId: string, count: number) => {
      const c = getCase(caseId)
      if (!c) return null
      const cost = c.price * count
      if (ref.current.coins < cost) return null
      const items = Array.from({ length: count }, () => openCase(c))
      update((s) => {
        const drops = { ...s.stats.drops }
        let best = s.stats.best
        for (const it of items) {
          const skin = getSkin(it.skinId)!
          drops[skin.rarity]++
          const value = itemValue(it)
          const bestSkin = best && getSkin(best.skinId)
          if (
            !best ||
            !bestSkin ||
            rarityRank(skin.rarity) > rarityRank(bestSkin.rarity) ||
            (skin.rarity === bestSkin.rarity && value > best.value)
          ) {
            best = { skinId: it.skinId, float: it.float, value }
          }
        }
        return {
          ...s,
          coins: s.coins - cost,
          items: [...items, ...s.items],
          stats: { ...s.stats, opened: s.stats.opened + count, spent: s.stats.spent + cost, drops, best },
        }
      })
      return items
    },
    [update],
  )

  const sell = useCallback(
    (uids: string[]) => {
      const set = new Set(uids)
      const sold = ref.current.items.filter((i) => set.has(i.uid))
      if (sold.length === 0) return 0
      const total = sold.reduce((sum, i) => sum + itemValue(i), 0)
      const macs = sold.filter((i) => getSkin(i.skinId)?.rarity === 'mac').length
      update((s) => ({
        ...s,
        coins: s.coins + total,
        items: s.items.filter((i) => !set.has(i.uid)),
        stats: { ...s.stats, sold: s.stats.sold + total, macSold: s.stats.macSold + macs },
      }))
      return total
    },
    [update],
  )

  const earn = useCallback(
    (amount: number) => update((s) => ({ ...s, coins: s.coins + amount, stats: { ...s.stats, earned: s.stats.earned + amount } })),
    [update],
  )

  const setAimBest = useCallback(
    (score: number) => update((s) => (score > s.stats.aimBest ? { ...s, stats: { ...s.stats, aimBest: score } } : s)),
    [update],
  )

  const claimDaily = useCallback(() => {
    if (Date.now() - ref.current.lastDaily < DAILY_COOLDOWN) return false
    update((s) => ({
      ...s,
      coins: s.coins + DAILY_BONUS,
      lastDaily: Date.now(),
      stats: { ...s.stats, earned: s.stats.earned + DAILY_BONUS },
    }))
    return true
  }, [update])

  const setSound = useCallback((on: boolean) => update((s) => ({ ...s, sound: on })), [update])
  const setFast = useCallback((on: boolean) => update((s) => ({ ...s, fast: on })), [update])
  const reset = useCallback(() => update(() => freshState()), [update])

  const value = useMemo<Store>(
    () => ({ state, open, sell, earn, setAimBest, claimDaily, setSound, setFast, reset, toasts, toast }),
    [state, open, sell, earn, setAimBest, claimDaily, setSound, setFast, reset, toasts, toast],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore außerhalb des StoreProvider')
  return s
}

export function formatCoins(n: number): string {
  return n.toLocaleString('de-DE')
}
