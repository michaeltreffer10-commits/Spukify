// Baut aus den 2D-Silhouetten echte 3D-Waffen.
import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { SHAPES, STICKER_SPOTS, patternMarkup } from '../game/art'
import type { Skin } from '../game/data'

const SCALE = 0.022

/** Das Skin-Muster als Textur, mit Kratzern je nach Abnutzung */
export async function skinTexture(skin: Skin, float: number): Promise<THREE.CanvasTexture> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="448" viewBox="0 0 256 112"><defs>${patternMarkup(
    'p',
    skin.pattern,
    skin.colors,
  )}</defs><rect width="256" height="112" fill="url(#p)"/></svg>`
  const img = new Image()
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  await img.decode()
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 448
  const g = canvas.getContext('2d')!
  g.drawImage(img, 0, 0)

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

function stickerTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grad = g.createLinearGradient(0, 0, 128, 128)
  ;['#ff4d4d', '#ffe14d', '#4dff9a', '#4db8ff', '#d44dff'].forEach((col, i) => grad.addColorStop(i / 4, col))
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  g.fillStyle = '#fff'
  g.font = '900 72px Arial, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('R', 64, 68)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

const loader = new SVGLoader()

export function buildWeapon(skin: Skin, float: number, tex: THREE.Texture): THREE.Group {
  const inner = new THREE.Group()
  const face = new THREE.MeshPhysicalMaterial({
    map: tex,
    metalness: 0.35,
    roughness: 0.22 + float * 0.55,
    clearcoat: Math.max(0, 1 - float * 1.5),
    clearcoatRoughness: 0.15,
  })
  const side = new THREE.MeshStandardMaterial({
    color: new THREE.Color(skin.colors[0]).multiplyScalar(0.7),
    metalness: 0.6,
    roughness: 0.45,
  })

  let maxDepth = 0
  for (const part of SHAPES[skin.shape]) {
    const depth = part.depth ?? 12
    maxDepth = Math.max(maxDepth, depth)
    const data = loader.parse(
      `<svg xmlns="http://www.w3.org/2000/svg"><path d="${part.d}" fill="#000"${part.evenOdd ? ' fill-rule="evenodd"' : ''}/></svg>`,
    )
    for (const p of data.paths) {
      const geo = new THREE.ExtrudeGeometry(SVGLoader.createShapes(p), {
        depth,
        bevelEnabled: true,
        bevelThickness: 1.1,
        bevelSize: 0.7,
        bevelSegments: 3,
        curveSegments: 18,
      })
      geo.translate(0, 0, -depth / 2)
      inner.add(new THREE.Mesh(geo, [face, side]))
    }
  }

  if (skin.stickers) {
    const holo = new THREE.MeshPhysicalMaterial({
      map: stickerTexture(),
      metalness: 0.8,
      roughness: 0.15,
      iridescence: 1,
      iridescenceIOR: 1.9,
    })
    const edge = new THREE.MeshStandardMaterial({ color: '#ddd', metalness: 1, roughness: 0.2 })
    for (const s of STICKER_SPOTS) {
      for (const dir of [1, -1]) {
        const geo = new THREE.CylinderGeometry(s.r, s.r, 0.6, 40)
        geo.rotateX((dir * Math.PI) / 2)
        const m = new THREE.Mesh(geo, [edge, holo, edge])
        m.position.set(s.x, s.y, dir * (maxDepth / 2 + 1.4))
        inner.add(m)
      }
    }
  }

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
