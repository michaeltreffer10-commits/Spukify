// Waffenschmiede – Geometrie-Baukasten.
// Koordinaten in Millimetern: +X = Richtung Mündung, +Y = oben, Z = Breite (rechts = +Z).
// Jede Funktion liefert fertige Geometrie im Modellraum (Transformationen sind „eingebacken“),
// damit Shader direkt mit Modellkoordinaten arbeiten können (triplanare Projektion, Abnutzung).
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'

/** Material-Slots: welches Material ein Teil bekommt */
export type Slot = 'paint' | 'metal' | 'darkMetal' | 'polymer' | 'wood' | 'rubber' | 'glass'

export interface Part {
  name: string
  slot: Slot
  geometry: THREE.BufferGeometry
}

const loader = new SVGLoader()

/**
 * Wandelt einen SVG-Pfad in Shapes um. Die Zahlen werden genau so übernommen,
 * wie sie im Pfad stehen (Y zeigt hier nach OBEN, nicht wie in SVG nach unten).
 */
export function shapes(d: string, evenOdd = false): THREE.Shape[] {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"${evenOdd ? ' fill-rule="evenodd"' : ''}/></svg>`
  return loader.parse(svg).paths.flatMap((p) => SVGLoader.createShapes(p))
}

interface ProfileOpts {
  /** Gesamtdicke in Z */
  thickness: number
  /** Rundung der Kanten */
  bevel?: number
  /** Verschiebung der Mitte in Z */
  z?: number
  evenOdd?: boolean
  curveSegments?: number
}

/**
 * Seitenprofil: Umriss in der X/Y-Ebene, mit Dicke in Z und abgerundeten Kanten.
 * Für Schaft, Griff, Magazin, Abzugsbügel, Hebel …
 */
export function profile(d: string, o: ProfileOpts): THREE.BufferGeometry {
  const bevel = Math.min(o.bevel ?? 1.5, o.thickness / 2 - 0.05)
  const depth = Math.max(0.01, o.thickness - 2 * bevel)
  const geo = new THREE.ExtrudeGeometry(shapes(d, o.evenOdd), {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: 5,
    curveSegments: o.curveSegments ?? 24,
  })
  geo.translate(0, 0, -depth / 2 + (o.z ?? 0))
  return geo
}

interface SectionOpts {
  /** Anfang und Ende entlang X */
  from: number
  to: number
  bevel?: number
  curveSegments?: number
}

/**
 * Querschnitt: Umriss in der Z/Y-Ebene (Breite/Höhe), entlang X gezogen.
 * Für Staubschutzdeckel, Handschutz, Schienen, Gehäuse mit gewölbtem Profil …
 * Im Pfad ist X = Breite (Z der Waffe), Y = Höhe.
 */
export function section(d: string, o: SectionOpts): THREE.BufferGeometry {
  const bevel = o.bevel ?? 1
  const len = o.to - o.from
  const depth = Math.max(0.01, len - 2 * bevel)
  const geo = new THREE.ExtrudeGeometry(shapes(d), {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: 3,
    curveSegments: o.curveSegments ?? 20,
  })
  // Extrusion läuft entlang +Z → auf +X drehen
  geo.rotateY(Math.PI / 2)
  geo.translate(o.from + bevel, 0, 0)
  return geo
}

/**
 * Drehkörper entlang X: Punkte als [Radius, x]. Für Lauf, Schalldämpfer,
 * Mündungsbremse, Zielfernrohr, Schrauben …
 */
export function lathe(points: [r: number, x: number][], o: { y?: number; z?: number; segments?: number } = {}): THREE.BufferGeometry {
  const geo = new THREE.LatheGeometry(
    points.map(([r, x]) => new THREE.Vector2(Math.max(0.0001, r), x)),
    o.segments ?? 40,
  )
  // Lathe dreht um Y → Achse auf X legen
  geo.rotateZ(-Math.PI / 2)
  geo.translate(0, o.y ?? 0, o.z ?? 0)
  return geo
}

/** Einfacher Zylinder entlang X (mit Deckeln) */
export function rod(x0: number, x1: number, r: number, y = 0, z = 0, segments = 32): THREE.BufferGeometry {
  return lathe(
    [
      [0, x0],
      [r, x0],
      [r, x1],
      [0, x1],
    ],
    { y, z, segments },
  )
}

/** Zylinder entlang Z (z. B. Nieten, Bolzen, Knöpfe an der Seite) */
export function pin(x: number, y: number, r: number, z0: number, z1: number, segments = 20): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(r, r, z1 - z0, segments)
  geo.rotateX(Math.PI / 2)
  geo.translate(x, y, (z0 + z1) / 2)
  return geo
}

/** Quader mit abgerundeten Kanten, über seine Grenzen angegeben */
export function block(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, radius = 1.2): THREE.BufferGeometry {
  const w = x1 - x0
  const h = y1 - y0
  const d = z1 - z0
  const r = Math.min(radius, w / 2 - 0.01, h / 2 - 0.01, d / 2 - 0.01)
  const geo = new RoundedBoxGeometry(w, h, d, 3, Math.max(0.01, r))
  geo.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
  return geo
}

/** Viele gleiche Teile entlang X verteilen (z. B. Schienen-Zähne, Rillen) */
export function repeatX(make: (x: number) => THREE.BufferGeometry, x0: number, x1: number, step: number): THREE.BufferGeometry[] {
  const list: THREE.BufferGeometry[] = []
  for (let x = x0; x <= x1 + 0.001; x += step) list.push(make(x))
  return list
}

/** Geometrie drehen um einen Punkt (Winkel in Grad, Achse Z = Neigung in der Seitenansicht) */
export function tiltZ(geo: THREE.BufferGeometry, deg: number, cx: number, cy: number): THREE.BufferGeometry {
  geo.translate(-cx, -cy, 0)
  geo.rotateZ((deg * Math.PI) / 180)
  geo.translate(cx, cy, 0)
  return geo
}

/** Hilfsfunktion zum Sammeln von Teilen */
export class PartList {
  parts: Part[] = []
  add(name: string, slot: Slot, ...geometries: THREE.BufferGeometry[]) {
    for (const geometry of geometries) this.parts.push({ name, slot, geometry })
    return this
  }
}
