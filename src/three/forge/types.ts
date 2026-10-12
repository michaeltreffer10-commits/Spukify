import type { Part } from './geometry'

export interface ForgeModel {
  name: string
  /** Baut alle Teile der Waffe im Modellraum (Millimeter) */
  build: () => Part[]
  /** Sticker-Plätze auf der rechten Seite (zeigen nach +Z) */
  stickers: { x: number; y: number; z: number }[]
}
