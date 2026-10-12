// Waffenschmiede – Studio-Licht.
// Ein prozedurales „Studio-HDRI“: dunkler Raum mit hellen Softboxen. Daraus erzeugt three.js eine
// vorgefilterte Umgebungskarte (PMREM) für realistische PBR-Spiegelungen auf Lack und Metall.
import * as THREE from 'three'

function softbox(w: number, h: number, pos: [number, number, number], intensity: number, color = 0xffffff): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }),
  )
  m.position.set(...pos)
  m.lookAt(0, 0, 0)
  return m
}

/** Baut die Studio-Umgebung und gibt die PMREM-Textur zurück */
export function studioEnvironment(renderer: THREE.WebGLRenderer): { texture: THREE.Texture; dispose: () => void } {
  const scene = new THREE.Scene()
  // Dunkler Raum mit leichtem Verlauf (Boden etwas heller als Decke)
  const roomGeo = new THREE.SphereGeometry(60, 32, 16)
  const colors: number[] = []
  const pos = roomGeo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 60
    const v = 0.035 + Math.max(0, -y) * 0.05
    colors.push(v, v, v * 1.1)
  }
  roomGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  scene.add(new THREE.Mesh(roomGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })))

  // Hauptlicht oben links, große weiche Box
  scene.add(softbox(26, 16, [-18, 20, 22], 9))
  // Aufhelllicht rechts
  scene.add(softbox(18, 12, [26, 6, 16], 3.2))
  // Streiflicht von hinten (schmale Leiste) für helle Kanten
  scene.add(softbox(5, 34, [10, 8, -28], 10))
  scene.add(softbox(5, 34, [-14, 8, -26], 6))
  // Deckenleiste für einen langen Glanzstreifen auf Lauf und Gehäuse
  scene.add(softbox(44, 3, [0, 30, 4], 6))
  // Frontlicht für die Inventar-Ansicht (Kamera schaut von +Z)
  scene.add(softbox(30, 10, [4, 2, 34], 2.2))
  // Warmes Bodenlicht von unten
  scene.add(softbox(40, 40, [0, -30, 6], 0.25, 0xffe2c0))

  const pmrem = new THREE.PMREMGenerator(renderer)
  const rt = pmrem.fromScene(scene, 0.015)
  pmrem.dispose()
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh
    mesh.geometry?.dispose()
    ;(mesh.material as THREE.Material | undefined)?.dispose?.()
  })
  return { texture: rt.texture, dispose: () => rt.dispose() }
}

/** Renderer-Einstellungen für fotorealistische Darstellung */
export function setupRenderer(renderer: THREE.WebGLRenderer) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  renderer.outputColorSpace = THREE.SRGBColorSpace
}
