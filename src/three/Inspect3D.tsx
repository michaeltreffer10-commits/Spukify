import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { RARITIES } from '../game/data'
import type { Skin } from '../game/data'
import { buildWeapon, disposeObject, skinTexture, stickerTextures } from './weapon'

interface Props {
  skin: Skin
  float: number
  stickers?: (string | null)[]
  className?: string
}

/** Drehbare 3D-Ansicht eines Skins (wie „Inspect“ in CS) */
export default function Inspect3D({ skin, float, stickers, className }: Props) {
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
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.outputColorSpace = THREE.SRGBColorSpace
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = envTex

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
    camera.position.set(0, 0.3, 7)
    scene.add(new THREE.AmbientLight('#ffffff', 0.35))
    const key = new THREE.DirectionalLight('#ffffff', 2)
    key.position.set(3, 4, 6)
    scene.add(key)
    const rim = new THREE.DirectionalLight(RARITIES[skin.rarity].color, 4)
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
    void Promise.all([skinTexture(skin, float), stickerTextures(ids)]).then(([tex, stex]) => {
      if (disposed) {
        tex.dispose()
        stex.forEach((t) => t.dispose())
        return
      }
      weapon = buildWeapon(skin, float, tex, stickerKey.split('|').map((x) => x || null), stex)
      weapon.rotation.y = -0.5
      scene.add(weapon)
    })

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
      envTex.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  }, [skin, float, stickerKey])

  return <div ref={host} className={`inspect3d ${className ?? ''}`} title="Ziehen zum Drehen" />
}
