import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CASES, getCase, getSkin } from './data'
import type { CaseDef, RarityId } from './data'
import {
  ACHIEVEMENTS,
  CASE_DISCOUNT,
  EVENTS,
  MISSION_BONUS,
  SELL_BONUS,
  activeEvent,
  albumProgress,
  albumRewards,
  dayKey,
  gameBonus,
  levelInfo,
  levelReward,
  missionText,
  missionsFor,
  xpForCase,
} from './progress'
import type { Achievement } from './progress'
import { itemValue, openCase, rarityRank } from './roll'
import type { Item } from './roll'
import * as sound from './sound'
import type { EventId, GameId, Mission, MissionType, SaveState, Stats } from './types'

export type { SaveState, Stats } from './types'

export const START_COINS = 2500
export const DAILY_BONUS = 1000
export const DAILY_COOLDOWN = 24 * 60 * 60 * 1000
export const RAIN_COIN = 25

const KEY = 'co3-save-v1'

function freshStats(): Stats {
  return {
    opened: 0,
    spent: 0,
    sold: 0,
    soldCount: 0,
    earned: 0,
    drops: { blau: 0, lila: 0, pink: 0, rot: 0, gold: 0, mac: 0 },
    macSold: 0,
    blueStreak: 0,
    bestBlueStreak: 0,
    games: 0,
    gameCoins: 0,
    gameBest: { aim: 0, bomb: 0, reaction: 0, headshot: 0 },
    aimHitsBest: 0,
    bombsDefused: 0,
    bombsExploded: 0,
    headshots: 0,
    hostages: 0,
    bestReaction: 0,
    earlyClicks: 0,
    bulk100: 0,
    lowFloat: 1,
    highFloat: 0,
    events: 0,
    dailies: 0,
    missionsDone: 0,
    wasBroke: false,
  }
}

function freshState(): SaveState {
  const day = dayKey()
  return {
    coins: START_COINS,
    items: [],
    lastDaily: 0,
    sound: true,
    meme: true,
    voice: true,
    fast: false,
    xp: 0,
    freeCases: {},
    album: {},
    albumClaimed: [],
    achievements: {},
    missions: { day, list: missionsFor(day), bonusClaimed: false },
    event: null,
    stats: freshStats(),
  }
}

/** Neuer Tag → neue Missionen */
function withToday(s: SaveState): SaveState {
  const day = dayKey()
  if (s.missions.day === day) return s
  return { ...s, missions: { day, list: missionsFor(day), bonusClaimed: false } }
}

function load(): SaveState {
  const base = freshState()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return base
    const saved = JSON.parse(raw) as Partial<SaveState> & { stats?: Partial<Stats> & { aimBest?: number } }
    const items = (saved.items ?? []).filter((i) => getSkin(i.skinId))
    const stats: Stats = {
      ...base.stats,
      ...saved.stats,
      drops: { ...base.stats.drops, ...saved.stats?.drops },
      gameBest: { ...base.stats.gameBest, ...saved.stats?.gameBest },
    }
    // Spielstände aus Version 1 übernehmen
    if (saved.stats?.aimBest && !saved.stats.gameBest) stats.gameBest.aim = saved.stats.aimBest
    let album = saved.album
    if (!album) {
      album = {}
      for (const i of items) album[i.skinId] = (album[i.skinId] ?? 0) + 1
    }
    return withToday({
      ...base,
      ...saved,
      items,
      album,
      stats,
      missions: saved.missions ?? base.missions,
    })
  } catch {
    return base
  }
}

export type News =
  | { kind: 'level'; level: number; coins: number; caseId: string }
  | { kind: 'ach'; ach: Achievement }
  | { kind: 'mission'; mission: Mission }

/** Prüft nach jeder Änderung: Level-Ups, erfüllte Missionen, neue Erfolge */
function finalize(prev: SaveState, next: SaveState): { state: SaveState; news: News[] } {
  const news: News[] = []
  let s = next

  const before = levelInfo(prev.xp).level
  const after = levelInfo(s.xp).level
  for (let l = before + 1; l <= after; l++) {
    const r = levelReward(l)
    s = {
      ...s,
      coins: s.coins + r.coins,
      freeCases: { ...s.freeCases, [r.caseId]: (s.freeCases[r.caseId] ?? 0) + 1 },
      stats: { ...s.stats, earned: s.stats.earned + r.coins },
    }
    news.push({ kind: 'level', level: l, ...r })
  }

  const prevDone = new Set(prev.missions.list.filter((m) => m.progress >= m.target).map((m) => m.id))
  for (const m of s.missions.list) if (m.progress >= m.target && !prevDone.has(m.id)) news.push({ kind: 'mission', mission: m })

  if (s.coins < 10 && !s.stats.wasBroke) s = { ...s, stats: { ...s.stats, wasBroke: true } }

  for (let pass = 0; pass < 3; pass++) {
    let changed = false
    for (const a of ACHIEVEMENTS) {
      if (s.achievements[a.id] || !a.check(s)) continue
      s = {
        ...s,
        coins: s.coins + a.reward,
        achievements: { ...s.achievements, [a.id]: Date.now() },
        stats: { ...s.stats, earned: s.stats.earned + a.reward },
      }
      news.push({ kind: 'ach', ach: a })
      changed = true
    }
    if (!changed) break
  }
  return { state: s, news }
}

function bump(list: Mission[], type: MissionType, amount: number): Mission[] {
  if (amount <= 0) return list
  return list.map((m) => (m.type === type && !m.claimed ? { ...m, progress: Math.min(m.target, m.progress + amount) } : m))
}

export interface Toast {
  id: number
  text: string
  kind: 'info' | 'good' | 'bad' | 'mac' | 'level' | 'ach' | 'event'
}

export interface GameResult {
  hits?: number
  headshots?: number
  hostages?: number
  defused?: boolean
  exploded?: boolean
  reactionMs?: number
  early?: number
}

type Setting = 'sound' | 'meme' | 'voice' | 'fast'

interface Store {
  state: SaveState
  level: { level: number; into: number; need: number }
  /** Preis eines Cases (mit Rabatt-Ereignis) */
  casePrice: (c: CaseDef) => number
  /** Öffnet Cases. Meldungen (Erfolge usw.) kommen erst mit releaseNews(), damit nichts verraten wird. */
  open: (caseId: string, count: number, free?: boolean) => { items: Item[]; cost: number } | null
  releaseNews: () => void
  sell: (uids: string[]) => number
  /** Ergebnis eines Minispiels eintragen. Gibt die gutgeschriebenen Münzen zurück (mit Level-Bonus). */
  playedGame: (game: GameId, coins: number, result?: GameResult) => number
  claimDaily: () => boolean
  claimMission: (id: string) => void
  claimMissionBonus: () => void
  claimAlbum: (caseId: string, kind: 'base' | 'full') => void
  collectRain: () => number
  startEvent: (id: EventId) => void
  tickClock: () => void
  setSetting: (key: Setting, on: boolean) => void
  reset: () => void
  toasts: Toast[]
  toast: (text: string, kind?: Toast['kind'], ms?: number) => void
  dismissToast: (id: number) => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SaveState>(load)
  const ref = useRef(state)
  const pending = useRef<News[]>([])
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

  useEffect(() => {
    sound.configureSound({ sound: state.sound, meme: state.meme, voice: state.voice })
  }, [state.sound, state.meme, state.voice])

  const toast = useCallback((text: string, kind: Toast['kind'] = 'info', ms = 3500) => {
    const id = ++toastId.current
    setToasts((t) => [...t.slice(-4), { id, text, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ms)
  }, [])

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const announce = useCallback(
    (news: News[]) => {
      news.forEach((n, i) => {
        setTimeout(() => {
          if (n.kind === 'level') {
            sound.levelUp()
            toast(
              `⬆️ LEVEL ${n.level}! +${formatCoins(n.coins)} Münzen und ein gratis ${getCase(n.caseId)?.name ?? 'Case'}`,
              'level',
              6000,
            )
          } else if (n.kind === 'ach') {
            sound.achievement()
            toast(`${n.ach.icon} Erfolg: ${n.ach.name} (+${formatCoins(n.ach.reward)})`, 'ach', 5000)
          } else {
            toast(`✅ Mission erfüllt: ${missionText(n.mission)} – jetzt abholen!`, 'good', 5000)
          }
        }, i * 900)
      })
    },
    [toast],
  )

  /** Übernimmt einen neuen Spielstand und prüft Level, Missionen und Erfolge */
  const commit = useCallback(
    (next: SaveState, defer = false) => {
      const prev = ref.current
      const { state: done, news } = finalize(prev, withToday(next))
      ref.current = done
      setState(done)
      if (defer) pending.current.push(...news)
      else announce(news)
    },
    [announce],
  )

  const releaseNews = useCallback(() => {
    const news = pending.current
    pending.current = []
    announce(news)
  }, [announce])

  const xpMult = (s: SaveState) => (activeEvent(s, 'xp') ? 2 : 1)

  const casePrice = useCallback(
    (c: CaseDef) => (activeEvent(ref.current, 'rabatt') ? Math.round(c.price * CASE_DISCOUNT) : c.price),
    [state.event],
  )

  const open = useCallback(
    (caseId: string, count: number, free = false) => {
      const c = getCase(caseId)
      if (!c) return null
      const s = ref.current
      const useFree = free && (s.freeCases[caseId] ?? 0) >= count
      const cost = useFree ? 0 : casePrice(c) * count
      if (s.coins < cost) return null
      const luck = activeEvent(s, 'glueck') ? 2 : 1
      const items = Array.from({ length: count }, () => openCase(c, luck))

      const stats = { ...s.stats, drops: { ...s.stats.drops } }
      const album = { ...s.album }
      let rare = 0
      for (const it of items) {
        const skin = getSkin(it.skinId)!
        stats.drops[skin.rarity]++
        album[skin.id] = (album[skin.id] ?? 0) + 1
        if (skin.rarity === 'blau') {
          stats.blueStreak++
          stats.bestBlueStreak = Math.max(stats.bestBlueStreak, stats.blueStreak)
        } else {
          stats.blueStreak = 0
          rare++
        }
        stats.lowFloat = Math.min(stats.lowFloat, it.float)
        stats.highFloat = Math.max(stats.highFloat, it.float)
        const value = itemValue(it)
        const bestSkin = stats.best && getSkin(stats.best.skinId)
        if (
          !stats.best ||
          !bestSkin ||
          rarityRank(skin.rarity) > rarityRank(bestSkin.rarity) ||
          (skin.rarity === bestSkin.rarity && value > stats.best.value)
        ) {
          stats.best = { skinId: it.skinId, float: it.float, value }
        }
      }
      stats.opened += count
      stats.spent += cost
      if (count >= 100) stats.bulk100++

      let missions = bump(s.missions.list, 'open', count)
      missions = bump(missions, 'rare', rare)

      commit(
        {
          ...s,
          coins: s.coins - cost,
          items: [...items, ...s.items],
          album,
          xp: s.xp + xpForCase(c) * count * xpMult(s),
          freeCases: useFree ? { ...s.freeCases, [caseId]: s.freeCases[caseId] - count } : s.freeCases,
          missions: { ...s.missions, list: missions },
          stats,
        },
        true,
      )
      return { items, cost }
    },
    [commit, casePrice],
  )

  const sell = useCallback(
    (uids: string[]) => {
      const s = ref.current
      const set = new Set(uids)
      const sold = s.items.filter((i) => set.has(i.uid))
      if (sold.length === 0) return 0
      const mult = activeEvent(s, 'haendler') ? SELL_BONUS : 1
      const total = Math.round(sold.reduce((sum, i) => sum + itemValue(i), 0) * mult)
      const macs = sold.filter((i) => getSkin(i.skinId)?.rarity === 'mac').length
      commit({
        ...s,
        coins: s.coins + total,
        items: s.items.filter((i) => !set.has(i.uid)),
        missions: { ...s.missions, list: bump(s.missions.list, 'sell', sold.length) },
        stats: {
          ...s.stats,
          sold: s.stats.sold + total,
          soldCount: s.stats.soldCount + sold.length,
          macSold: s.stats.macSold + macs,
        },
      })
      return total
    },
    [commit],
  )

  const playedGame = useCallback(
    (game: GameId, coins: number, r: GameResult = {}) => {
      const s = ref.current
      const lvl = levelInfo(s.xp).level
      const credited = Math.round(coins * (1 + gameBonus(lvl)))
      let missions = bump(s.missions.list, 'games', 1)
      missions = bump(missions, 'gameCoins', credited)
      missions = bump(missions, 'bomb', r.defused ? 1 : 0)
      missions = bump(missions, 'headshots', r.headshots ?? 0)
      missions = bump(missions, 'aimHits', game === 'aim' ? (r.hits ?? 0) : 0)
      if (r.reactionMs) {
        missions = missions.map((m) =>
          m.type === 'reaction' && !m.claimed && m.param && r.reactionMs! < m.param ? { ...m, progress: 1 } : m,
        )
      }
      const st = s.stats
      commit({
        ...s,
        coins: s.coins + credited,
        xp: s.xp + (10 + Math.round(credited / 4)) * xpMult(s),
        missions: { ...s.missions, list: missions },
        stats: {
          ...st,
          earned: st.earned + credited,
          games: st.games + 1,
          gameCoins: st.gameCoins + credited,
          gameBest: { ...st.gameBest, [game]: Math.max(st.gameBest[game], credited) },
          aimHitsBest: game === 'aim' ? Math.max(st.aimHitsBest, r.hits ?? 0) : st.aimHitsBest,
          bombsDefused: st.bombsDefused + (r.defused ? 1 : 0),
          bombsExploded: st.bombsExploded + (r.exploded ? 1 : 0),
          headshots: st.headshots + (r.headshots ?? 0),
          hostages: st.hostages + (r.hostages ?? 0),
          bestReaction: r.reactionMs && (st.bestReaction === 0 || r.reactionMs < st.bestReaction) ? r.reactionMs : st.bestReaction,
          earlyClicks: st.earlyClicks + (r.early ?? 0),
        },
      })
      return credited
    },
    [commit],
  )

  const claimDaily = useCallback(() => {
    const s = ref.current
    if (Date.now() - s.lastDaily < DAILY_COOLDOWN) return false
    commit({
      ...s,
      coins: s.coins + DAILY_BONUS,
      lastDaily: Date.now(),
      stats: { ...s.stats, earned: s.stats.earned + DAILY_BONUS, dailies: s.stats.dailies + 1 },
    })
    return true
  }, [commit])

  const claimMission = useCallback(
    (id: string) => {
      const s = ref.current
      const m = s.missions.list.find((x) => x.id === id)
      if (!m || m.claimed || m.progress < m.target) return
      sound.coin()
      commit({
        ...s,
        coins: s.coins + m.reward,
        xp: s.xp + m.xp * xpMult(s),
        missions: { ...s.missions, list: s.missions.list.map((x) => (x.id === id ? { ...x, claimed: true } : x)) },
        stats: { ...s.stats, earned: s.stats.earned + m.reward, missionsDone: s.stats.missionsDone + 1 },
      })
      toast(`+${formatCoins(m.reward)} Münzen · +${formatCoins(m.xp)} XP`, 'good')
    },
    [commit, toast],
  )

  const claimMissionBonus = useCallback(() => {
    const s = ref.current
    if (s.missions.bonusClaimed || !s.missions.list.every((m) => m.claimed)) return
    sound.coin()
    commit({
      ...s,
      coins: s.coins + MISSION_BONUS.coins,
      freeCases: { ...s.freeCases, [MISSION_BONUS.caseId]: (s.freeCases[MISSION_BONUS.caseId] ?? 0) + 1 },
      missions: { ...s.missions, bonusClaimed: true },
      stats: { ...s.stats, earned: s.stats.earned + MISSION_BONUS.coins },
    })
    toast(`🎁 Tagesbonus für alle Missionen: +${formatCoins(MISSION_BONUS.coins)} und ein gratis Neon-Case!`, 'level', 5000)
  }, [commit, toast])

  const claimAlbum = useCallback(
    (caseId: string, kind: 'base' | 'full') => {
      const s = ref.current
      const c = getCase(caseId)
      const key = `${caseId}:${kind}`
      if (!c || s.albumClaimed.includes(key)) return
      const p = albumProgress(s, c)
      const complete = p.baseHave === p.baseTotal && (kind === 'base' || p.goldHave === p.goldTotal)
      if (!complete) return
      const reward = albumRewards(c)[kind]
      sound.levelUp()
      commit({
        ...s,
        coins: s.coins + reward,
        albumClaimed: [...s.albumClaimed, key],
        stats: { ...s.stats, earned: s.stats.earned + reward },
      })
      toast(`📒 Album-Belohnung: +${formatCoins(reward)} Münzen!`, 'level', 5000)
    },
    [commit, toast],
  )

  const collectRain = useCallback(() => {
    const s = ref.current
    const amount = Math.round(RAIN_COIN * (1 + gameBonus(levelInfo(s.xp).level)))
    commit({ ...s, coins: s.coins + amount, stats: { ...s.stats, earned: s.stats.earned + amount } })
    return amount
  }, [commit])

  const startEvent = useCallback(
    (id: EventId) => {
      const s = ref.current
      const def = EVENTS[id]
      commit({ ...s, event: { id, until: Date.now() + def.duration }, stats: { ...s.stats, events: s.stats.events + 1 } })
      sound.airhorn()
      sound.speak(def.name)
      toast(`${def.icon} ${def.name}! ${def.desc}`, 'event', 6000)
    },
    [commit, toast],
  )

  /** Läuft regelmäßig: beendet abgelaufene Ereignisse und wechselt den Tag */
  const tickClock = useCallback(() => {
    const s = ref.current
    let next = s
    if (s.event && s.event.until <= Date.now()) next = { ...next, event: null }
    next = withToday(next)
    if (next !== s) commit(next)
  }, [commit])

  const setSetting = useCallback((key: Setting, on: boolean) => commit({ ...ref.current, [key]: on }), [commit])
  const reset = useCallback(() => {
    ref.current = freshState()
    setState(ref.current)
  }, [])

  const level = useMemo(() => levelInfo(state.xp), [state.xp])

  const value = useMemo<Store>(
    () => ({
      state,
      level,
      casePrice,
      open,
      releaseNews,
      sell,
      playedGame,
      claimDaily,
      claimMission,
      claimMissionBonus,
      claimAlbum,
      collectRain,
      startEvent,
      tickClock,
      setSetting,
      reset,
      toasts,
      toast,
      dismissToast,
    }),
    [
      state,
      level,
      casePrice,
      open,
      releaseNews,
      sell,
      playedGame,
      claimDaily,
      claimMission,
      claimMissionBonus,
      claimAlbum,
      collectRain,
      startEvent,
      tickClock,
      setSetting,
      reset,
      toasts,
      toast,
      dismissToast,
    ],
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

/** Für Anzeigen: Seltenheit eines Gegenstands */
export function rarityOf(item: Item): RarityId {
  return getSkin(item.skinId)!.rarity
}

export const ALL_CASES = CASES
