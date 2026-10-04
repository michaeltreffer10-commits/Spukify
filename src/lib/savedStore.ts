// Merkt sich, welche Songs/Alben/Künstler/Playlists in deiner Bibliothek sind.
// Anfragen werden gesammelt und gebündelt an Spotify geschickt (max. 40 URIs pro Anfrage).

import { useEffect, useSyncExternalStore } from 'react'
import { api } from './spotify'

const saved = new Map<string, boolean>()
const pending = new Set<string>()
const inFlight = new Set<string>()
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setTimeout> | null = null
let version = 0

function emit() {
  version++
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

async function flush() {
  timer = null
  const uris = [...pending]
  pending.clear()
  if (!uris.length) return
  uris.forEach((u) => inFlight.add(u))
  try {
    const result = await api.libraryContains(uris)
    uris.forEach((u, i) => saved.set(u, !!result[i]))
    emit()
  } catch {
    // Wenn die Abfrage fehlschlägt, zeigen wir einfach „nicht gespeichert“ an.
  } finally {
    uris.forEach((u) => inFlight.delete(u))
  }
}

function ensure(uris: string[]) {
  let added = false
  for (const u of uris) {
    if (!u || u.startsWith('spotify:local:') || saved.has(u) || pending.has(u) || inFlight.has(u)) continue
    pending.add(u)
    added = true
  }
  if (added && !timer) timer = setTimeout(flush, 40)
}

export function resetSavedStore() {
  saved.clear()
  pending.clear()
  emit()
}

export function isSaved(uri: string) {
  return saved.get(uri) ?? false
}

/** Setzt den Status sofort (optimistisch) und speichert ihn bei Spotify. */
export async function setSaved(uri: string, value: boolean) {
  const before = saved.get(uri)
  saved.set(uri, value)
  emit()
  try {
    if (value) await api.librarySave([uri])
    else await api.libraryRemove([uri])
  } catch (e) {
    if (before === undefined) saved.delete(uri)
    else saved.set(uri, before)
    emit()
    throw e
  }
}

/** Liefert für eine Liste von URIs, ob sie gespeichert sind (lädt fehlende automatisch nach). */
export function useSavedMap(uris: string[]): (uri: string) => boolean | undefined {
  const key = uris.join(',')
  useEffect(() => {
    ensure(uris)
  }, [key])
  useSyncExternalStore(subscribe, () => version)
  return (uri: string) => saved.get(uri)
}

export function useSaved(uri: string | undefined): boolean | undefined {
  const get = useSavedMap(uri ? [uri] : [])
  return uri ? get(uri) : undefined
}
