// Waffenschmiede – Betrachter zum Testen der 3D-Modelle (erreichbar über #schmiede).
import { Suspense, useEffect, useMemo, useState } from 'react'
import { CASES, MAC_SKIN, wearOf } from '../../game/data'
import type { Skin } from '../../game/data'
import { Inspect3D } from '../lazy'
import { FORGE_MODELS } from './index'

export default function ForgeViewer() {
  const skins = useMemo<Skin[]>(
    () => [...CASES.flatMap((c) => c.skins), MAC_SKIN].filter((s) => s.model in FORGE_MODELS),
    [],
  )
  const [skinId, setSkinId] = useState(skins[0]?.id ?? '')
  const [float, setFloat] = useState(0.05)
  const [seed, setSeed] = useState(1)
  // Schieberegler erst nach kurzer Pause anwenden (Neuaufbau kostet etwas)
  const [applied, setApplied] = useState({ float, seed })
  useEffect(() => {
    const t = setTimeout(() => setApplied({ float, seed }), 250)
    return () => clearTimeout(t)
  }, [float, seed])
  const skin = skins.find((s) => s.id === skinId)

  return (
    <div className="forge">
      <header className="forge-head">
        <h1>
          Waffen<span>schmiede</span>
        </h1>
        <a href="#" className="btn ghost small" onClick={() => setTimeout(() => location.reload(), 0)}>
          ← Zurück zum Spiel
        </a>
      </header>
      <div className="forge-controls">
        <label>
          Skin
          <select value={skinId} onChange={(e) => setSkinId(e.target.value)}>
            {skins.map((s) => (
              <option key={s.id} value={s.id}>
                {s.weapon} | {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Float {float.toFixed(3)} · {wearOf(float).name}
          <input type="range" min={0} max={1} step={0.001} value={float} onChange={(e) => setFloat(Number(e.target.value))} />
        </label>
        <label>
          Pattern-Seed {seed}
          <input type="range" min={0} max={1000} step={1} value={seed} onChange={(e) => setSeed(Number(e.target.value))} />
        </label>
      </div>
      <div className="forge-stage">
        {skin && (
          <Suspense fallback={<p className="muted">Lade 3D …</p>}>
            <Inspect3D key={`${skin.id}-${applied.float}-${applied.seed}`} skin={skin} float={applied.float} seed={applied.seed} className="forge-3d" />
          </Suspense>
        )}
      </div>
      <p className="muted small">
        Modelle in echtem 3D: {Object.values(FORGE_MODELS).map((m) => m!.name).join(', ')}. Ziehen zum Drehen, Mausrad zum Zoomen.
      </p>
    </div>
  )
}
