/**
 * Gerador determinístico. O mock precisa ser igual em todo carregamento,
 * então nada de Math.random em nenhum ponto de src/data/mock.
 */
export function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashSeed(text: string): number {
  let hash = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function pick<T>(next: () => number, list: readonly T[]): T {
  return list[Math.floor(next() * list.length) % list.length]
}

export function between(next: () => number, min: number, max: number): number {
  return Math.round(min + next() * (max - min))
}
