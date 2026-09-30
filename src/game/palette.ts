import type { RoomId } from '../types'

/** Paleta única do mapa. Tons dessaturados para o pixel art ficar coeso. */
export const PALETTE = {
  exterior: '#0d1014',
  exteriorLine: '#141922',

  wallBase: '#39414f',
  wallTop: '#4d5768',
  wallSeam: '#282f3a',
  wallSpeck: '#434c5c',

  roomFloorA: '#cfc1a5',
  roomFloorB: '#c8b99b',
  roomGrout: '#bcab8c',
  roomSpeck: '#d6c9af',

  corridorA: '#9ba2b1',
  corridorB: '#949cab',
  corridorGrout: '#8a92a1',
  corridorSpeck: '#a5acba',

  atriumA: '#a9b4a3',
  atriumB: '#a1ac9b',
  atriumGrout: '#97a291',

  doorBase: '#8d7050',
  doorLight: '#a3855f',
  doorEdge: '#6a523a',

  deskTop: '#8d6c4b',
  deskTopLight: '#a5825c',
  deskGrain: '#7c5d3f',
  deskEdge: '#5b4530',

  monitorBody: '#2b313c',
  monitorEdge: '#171c23',
  keyboard: '#cfd3db',

  chairBase: '#424a5c',
  chairLight: '#545d72',
  chairDark: '#2c3341',

  potBase: '#a1613e',
  potLight: '#b97a52',
  leafDark: '#2d6640',
  leaf: '#3d8450',
  leafLight: '#52a265',

  paper: '#f4efe4',
  paperLine: '#c6bca6',

  sofaBase: '#4a5369',
  sofaLight: '#5c667e',

  skin: '#e5b78d',
  skinShade: '#c8996f',
  hair: '#2a2018',
  shirt: '#3d8f8a',
  shirtShade: '#2f736f',
  pants: '#37405a',
  pantsShade: '#2a3145',
  shoe: '#20242e',

  dropShadow: 'rgba(11,14,19,0.32)',
} as const

/** Cor de identidade de cada sala. Usada em piso, placa e telas das mesas. */
export const ROOM_ACCENT: Record<RoomId, string> = {
  recepcao: '#3d8f8a',
  conteudo: '#c2803f',
  sites: '#4a7fb5',
  seo_local: '#5b9b4d',
  midia_paga: '#a8524f',
  revisao: '#8a6bb0',
  reuniao: '#3f829e',
  diretoria: '#b08a2e',
}

export function toNum(hex: string): number {
  return parseInt(hex.slice(1), 16)
}

export function withAlpha(hex: string, alpha: number): string {
  const n = toNum(hex)
  const r = (n >> 16) & 0xff
  const g = (n >> 8) & 0xff
  const b = n & 0xff
  return `rgba(${r},${g},${b},${alpha})`
}

export function mix(hex: string, target: string, amount: number): string {
  const a = toNum(hex)
  const b = toNum(target)
  const blend = (shift: number) => {
    const ca = (a >> shift) & 0xff
    const cb = (b >> shift) & 0xff
    return Math.round(ca + (cb - ca) * amount)
  }
  const value = (blend(16) << 16) | (blend(8) << 8) | blend(0)
  return `#${value.toString(16).padStart(6, '0')}`
}
