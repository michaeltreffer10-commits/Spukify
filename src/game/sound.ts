// Kleine Soundeffekte, direkt im Browser erzeugt (keine Audiodateien nötig).
import type { RarityId } from './data'

let ctx: AudioContext | null = null
let enabled = true

export function setSoundEnabled(on: boolean) {
  enabled = on
}

function audio(): AudioContext | null {
  if (!enabled) return null
  if (!ctx) {
    try {
      ctx = new AudioContext()
    } catch {
      return null
    }
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.15) {
  const a = audio()
  if (!a) return
  const t = a.currentTime + start
  const osc = a.createOscillator()
  const gain = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(gain).connect(a.destination)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

let lastTick = 0
/** Das typische Klicken, wenn das Band an einem Gegenstand vorbeiläuft */
export function tick() {
  const now = performance.now()
  if (now - lastTick < 28) return
  lastTick = now
  tone(1900, 0, 0.03, 'square', 0.05)
}

const REVEAL: Record<RarityId, number[]> = {
  blau: [440, 554],
  lila: [440, 554, 659],
  pink: [523, 659, 784, 988],
  rot: [523, 659, 784, 1047, 1319],
  gold: [659, 831, 988, 1319, 1661, 1976],
  mac: [196, 247, 294, 392, 494, 587, 784],
}

export function reveal(rarity: RarityId) {
  const notes = REVEAL[rarity]
  notes.forEach((f, i) => tone(f, i * 0.07, 0.35, rarity === 'mac' ? 'sawtooth' : 'triangle', 0.12))
}

export function coin() {
  tone(988, 0, 0.08, 'square', 0.06)
  tone(1319, 0.07, 0.15, 'square', 0.06)
}

export function hit() {
  tone(660, 0, 0.06, 'triangle', 0.1)
}

export function miss() {
  tone(140, 0, 0.12, 'sawtooth', 0.06)
}
