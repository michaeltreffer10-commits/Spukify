// Sound-Engine: Alle Geräusche werden live im Browser erzeugt (keine Audiodateien).
// Signalweg: Klänge → (trocken + Hall) → Kompressor → Lautsprecher
import type { RarityId } from './data'

let ctx: AudioContext | null = null
let master: GainNode
let reverbIn: GainNode
let noiseBuf: AudioBuffer

const settings = { sound: true, meme: true, voice: true }

export function configureSound(next: Partial<typeof settings>) {
  Object.assign(settings, next)
  if (!settings.sound && typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
}

function impulse(a: AudioContext, seconds: number, decay: number): AudioBuffer {
  const len = Math.floor(a.sampleRate * seconds)
  const buf = a.createBuffer(2, len, a.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
  }
  return buf
}

function audio(): AudioContext | null {
  if (!settings.sound) return null
  if (!ctx) {
    try {
      ctx = new AudioContext()
    } catch {
      return null
    }
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -16
    comp.knee.value = 12
    comp.ratio.value = 6
    master = ctx.createGain()
    master.gain.value = 0.9
    master.connect(comp).connect(ctx.destination)

    const conv = ctx.createConvolver()
    conv.buffer = impulse(ctx, 2.4, 3)
    reverbIn = ctx.createGain()
    const wet = ctx.createGain()
    wet.gain.value = 0.35
    reverbIn.connect(conv).connect(wet).connect(master)

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

interface ToneOpts {
  type?: OscillatorType
  freq: number
  /** Ton gleitet bis zu dieser Frequenz */
  to?: number
  at?: number
  dur: number
  vol?: number
  attack?: number
  /** Anteil Hall 0–1 */
  wet?: number
  detune?: number
  /** Tiefpass-Filter */
  lp?: number
  /** Vibrato in Hz */
  vibrato?: number
}

function tone(o: ToneOpts) {
  const a = audio()
  if (!a) return
  const t = a.currentTime + (o.at ?? 0)
  const osc = a.createOscillator()
  const g = a.createGain()
  osc.type = o.type ?? 'sine'
  osc.frequency.setValueAtTime(o.freq, t)
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + o.dur)
  if (o.detune) osc.detune.value = o.detune
  if (o.vibrato) {
    const lfo = a.createOscillator()
    const lg = a.createGain()
    lfo.frequency.value = o.vibrato
    lg.gain.value = o.freq * 0.03
    lfo.connect(lg).connect(osc.frequency)
    lfo.start(t)
    lfo.stop(t + o.dur + 0.1)
  }
  const vol = o.vol ?? 0.2
  const atk = o.attack ?? 0.005
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + atk)
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur)
  let node: AudioNode = osc
  if (o.lp) {
    const f = a.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = o.lp
    node.connect(f)
    node = f
  }
  node.connect(g)
  g.connect(master)
  if (o.wet) {
    const s = a.createGain()
    s.gain.value = o.wet
    g.connect(s).connect(reverbIn)
  }
  osc.start(t)
  osc.stop(t + o.dur + 0.05)
}

interface NoiseOpts {
  at?: number
  dur: number
  vol?: number
  type?: BiquadFilterType
  freq: number
  to?: number
  q?: number
  wet?: number
  attack?: number
}

function noise(o: NoiseOpts) {
  const a = audio()
  if (!a) return
  const t = a.currentTime + (o.at ?? 0)
  const src = a.createBufferSource()
  src.buffer = noiseBuf
  src.loop = true
  const f = a.createBiquadFilter()
  f.type = o.type ?? 'bandpass'
  f.frequency.setValueAtTime(o.freq, t)
  if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + o.dur)
  f.Q.value = o.q ?? 1
  const g = a.createGain()
  const vol = o.vol ?? 0.2
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + (o.attack ?? 0.004))
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur)
  src.connect(f).connect(g).connect(master)
  if (o.wet) {
    const s = a.createGain()
    s.gain.value = o.wet
    g.connect(s).connect(reverbIn)
  }
  src.start(t, Math.random())
  src.stop(t + o.dur + 0.05)
}

const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12)

// ---------- Case & Band ----------

let lastTick = 0
/** Klicken, wenn das Band an einem Gegenstand vorbeiläuft */
export function tick() {
  const now = performance.now()
  if (now - lastTick < 26) return
  lastTick = now
  noise({ dur: 0.025, vol: 0.18, type: 'highpass', freq: 3200 })
  tone({ type: 'triangle', freq: 2400, to: 1800, dur: 0.03, vol: 0.05 })
}

export function caseDrop() {
  tone({ type: 'sine', freq: 110, to: 45, dur: 0.35, vol: 0.5, wet: 0.2 })
  noise({ dur: 0.18, vol: 0.25, type: 'lowpass', freq: 900, to: 200 })
}

export function caseRattle(intensity: number) {
  noise({ dur: 0.06, vol: 0.06 + intensity * 0.12, type: 'bandpass', freq: 1400 + Math.random() * 1200, q: 3 })
  tone({ type: 'square', freq: 180 + Math.random() * 80, dur: 0.04, vol: 0.03 + intensity * 0.04, lp: 1200 })
}

export function caseOpen() {
  noise({ dur: 0.5, vol: 0.3, type: 'bandpass', freq: 400, to: 4000, q: 0.7, attack: 0.2 })
  tone({ type: 'square', freq: 900, dur: 0.05, vol: 0.08, at: 0.22, lp: 3000 })
  tone({ type: 'sine', freq: 90, to: 40, dur: 0.6, vol: 0.45, at: 0.25, wet: 0.4 })
  noise({ dur: 0.9, vol: 0.12, type: 'highpass', freq: 5000, at: 0.25, wet: 0.6 })
}

const CHORDS: Record<RarityId, number[]> = {
  blau: [60, 64, 67],
  lila: [62, 66, 69, 74],
  pink: [64, 68, 71, 76, 80],
  rot: [57, 64, 69, 73, 76, 81],
  gold: [60, 67, 72, 76, 79, 84, 88],
  mac: [45, 52, 57, 60, 64, 69],
}

/** Ergebnis-Sound, je seltener desto größer */
export function reveal(rarity: RarityId) {
  const notes = CHORDS[rarity]
  const big = rarity === 'rot' || rarity === 'gold' || rarity === 'mac'
  notes.forEach((n, i) => {
    tone({ type: 'triangle', freq: NOTE(n), at: i * 0.06, dur: big ? 1.6 : 0.7, vol: 0.09, wet: 0.5 })
    if (big) tone({ type: 'sawtooth', freq: NOTE(n), at: i * 0.06, dur: 1.8, vol: 0.035, lp: 2400, detune: 8, wet: 0.6 })
  })
  if (rarity !== 'blau') noise({ at: 0.05, dur: 0.8, vol: 0.06, type: 'highpass', freq: 7000, wet: 0.7 })
  if (big) {
    tone({ type: 'sine', freq: 70, to: 35, dur: 0.9, vol: 0.5, wet: 0.3 })
    noise({ dur: 0.6, vol: 0.18, type: 'lowpass', freq: 1200, to: 120 })
  }
  if (rarity === 'gold' || rarity === 'mac') {
    // Glitzer
    for (let i = 0; i < 10; i++) tone({ type: 'sine', freq: NOTE(84 + ((i * 5) % 12)), at: 0.3 + i * 0.07, dur: 0.25, vol: 0.04, wet: 0.8 })
  }
}

// ---------- Münzen & Belohnungen ----------

export function coin() {
  tone({ type: 'square', freq: NOTE(83), dur: 0.08, vol: 0.06, lp: 6000 })
  tone({ type: 'square', freq: NOTE(88), at: 0.07, dur: 0.35, vol: 0.06, lp: 6000, wet: 0.3 })
  tone({ type: 'sine', freq: NOTE(100), at: 0.07, dur: 0.3, vol: 0.04 })
  noise({ at: 0.07, dur: 0.12, vol: 0.05, type: 'highpass', freq: 8000 })
}

export function levelUp() {
  const seq = [60, 64, 67, 72, 76, 79, 84]
  seq.forEach((n, i) => tone({ type: 'square', freq: NOTE(n), at: i * 0.07, dur: 0.2, vol: 0.05, lp: 4000, wet: 0.3 }))
  ;[72, 76, 79, 84].forEach((n) => tone({ type: 'sawtooth', freq: NOTE(n), at: 0.5, dur: 1.4, vol: 0.04, lp: 3000, detune: 6, wet: 0.5 }))
  tone({ type: 'sine', freq: 60, to: 40, at: 0.5, dur: 0.7, vol: 0.4 })
}

export function achievement() {
  tone({ type: 'sine', freq: NOTE(88), dur: 0.5, vol: 0.12, wet: 0.6 })
  tone({ type: 'sine', freq: NOTE(95), at: 0.12, dur: 0.8, vol: 0.12, wet: 0.6 })
  tone({ type: 'triangle', freq: NOTE(76), at: 0.12, dur: 0.8, vol: 0.06, wet: 0.5 })
  noise({ at: 0.1, dur: 0.6, vol: 0.05, type: 'highpass', freq: 8000, wet: 0.8 })
}

export function click() {
  tone({ type: 'sine', freq: 900, to: 600, dur: 0.05, vol: 0.06 })
}

export function error() {
  tone({ type: 'square', freq: 140, dur: 0.18, vol: 0.06, lp: 900 })
  tone({ type: 'square', freq: 110, at: 0.12, dur: 0.25, vol: 0.06, lp: 900 })
}

// ---------- Minispiele ----------

export function shot() {
  noise({ dur: 0.12, vol: 0.35, type: 'lowpass', freq: 5000, to: 600 })
  tone({ type: 'sine', freq: 160, to: 50, dur: 0.12, vol: 0.35 })
}

export function hit() {
  shot()
  tone({ type: 'triangle', freq: 880, dur: 0.08, vol: 0.08, at: 0.02 })
}

/** Das berühmte „Dink“ beim Kopfschuss */
export function headshot() {
  shot()
  tone({ type: 'sine', freq: NOTE(96), dur: 0.6, vol: 0.14, at: 0.02, wet: 0.4 })
  tone({ type: 'sine', freq: NOTE(103), dur: 0.4, vol: 0.06, at: 0.02, wet: 0.4 })
}

export function miss() {
  shot()
  tone({ type: 'sine', freq: 220, to: 120, dur: 0.15, vol: 0.08, at: 0.03 })
}

export function bombBeep(urgent = false) {
  tone({ type: 'sine', freq: urgent ? 2100 : 1800, dur: 0.09, vol: 0.13 })
}

export function wireCut() {
  noise({ dur: 0.05, vol: 0.3, type: 'highpass', freq: 3000 })
  tone({ type: 'square', freq: 2400, to: 900, dur: 0.06, vol: 0.05 })
}

export function explosion() {
  noise({ dur: 2.2, vol: 0.7, type: 'lowpass', freq: 3000, to: 60, wet: 0.5 })
  tone({ type: 'sine', freq: 90, to: 25, dur: 1.6, vol: 0.8 })
  noise({ at: 0.05, dur: 1.2, vol: 0.2, type: 'bandpass', freq: 600, to: 150, q: 0.5, wet: 0.6 })
}

export function defused() {
  ;[67, 72, 76].forEach((n, i) => tone({ type: 'triangle', freq: NOTE(n), at: i * 0.1, dur: 0.6, vol: 0.1, wet: 0.4 }))
}

export function readyGo() {
  tone({ type: 'square', freq: NOTE(84), dur: 0.12, vol: 0.07, lp: 5000 })
}

// ---------- Meme-Sounds ----------

/** MLG-Airhorn: BWAAP BWAAP BWAAAAP */
export function airhorn() {
  if (!settings.meme) return
  const blasts = [
    [0, 0.18],
    [0.24, 0.18],
    [0.48, 0.8],
  ]
  for (const [at, dur] of blasts) {
    for (const [f, det] of [
      [415, 0],
      [415, 12],
      [622, -7],
      [830, 5],
    ]) {
      tone({ type: 'sawtooth', freq: f, to: f * 0.97, at, dur, vol: 0.06, detune: det, lp: 3200, attack: 0.01, wet: 0.2 })
    }
  }
}

/** Trauriges Posaunen-Wah-wah-wah-waaah */
export function sadTrombone() {
  if (!settings.meme) return
  const notes = [
    [55, 0, 0.42],
    [54, 0.45, 0.42],
    [53, 0.9, 0.42],
    [52, 1.35, 1.4],
  ] as const
  for (const [n, at, dur] of notes) {
    tone({ type: 'sawtooth', freq: NOTE(n), at, dur, vol: 0.09, lp: 900, attack: 0.05, vibrato: n === 52 ? 6 : 0, wet: 0.25 })
    tone({ type: 'square', freq: NOTE(n - 12), at, dur, vol: 0.03, lp: 500, attack: 0.05 })
  }
}

/** Clown-Hupe */
export function honk() {
  if (!settings.meme) return
  tone({ type: 'square', freq: 330, to: 300, dur: 0.18, vol: 0.08, lp: 1800 })
  tone({ type: 'square', freq: 392, to: 350, at: 0.22, dur: 0.25, vol: 0.08, lp: 1800 })
}

/** Trommelwirbel + Becken */
export function drumroll(seconds = 1.2) {
  if (!settings.meme) return
  const hits = Math.floor(seconds * 22)
  for (let i = 0; i < hits; i++) noise({ at: i / 22, dur: 0.05, vol: 0.05 + (i / hits) * 0.12, type: 'bandpass', freq: 1800, q: 1.5 })
  noise({ at: seconds, dur: 1.5, vol: 0.25, type: 'highpass', freq: 5000, wet: 0.6 })
  tone({ type: 'sine', freq: 70, to: 40, at: seconds, dur: 0.5, vol: 0.4 })
}

let lastSpeak = 0
/** Sprachausgabe für Ansagen wie „Terroristen gewinnen“ */
export function speak(text: string, pitch = 1) {
  if (!settings.sound || !settings.voice || typeof speechSynthesis === 'undefined') return
  const now = Date.now()
  if (now - lastSpeak < 800) return
  lastSpeak = now
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'de-DE'
  const voice = speechSynthesis.getVoices().find((v) => v.lang.startsWith('de'))
  if (voice) u.voice = voice
  u.rate = 1.05
  u.pitch = pitch
  u.volume = 0.9
  speechSynthesis.cancel()
  speechSynthesis.speak(u)
}
