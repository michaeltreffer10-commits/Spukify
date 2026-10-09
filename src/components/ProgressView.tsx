import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { CASES, MAC_SKIN, RARITIES, RARITY_ORDER, getCase } from '../game/data'
import {
  ACHIEVEMENTS,
  MISSION_BONUS,
  albumProgress,
  albumRewards,
  gameBonus,
  levelReward,
  missionText,
} from '../game/progress'
import { formatCoins, useStore } from '../game/store'
import { StatsView } from './StatsView'
import { WeaponArt } from './WeaponArt'

type Sub = 'missionen' | 'album' | 'erfolge' | 'statistik'

function untilMidnight(): string {
  const now = new Date()
  const next = new Date(now)
  next.setHours(24, 0, 0, 0)
  const ms = next.getTime() - now.getTime()
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  return `${h} Std. ${m} Min.`
}

function Missions() {
  const { state, level, claimMission, claimMissionBonus } = useStore()
  const [, force] = useState(0)
  useEffect(() => {
    const t = setInterval(() => force((x) => x + 1), 30_000)
    return () => clearInterval(t)
  }, [])
  const next = levelReward(level.level + 1)
  const allClaimed = state.missions.list.every((m) => m.claimed)

  return (
    <>
      <div className="level-card">
        <div className="level-ring">
          <span>Level</span>
          <strong>{level.level}</strong>
        </div>
        <div className="level-info">
          <div className="xp-bar big">
            <div style={{ width: `${(level.into / level.need) * 100}%` }} />
          </div>
          <p>
            {formatCoins(level.into)} / {formatCoins(level.need)} XP bis Level {level.level + 1}
          </p>
          <p className="muted">
            Nächste Belohnung: 🪙 {formatCoins(next.coins)} und ein gratis {getCase(next.caseId)?.name} · Minispiel-Bonus: +
            {Math.round(gameBonus(level.level) * 100)} %
          </p>
          <p className="muted small">
            XP gibt es für jedes Case (je teurer, desto mehr), für Minispiele und für Missionen.
          </p>
        </div>
      </div>

      <div className="missions-head">
        <h3>Tägliche Missionen</h3>
        <span className="muted">Neue Missionen in {untilMidnight()}</span>
      </div>
      <div className="missions">
        {state.missions.list.map((m) => {
          const done = m.progress >= m.target
          return (
            <div key={m.id} className={`mission${m.claimed ? ' claimed' : done ? ' done' : ''}`}>
              <div className="mission-text">
                <strong>{missionText(m)}</strong>
                <span className="muted">
                  🪙 {formatCoins(m.reward)} · ✨ {formatCoins(m.xp)} XP
                </span>
              </div>
              <div className="xp-bar">
                <div style={{ width: `${(m.progress / m.target) * 100}%` }} />
              </div>
              <div className="mission-foot">
                <span className="muted">
                  {m.type === 'reaction' ? (done ? 'Geschafft' : 'Noch nicht geschafft') : `${formatCoins(m.progress)} / ${formatCoins(m.target)}`}
                </span>
                {m.claimed ? (
                  <span className="plus">✓ Abgeholt</span>
                ) : (
                  <button type="button" className="btn primary small" disabled={!done} onClick={() => claimMission(m.id)}>
                    Abholen
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div className={`mission-bonus${state.missions.bonusClaimed ? ' claimed' : ''}`}>
        <span>
          🎁 Alle 3 Missionen abgeholt: 🪙 {formatCoins(MISSION_BONUS.coins)} und ein gratis Neon-Case
        </span>
        {state.missions.bonusClaimed ? (
          <span className="plus">✓ Abgeholt</span>
        ) : (
          <button type="button" className="btn primary small" disabled={!allClaimed} onClick={claimMissionBonus}>
            Abholen
          </button>
        )}
      </div>
    </>
  )
}

function Album() {
  const { state, claimAlbum } = useStore()
  const [caseId, setCaseId] = useState(CASES[0].id)
  const c = getCase(caseId)!
  const p = albumProgress(state, c)
  const rewards = albumRewards(c)
  const baseDone = p.baseHave === p.baseTotal
  const fullDone = baseDone && p.goldHave === p.goldTotal
  const macFound = (state.album[MAC_SKIN.id] ?? 0) > 0

  return (
    <>
      <div className="chips filter">
        {CASES.map((x) => {
          const q = albumProgress(state, x)
          return (
            <button
              type="button"
              key={x.id}
              className={`chip${x.id === caseId ? ' active' : ''}`}
              style={{ '--rc': x.colors[1] } as CSSProperties}
              onClick={() => setCaseId(x.id)}
            >
              {x.name} ({q.baseHave + q.goldHave}/{q.baseTotal + q.goldTotal})
            </button>
          )
        })}
      </div>

      <div className="album-rewards">
        <div className={`album-reward${state.albumClaimed.includes(`${c.id}:base`) ? ' claimed' : ''}`}>
          <span>
            📒 Alle normalen Skins ({p.baseHave}/{p.baseTotal}) · 🪙 {formatCoins(rewards.base)}
          </span>
          {state.albumClaimed.includes(`${c.id}:base`) ? (
            <span className="plus">✓ Abgeholt</span>
          ) : (
            <button type="button" className="btn primary small" disabled={!baseDone} onClick={() => claimAlbum(c.id, 'base')}>
              Abholen
            </button>
          )}
        </div>
        <div className={`album-reward${state.albumClaimed.includes(`${c.id}:full`) ? ' claimed' : ''}`}>
          <span>
            🏆 Komplett mit allen ★ ({p.goldHave}/{p.goldTotal}) · 🪙 {formatCoins(rewards.full)}
          </span>
          {state.albumClaimed.includes(`${c.id}:full`) ? (
            <span className="plus">✓ Abgeholt</span>
          ) : (
            <button type="button" className="btn primary small" disabled={!fullDone} onClick={() => claimAlbum(c.id, 'full')}>
              Abholen
            </button>
          )}
        </div>
      </div>

      {[...RARITY_ORDER]
        .reverse()
        .filter((r) => r !== 'mac')
        .map((r) => {
          const skins = c.skins.filter((s) => s.rarity === r)
          return (
            <div key={r} className="contents-group" style={{ '--rc': RARITIES[r].color } as CSSProperties}>
              <div className="contents-head">
                <span className="dot" />
                <span>{RARITIES[r].name}</span>
              </div>
              <div className="contents-grid">
                {skins.map((s) => {
                  const n = state.album[s.id] ?? 0
                  return (
                    <div key={s.id} className={`mini-card${n ? '' : ' locked'}`}>
                      <WeaponArt skin={s} className="art" />
                      <span className="weapon">{s.weapon}</span>
                      <span className="skin">{n ? s.name : '???'}</span>
                      {n > 0 && <span className="count">×{n}</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

      <div className="contents-group" style={{ '--rc': RARITIES.mac.color } as CSSProperties}>
        <div className="contents-head">
          <span className="dot" />
          <span>Geheim</span>
        </div>
        <div className="contents-grid">
          <div className={`mini-card${macFound ? '' : ' locked'}`}>
            <WeaponArt skin={MAC_SKIN} className="art" />
            <span className="weapon">{macFound ? MAC_SKIN.weapon : '???'}</span>
            <span className="skin">{macFound ? 'Hitzewelle' : 'Aus jedem Case möglich …'}</span>
          </div>
        </div>
      </div>
    </>
  )
}

function Achievements() {
  const { state } = useStore()
  const got = ACHIEVEMENTS.filter((a) => state.achievements[a.id]).length
  return (
    <>
      <p className="muted">
        {got} von {ACHIEVEMENTS.length} Erfolgen freigeschaltet. Die Belohnung bekommst du automatisch.
      </p>
      <div className="xp-bar big">
        <div style={{ width: `${(got / ACHIEVEMENTS.length) * 100}%` }} />
      </div>
      <div className="ach-grid">
        {ACHIEVEMENTS.map((a) => {
          const at = state.achievements[a.id]
          const hidden = a.secret && !at
          return (
            <div key={a.id} className={`ach${at ? ' got' : ''}`}>
              <span className="ach-icon">{hidden ? '❓' : a.icon}</span>
              <div>
                <strong>{hidden ? 'Geheimer Erfolg' : a.name}</strong>
                <p className="muted">{hidden ? 'Wird verraten, wenn es so weit ist …' : a.desc}</p>
                <span className="ach-reward">
                  {at ? `✓ ${new Date(at).toLocaleDateString('de-DE')}` : `🪙 ${formatCoins(a.reward)}`}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

export function ProgressView() {
  const { state } = useStore()
  const [sub, setSub] = useState<Sub>('missionen')
  const claimable = state.missions.list.filter((m) => m.progress >= m.target && !m.claimed).length
  const tabs: { id: Sub; label: string }[] = [
    { id: 'missionen', label: `🎯 Level & Missionen${claimable ? ` (${claimable})` : ''}` },
    { id: 'album', label: '📒 Album' },
    { id: 'erfolge', label: '🏆 Erfolge' },
    { id: 'statistik', label: '📊 Statistik' },
  ]
  return (
    <div className="progress">
      <h2 className="section-title">Fortschritt</h2>
      <div className="subtabs">
        {tabs.map((t) => (
          <button type="button" key={t.id} className={sub === t.id ? 'active' : ''} onClick={() => setSub(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {sub === 'missionen' && <Missions />}
      {sub === 'album' && <Album />}
      {sub === 'erfolge' && <Achievements />}
      {sub === 'statistik' && <StatsView />}
    </div>
  )
}
