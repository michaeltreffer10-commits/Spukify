import { useState } from 'react'
import type { CSSProperties } from 'react'
import { CASES, RARITIES, RARITY_ORDER, getCase } from '../game/data'
import type { CaseDef } from '../game/data'
import type { Item, StickerItem } from '../game/roll'
import * as sound from '../game/sound'
import { CAPSULES, CAPSULE_ODDS, FINISHES, TITAN_CHANCE, capsuleLabel, getCapsule } from '../game/stickers'
import type { CapsuleDef, StickerFinish } from '../game/stickers'
import { formatCoins, useStore } from '../game/store'
import type { BuyKind } from '../game/store'
import { ItemModal } from './ItemModal'
import { Opening } from './Opening'
import type { Run } from './Opening'
import { StickerModal } from './StickerModal'
import { CapsuleArt, CaseArt, KeyArt, StickerArt, WeaponArt } from './WeaponArt'

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

function CapsuleContents({ c }: { c: CapsuleDef }) {
  const secret = c.stickers.some((s) => s.special)
  return (
    <div className="contents">
      <h3>Inhalt & Chancen</h3>
      {secret && (
        <div className="contents-group" style={{ '--rc': RARITIES.mac.color } as CSSProperties}>
          <div className="contents-head">
            <span className="dot" />
            <span>Schmuggelware</span>
            <span className="chance">{percent(TITAN_CHANCE)}</span>
          </div>
          <p className="secret">??? – Ein legendärer Sticker von 2014. Wer ihn zieht, schreit.</p>
        </div>
      )}
      {(['gold', 'holo', 'glitzer', 'papier'] as StickerFinish[]).map((f) => {
        const fin = FINISHES[f]
        const list = c.stickers.filter((s) => s.finish === f && !s.special)
        if (!list.length) return null
        return (
          <div key={f} className="contents-group" style={{ '--rc': RARITIES[fin.rarity].color } as CSSProperties}>
            <div className="contents-head">
              <span className="dot" />
              <span>
                {fin.rarityName} · {fin.name}
              </span>
              <span className="chance">{percent(CAPSULE_ODDS[f])}</span>
            </div>
            <div className="contents-grid">
              {list.map((s) => (
                <div key={s.id} className="mini-card sticker-mini">
                  <StickerArt sticker={s} className="art" />
                  <span className="skin">{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Wie viele Cases/Schlüssel/Kapseln man hat */
function Owned({ items }: { items: { icon: string; label: string; n: number }[] }) {
  return (
    <div className="owned">
      {items.map((x) => (
        <span key={x.label} className={`owned-chip${x.n > 0 ? ' has' : ''}`}>
          {x.icon} {x.n}× {x.label}
        </span>
      ))}
    </div>
  )
}

export type Focus = { kind: 'case' | 'capsule'; id: string } | null

export function CasesView({ focus }: { focus?: Focus }) {
  const { state, open, openCapsules, openCost, capsuleCost, priceOf, buy, setSetting, toast } = useStore()
  const [tab, setTab] = useState<'cases' | 'capsules'>(focus?.kind === 'capsule' ? 'capsules' : 'cases')
  const [selected, setSelected] = useState<string | null>(focus?.id ?? null)
  const [run, setRun] = useState<Run | null>(null)
  const [detail, setDetail] = useState<Item | null>(null)
  const [stickerDetail, setStickerDetail] = useState<StickerItem | null>(null)
  const discount = state.event?.id === 'rabatt' && state.event.until > Date.now()

  const tooPoor = () => toast('Nicht genug Münzen! Spiel ein paar Minispiele oder sammle die Geldpresse ein.', 'bad')

  const startCase = (c: CaseDef, count: number) => {
    const res = open(c.id, count)
    if (!res) return tooPoor()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setRun({ kind: 'case', caseDef: c, items: res.items, cost: res.cost, key: Date.now() })
  }

  const startCapsule = (c: CapsuleDef, count: number) => {
    const res = openCapsules(c.id, count)
    if (!res) return tooPoor()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setRun({ kind: 'capsule', capsule: c, stickers: res.stickers, cost: res.cost, key: Date.now() })
  }

  const doBuy = (kind: BuyKind, id: string, n: number) => {
    if (buy(kind, id, n)) sound.coin()
    else tooPoor()
  }

  if (run) {
    return (
      <>
        <Opening
          key={run.key}
          run={run}
          fast={state.fast}
          spam={state.spamOpen}
          onClose={() => setRun(null)}
          onAgain={() =>
            run.kind === 'case' ? startCase(run.caseDef, run.items.length) : startCapsule(run.capsule, run.stickers.length)
          }
          onSelect={setDetail}
          onSelectSticker={setStickerDetail}
        />
        {detail && <ItemModal item={detail} onClose={() => setDetail(null)} />}
        {stickerDetail && <StickerModal item={stickerDetail} onClose={() => setStickerDetail(null)} />}
      </>
    )
  }

  const settings = (
    <div className="open-settings">
      <label className="toggle">
        <input type="checkbox" checked={state.spamOpen} onChange={(e) => setSetting('spamOpen', e.target.checked)} />
        <span>Leertaste spammen zum Öffnen</span>
      </label>
      <label className="toggle">
        <input type="checkbox" checked={state.fast} onChange={(e) => setSetting('fast', e.target.checked)} />
        <span>Schnell öffnen (ohne Animation)</span>
      </label>
    </div>
  )

  // ---------- Case-Ansicht ----------
  const c = tab === 'cases' && selected ? getCase(selected) : undefined
  if (c) {
    const p = priceOf(c)
    const nCases = state.cases[c.id] ?? 0
    const nKeys = state.keys[c.id] ?? 0
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
            <Owned
              items={[
                { icon: '📦', label: 'Cases', n: nCases },
                { icon: '🔑', label: 'Schlüssel', n: nKeys },
              ]}
            />
            <div className="buy-row">
              <button type="button" className="btn small" onClick={() => doBuy('case', c.id, 1)}>
                📦 Case kaufen · 🪙 {formatCoins(p.casePrice)}
              </button>
              <button type="button" className="btn small key-btn" onClick={() => doBuy('key', c.id, 1)}>
                <KeyArt color={c.colors[1]} className="key-icon" /> Schlüssel · 🪙 {formatCoins(p.keyPrice)}
              </button>
              <button type="button" className="btn small ghost" onClick={() => doBuy('key', c.id, 10)}>
                10 Schlüssel · 🪙 {formatCoins(p.keyPrice * 10)}
              </button>
            </div>
            {discount && <p className="plus small">🏷️ Rabattaktion: alles 30 % billiger!</p>}
          </div>
        </div>
        <p className="muted small open-hint">
          Zum Öffnen brauchst du 1 Case und 1 Schlüssel. Fehlt etwas, wird es beim Öffnen automatisch gekauft.
        </p>
        <div className="open-buttons">
          {COUNTS.map((n) => {
            const cost = openCost(c.id, n)
            return (
              <button
                type="button"
                key={n}
                className={`btn open-btn${n === 1 ? ' primary' : ''}`}
                disabled={state.coins < cost}
                onClick={() => startCase(c, n)}
              >
                <strong>{n === 1 ? 'Öffnen' : `× ${n}`}</strong>
                <span>{cost === 0 ? '📦🔑 aus Inventar' : `🪙 ${formatCoins(cost)}`}</span>
              </button>
            )
          })}
        </div>
        {settings}
        <CaseContents c={c} />
      </div>
    )
  }

  // ---------- Kapsel-Ansicht ----------
  const cap = tab === 'capsules' && selected ? getCapsule(selected) : undefined
  if (cap) {
    const n = state.capsules[cap.id] ?? 0
    return (
      <div className="case-detail">
        <button type="button" className="btn ghost small back" onClick={() => setSelected(null)}>
          ← Alle Kapseln
        </button>
        <div className="case-hero" style={{ '--cc': cap.colors[1] } as CSSProperties}>
          <CapsuleArt colors={cap.colors} label={capsuleLabel(cap)} className="case-big" />
          <div>
            <h2>{cap.name}</h2>
            <p className="muted">{cap.description}</p>
            <Owned items={[{ icon: '💊', label: 'Kapseln', n }]} />
            <p className="muted small">Kapseln brauchen keinen Schlüssel. Sticker kannst du im Inventar auf Waffen kleben.</p>
          </div>
        </div>
        <div className="open-buttons">
          {COUNTS.map((k) => {
            const cost = capsuleCost(cap.id, k)
            return (
              <button
                type="button"
                key={k}
                className={`btn open-btn${k === 1 ? ' primary' : ''}`}
                disabled={state.coins < cost}
                onClick={() => startCapsule(cap, k)}
              >
                <strong>{k === 1 ? 'Öffnen' : `× ${k}`}</strong>
                <span>{cost === 0 ? '💊 aus Inventar' : `🪙 ${formatCoins(cost)}`}</span>
              </button>
            )
          })}
        </div>
        {settings}
        <CapsuleContents c={cap} />
      </div>
    )
  }

  // ---------- Übersicht ----------
  return (
    <div className="cases">
      <div className="shop-tabs">
        <button type="button" className={tab === 'cases' ? 'active' : ''} onClick={() => setTab('cases')}>
          📦 Cases
        </button>
        <button type="button" className={tab === 'capsules' ? 'active' : ''} onClick={() => setTab('capsules')}>
          💊 Sticker-Kapseln
        </button>
      </div>
      {tab === 'cases' ? (
        <div className="case-grid">
          {CASES.map((x) => {
            const nc = state.cases[x.id] ?? 0
            const nk = state.keys[x.id] ?? 0
            const p = priceOf(x)
            return (
              <button
                type="button"
                key={x.id}
                className="case-card"
                style={{ '--cc': x.colors[1] } as CSSProperties}
                onClick={() => setSelected(x.id)}
              >
                <CaseArt colors={x.colors} label={x.name.replace('-Case', '').toUpperCase()} className="case-art" />
                {(nc > 0 || nk > 0) && (
                  <span className="free-badge">
                    📦 {nc} · 🔑 {nk}
                  </span>
                )}
                <span className="case-name">{x.name}</span>
                <span className="case-price">
                  🔑 {discount && <s className="muted">{formatCoins(x.keyPrice)}</s>} {formatCoins(p.keyPrice)}
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="case-grid">
          {CAPSULES.map((x) => {
            const n = state.capsules[x.id] ?? 0
            return (
              <button
                type="button"
                key={x.id}
                className="case-card"
                style={{ '--cc': x.colors[1] } as CSSProperties}
                onClick={() => setSelected(x.id)}
              >
                <CapsuleArt colors={x.colors} label={capsuleLabel(x)} className="case-art" />
                {n > 0 && <span className="free-badge">💊 {n}</span>}
                <span className="case-name">{x.name}</span>
                <span className="case-price">🪙 {formatCoins(x.price)}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
