import type { RoomDef, RoomId } from '../types'

/**
 * Planta gerada a partir da lista de salas visíveis.
 *
 * A consequência disso é a regra de segurança: sala interna que não entrou na
 * lista não existe no mapa. Não há tile dela, não há porta, não há área
 * clicável. Em modo cliente o prédio é literalmente menor.
 */

export const TILE = 24

/** Cada célula da grade de salas, em tiles, incluindo o anel de parede. */
const SLOT_W = 11
const SLOT_H = 10
/** Largura do corredor entre células. */
const GAP = 3

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

export interface RoomPlacement {
  room: RoomDef
  /** retângulo em tiles, incluindo o anel de parede */
  rect: Rect
  /** vão da porta, sobre a parede */
  door: Rect
  /** lado do prédio em que a porta fica */
  doorSide: 'left' | 'right'
  /** tile interno logo depois da porta, destino do teleporte */
  entry: { x: number; y: number }
  /** onde a placa da sala é desenhada */
  sign: { x: number; y: number }
}

export interface DeskPlacement {
  id: string
  roomId: RoomId
  x: number
  y: number
  w: number
  h: number
  chair: { x: number; y: number }
}

export interface DecorPlacement {
  kind: 'plant'
  x: number
  y: number
}

export interface FloorPlan {
  cols: number
  rows: number
  width: number
  height: number
  grid: number[][]
  rooms: RoomPlacement[]
  desks: DeskPlacement[]
  decor: DecorPlacement[]
  corridors: Rect[]
  spawn: { x: number; y: number }
}

function slotOriginX(col: number): number {
  return col * (SLOT_W + GAP)
}

function slotOriginY(row: number): number {
  return row * (SLOT_H + GAP)
}

function roomRect(room: RoomDef): Rect {
  return {
    x: slotOriginX(room.slot.col),
    y: slotOriginY(room.slot.row),
    w: SLOT_W,
    h: room.tall ? SLOT_H * 2 + GAP : SLOT_H,
  }
}

function inRect(rect: Rect, col: number, row: number): boolean {
  return col >= rect.x && col < rect.x + rect.w && row >= rect.y && row < rect.y + rect.h
}

/**
 * A porta abre para o corredor mais próximo. Coluna 0 abre à direita porque
 * não existe corredor à esquerda dela; as demais abrem à esquerda.
 */
function doorFor(room: RoomDef, rect: Rect): Pick<RoomPlacement, 'door' | 'doorSide' | 'entry'> {
  const midY = rect.y + Math.floor(rect.h / 2) - 1
  if (room.slot.col === 0) {
    const x = rect.x + rect.w - 1
    return {
      door: { x, y: midY, w: 1, h: 2 },
      doorSide: 'right',
      entry: { x: x - 1, y: midY },
    }
  }
  return {
    door: { x: rect.x, y: midY, w: 1, h: 2 },
    doorSide: 'left',
    entry: { x: rect.x + 1, y: midY },
  }
}

function deskRow(roomId: RoomId, rx: number, ry: number, index: number): DeskPlacement {
  const x = rx + (index % 2 === 0 ? 2 : 6)
  return {
    id: `${roomId}-mesa-${index + 1}`,
    roomId,
    x,
    y: ry,
    w: 3,
    h: 2,
    chair: { x: x + 1, y: ry + 2 },
  }
}

function furnitureFor(room: RoomDef, rect: Rect): {
  desks: DeskPlacement[]
  decor: DecorPlacement[]
} {
  const desks: DeskPlacement[] = []
  const rows = room.tall ? [rect.y + 3, rect.y + 15] : [rect.y + 4]

  rows.forEach((rowY, rowIndex) => {
    desks.push(deskRow(room.id, rect.x, rowY, rowIndex * 2))
    desks.push(deskRow(room.id, rect.x, rowY, rowIndex * 2 + 1))
  })

  const bottom = rect.y + rect.h - 2
  const decor: DecorPlacement[] = [
    { kind: 'plant', x: rect.x + 1, y: bottom },
    { kind: 'plant', x: rect.x + rect.w - 2, y: bottom },
  ]

  return { desks, decor }
}

export function buildFloorPlan(rooms: RoomDef[]): FloorPlan {
  const placements: RoomPlacement[] = rooms.map((room) => {
    const rect = roomRect(room)
    const { door, doorSide, entry } = doorFor(room, rect)
    return {
      room,
      rect,
      door,
      doorSide,
      entry,
      sign: { x: rect.x + Math.floor(rect.w / 2), y: rect.y + 1 },
    }
  })

  const cols = Math.max(...placements.map((p) => p.rect.x + p.rect.w))
  const rows = Math.max(...placements.map((p) => p.rect.y + p.rect.h))

  const grid: number[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => TileIndex.Wall as number),
  )

  // Corredores nas faixas entre células. Vêm antes das salas, então uma sala
  // alta interrompe o corredor horizontal em vez de ser cortada por ele.
  const maxCol = Math.max(...rooms.map((r) => r.slot.col))
  const maxRow = Math.max(...rooms.map((r) => (r.tall ? 1 : r.slot.row)))
  const corridors: Rect[] = []
  for (let col = 0; col < maxCol; col += 1) {
    corridors.push({ x: slotOriginX(col) + SLOT_W, y: 0, w: GAP, h: rows })
  }
  for (let row = 0; row < maxRow; row += 1) {
    corridors.push({ x: 0, y: slotOriginY(row) + SLOT_H, w: cols, h: GAP })
  }

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (corridors.some((band) => inRect(band, col, row))) {
        grid[row][col] = (col + row) % 2 === 0 ? TileIndex.CorridorA : TileIndex.CorridorB
      }
    }
  }

  const desks: DeskPlacement[] = []
  const decor: DecorPlacement[] = []

  for (const placement of placements) {
    const { rect } = placement
    for (let row = rect.y + 1; row < rect.y + rect.h - 1; row += 1) {
      for (let col = rect.x + 1; col < rect.x + rect.w - 1; col += 1) {
        grid[row][col] = (col + row) % 2 === 0 ? TileIndex.RoomFloorA : TileIndex.RoomFloorB
      }
    }
    const furniture = furnitureFor(placement.room, rect)
    desks.push(...furniture.desks)
    decor.push(...furniture.decor)
  }

  for (const placement of placements) {
    const { door } = placement
    for (let row = door.y; row < door.y + door.h; row += 1) {
      for (let col = door.x; col < door.x + door.w; col += 1) {
        grid[row][col] = TileIndex.Door
      }
    }
  }

  for (let col = 0; col < cols; col += 1) {
    grid[0][col] = TileIndex.Wall
    grid[rows - 1][col] = TileIndex.Wall
  }
  for (let row = 0; row < rows; row += 1) {
    grid[row][0] = TileIndex.Wall
    grid[row][cols - 1] = TileIndex.Wall
  }

  return {
    cols,
    rows,
    width: cols * TILE,
    height: rows * TILE,
    grid,
    rooms: placements,
    desks,
    decor,
    corridors,
    spawn: { x: slotOriginX(0) + SLOT_W + 1, y: rows - 2 },
  }
}

export function isFloorTile(index: number): boolean {
  return index !== TileIndex.Wall && index !== TileIndex.Exterior
}

export function roomAtTile(plan: FloorPlan, col: number, row: number): RoomPlacement | null {
  return plan.rooms.find((placement) => inRect(placement.rect, col, row)) ?? null
}

export function roomAtPixel(plan: FloorPlan, x: number, y: number): RoomPlacement | null {
  return roomAtTile(plan, Math.floor(x / TILE), Math.floor(y / TILE))
}
