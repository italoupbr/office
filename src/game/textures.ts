import Phaser from 'phaser'
import {
  ATRIUM,
  DESKS,
  MAP_COLS,
  MAP_H,
  MAP_ROWS,
  MAP_W,
  ROOMS,
  TILE,
  TileIndex,
  isFloorTile,
} from './layout'
import { PALETTE, mix, withAlpha } from './palette'

/**
 * Todo o visual do mapa é gerado em código, porque o projeto não traz
 * sprites em public/assets. Se um dia existirem arquivos lá, o caminho é
 * carregá-los no preload da cena e manter as mesmas chaves listadas em TEX;
 * nada mais precisa mudar.
 */
export const TEX = {
  tileset: 'tileset',
  overlay: 'overlay',
  chair: 'chair',
  plant: 'plant',
  paper: 'paper',
  marker: 'marker',
  desk: (deskId: string) => `desk-${deskId}`,
  sofa: (accent: string) => `sofa-${accent}`,
  counter: (accent: string) => `counter-${accent}`,
  board: (accent: string) => `board-${accent}`,
  hero: (dir: HeroDir, frame: number) => `hero-${dir}-${frame}`,
}

export type HeroDir = 'down' | 'up' | 'left' | 'right'
export const HERO_DIRS: HeroDir[] = ['down', 'up', 'left', 'right']

export const HERO_W = 24
export const HERO_H = 32

type Ctx = CanvasRenderingContext2D

function canvasCtx(scene: Phaser.Scene, key: string, w: number, h: number): Ctx | null {
  if (scene.textures.exists(key)) return null
  const texture = scene.textures.createCanvas(key, w, h)
  if (!texture) return null
  return texture.getContext()
}

function commit(scene: Phaser.Scene, key: string): void {
  const texture = scene.textures.get(key)
  if (texture instanceof Phaser.Textures.CanvasTexture) texture.refresh()
}

function px(ctx: Ctx, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color
  ctx.fillRect(x, y, w, h)
}

/** Ruído determinístico, para o piso não ficar chapado nem cintilar. */
function rng(seed: number): () => number {
  let state = seed + 0x6d2b79f5
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function speckle(ctx: Ctx, ox: number, color: string, count: number, seed: number): void {
  const next = rng(seed)
  for (let i = 0; i < count; i += 1) {
    const x = Math.floor(next() * TILE)
    const y = Math.floor(next() * TILE)
    px(ctx, ox + x, y, 1, 1, color)
  }
}

// ---------------------------------------------------------------- tileset

function drawFloorTile(
  ctx: Ctx,
  ox: number,
  base: string,
  grout: string,
  speck: string,
  seed: number,
): void {
  px(ctx, ox, 0, TILE, TILE, base)
  px(ctx, ox + TILE - 1, 0, 1, TILE, grout)
  px(ctx, ox, TILE - 1, TILE, 1, grout)
  px(ctx, ox, 0, TILE, 1, withAlpha('#ffffff', 0.05))
  speckle(ctx, ox, speck, 14, seed)
}

function createTileset(scene: Phaser.Scene): void {
  const ctx = canvasCtx(scene, TEX.tileset, TILE * 8, TILE)
  if (!ctx) return

  // 0 exterior
  let ox = TileIndex.Exterior * TILE
  px(ctx, ox, 0, TILE, TILE, PALETTE.exterior)
  for (let i = -TILE; i < TILE; i += 8) {
    ctx.strokeStyle = PALETTE.exteriorLine
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(ox + i, TILE)
    ctx.lineTo(ox + i + TILE, 0)
    ctx.stroke()
  }

  // 1 parede
  ox = TileIndex.Wall * TILE
  px(ctx, ox, 0, TILE, TILE, PALETTE.wallBase)
  px(ctx, ox, 0, TILE, 4, PALETTE.wallTop)
  px(ctx, ox, 4, TILE, 1, withAlpha('#ffffff', 0.06))
  px(ctx, ox, TILE - 3, TILE, 3, PALETTE.wallSeam)
  speckle(ctx, ox, PALETTE.wallSpeck, 18, 11)

  // 2 e 3 piso das salas
  drawFloorTile(ctx, TileIndex.RoomFloorA * TILE, PALETTE.roomFloorA, PALETTE.roomGrout, PALETTE.roomSpeck, 21)
  drawFloorTile(ctx, TileIndex.RoomFloorB * TILE, PALETTE.roomFloorB, PALETTE.roomGrout, PALETTE.roomSpeck, 37)

  // 4 e 5 corredor
  drawFloorTile(ctx, TileIndex.CorridorA * TILE, PALETTE.corridorA, PALETTE.corridorGrout, PALETTE.corridorSpeck, 53)
  drawFloorTile(ctx, TileIndex.CorridorB * TILE, PALETTE.corridorB, PALETTE.corridorGrout, PALETTE.corridorSpeck, 71)

  // 6 praça central
  ox = TileIndex.Atrium * TILE
  drawFloorTile(ctx, ox, PALETTE.atriumA, PALETTE.atriumGrout, PALETTE.atriumB, 89)
  px(ctx, ox + 8, 8, 2, 2, withAlpha('#ffffff', 0.10))
  px(ctx, ox + 22, 20, 2, 2, withAlpha('#ffffff', 0.10))

  // 7 porta
  ox = TileIndex.Door * TILE
  px(ctx, ox, 0, TILE, TILE, PALETTE.doorBase)
  px(ctx, ox, 0, TILE, 3, PALETTE.doorEdge)
  px(ctx, ox, TILE - 3, TILE, 3, PALETTE.doorEdge)
  px(ctx, ox, 4, TILE, 2, PALETTE.doorLight)
  for (let i = 2; i < TILE; i += 6) px(ctx, ox + i, 10, 3, 12, PALETTE.doorLight)
  speckle(ctx, ox, PALETTE.doorEdge, 8, 97)

  commit(scene, TEX.tileset)
}

// ---------------------------------------------------------------- overlay

/**
 * Camada única desenhada acima do tilemap. Resolve duas coisas de uma vez:
 * a identidade de cor de cada sala e a sombra projetada das paredes no piso.
 */
function createOverlay(scene: Phaser.Scene, grid: number[][]): void {
  const ctx = canvasCtx(scene, TEX.overlay, MAP_W, MAP_H)
  if (!ctx) return

  for (const room of ROOMS) {
    const ix = (room.rect.x + 1) * TILE
    const iy = (room.rect.y + 1) * TILE
    const iw = (room.rect.w - 2) * TILE
    const ih = (room.rect.h - 2) * TILE
    px(ctx, ix, iy, iw, ih, withAlpha(room.accent, 0.1))
    px(ctx, ix, iy, iw, TILE, withAlpha(room.accent, 0.32))
    px(ctx, ix, iy + TILE - 2, iw, 2, withAlpha(room.accent, 0.55))
  }

  const cx = (ATRIUM.x + ATRIUM.w / 2) * TILE
  const cy = (ATRIUM.y + ATRIUM.h / 2) * TILE
  const glow = ctx.createRadialGradient(cx, cy, 8, cx, cy, ATRIUM.w * TILE * 0.5)
  glow.addColorStop(0, withAlpha('#ffffff', 0.16))
  glow.addColorStop(1, withAlpha('#ffffff', 0))
  ctx.fillStyle = glow
  ctx.fillRect((ATRIUM.x + 1) * TILE, (ATRIUM.y + 1) * TILE, (ATRIUM.w - 2) * TILE, (ATRIUM.h - 2) * TILE)

  const isWall = (col: number, row: number): boolean => {
    if (col < 0 || row < 0 || col >= MAP_COLS || row >= MAP_ROWS) return true
    return !isFloorTile(grid[row][col])
  }

  const shade = (x: number, y: number, w: number, h: number, from: string, to: string, vertical: boolean) => {
    const gradient = vertical
      ? ctx.createLinearGradient(x, y, x, y + h)
      : ctx.createLinearGradient(x, y, x + w, y)
    gradient.addColorStop(0, from)
    gradient.addColorStop(1, to)
    ctx.fillStyle = gradient
    ctx.fillRect(x, y, w, h)
  }

  const dark = (alpha: number) => withAlpha('#0b0e13', alpha)
  const clear = dark(0)

  for (let row = 0; row < MAP_ROWS; row += 1) {
    for (let col = 0; col < MAP_COLS; col += 1) {
      if (!isFloorTile(grid[row][col])) continue
      const x = col * TILE
      const y = row * TILE
      if (isWall(col, row - 1)) shade(x, y, TILE, 12, dark(0.36), clear, true)
      if (isWall(col - 1, row)) shade(x, y, 9, TILE, dark(0.22), clear, false)
      if (isWall(col + 1, row)) shade(x + TILE - 9, y, 9, TILE, clear, dark(0.18), false)
      if (isWall(col, row + 1)) shade(x, y + TILE - 6, TILE, 6, clear, dark(0.14), true)
    }
  }

  commit(scene, TEX.overlay)
}

// ---------------------------------------------------------------- mobiliário

type DeskVariant = 'desk' | 'table'

function drawSurface(ctx: Ctx, w: number, h: number): void {
  px(ctx, 4, 6, w - 4, h - 6, PALETTE.dropShadow)
  px(ctx, 1, 2, w - 6, h - 10, PALETTE.deskEdge)
  px(ctx, 2, 3, w - 8, h - 12, PALETTE.deskTop)
  px(ctx, 2, 3, w - 8, 3, PALETTE.deskTopLight)
  for (let y = 10; y < h - 13; y += 7) px(ctx, 6, y, w - 16, 1, PALETTE.deskGrain)
}

function createDeskTexture(
  scene: Phaser.Scene,
  key: string,
  wTiles: number,
  hTiles: number,
  accent: string,
  variant: DeskVariant,
): void {
  const w = wTiles * TILE
  const h = hTiles * TILE
  const ctx = canvasCtx(scene, key, w, h)
  if (!ctx) return

  drawSurface(ctx, w, h)
  const center = Math.round((w - 6) / 2)

  if (variant === 'desk') {
    px(ctx, center - 11, 7, 22, 15, PALETTE.monitorBody)
    px(ctx, center - 9, 9, 18, 11, accent)
    px(ctx, center - 9, 9, 18, 3, mix(accent, '#ffffff', 0.42))
    px(ctx, center - 9, 17, 18, 1, mix(accent, '#000000', 0.3))
    px(ctx, center - 3, 22, 6, 3, PALETTE.monitorEdge)
    px(ctx, center - 7, 25, 14, 2, PALETTE.monitorEdge)
    px(ctx, center + 2, h - 22, 22, 6, PALETTE.keyboard)
    px(ctx, center + 2, h - 22, 22, 1, '#eef1f6')
    px(ctx, center + 28, h - 21, 6, 4, PALETTE.deskGrain)
  } else {
    const runnerX = 18
    const runnerW = w - 42
    px(ctx, runnerX, h / 2 - 16, runnerW, 26, mix(accent, PALETTE.exterior, 0.32))
    px(ctx, runnerX, h / 2 - 16, runnerW, 3, mix(accent, '#ffffff', 0.2))
    for (let i = 0; i < 4; i += 1) {
      const nx = 26 + i * Math.floor((runnerW - 24) / 3)
      px(ctx, nx, h / 2 - 30, 18, 11, PALETTE.monitorBody)
      px(ctx, nx + 2, h / 2 - 28, 14, 7, mix(accent, '#ffffff', 0.3))
      px(ctx, nx, h / 2 + 16, 18, 11, PALETTE.monitorBody)
      px(ctx, nx + 2, h / 2 + 18, 14, 7, mix(accent, '#ffffff', 0.3))
    }
  }

  commit(scene, key)
}

/** Posição dos cartões de item sobre a mesa, em pixels locais. */
export function paperSlot(index: number, deskH: number): { x: number; y: number } {
  return { x: 7 + index * 12, y: deskH - 27 }
}

export function markerSlot(deskW: number): { x: number; y: number } {
  return { x: deskW - 20, y: 9 }
}

function createChair(scene: Phaser.Scene): void {
  const ctx = canvasCtx(scene, TEX.chair, TILE, TILE)
  if (!ctx) return
  px(ctx, 7, 26, 18, 3, PALETTE.dropShadow)
  px(ctx, 6, 12, 3, 9, PALETTE.chairDark)
  px(ctx, 23, 12, 3, 9, PALETTE.chairDark)
  px(ctx, 7, 21, 18, 6, PALETTE.chairDark)
  px(ctx, 7, 21, 18, 2, PALETTE.chairBase)
  px(ctx, 9, 8, 14, 14, PALETTE.chairBase)
  px(ctx, 9, 8, 14, 2, PALETTE.chairLight)
  px(ctx, 9, 20, 14, 1, PALETTE.chairDark)
  commit(scene, TEX.chair)
}

function createPlant(scene: Phaser.Scene): void {
  const ctx = canvasCtx(scene, TEX.plant, TILE, 40)
  if (!ctx) return
  px(ctx, 6, 36, 20, 3, PALETTE.dropShadow)
  px(ctx, 9, 28, 14, 2, PALETTE.potLight)
  px(ctx, 9, 30, 14, 7, PALETTE.potBase)
  px(ctx, 10, 35, 12, 2, mix(PALETTE.potBase, '#000000', 0.3))
  px(ctx, 11, 26, 10, 2, '#4a3a2c')
  px(ctx, 15, 18, 2, 9, PALETTE.leafDark)
  px(ctx, 12, 14, 8, 5, PALETTE.leaf)
  px(ctx, 5, 13, 8, 4, PALETTE.leafDark)
  px(ctx, 19, 13, 8, 4, PALETTE.leafDark)
  px(ctx, 7, 9, 7, 5, PALETTE.leaf)
  px(ctx, 18, 9, 7, 5, PALETTE.leaf)
  px(ctx, 11, 5, 10, 6, PALETTE.leafLight)
  px(ctx, 13, 3, 6, 3, PALETTE.leaf)
  px(ctx, 9, 11, 5, 3, PALETTE.leafLight)
  px(ctx, 18, 11, 5, 3, PALETTE.leafLight)
  commit(scene, TEX.plant)
}

function createSofa(scene: Phaser.Scene, accent: string): void {
  const key = TEX.sofa(accent)
  const w = 3 * TILE
  const ctx = canvasCtx(scene, key, w, TILE)
  if (!ctx) return
  px(ctx, 4, 8, w - 4, TILE - 8, PALETTE.dropShadow)
  px(ctx, 2, 4, w - 8, 22, PALETTE.sofaBase)
  px(ctx, 2, 4, w - 8, 4, PALETTE.sofaLight)
  px(ctx, 2, 4, 6, 22, PALETTE.sofaLight)
  px(ctx, w - 12, 4, 6, 22, PALETTE.sofaLight)
  px(ctx, 10, 10, w - 24, 12, mix(accent, PALETTE.sofaBase, 0.45))
  px(ctx, 10, 10, w - 24, 2, mix(accent, '#ffffff', 0.25))
  commit(scene, key)
}

function createCounter(scene: Phaser.Scene, accent: string, wTiles: number): void {
  const key = TEX.counter(accent)
  const w = wTiles * TILE
  const ctx = canvasCtx(scene, key, w, TILE)
  if (!ctx) return
  drawSurface(ctx, w, TILE)
  px(ctx, 2, 3, w - 8, 4, mix(accent, '#ffffff', 0.18))
  px(ctx, 2, 16, w - 8, 1, PALETTE.deskGrain)
  commit(scene, key)
}

function createBoard(scene: Phaser.Scene, accent: string): void {
  const key = TEX.board(accent)
  const w = 3 * TILE
  const ctx = canvasCtx(scene, key, w, TILE)
  if (!ctx) return
  px(ctx, 2, 6, w - 4, 22, PALETTE.monitorEdge)
  px(ctx, 4, 8, w - 8, 18, mix(accent, PALETTE.exterior, 0.55))
  const bars = [10, 14, 7, 16, 12, 18]
  bars.forEach((height, i) => {
    px(ctx, 10 + i * 12, 24 - height, 7, height, mix(accent, '#ffffff', 0.15 + i * 0.05))
  })
  px(ctx, 4, 8, w - 8, 1, mix(accent, '#ffffff', 0.4))
  commit(scene, key)
}

function createPaper(scene: Phaser.Scene): void {
  const ctx = canvasCtx(scene, TEX.paper, 10, 13)
  if (!ctx) return
  px(ctx, 0, 1, 10, 12, withAlpha('#0b0e13', 0.35))
  px(ctx, 0, 0, 10, 12, PALETTE.paper)
  px(ctx, 2, 3, 6, 1, PALETTE.paperLine)
  px(ctx, 2, 6, 6, 1, PALETTE.paperLine)
  px(ctx, 2, 9, 4, 1, PALETTE.paperLine)
  commit(scene, TEX.paper)
}

function createMarker(scene: Phaser.Scene): void {
  const size = 14
  const ctx = canvasCtx(scene, TEX.marker, size, size)
  if (!ctx) return
  px(ctx, 2, 2, 10, 10, withAlpha('#0b0e13', 0.4))
  px(ctx, 2, 1, 10, 10, '#8f2a24')
  px(ctx, 3, 2, 8, 8, '#d64a41')
  px(ctx, 4, 3, 3, 2, '#f08a80')
  commit(scene, TEX.marker)
}

// ---------------------------------------------------------------- personagem

function drawHero(ctx: Ctx, dir: HeroDir, frame: number): void {
  const bob = frame === 1 ? -1 : 0
  px(ctx, 5, 29, 14, 3, PALETTE.dropShadow)

  if (frame === 0) {
    px(ctx, 8, 20 + bob, 3, 6, PALETTE.pants)
    px(ctx, 13, 20 + bob, 3, 6, PALETTE.pants)
    px(ctx, 8, 26 + bob, 3, 3, PALETTE.shoe)
    px(ctx, 13, 26 + bob, 3, 3, PALETTE.shoe)
  } else {
    px(ctx, 8, 20 + bob, 3, 8, PALETTE.pants)
    px(ctx, 13, 21 + bob, 3, 5, PALETTE.pantsShade)
    px(ctx, 8, 28 + bob, 3, 2, PALETTE.shoe)
    px(ctx, 13, 26 + bob, 3, 3, PALETTE.shoe)
  }

  const narrow = dir === 'left' || dir === 'right'
  const torsoX = narrow ? 8 : 7
  const torsoW = narrow ? 8 : 10
  px(ctx, torsoX, 11 + bob, torsoW, 10, PALETTE.shirt)
  px(ctx, torsoX, 19 + bob, torsoW, 2, PALETTE.shirtShade)

  if (narrow) {
    px(ctx, 14, 12 + bob, 3, 8, PALETTE.shirtShade)
    px(ctx, 15, 19 + bob, 2, 3, PALETTE.skinShade)
  } else {
    px(ctx, 5, 12 + bob, 2, 8, PALETTE.shirtShade)
    px(ctx, 17, 12 + bob, 2, 8, PALETTE.shirtShade)
    px(ctx, 5, 20 + bob, 2, 2, PALETTE.skinShade)
    px(ctx, 17, 20 + bob, 2, 2, PALETTE.skinShade)
  }

  px(ctx, 8, 3 + bob, 8, 8, PALETTE.skin)
  px(ctx, 8, 10 + bob, 8, 1, PALETTE.skinShade)

  if (dir === 'up') {
    px(ctx, 7, 2 + bob, 10, 8, PALETTE.hair)
  } else if (narrow) {
    px(ctx, 7, 2 + bob, 10, 4, PALETTE.hair)
    px(ctx, 7, 4 + bob, 3, 5, PALETTE.hair)
    px(ctx, 13, 6 + bob, 2, 2, PALETTE.hair)
  } else {
    px(ctx, 7, 2 + bob, 10, 4, PALETTE.hair)
    px(ctx, 7, 4 + bob, 2, 3, PALETTE.hair)
    px(ctx, 15, 4 + bob, 2, 3, PALETTE.hair)
    px(ctx, 9, 7 + bob, 2, 2, PALETTE.hair)
    px(ctx, 13, 7 + bob, 2, 2, PALETTE.hair)
  }
}

function createHero(scene: Phaser.Scene): void {
  for (const dir of HERO_DIRS) {
    for (const frame of [0, 1]) {
      const key = TEX.hero(dir, frame)
      const ctx = canvasCtx(scene, key, HERO_W, HERO_H)
      if (!ctx) continue
      if (dir === 'left') {
        ctx.save()
        ctx.translate(HERO_W, 0)
        ctx.scale(-1, 1)
        drawHero(ctx, dir, frame)
        ctx.restore()
      } else {
        drawHero(ctx, dir, frame)
      }
      commit(scene, key)
    }
  }
}

// ---------------------------------------------------------------- entrada

export function buildTextures(scene: Phaser.Scene, grid: number[][]): void {
  createTileset(scene)
  createOverlay(scene, grid)
  createChair(scene)
  createPlant(scene)
  createPaper(scene)
  createMarker(scene)
  createHero(scene)

  for (const room of ROOMS) {
    createSofa(scene, room.accent)
    createBoard(scene, room.accent)
    createCounter(scene, room.accent, 5)
  }

  for (const deskDef of DESKS) {
    const room = ROOMS.find((r) => r.id === deskDef.roomId)
    if (!room) continue
    const variant: DeskVariant = deskDef.w >= 5 ? 'table' : 'desk'
    createDeskTexture(scene, TEX.desk(deskDef.id), deskDef.w, deskDef.h, room.accent, variant)
  }
}
