import type { DeskSummary, RoomId } from '../types'

export type CameraCommand = 'zoom-in' | 'zoom-out' | 'overview' | 'follow'

export interface CameraState {
  zoom: number
  mode: 'follow' | 'overview'
}

/**
 * Único canal entre React e Phaser. A interface nunca toca na cena e a cena
 * nunca importa componentes, o que deixa as duas metades trocáveis.
 */
export interface BusEvents {
  // React -> Phaser
  'desks:update': DeskSummary[]
  'desk:selected': string | null
  'camera:command': CameraCommand
  // Phaser -> React
  'desk:click': string
  'room:enter': RoomId | null
  'camera:state': CameraState
}

type EventKey = keyof BusEvents
type Listener<K extends EventKey> = (payload: BusEvents[K]) => void
type StoredListener = (payload: unknown) => void

/**
 * Eventos retidos: o último valor é reenviado a quem assinar depois.
 * A cena Phaser nasce depois do primeiro render do React, então sem isso
 * ela perderia o estado inicial das mesas.
 */
const LATCHED: EventKey[] = ['desks:update', 'desk:selected']

const listeners = new Map<EventKey, Set<StoredListener>>()
const latest = new Map<EventKey, unknown>()

export function on<K extends EventKey>(key: K, listener: Listener<K>): () => void {
  const stored = listener as unknown as StoredListener
  let set = listeners.get(key)
  if (!set) {
    set = new Set()
    listeners.set(key, set)
  }
  set.add(stored)

  if (LATCHED.includes(key) && latest.has(key)) {
    listener(latest.get(key) as BusEvents[K])
  }

  return () => {
    listeners.get(key)?.delete(stored)
  }
}

export function emit<K extends EventKey>(key: K, payload: BusEvents[K]): void {
  if (LATCHED.includes(key)) latest.set(key, payload)
  const set = listeners.get(key)
  if (!set) return
  for (const listener of [...set]) listener(payload as unknown)
}
