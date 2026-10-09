import { useState } from 'react'
import type { CSSProperties } from 'react'
import { CASES, RARITIES, RARITY_ORDER, getCase } from '../game/data'
import type { CaseDef } from '../game/data'
import type { Item } from '../game/roll'
import { formatCoins, useStore } from '../game/store'
import { ItemModal } from './ItemModal'
import { Opening } from './Opening'
import { CaseArt, WeaponArt } from './WeaponArt'

const COUNTS = [1, 5, 10, 100]

function percent(p: number): string {
  return `${(p * 100).toLocaleString('de-DE', { maximumFractionDigits: 3 })} %`
}

function CaseContents({ c }: { c: CaseDef }) {
  return (
    <div className="contents">
      <h3>Inhalt & Chancen</h3>
      {[...RARITY_ORDER].reverse().map((r) => {
        const rarity = RARITIES[r]
        const skins = c.skins.filter((s) => s.rarity === r)
        return (
          <div key={r} className="contents-group" style={{ '--rc': rarity.color } as CSSProperties}>
            <div className="contents-head">
              <span className="dot" />
              <span>{rarity.name}</span>
              <span className="chance">{percent(rarity.chance)}</span>
            </div>
            {r === 'mac' ? (
              <p className="secret">??? – Ein geheimer Gegenstand. Niemand weiß genau, was es ist …</p>
            ) : (
              <div className="contents-grid">
                {skins.map((s) => (
                  <div key={s.id} className="mini-card">
                    <WeaponArt skin={s} className="art" />
                    <span className="weapon">{s.weapon}</span>
                    <span className="skin">{s.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface OpenRun {
  caseId: string
  items: Item[]
  key: number
}

export function CasesView() {
  const { state, open, setFast, toast } = useStore()
  const [selected, setSelected] = useState<string | null>(null)
  const [run, setRun] = useState<OpenRun | null>(null)
  const [detail, setDetail] = useState<Item | null>(null)

  const start = (c: CaseDef, count: number) => {
    const items = open(c.id, count)
    if (!items) {
      toast('Nicht genug Münzen! Spiel das Aim-Training oder hol dir den Tagesbonus.', 'bad')
      return
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setRun({ caseId: c.id, items, key: Date.now() })
  }

  const runCase = run && getCase(run.caseId)
  if (run && runCase) {
    return (
      <>
        <Opening
          key={run.key}
          caseDef={runCase}
          items={run.items}
          fast={state.fast}
          onClose={() => setRun(null)}
          onAgain={() => start(runCase, run.items.length)}
          onSelect={setDetail}
        />
        {detail && <ItemModal item={detail} onClose={() => setDetail(null)} />}
      </>
    )
  }

  const c = selected ? getCase(selected) : undefined
  if (c) {
    return (
      <div className="case-detail">
        <button type="button" className="btn ghost small back" onClick={() => setSelected(null)}>
          ← Alle Cases
        </button>
        <div className="case-hero" style={{ '--cc': c.colors[1] } as CSSProperties}>
          <CaseArt colors={c.colors} label={c.name.replace('-Case', '').toUpperCase()} className="case-big" />
          <div>
            <h2>{c.name}</h2>
            <p className="muted">{c.description}</p>
            <p className="price">🪙 {formatCoins(c.price)} pro Case</p>
          </div>
        </div>
        <div className="open-buttons">
          {COUNTS.map((n) => {
            const cost = c.price * n
            return (
              <button
                type="button"
                key={n}
                className={`btn open-btn${n === 1 ? ' primary' : ''}`}
                disabled={state.coins < cost}
                onClick={() => start(c, n)}
              >
                <strong>{n === 1 ? 'Öffnen' : `× ${n}`}</strong>
                <span>🪙 {formatCoins(cost)}</span>
              </button>
            )
          })}
        </div>
        <label className="toggle">
          <input type="checkbox" checked={state.fast} onChange={(e) => setFast(e.target.checked)} />
          <span>Schnell öffnen (ohne Animation)</span>
        </label>
        <CaseContents c={c} />
      </div>
    )
  }

  return (
    <div className="cases">
      <h2 className="section-title">Wähle ein Case</h2>
      <div className="case-grid">
        {CASES.map((c) => (
          <button
            type="button"
            key={c.id}
            className="case-card"
            style={{ '--cc': c.colors[1] } as CSSProperties}
            onClick={() => setSelected(c.id)}
          >
            <CaseArt colors={c.colors} label={c.name.replace('-Case', '').toUpperCase()} className="case-art" />
            <span className="case-name">{c.name}</span>
            <span className="case-price">🪙 {formatCoins(c.price)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
