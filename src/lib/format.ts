export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatLongDuration(ms: number): string {
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `${minutes} Min.`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} Std. ${m} Min.` : `${h} Std.`
}

export function formatDate(iso?: string): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000)
  if (diffDays < 1) return 'Heute'
  if (diffDays < 2) return 'Gestern'
  if (diffDays < 7) return `Vor ${diffDays} Tagen`
  if (diffDays < 30) {
    const w = Math.floor(diffDays / 7)
    return w === 1 ? 'Vor 1 Woche' : `Vor ${w} Wochen`
  }
  return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function year(date?: string): string {
  return date ? date.slice(0, 4) : ''
}

export function artistNames(artists: { name: string }[] | undefined): string {
  return (artists ?? []).map((a) => a.name).join(', ')
}

export function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Gute Nacht'
  if (h < 11) return 'Guten Morgen'
  if (h < 18) return 'Guten Tag'
  return 'Guten Abend'
}

/** Liefert für einen Text immer denselben Farbton (0–359). */
export function hashHue(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0
  return h % 360
}

export function stripHtml(html?: string | null): string {
  if (!html) return ''
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || ''
}

export function plural(n: number, one: string, many: string) {
  return `${n.toLocaleString('de-DE')} ${n === 1 ? one : many}`
}
