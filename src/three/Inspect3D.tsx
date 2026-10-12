import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RARITIES } from '../game/data'
import type { Skin } from '../game/data'
import { buildForgeWeapon, hasForgeModel } from './forge'
import { setupRenderer, studioEnvironment } from './forge/studio'
import { buildWeapon, disposeObject, skinTexture, stickerTextures } from './weapon'

interface Props {
  skin: Skin
  float: number
  /** Pattern-Seed 0–1000 */
  seed?: number
  stickers?: (string | null)[]
  className?: string
}

/** Drehbare 3D-Ansicht eines Skins (wie „Inspect“ in CS) */
export default function Inspect3D({ skin, float, seed = 0, stickers, className }: Props) {
  const stickerKey = (skin.builtInStickers ?? stickers ?? []).join('|')
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = host.current
    if (!el) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      el.classList.add('no-webgl')
      return
    }
    let disposed = false
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
    setupRenderer(renderer)
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const studio = studioEnvironment(renderer)
    scene.environment = studio.texture

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
    camera.position.set(0, 0.3, 7)
    scene.add(new THREE.AmbientLight('#ffffff', 0.15))
    const key = new THREE.DirectionalLight('#ffffff', 1.4)
    key.position.set(3, 4, 6)
    scene.add(key)
    const rim = new THREE.DirectionalLight(RARITIES[skin.rarity].color, 3)
    rim.position.set(-5, 2, -5)
    scene.add(rim)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.minDistance = 5
    controls.maxDistance = 16
    controls.autoRotate = true
    controls.autoRotateSpeed = 2.4
    controls.addEventListener('start', () => (controls.autoRotate = false))

    let weapon: THREE.Group | null = null
    const ids = stickerKey ? stickerKey.split('|').filter(Boolean) : []
    const applied = stickerKey.split('|').map((x) => x || null)
    const place = (w: THREE.Group) => {
      if (disposed) {
        disposeObject(w)
        return
      }
      weapon = w
      weapon.rotation.y = -0.5
      scene.add(weapon)
    }
    if (hasForgeModel(skin.model)) {
      // Neue Waffenschmiede: echtes 3D-Modell mit PBR-Materialien
      void stickerTextures(ids)
        .then((stex) => buildForgeWeapon({ skin, float, seed, stickers: applied, stickerTextures: stex }))
        .then(place)
    } else {
      void Promise.all([skinTexture(skin, float), stickerTextures(ids)]).then(([tex, stex]) => {
        if (disposed) {
          tex.dispose()
          stex.forEach((t) => t.dispose())
          return
        }
        place(buildWeapon(skin, float, tex, applied, stex))
      })
    }

    const resize = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      // Abstand so wählen, dass die Waffe die Breite gut ausfüllt
      camera.position.setLength(Math.min(16, Math.max(5.5, 12.5 / camera.aspect)))
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    let frame = 0
    const loop = () => {
      controls.update()
      renderer.render(scene, camera)
      frame = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      ro.disconnect()
      controls.dispose()
      if (weapon) disposeObject(weapon)
      studio.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  }, [skin, float, seed, stickerKey])

  return <div ref={host} className={`inspect3d ${className ?? ''}`} title="Ziehen zum Drehen" />
}
