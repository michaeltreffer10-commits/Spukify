// Waffenschmiede – setzt Modell, Materialien und Sticker zu einer fertigen 3D-Waffe zusammen.
import * as THREE from 'three'
import type { Skin } from '../../game/data'
import type { ModelId } from '../../game/models'
import { getSticker } from '../../game/stickers'
import { createMaterials, patternTexture } from './materials'
import { ak47 } from './models/ak47'
import type { ForgeModel } from './types'

/** Modelle, die schon in echtem 3D gebaut sind (die anderen nutzen noch die alten Profile) */
export const FORGE_MODELS: Partial<Record<ModelId, ForgeModel>> = { ak47 }

export function hasForgeModel(id: ModelId): boolean {
  return id in FORGE_MODELS
}

/** So lang (in Szenen-Einheiten) wird jede Waffe dargestellt */
export const WORLD_LENGTH = 5.8

export interface ForgeOptions {
  skin: Skin
  float: number
  /** Pattern-Seed 0–1000 */
  seed: number
  stickers?: (string | null)[]
  stickerTextures?: Map<string, THREE.Texture>
}

export async function buildForgeWeapon(o: ForgeOptions): Promise<THREE.Group> {
  const model = FORGE_MODELS[o.skin.model]
  if (!model) throw new Error(`Kein 3D-Modell für ${o.skin.model}`)
  const parts = model.build()

  // Gesamtgröße des Modells (für Projektion und Skalierung)
  const box = new THREE.Box3()
  for (const p of parts) {
    p.geometry.computeBoundingBox()
    box.union(p.geometry.boundingBox!)
  }
  const size = box.getSize(new THREE.Vector3())
  const length = size.x

  const pattern = await patternTexture(o.skin, o.seed)
  const mats = createMaterials({ pattern, min: box.min.clone(), length, float: o.float })

  const inner = new THREE.Group()
  for (const p of parts) {
    const mesh = new THREE.Mesh(p.geometry, mats[p.slot])
    mesh.name = p.name
    mesh.castShadow = true
    mesh.receiveShadow = true
    inner.add(mesh)
  }

  // Sticker als Aufkleber auf der rechten Seite
  const applied = o.skin.builtInStickers ?? o.stickers ?? []
  model.stickers.forEach((spot, i) => {
    const id = applied[i]
    const tex = id ? o.stickerTextures?.get(id) : undefined
    const def = id ? getSticker(id) : undefined
    if (!tex || !def) return
    const mat = new THREE.MeshPhysicalMaterial({
      map: tex,
      transparent: true,
      alphaTest: 0.2,
      metalness: def.finish === 'gold' ? 0.9 : 0.05,
      roughness: def.finish === 'papier' ? 0.6 : 0.2,
      iridescence: def.finish === 'holo' ? 1 : 0,
      clearcoat: def.finish === 'papier' ? 0 : 1,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    })
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), mat)
    // Sticker-Texturen sind ohne Y-Spiegelung angelegt
    plane.scale.y = -1
    plane.position.set(spot.x, spot.y, spot.z + 0.15)
    inner.add(plane)
  })

  const center = box.getCenter(new THREE.Vector3())
  inner.position.set(-center.x, -center.y, -center.z)
  const outer = new THREE.Group()
  outer.add(inner)
  outer.scale.setScalar(WORLD_LENGTH / length)
  outer.userData.forge = true
  return outer
}
