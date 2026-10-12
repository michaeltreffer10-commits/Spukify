// Baut aus den 2D-Modellen echte 3D-Waffen.
import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { patternMarkup } from '../game/art'
import type { Skin } from '../game/data'
import { MODELS } from '../game/models'
import type { ModelPart } from '../game/models'
import { getSticker, stickerMarkup } from '../game/stickers'

const SCALE = 0.022

async function svgToCanvas(svg: string, w: number, h: number): Promise<HTMLCanvasElement> {
  const img = new Image()
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  await img.decode()
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
  return canvas
}

/** Das Skin-Muster als Textur, mit Fugen und Kratzern je nach Abnutzung */
export async function skinTexture(skin: Skin, float: number): Promise<THREE.CanvasTexture> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="448" viewBox="0 0 256 112"><defs>${patternMarkup(
    'p',
    skin.pattern,
    skin.colors,
  )}</defs><rect width="256" height="112" fill="url(#p)"/></svg>`
  const canvas = await svgToCanvas(svg, 1024, 448)
  const g = canvas.getContext('2d')!

  // Fugen und Rillen des Modells
  const details = MODELS[skin.model].details
  if (details) {
    g.save()
    g.scale(4, 4)
    g.strokeStyle = 'rgba(0,0,0,0.5)'
    g.lineWidth = 0.9
    g.lineCap = 'round'
    g.stroke(new Path2D(details))
    g.restore()
  }

  // Abnutzung: Kratzer …
  const scratches = Math.floor(float * 260)
  for (let i = 0; i < scratches; i++) {
    g.strokeStyle = `rgba(210,210,215,${0.12 + Math.random() * 0.35})`
    g.lineWidth = 0.8 + Math.random() * 1.6
    const x = Math.random() * 1024
    const y = Math.random() * 448
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + (Math.random() - 0.5) * 70, y + (Math.random() - 0.5) * 24)
    g.stroke()
  }
  // … und abgeblätterte Stellen bei starker Abnutzung
  if (float > 0.38) {
    const spots = Math.floor((float - 0.38) * 90)
    for (let i = 0; i < spots; i++) {
      g.fillStyle = `rgba(120,120,125,${0.25 + Math.random() * 0.3})`
      g.beginPath()
      g.ellipse(Math.random() * 1024, Math.random() * 448, 6 + Math.random() * 24, 3 + Math.random() * 10, Math.random() * 3, 0, Math.PI * 2)
      g.fill()
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.flipY = false
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  // Die Flächen haben Koordinaten von 0–256 × 0–112
  tex.repeat.set(1 / 256, 1 / 112)
  tex.anisotropy = 8
  return tex
}

/** Texturen für alle Sticker (Schlüssel: Sticker-ID) */
export async function stickerTextures(ids: string[]): Promise<Map<string, THREE.CanvasTexture>> {
  const map = new Map<string, THREE.CanvasTexture>()
  for (const id of new Set(ids)) {
    const def = getSticker(id)
    if (!def) continue
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="-2 -2 68 68">${stickerMarkup(def, 's')}</svg>`
    const tex = new THREE.CanvasTexture(await svgToCanvas(svg, 256, 256))
    tex.colorSpace = THREE.SRGBColorSpace
    tex.flipY = false
    tex.anisotropy = 4
    map.set(id, tex)
  }
  return map
}

function partPath(p: ModelPart): Path2D {
  const path = new Path2D(p.d)
  if (!p.t) return path
  // Nur „translate(x y) scale(s)“ wird gebraucht
  const tr = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(p.t)
  const sc = /scale\(([-\d.]+)\)/.exec(p.t)
  const m = new DOMMatrix()
  if (tr) m.translateSelf(Number(tr[1]), Number(tr[2]))
  if (sc) m.scaleSelf(Number(sc[1]))
  const out = new Path2D()
  out.addPath(path, m)
  return out
}

const loader = new SVGLoader()

export function buildWeapon(
  skin: Skin,
  float: number,
  tex: THREE.Texture,
  stickers: (string | null)[] = [],
  stickerTex: Map<string, THREE.Texture> = new Map(),
): THREE.Group {
  const model = MODELS[skin.model]
  const inner = new THREE.Group()
  const paint = new THREE.MeshPhysicalMaterial({
    map: tex,
    metalness: 0.3,
    roughness: 0.22 + float * 0.55,
    clearcoat: Math.max(0, 1 - float * 1.5),
    clearcoatRoughness: 0.15,
  })
  const paintSide = new THREE.MeshStandardMaterial({
    color: new THREE.Color(skin.colors[0]).multiplyScalar(0.7),
    metalness: 0.5,
    roughness: 0.45,
  })
  const metal = new THREE.MeshStandardMaterial({ color: '#6b717b', metalness: 0.95, roughness: 0.32 })
  const dark = new THREE.MeshStandardMaterial({ color: '#1d1e22', metalness: 0.15, roughness: 0.75 })

  const ctx = document.createElement('canvas').getContext('2d')!
  const hitParts = model.parts.map((p) => ({ path: partPath(p), depth: p.depth ?? 12 }))

  for (const part of model.parts) {
    const depth = part.depth ?? 12
    const data = loader.parse(
      `<svg xmlns="http://www.w3.org/2000/svg"><path d="${part.d}" fill="#000"${part.evenOdd ? ' fill-rule="evenodd"' : ''}${
        part.t ? ` transform="${part.t}"` : ''
      }/></svg>`,
    )
    const mats: THREE.Material[] =
      part.mat === 'metal' ? [metal, metal] : part.mat === 'dark' ? [dark, dark] : [paint, paintSide]
    for (const p of data.paths) {
      const geo = new THREE.ExtrudeGeometry(SVGLoader.createShapes(p), {
        depth,
        bevelEnabled: true,
        bevelThickness: 1,
        bevelSize: 0.6,
        bevelSegments: 3,
        curveSegments: 18,
      })
      geo.translate(0, 0, -depth / 2)
      inner.add(new THREE.Mesh(geo, mats))
    }
  }

  // Sticker als echte Aufkleber auf der Vorderseite
  const applied = skin.builtInStickers ?? stickers
  ;(model.stickers ?? []).forEach((spot, i) => {
    const id = applied[i]
    const t = id ? stickerTex.get(id) : undefined
    const def = id ? getSticker(id) : undefined
    if (!t || !def) return
    // Dicke an dieser Stelle: das dickste Teil, das den Punkt enthält
    let z = 6
    for (const h of hitParts) if (ctx.isPointInPath(h.path, spot.x, spot.y)) z = Math.max(z, h.depth / 2)
    const mat = new THREE.MeshPhysicalMaterial({
      map: t,
      transparent: true,
      alphaTest: 0.2,
      metalness: def.finish === 'gold' ? 0.9 : 0.1,
      roughness: def.finish === 'papier' ? 0.6 : 0.2,
      iridescence: def.finish === 'holo' ? 1 : 0,
      iridescenceIOR: 1.8,
      clearcoat: def.finish === 'papier' ? 0 : 1,
    })
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(17, 17), mat)
    plane.position.set(spot.x, spot.y, z + 1.15)
    inner.add(plane)
  })

  const box = new THREE.Box3().setFromObject(inner)
  const center = box.getCenter(new THREE.Vector3())
  inner.position.set(-center.x, -center.y, -center.z)
  const outer = new THREE.Group()
  outer.add(inner)
  // SVG zählt nach unten, 3D nach oben → spiegeln
  outer.scale.set(SCALE, -SCALE, SCALE)
  return outer
}

export function disposeObject(obj: THREE.Object3D) {
  obj.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (mesh.geometry) mesh.geometry.dispose()
    const mats = mesh.material ? (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) : []
    for (const m of mats) {
      for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose()
      m.dispose()
    }
  })
}
