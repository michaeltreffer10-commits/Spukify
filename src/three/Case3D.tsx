import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { CaseDef } from '../game/data'
import * as sound from '../game/sound'
import { disposeObject } from './weapon'

interface Props {
  caseDef: CaseDef
  count: number
  onDone: () => void
}

const DROP = 550
const SHAKE_END = 1500
const OPEN_END = 1900
const END = 2550

function frontTexture(c: CaseDef, count: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 340
  const g = canvas.getContext('2d')!
  const [dark, glow] = c.colors
  const grad = g.createLinearGradient(0, 0, 0, 340)
  grad.addColorStop(0, glow)
  grad.addColorStop(0.25, dark)
  grad.addColorStop(1, '#050508')
  g.fillStyle = grad
  g.fillRect(0, 0, 640, 340)
  g.strokeStyle = glow
  g.lineWidth = 10
  g.strokeRect(14, 14, 612, 312)
  g.fillStyle = '#fff'
  g.font = '900 78px Arial, sans-serif'
  g.textAlign = 'center'
  g.shadowColor = glow
  g.shadowBlur = 30
  g.fillText(c.name.replace('-Case', '').toUpperCase(), 320, 190)
  if (count > 1) {
    g.font = '900 56px Arial, sans-serif'
    g.fillStyle = glow
    g.fillText(`× ${count}`, 320, 270)
  }
  const t = new THREE.CanvasTexture(canvas)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function easeOutBounce(x: number): number {
  const n = 7.5625
  const d = 2.75
  if (x < 1 / d) return n * x * x
  if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75
  if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375
  return n * (x -= 2.625 / d) * x + 0.984375
}

/** Die 3D-Kiste, die vor dem Band aufspringt */
export default function Case3D({ caseDef, count, onDone }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const [flash, setFlash] = useState(0)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    const el = host.current
    if (!el) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      doneRef.current()
      return
    }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.outputColorSpace = THREE.SRGBColorSpace
    el.appendChild(renderer.domElement)

    const [dark, glow] = caseDef.colors
    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = envTex
    scene.add(new THREE.AmbientLight('#ffffff', 0.4))
    const key = new THREE.DirectionalLight('#ffffff', 1.6)
    key.position.set(3, 5, 6)
    scene.add(key)

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(0, 2.2, 8)
    camera.lookAt(0, 0.4, 0)

    // Kiste
    const caseGroup = new THREE.Group()
    scene.add(caseGroup)
    const body = new THREE.MeshStandardMaterial({ color: dark, metalness: 0.55, roughness: 0.35 })
    const front = new THREE.MeshStandardMaterial({ map: frontTexture(caseDef, count), metalness: 0.3, roughness: 0.4 })
    const boxGeo = new THREE.BoxGeometry(3.2, 1.7, 2.1)
    const box = new THREE.Mesh(boxGeo, [body, body, body, body, front, body])
    box.position.y = 0.85
    caseGroup.add(box)
    const edgeMat = new THREE.LineBasicMaterial({ color: glow })
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(boxGeo), edgeMat)
    edges.position.copy(box.position)
    caseGroup.add(edges)

    const hinge = new THREE.Group()
    hinge.position.set(0, 1.7, -1.05)
    caseGroup.add(hinge)
    const lidGeo = new THREE.BoxGeometry(3.35, 0.38, 2.25)
    const lid = new THREE.Mesh(lidGeo, new THREE.MeshStandardMaterial({ color: dark, metalness: 0.6, roughness: 0.3 }))
    lid.position.set(0, 0.19, 1.05)
    hinge.add(lid)
    const lidEdges = new THREE.LineSegments(new THREE.EdgesGeometry(lidGeo), edgeMat)
    lidEdges.position.copy(lid.position)
    hinge.add(lidEdges)
    const lock = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.42, 0.12),
      new THREE.MeshStandardMaterial({ color: glow, emissive: glow, emissiveIntensity: 0.6, metalness: 0.8, roughness: 0.2 }),
    )
    lock.position.set(0, 0.05, 2.2)
    hinge.add(lock)

    // Licht und Strahl im Inneren
    const inner = new THREE.PointLight(glow, 0, 12)
    inner.position.set(0, 1.6, 0)
    caseGroup.add(inner)
    const beamMat = new THREE.MeshBasicMaterial({
      color: glow,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 0.9, 6, 32, 1, true), beamMat)
    beam.position.set(0, 4.6, 0)
    beam.scale.y = 0.01
    caseGroup.add(beam)

    // Funken
    const N = 260
    const pos = new Float32Array(N * 3)
    const vel: THREE.Vector3[] = []
    for (let i = 0; i < N; i++) {
      pos.set([0, 1.5, 0], i * 3)
      vel.push(new THREE.Vector3((Math.random() - 0.5) * 6, 3 + Math.random() * 6, (Math.random() - 0.5) * 6))
    }
    const sparkGeo = new THREE.BufferGeometry()
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const sparkMat = new THREE.PointsMaterial({
      color: glow,
      size: 0.09,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const sparks = new THREE.Points(sparkGeo, sparkMat)
    caseGroup.add(sparks)

    // Schatten am Boden
    const sc = document.createElement('canvas')
    sc.width = sc.height = 128
    const sg = sc.getContext('2d')!
    const rg = sg.createRadialGradient(64, 64, 4, 64, 64, 64)
    rg.addColorStop(0, 'rgba(0,0,0,0.7)')
    rg.addColorStop(1, 'rgba(0,0,0,0)')
    sg.fillStyle = rg
    sg.fillRect(0, 0, 128, 128)
    const shadowTex = new THREE.CanvasTexture(sc)
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }))
    shadow.rotation.x = -Math.PI / 2
    shadow.position.y = 0.001
    scene.add(shadow)

    const resize = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.position.z = camera.aspect < 1 ? 8 / camera.aspect : 8
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    const start = performance.now()
    let frame = 0
    let dropped = false
    let opened = false
    let finished = false
    let lastRattle = 0
    let lastT = start
    const loop = (now: number) => {
      const t = now - start
      const dt = Math.min(0.05, (now - lastT) / 1000)
      lastT = now

      if (t < DROP) {
        caseGroup.position.y = 5 * (1 - easeOutBounce(t / DROP))
      } else {
        caseGroup.position.y = 0
        if (!dropped) {
          dropped = true
          sound.caseDrop()
        }
      }

      if (t > DROP && t < SHAKE_END) {
        const k = (t - DROP) / (SHAKE_END - DROP)
        caseGroup.rotation.z = Math.sin(t * 0.06) * 0.06 * k
        caseGroup.rotation.x = Math.cos(t * 0.05) * 0.03 * k
        inner.intensity = k * 6
        hinge.rotation.x = -Math.abs(Math.sin(t * 0.03)) * 0.05 * k
        if (now - lastRattle > 110 - k * 60) {
          lastRattle = now
          sound.caseRattle(k)
        }
      } else {
        caseGroup.rotation.z *= 0.8
        caseGroup.rotation.x *= 0.8
      }

      if (t >= SHAKE_END) {
        if (!opened) {
          opened = true
          sound.caseOpen()
          sparkMat.opacity = 1
        }
        const k = Math.min(1, (t - SHAKE_END) / (OPEN_END - SHAKE_END))
        const back = 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2)
        hinge.rotation.x = -1.95 * back
        inner.intensity = 6 + k * 60
        beamMat.opacity = 0.45 * k
        beam.scale.y = Math.max(0.01, k)
        for (let i = 0; i < N; i++) {
          vel[i].y -= 9 * dt
          pos[i * 3] += vel[i].x * dt
          pos[i * 3 + 1] += vel[i].y * dt
          pos[i * 3 + 2] += vel[i].z * dt
        }
        sparkGeo.attributes.position.needsUpdate = true
        sparkMat.opacity = Math.max(0, 1 - (t - SHAKE_END) / 1000)
      }

      if (t > OPEN_END) {
        const k = Math.min(1, (t - OPEN_END) / (END - OPEN_END))
        camera.position.y = 2.2 + k * 2.4
        camera.lookAt(0, 0.4 + k * 3, 0)
        setFlash(k)
      }

      renderer.render(scene, camera)
      if (t < END) frame = requestAnimationFrame(loop)
      else if (!finished) {
        finished = true
        doneRef.current()
      }
    }
    frame = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      disposeObject(scene)
      envTex.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  }, [caseDef, count])

  return (
    <div className="case3d" ref={host}>
      <div className="case3d-flash" style={{ opacity: flash }} />
    </div>
  )
}
