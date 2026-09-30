import type { RoomId } from '../types'
import { ROOM_ACCENT } from './palette'

export const TILE = 32
export const MAP_COLS = 59
export const MAP_ROWS = 50
export const MAP_W = MAP_COLS * TILE
export const MAP_H = MAP_ROWS * TILE

/** Índices do tileset gerado em textures.ts. */
export const TileIndex = {
  Exterior: 0,
  Wall: 1,
  RoomFloorA: 2,
  RoomFloorB: 3,
  CorridorA: 4,
  CorridorB: 5,
  Atrium: 6,
  Door: 7,
} as const

export const SOLID_TILES: number[] = [TileIndex.Exterior, TileIndex.Wall]

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface RoomDef {
  id: RoomId
  name: string
  /** frase curta mostrada no painel lateral */
  purpose: string
  accent: string
  /** retângulo em tiles, incluindo o anel de parede */
  rect: Rect
  /** vão da porta, em tiles, sobre a parede */
  door: Rect
}

/*
 * Grade do andar. Três colunas e três linhas de salas, com corredores de
 * 4 tiles entre elas. O centro fica aberto como praça interna (atrium),
 * o que mantém todos os corredores conectados.
 *
 *   colunas: 0..16 | corredor 17..20 | 21..37 | corredor 38..41 | 42..58
 *   linhas:  0..13 | corredor 14..17 | 18..31 | corredor 32..35 | 36..49
 */
const COL = [0, 21, 42]
const ROW = [0, 18, 36]
const ROOM_W = 17
const ROOM_H = 14

const CORRIDOR_COLS: Rect[] = [
  { x: 17, y: 0, w: 4, h: MAP_ROWS },
  { x: 38, y: 0, w: 4, h: MAP_ROWS },
]
const CORRIDOR_ROWS: Rect[] = [
  { x: 0, y: 14, w: MAP_COLS, h: 4 },
  { x: 0, y: 32, w: MAP_COLS, h: 4 },
]

export const ATRIUM: Rect = { x: COL[1], y: ROW[1], w: ROOM_W, h: ROOM_H }

function room(
  id: RoomId,
  name: string,
  purpose: string,
  col: number,
  row: number,
  door: Rect,
): RoomDef {
  return {
    id,
    name,
    purpose,
    accent: ROOM_ACCENT[id],
    rect: { x: COL[col], y: ROW[row], w: ROOM_W, h: ROOM_H },
    door,
  }
}

export const ROOMS: RoomDef[] = [
  room('conteudo', 'Conteúdo', 'Produção de artigos e pautas', 0, 0, { x: 16, y: 6, w: 1, h: 2 }),
  room('reuniao', 'Sala de Reunião', 'Alinhamentos com time e cliente', 1, 0, { x: 28, y: 13, w: 2, h: 1 }),
  room('sites', 'Sites', 'Construção e ajuste de páginas', 2, 0, { x: 42, y: 6, w: 1, h: 2 }),
  room('seo_local', 'SEO Local', 'Perfil no Google e Core 30', 0, 1, { x: 16, y: 24, w: 1, h: 2 }),
  room('midia_paga', 'Mídia Paga', 'Campanhas e criativos', 2, 1, { x: 42, y: 24, w: 1, h: 2 }),
  room('revisao', 'Revisão', 'Controle de qualidade antes da entrega', 0, 2, { x: 16, y: 42, w: 1, h: 2 }),
  room('recepcao', 'Recepção', 'Entrada de tarefas', 1, 2, { x: 28, y: 36, w: 2, h: 1 }),
  room('diretoria', 'Diretoria', 'Visão geral da operação', 2, 2, { x: 42, y: 42, w: 1, h: 2 }),
]

export const ROOM_BY_ID: Record<RoomId, RoomDef> = ROOMS.reduce(
  (acc, r) => {
    acc[r.id] = r
    return acc
  },
  {} as Record<RoomId, RoomDef>,
)

export interface DeskDef {
  id: string
  roomId: RoomId
  label: string
  /** canto superior esquerdo, em tiles */
  x: number
  y: number
  w: number
  h: number
  chairs: { x: number; y: number }[]
}

function desk(id: string, roomId: RoomId, label: string, x: number, y: number): DeskDef {
  return { id, roomId, label, x, y, w: 3, h: 2, chairs: [{ x: x + 1, y: y + 2 }] }
}

export const DESKS: DeskDef[] = [
  // Conteúdo (sala em 0,0)
  desk('con-1', 'conteudo', 'Mesa 1', 2, 3),
  desk('con-2', 'conteudo', 'Mesa 2', 10, 3),
  desk('con-3', 'conteudo', 'Mesa 3', 2, 8),
  desk('con-4', 'conteudo', 'Mesa 4', 10, 8),

  // Sites (sala em 42,0)
  desk('sit-1', 'sites', 'Mesa 1', 44, 3),
  desk('sit-2', 'sites', 'Mesa 2', 52, 3),
  desk('sit-3', 'sites', 'Mesa 3', 44, 8),
  desk('sit-4', 'sites', 'Mesa 4', 52, 8),

  // SEO Local (sala em 0,18)
  desk('seo-1', 'seo_local', 'Mesa 1', 2, 21),
  desk('seo-2', 'seo_local', 'Mesa 2', 10, 21),
  desk('seo-3', 'seo_local', 'Mesa 3', 2, 26),
  desk('seo-4', 'seo_local', 'Mesa 4', 10, 26),

  // Mídia Paga (sala em 42,18)
  desk('mid-1', 'midia_paga', 'Mesa 1', 44, 21),
  desk('mid-2', 'midia_paga', 'Mesa 2', 52, 21),
  desk('mid-3', 'midia_paga', 'Mesa 3', 44, 26),
  desk('mid-4', 'midia_paga', 'Mesa 4', 52, 26),

  // Revisão (sala em 0,36)
  desk('rev-1', 'revisao', 'Mesa 1', 2, 39),
  desk('rev-2', 'revisao', 'Mesa 2', 10, 39),
  desk('rev-3', 'revisao', 'Mesa 3', 6, 45),

  // Recepção (sala em 21,36)
  desk('rec-1', 'recepcao', 'Balcão 1', 23, 40),
  desk('rec-2', 'recepcao', 'Balcão 2', 32, 40),

  // Diretoria (sala em 42,36)
  desk('dir-1', 'diretoria', 'Mesa 1', 48, 39),
  desk('dir-2', 'diretoria', 'Mesa 2', 48, 45),

  // Sala de Reunião: mesa única, com cadeiras em volta
  {
    id: 'reu-1',
    roomId: 'reuniao',
    label: 'Mesa de reunião',
    x: 26,
    y: 3,
    w: 7,
    h: 4,
    chairs: [
      { x: 27, y: 2 },
      { x: 29, y: 2 },
      { x: 31, y: 2 },
      { x: 27, y: 7 },
      { x: 29, y: 7 },
      { x: 31, y: 7 },
      { x: 25, y: 4 },
      { x: 25, y: 5 },
      { x: 33, y: 4 },
      { x: 33, y: 5 },
    ],
  },
]

export const DESK_BY_ID: Record<string, DeskDef> = DESKS.reduce<Record<string, DeskDef>>(
  (acc, d) => {
    acc[d.id] = d
    return acc
  },
  {},
)

export type DecorKind = 'plant' | 'sofa' | 'counter' | 'board'

export interface DecorDef {
  kind: DecorKind
  x: number
  y: number
  w: number
  h: number
  /** decoração com corpo físico bloqueia o personagem */
  solid: boolean
  accent?: string
}

function plant(x: number, y: number): DecorDef {
  return { kind: 'plant', x, y, w: 1, h: 1, solid: true }
}

/** Vasos nos dois cantos inferiores de cada sala, mais a praça e os corredores. */
const roomPlants: DecorDef[] = ROOMS.flatMap((r) => [
  plant(r.rect.x + 1, r.rect.y + r.rect.h - 2),
  plant(r.rect.x + r.rect.w - 2, r.rect.y + r.rect.h - 2),
])

export const DECOR: DecorDef[] = [
  ...roomPlants,

  // Praça central
  plant(24, 21),
  plant(34, 21),
  plant(24, 28),
  plant(34, 28),
  { kind: 'sofa', x: 27, y: 20, w: 3, h: 1, solid: true, accent: ROOM_ACCENT.reuniao },
  { kind: 'sofa', x: 29, y: 29, w: 3, h: 1, solid: true, accent: ROOM_ACCENT.recepcao },

  // Corredores
  plant(18, 16),
  plant(39, 16),
  plant(18, 34),
  plant(39, 34),

  // Recepção: balcão de atendimento com vão central alinhado à porta
  { kind: 'counter', x: 22, y: 38, w: 5, h: 1, solid: true, accent: ROOM_ACCENT.recepcao },
  { kind: 'counter', x: 32, y: 38, w: 5, h: 1, solid: true, accent: ROOM_ACCENT.recepcao },
  { kind: 'sofa', x: 28, y: 47, w: 3, h: 1, solid: true, accent: ROOM_ACCENT.recepcao },

  // Diretoria: quadro de acompanhamento na parede
  { kind: 'board', x: 54, y: 37, w: 3, h: 1, solid: false, accent: ROOM_ACCENT.diretoria },
]

/** O personagem nasce na Recepção, logo abaixo da porta de entrada. */
export const SPAWN = { x: 28, y: 44 }

function inRect(rect: Rect, col: number, row: number): boolean {
  return col >= rect.x && col < rect.x + rect.w && row >= rect.y && row < rect.y + rect.h
}

export function isFloorTile(index: number): boolean {
  return index !== TileIndex.Wall && index !== TileIndex.Exterior
}

/**
 * Monta a matriz de tiles do andar. A ordem das etapas importa:
 * corredores e praça primeiro, depois o interior das salas, as portas e,
 * por fim, o anel externo do prédio.
 */
export function buildTileGrid(): number[][] {
  const grid: number[][] = Array.from({ length: MAP_ROWS }, () =>
    Array.from({ length: MAP_COLS }, () => TileIndex.Wall as number),
  )

  const corridorBands = [...CORRIDOR_COLS, ...CORRIDOR_ROWS]
  for (let row = 0; row < MAP_ROWS; row += 1) {
    for (let col = 0; col < MAP_COLS; col += 1) {
      if (corridorBands.some((band) => inRect(band, col, row))) {
        grid[row][col] = (col + row) % 2 === 0 ? TileIndex.CorridorA : TileIndex.CorridorB
      }
    }
  }

  for (let row = ATRIUM.y; row < ATRIUM.y + ATRIUM.h; row += 1) {
    for (let col = ATRIUM.x; col < ATRIUM.x + ATRIUM.w; col += 1) {
      grid[row][col] = TileIndex.Atrium
    }
  }

  for (const r of ROOMS) {
    for (let row = r.rect.y + 1; row < r.rect.y + r.rect.h - 1; row += 1) {
      for (let col = r.rect.x + 1; col < r.rect.x + r.rect.w - 1; col += 1) {
        grid[row][col] = (col + row) % 2 === 0 ? TileIndex.RoomFloorA : TileIndex.RoomFloorB
      }
    }
  }

  for (const r of ROOMS) {
    for (let row = r.door.y; row < r.door.y + r.door.h; row += 1) {
      for (let col = r.door.x; col < r.door.x + r.door.w; col += 1) {
        grid[row][col] = TileIndex.Door
      }
    }
  }

  for (let col = 0; col < MAP_COLS; col += 1) {
    grid[0][col] = TileIndex.Wall
    grid[MAP_ROWS - 1][col] = TileIndex.Wall
  }
  for (let row = 0; row < MAP_ROWS; row += 1) {
    grid[row][0] = TileIndex.Wall
    grid[row][MAP_COLS - 1] = TileIndex.Wall
  }

  return grid
}

/** Sala que contém um ponto em pixels, ou null se estiver em corredor. */
export function roomAtPixel(x: number, y: number): RoomDef | null {
  const col = Math.floor(x / TILE)
  const row = Math.floor(y / TILE)
  return ROOMS.find((r) => inRect(r.rect, col, row)) ?? null
}
