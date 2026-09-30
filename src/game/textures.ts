import Phaser from 'phaser'
import { TILE, TileIndex, isFloorTile, type FloorPlan } from './layout'
import { PALETTE, mix, withAlpha } from './palette'

/**
 * Todo o visual do mapa é gerado em canvas, porque o projeto não traz sprites
 * em public/assets. Para trocar por arquivos reais, carregue-os no preload da
 * cena usando as mesmas chaves de TEX; o resto da cena não muda.
 */
export const TEX = {
  tileset: 'tileset',
  overlay: 'overlay',
  chair: 'chair',
  plant: 'plant',
  desk: (accent: string) => `desk-${accent}`,
  sign: (accent: string) => `sign-${accent}`,
  light: (health: string) => `light-${health}`,
  hero: (dir: HeroDir, frame: number) => `hero-${dir}-${frame}`,
}

export type HeroDir = 'down' | 'up' | 'left' | 'right'
export const HERO_DIRS: HeroDir[] = ['down', 'up', 'left', 'right']
export const HERO_W = 22
export const HERO_H = 30

export const SIGN_W = 5 * TILE
export const SIGN_H = Math.round(TILE * 1.45)

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
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
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
    px(ctx, ox + Math.floor(next() * TILE), Math.floor(next() * TILE), 1, 1, color)
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
  speckle(ctx, ox, speck, 10, seed)
}

function createTileset(scene: Phaser.Scene): void {
  const ctx = canvasCtx(scene, TEX.tileset, TILE * 8, TILE)
  if (!ctx) return

  let ox = TileIndex.Exterior * TILE
  px(ctx, ox, 0, TILE, TILE, PALETTE.exterior)
  for (let i = -TILE; i < TILE; i += 6) {
    ctx.strokeStyle = PALETTE.exteriorLine
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(ox + i, TILE)
    ctx.lineTo(ox + i + TILE, 0)
    ctx.stroke()
  }

  ox = TileIndex.Wall * TILE
  px(ctx, ox, 0, TILE, TILE, PALETTE.wallBase)
  px(ctx, ox, 0, TILE, 3, PALETTE.wallTop)
  px(ctx, ox, 3, TILE, 1, withAlpha('#ffffff', 0.06))
  px(ctx, ox, TILE - 2, TILE, 2, PALETTE.wallSeam)
  speckle(ctx, ox, PALETTE.wallSpeck, 12, 11)

  drawFloorTile(ctx, TileIndex.RoomFloorA * TILE, PALETTE.roomFloorA, PALETTE.roomGrout, PALETTE.roomSpeck, 21)
  drawFloorTile(ctx, TileIndex.RoomFloorB * TILE, PALETTE.roomFloorB, PALETTE.roomGrout, PALETTE.roomSpeck, 37)
  drawFloorTile(ctx, TileIndex.CorridorA * TILE, PALETTE.corridorA, PALETTE.corridorGrout, PALETTE.corridorSpeck, 53)
  drawFloorTile(ctx, TileIndex.CorridorB * TILE, PALETTE.corridorB, PALETTE.corridorGrout, PALETTE.corridorSpeck, 71)
  drawFloorTile(ctx, TileIndex.Atrium * TILE, PALETTE.atriumA, PALETTE.atriumGrout, PALETTE.atriumB, 89)

  ox = TileIndex.Door * TILE
  px(ctx, ox, 0, TILE, TILE, PALETTE.doorBase)
  px(ctx, ox, 0, TILE, 2, PALETTE.doorEdge)
  px(ctx, ox, TILE - 2, TILE, 2, PALETTE.doorEdge)
  px(ctx, ox, 3, TILE, 2, PALETTE.doorLight)
  for (let i = 2; i < TILE; i += 5) px(ctx, ox + i, 8, 2, TILE - 13, PALETTE.doorLight)

  commit(scene, TEX.tileset)
}

// ---------------------------------------------------------------- overlay

/**
 * Camada única desenhada acima do tilemap. Resolve de uma vez a identidade de
 * cor de cada sala, a luz levemente quente e a sombra das paredes no piso.
 */
function createOverlay(scene: Phaser.Scene, plan: FloorPlan): void {
  const ctx = canvasCtx(scene, TEX.overlay, plan.width, plan.height)
  if (!ctx) return

  for (const placement of plan.rooms) {
    const { rect, room } = placement
    const ix = (rect.x + 1) * TILE
    const iy = (rect.y + 1) * TILE
    const iw = (rect.w - 2) * TILE
    const ih = (rect.h - 2) * TILE
    px(ctx, ix, iy, iw, ih, withAlpha(room.accent, 0.1))
    px(ctx, ix, iy, iw, TILE, withAlpha(room.accent, 0.3))
    px(ctx, ix, iy + TILE - 2, iw, 2, withAlpha(room.accent, 0.55))

    // Luz de teto, levemente quente.
    const cx = ix + iw / 2
    const cy = iy + ih * 0.42
    const glow = ctx.createRadialGradient(cx, cy, TILE * 0.5, cx, cy, Math.max(iw, ih) * 0.62)
    glow.addColorStop(0, withAlpha('#ffd9a3', 0.22))
    glow.addColorStop(1, withAlpha('#ffd9a3', 0))
    ctx.fillStyle = glow
    ctx.fillRect(ix, iy, iw, ih)
  }

  const isWall = (col: number, row: number): boolean => {
    if (col < 0 || row < 0 || col >= plan.cols || row >= plan.rows) return true
    return !isFloorTile(plan.grid[row][col])
  }

  const shade = (
    x: number,
    y: number,
    w: number,
    h: number,
    from: string,
    to: string,
    vertical: boolean,
  ) => {
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

  for (let row = 0; row < plan.rows; row += 1) {
    for (let col = 0; col < plan.cols; col += 1) {
      if (!isFloorTile(plan.grid[row][col])) continue
      const x = col * TILE
      const y = row * TILE
      if (isWall(col, row - 1)) shade(x, y, TILE, 10, dark(0.34), clear, true)
      if (isWall(col - 1, row)) shade(x, y, 7, TILE, dark(0.2), clear, false)
      if (isWall(col + 1, row)) shade(x + TILE - 7, y, 7, TILE, clear, dark(0.16), false)
      if (isWall(col, row + 1)) shade(x, y + TILE - 5, TILE, 5, clear, dark(0.12), true)
    }
  }

  commit(scene, TEX.overlay)
}

// ---------------------------------------------------------------- mobiliário

function createDesk(scene: Phaser.Scene, accent: string): void {
  const key = TEX.desk(accent)
  const w = 3 * TILE
  const h = 2 * TILE
  const ctx = canvasCtx(scene, key, w, h)
  if (!ctx) return

  px(ctx, 3, 5, w - 3, h - 5, PALETTE.dropShadow)
  px(ctx, 1, 2, w - 5, h - 8, PALETTE.deskEdge)
  px(ctx, 2, 3, w - 7, h - 10, PALETTE.deskTop)
  px(ctx, 2, 3, w - 7, 2, PALETTE.deskTopLight)
  for (let y = 9; y < h - 11; y += 6) px(ctx, 5, y, w - 13, 1, PALETTE.deskGrain)

  const center = Math.round((w - 5) / 2)
  px(ctx, center - 9, 5, 18, 12, PALETTE.monitorBody)
  px(ctx, center - 7, 7, 14, 8, accent)
  px(ctx, center - 7, 7, 14, 2, mix(accent, '#ffffff', 0.42))
  px(ctx, center - 2, 17, 4, 2, PALETTE.monitorEdge)
  px(ctx, center - 5, 19, 10, 2, PALETTE.monitorEdge)
  px(ctx, center + 1, h - 16, 16, 4, PALETTE.keyboard)

  commit(scene, key)
}

function createChair(scene: Phaser.Scene): void {
  const ctx = canvasCtx(scene, TEX.chair, TILE, TILE)
  if (!ctx) return
  const s = TILE / 32
  px(ctx, 7 * s, 26 * s, 18 * s, 3 * s, PALETTE.dropShadow)
  px(ctx, 6 * s, 12 * s, 3 * s, 9 * s, PALETTE.chairDark)
  px(ctx, 23 * s, 12 * s, 3 * s, 9 * s, PALETTE.chairDark)
  px(ctx, 7 * s, 21 * s, 18 * s, 6 * s, PALETTE.chairDark)
  px(ctx, 7 * s, 21 * s, 18 * s, 2 * s, PALETTE.chairBase)
  px(ctx, 9 * s, 8 * s, 14 * s, 14 * s, PALETTE.chairBase)
  px(ctx, 9 * s, 8 * s, 14 * s, 2 * s, PALETTE.chairLight)
  commit(scene, TEX.chair)
}

function createPlant(scene: Phaser.Scene): void {
  const h = Math.round(TILE * 1.6)
  const ctx = canvasCtx(scene, TEX.plant, TILE, h)
  if (!ctx) return
  const s = TILE / 32
  const base = h
  px(ctx, 6 * s, base - 4, 20 * s, 3, PALETTE.dropShadow)
  px(ctx, 9 * s, base - 12, 14 * s, 2, PALETTE.potLight)
  px(ctx, 9 * s, base - 10, 14 * s, 7, PALETTE.potBase)
  px(ctx, 11 * s, base - 14, 10 * s, 2, '#4a3a2c')
  px(ctx, 15 * s, base - 24, 2 * s, 10, PALETTE.leafDark)
  px(ctx, 12 * s, base - 28, 8 * s, 5, PALETTE.leaf)
  px(ctx, 5 * s, base - 29, 8 * s, 4, PALETTE.leafDark)
  px(ctx, 19 * s, base - 29, 8 * s, 4, PALETTE.leafDark)
  px(ctx, 7 * s, base - 33, 7 * s, 5, PALETTE.leaf)
  px(ctx, 18 * s, base - 33, 7 * s, 5, PALETTE.leaf)
  px(ctx, 11 * s, base - 37, 10 * s, 6, PALETTE.leafLight)
  commit(scene, TEX.plant)
}

/** Placa da sala: moldura escura com faixa de cor, o texto é Text do Phaser. */
function createSign(scene: Phaser.Scene, accent: string): void {
  const key = TEX.sign(accent)
  const ctx = canvasCtx(scene, key, SIGN_W, SIGN_H)
  if (!ctx) return
  px(ctx, 2, 4, SIGN_W - 2, SIGN_H - 4, withAlpha('#0b0e13', 0.35))
  px(ctx, 0, 0, SIGN_W - 2, SIGN_H - 4, '#1b2530')
  px(ctx, 1, 1, SIGN_W - 4, SIGN_H - 6, '#243040')
  px(ctx, 1, 1, SIGN_W - 4, 3, accent)
  px(ctx, 1, SIGN_H - 8, SIGN_W - 4, 1, withAlpha(accent, 0.45))
  commit(scene, key)
}

const LIGHT_COLOR: Record<string, string> = {
  ok: '#4ec06a',
  attention: '#e2b13c',
  late: '#d64a41',
}

/** Luz de status da mesa. */
function createLight(scene: Phaser.Scene, health: string): void {
  const key = TEX.light(health)
  const size = 10
  const ctx = canvasCtx(scene, key, size, size)
  if (!ctx) return
  const color = LIGHT_COLOR[health]
  px(ctx, 1, 2, 8, 7, withAlpha('#0b0e13', 0.4))
  px(ctx, 1, 1, 8, 7, mix(color, '#000000', 0.45))
  px(ctx, 2, 2, 6, 5, color)
  px(ctx, 3, 2, 2, 2, mix(color, '#ffffff', 0.6))
  commit(scene, key)
}

// ---------------------------------------------------------------- personagem

function drawHero(ctx: Ctx, dir: HeroDir, frame: number): void {
  const bob = frame === 1 ? -1 : 0
  px(ctx, 4, 27, 14, 3, PALETTE.dropShadow)

  if (frame === 0) {
    px(ctx, 7, 19 + bob, 3, 6, PALETTE.pants)
    px(ctx, 12, 19 + bob, 3, 6, PALETTE.pants)
    px(ctx, 7, 25 + bob, 3, 3, PALETTE.shoe)
    px(ctx, 12, 25 + bob, 3, 3, PALETTE.shoe)
  } else {
    px(ctx, 7, 19 + bob, 3, 8, PALETTE.pants)
    px(ctx, 12, 20 + bob, 3, 5, PALETTE.pantsShade)
    px(ctx, 7, 27 + bob, 3, 2, PALETTE.shoe)
    px(ctx, 12, 25 + bob, 3, 3, PALETTE.shoe)
  }

  const narrow = dir === 'left' || dir === 'right'
  const torsoX = narrow ? 7 : 6
  const torsoW = narrow ? 8 : 10
  px(ctx, torsoX, 10 + bob, torsoW, 10, PALETTE.shirt)
  px(ctx, torsoX, 18 + bob, torsoW, 2, PALETTE.shirtShade)

  if (narrow) {
    px(ctx, 13, 11 + bob, 3, 8, PALETTE.shirtShade)
    px(ctx, 14, 18 + bob, 2, 3, PALETTE.skinShade)
  } else {
    px(ctx, 4, 11 + bob, 2, 8, PALETTE.shirtShade)
    px(ctx, 16, 11 + bob, 2, 8, PALETTE.shirtShade)
    px(ctx, 4, 19 + bob, 2, 2, PALETTE.skinShade)
    px(ctx, 16, 19 + bob, 2, 2, PALETTE.skinShade)
  }

  px(ctx, 7, 2 + bob, 8, 8, PALETTE.skin)
  px(ctx, 7, 9 + bob, 8, 1, PALETTE.skinShade)

  if (dir === 'up') {
    px(ctx, 6, 1 + bob, 10, 8, PALETTE.hair)
  } else if (narrow) {
    px(ctx, 6, 1 + bob, 10, 4, PALETTE.hair)
    px(ctx, 6, 3 + bob, 3, 5, PALETTE.hair)
    px(ctx, 12, 5 + bob, 2, 2, PALETTE.hair)
  } else {
    px(ctx, 6, 1 + bob, 10, 4, PALETTE.hair)
    px(ctx, 6, 3 + bob, 2, 3, PALETTE.hair)
    px(ctx, 14, 3 + bob, 2, 3, PALETTE.hair)
    px(ctx, 8, 6 + bob, 2, 2, PALETTE.hair)
    px(ctx, 12, 6 + bob, 2, 2, PALETTE.hair)
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

export function buildTextures(scene: Phaser.Scene, plan: FloorPlan): void {
  createTileset(scene)
  createOverlay(scene, plan)
  createChair(scene)
  createPlant(scene)
  createHero(scene)

  for (const health of ['ok', 'attention', 'late']) createLight(scene, health)

  const accents = new Set(plan.rooms.map((placement) => placement.room.accent))
  for (const accent of accents) {
    createDesk(scene, accent)
    createSign(scene, accent)
  }
}

/** A planta muda quando o modo muda, então o overlay tem de ser refeito. */
export function dropPlanTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEX.overlay)) scene.textures.remove(TEX.overlay)
}
