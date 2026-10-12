// Waffenschmiede – Material-Pipeline.
// Jeder Slot bekommt ein physikalisch basiertes Material (PBR: Grundfarbe, Metallic, Roughness,
// Klarlack, Normalen). Der Lack-Slot projiziert das Skin-Muster triplanar über die Modellkoordinaten,
// so braucht es kein UV-Layout und das Muster läuft nahtlos über alle Teile.
import * as THREE from 'three'
import { patternMarkup } from '../../game/art'
import type { Skin } from '../../game/data'
import type { Slot } from './geometry'

/** Pattern-Seed (0–1000) → Verschiebung, Drehung, Skalierung des Musters (immer gleich für denselben Seed) */
export function seedTransform(seed: number) {
  let s = (Math.floor(seed) * 2654435761) >>> 0
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
  return { ox: rnd() * 256, oy: rnd() * 256, rot: (rnd() - 0.5) * 40, scale: 0.85 + rnd() * 0.3 }
}

/** Muster als Textur. Der Seed wird direkt beim Zeichnen eingerechnet, damit keine Nähte entstehen. */
export async function patternTexture(skin: Skin, seed: number): Promise<THREE.CanvasTexture> {
  const t = seedTransform(seed)
  // Verläufe (Fade) bleiben fest ausgerichtet, nur leicht verschoben – wie die Fade-Prozente in CS2
  const gradient = skin.pattern === 'fade' || skin.pattern === 'solid'
  const transform = gradient
    ? `translate(${(t.ox / 256 - 0.5) * 30} 0)`
    : `translate(128 128) rotate(${t.rot}) scale(${t.scale}) translate(${-128 - t.ox} ${-128 - t.oy})`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 256 256"><defs>${patternMarkup(
    'p',
    skin.pattern,
    skin.colors,
  )}</defs><g transform="${transform}"><rect x="-512" y="-512" width="1536" height="1536" fill="url(#p)"/></g></svg>`
  const img = new Image()
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  await img.decode()
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1024
  canvas.getContext('2d')!.drawImage(img, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
  tex.anisotropy = 8
  return tex
}

export interface PaintParams {
  pattern: THREE.Texture
  /** Bereich des Modells (für die Projektion) */
  min: THREE.Vector3
  length: number
  float: number
}

/**
 * Lack mit triplanarer Muster-Projektion.
 * Schritt 2 erweitert diesen Shader um die CS2-Abnutzung (Wear-Masken, Kratzer, Kanten-Abrieb)
 * und die Skin-Arten (Custom Paint, Gunsmith, Anodized, Patina, Hydrographic, Spray-Paint).
 */
export function paintMaterial(p: PaintParams): THREE.MeshPhysicalMaterial {
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.05,
    roughness: 0.3 + p.float * 0.4,
    clearcoat: Math.max(0.1, 0.8 - p.float),
    clearcoatRoughness: 0.18,
  })
  const uniforms = {
    uPattern: { value: p.pattern },
    uMin: { value: p.min },
    uInvLen: { value: 1 / p.length },
  }
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vMPos;\nvarying vec3 vMNormal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMPos = position;\nvMNormal = normal;')
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform sampler2D uPattern;
uniform vec3 uMin;
uniform float uInvLen;
varying vec3 vMPos;
varying vec3 vMNormal;
// Triplanare Projektion: Seiten (XY), Oben/Unten (XZ), Vorne/Hinten (ZY)
vec3 triplanarPattern(vec3 pos, vec3 n) {
  vec3 w = pow(abs(normalize(n)), vec3(6.0));
  w /= (w.x + w.y + w.z);
  vec3 q = (pos - uMin) * uInvLen;
  vec3 side = texture2D(uPattern, vec2(q.x, q.y)).rgb;
  vec3 top = texture2D(uPattern, vec2(q.x, 0.5 + (pos.z * uInvLen))).rgb;
  vec3 front = texture2D(uPattern, vec2(0.5 + (pos.z * uInvLen), q.y)).rgb;
  return side * w.z + top * w.y + front * w.x;
}`,
      )
      .replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb *= triplanarPattern(vMPos, vMNormal);')
  }
  mat.customProgramCacheKey = () => 'forge-paint-v1'
  return mat
}

/** Prozedurale Holzmaserung (für Holzteile, die ein Skin nicht lackiert) */
function woodTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 128
  const g = c.getContext('2d')!
  g.fillStyle = '#6b3a1c'
  g.fillRect(0, 0, 512, 128)
  for (let i = 0; i < 70; i++) {
    const y = Math.random() * 128
    g.strokeStyle = `rgba(${40 + Math.random() * 30},${18 + Math.random() * 12},${6},${0.25 + Math.random() * 0.35})`
    g.lineWidth = 0.6 + Math.random() * 2
    g.beginPath()
    g.moveTo(0, y)
    for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x / 60 + i) * 3 + (Math.random() - 0.5) * 2)
    g.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

/** Alle Materialien für eine Waffe */
export function createMaterials(paint: PaintParams): Record<Slot, THREE.Material> {
  const wear = paint.float
  return {
    paint: paintMaterial(paint),
    // Brüniertes Stahl: dunkel, metallisch, leicht matt
    metal: new THREE.MeshPhysicalMaterial({ color: 0x6a6f78, metalness: 1, roughness: 0.26 + wear * 0.2 }),
    // Parkerisiertes Metall (Mündungsbremse, Schrauben): fast schwarz, rauer
    darkMetal: new THREE.MeshPhysicalMaterial({ color: 0x34363c, metalness: 0.9, roughness: 0.42 }),
    // Kunststoff (Griffe, Magazine moderner Waffen)
    polymer: new THREE.MeshPhysicalMaterial({ color: 0x17181b, metalness: 0, roughness: 0.62, sheen: 0.2 }),
    wood: new THREE.MeshPhysicalMaterial({ map: woodTexture(), metalness: 0, roughness: 0.48, clearcoat: 0.35 }),
    rubber: new THREE.MeshPhysicalMaterial({ color: 0x0f0f10, metalness: 0, roughness: 0.92 }),
    // Glas für Zielfernrohre
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x86b8d8,
      metalness: 0,
      roughness: 0.04,
      transmission: 0.6,
      thickness: 2,
      iridescence: 0.6,
      clearcoat: 1,
    }),
  }
}
