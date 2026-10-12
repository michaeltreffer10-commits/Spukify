import { useEffect, useRef } from 'react'

/** Konfetti-Regen für seltene Drops */
export function Confetti({ colors, amount = 160 }: { colors: string[]; amount?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const g = canvas.getContext('2d')
    if (!g) return
    const dpr = Math.min(2, window.devicePixelRatio)
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    g.scale(dpr, dpr)
    const parts = Array.from({ length: amount }, (_, i) => ({
      x: w / 2 + (Math.random() - 0.5) * 80,
      y: h * 0.35,
      vx: (Math.random() - 0.5) * 14,
      vy: -6 - Math.random() * 12,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      s: 5 + Math.random() * 7,
      c: colors[i % colors.length],
    }))
    const start = performance.now()
    let frame = 0
    const loop = (now: number) => {
      const t = now - start
      g.clearRect(0, 0, w, h)
      g.globalAlpha = Math.max(0, 1 - t / 3200)
      for (const p of parts) {
        p.vy += 0.35
        p.vx *= 0.99
        p.x += p.vx
        p.y += p.vy
        p.r += p.vr
        g.save()
        g.translate(p.x, p.y)
        g.rotate(p.r)
        g.fillStyle = p.c
        g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2)
        g.restore()
      }
      if (t < 3200) frame = requestAnimationFrame(loop)
      else g.clearRect(0, 0, w, h)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [colors, amount])
  return <canvas ref={ref} className="confetti" aria-hidden="true" />
}
