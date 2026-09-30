import Phaser from 'phaser'
import type { RoomDef, RoomId } from '../types'
import * as bus from './bus'
import {
  SOLID_TILES,
  TILE,
  buildFloorPlan,
  roomAtPixel,
  type FloorPlan,
  type RoomPlacement,
} from './layout'
import { PALETTE, toNum } from './palette'
import {
  HERO_DIRS,
  SIGN_H,
  TEX,
  buildTextures,
  dropPlanTextures,
  type HeroDir,
} from './textures'
const ZOOM_STEPS = [0.7, 0.85, 1, 1.2, 1.45, 1.8]
const DEFAULT_ZOOM = 2
const SPEED = 150
export interface WorldSpec {
  /** já filtrada por src/auth/permissions.ts antes de chegar aqui */
  rooms: RoomDef[]
  label: string
}
interface RoomView {
  placement: RoomPlacement
  zone: Phaser.GameObjects.Zone
  outline: Phaser.GameObjects.Graphics
  signPrimary: Phaser.GameObjects.Text
  signAlert: Phaser.GameObjects.Text
}
export class OfficeScene extends Phaser.Scene {
  private spec: WorldSpec = { rooms: [], label: '' }
  private plan!: FloorPlan
  private player!: Phaser.Physics.Arcade.Sprite
  private keys?: Record<string, Phaser.Input.Keyboard.Key>
  private solids!: Phaser.Physics.Arcade.StaticGroup
  private roomViews = new Map<RoomId, RoomView>()
  private zoomIndex = DEFAULT_ZOOM
  private cameraMode: 'follow' | 'overview' = 'follow'
  private facing: HeroDir = 'down'
  private currentRoom: RoomId | null = null
  private highlighted: RoomId | null = null
  private unsubscribe: (() => void)[] = []
  private torndown = false
  constructor() {
    super('office')
  }
  init(data: WorldSpec): void {
    this.spec = data?.rooms?.length ? data : this.spec
    this.torndown = false
    this.roomViews.clear()
  }
  create(): void {
    if (!this.spec.rooms.length) return
    dropPlanTextures(this)
    this.plan = buildFloorPlan(this.spec.rooms)
    buildTextures(this, this.plan)
    this.cameras.main.setBackgroundColor(PALETTE.exterior)
    const map = this.make.tilemap({
      data: this.plan.grid,
      tileWidth: TILE,
      tileHeight: TILE,
    })
    const tileset = map.addTilesetImage(TEX.tileset, TEX.tileset, TILE, TILE, 0, 0)
    if (!tileset) throw new Error('tileset não pôde ser registrado')
    const floor = map.createLayer(0, tileset, 0, 0)
    if (!floor) throw new Error('camada de piso não pôde ser criada')
    floor.setCollision(SOLID_TILES)
    floor.setDepth(0)
    this.add.image(0, 0, TEX.overlay).setOrigin(0, 0).setDepth(1)
    this.solids = this.physics.add.staticGroup()
    this.buildFurniture()
    this.buildRooms()
    this.buildPlayer()
    this.physics.add.collider(this.player, floor)
    this.physics.add.collider(this.player, this.solids)
    this.setupCamera()
    this.setupInput()
    this.setupBus()
    bus.emit('scene:ready', { rooms: this.spec.rooms.map((room) => room.id) })
    this.emitCameraState()
  }
  // ------------------------------------------------------------- construção
  private addSolid(x: number, y: number, w: number, h: number): void {
    const zone = this.add.zone(x + w / 2, y + h / 2, w, h)
    this.solids.add(zone)
    const body = zone.body as Phaser.Physics.Arcade.StaticBody | null
    body?.setSize(w, h)
  }
  private buildFurniture(): void {
    const accentByRoom = new Map(this.plan.rooms.map((p) => [p.room.id, p.room.accent]))
    for (const desk of this.plan.desks) {
      const x = desk.x * TILE
      const y = desk.y * TILE
      const accent = accentByRoom.get(desk.roomId) ?? PALETTE.deskTop
      this.add
        .image(desk.chair.x * TILE, desk.chair.y * TILE, TEX.chair)
        .setOrigin(0, 0)
        .setDepth(10 + desk.chair.y * TILE)
      this.add
        .image(x, y, TEX.desk(accent))
        .setOrigin(0, 0)
        .setDepth(10 + y + desk.h * TILE)
      this.addSolid(x, y, desk.w * TILE, desk.h * TILE)
    }
    for (const decor of this.plan.decor) {
      const x = decor.x * TILE
      const y = decor.y * TILE
      this.add
        .image(x, y + TILE, TEX.plant)
        .setOrigin(0, 1)
        .setDepth(10 + y + TILE)
      this.addSolid(x + TILE * 0.2, y + TILE * 0.3, TILE * 0.6, TILE * 0.7)
    }
  }
  /**
   * Cada sala ganha uma área clicável do tamanho do interior e uma placa.
   * Sala que não veio em spec.rooms não tem nada disso.
   */
  private buildRooms(): void {
    for (const placement of this.plan.rooms) {
      const { rect, room, sign } = placement
      const ix = (rect.x + 1) * TILE
      const iy = (rect.y + 1) * TILE
      const iw = (rect.w - 2) * TILE
      const ih = (rect.h - 2) * TILE
      const outline = this.add.graphics().setDepth(2)
      const zone = this.add.zone(ix, iy, iw, ih).setOrigin(0, 0)
      zone.setInteractive({ useHandCursor: true })
      zone.on('pointerover', () => this.drawOutline(outline, placement, 0.85))
      zone.on('pointerout', () => {
        if (this.highlighted === room.id) this.drawOutline(outline, placement, 0.5)
        else outline.clear()
      })
      zone.on('pointerdown', () => bus.emit('room:open', room.id))
      const signX = sign.x * TILE
      const signY = (sign.y + 1) * TILE - 2
      this.add
        .image(signX, signY, TEX.sign(room.accent))
        .setOrigin(0.5, 1)
        .setDepth(3)
      const signPrimary = this.add
        .text(signX, signY - SIGN_H + 8, room.name.toUpperCase(), {
          fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
          fontSize: '11px',
          color: '#f2f5fa',
        })
        .setOrigin(0.5, 0)
        .setResolution(2)
        .setDepth(4)
      const signAlert = this.add
        .text(signX, signY - SIGN_H + 21, '', {
          fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
          fontSize: '9px',
          color: '#b9c6d8',
        })
        .setOrigin(0.5, 0)
        .setResolution(2)
        .setDepth(4)
      this.roomViews.set(room.id, { placement, zone, outline, signPrimary, signAlert })
    }
  }
  private drawOutline(
    graphics: Phaser.GameObjects.Graphics,
    placement: RoomPlacement,
    alpha: number,
  ): void {
    const { rect, room } = placement
    graphics.clear()
    graphics.lineStyle(2, toNum(room.accent), alpha)
    graphics.strokeRect(
      (rect.x + 1) * TILE + 1,
      (rect.y + 1) * TILE + 1,
      (rect.w - 2) * TILE - 2,
      (rect.h - 2) * TILE - 2,
    )
  }
  private buildPlayer(): void {
    this.player = this.physics.add.sprite(
      this.plan.spawn.x * TILE + TILE / 2,
      this.plan.spawn.y * TILE + TILE / 2,
      TEX.hero('down', 0),
    )
    this.player.setOrigin(0.5, 0.8)
    this.player.setSize(12, 8)
    this.player.setOffset(5, 21)
    this.player.setCollideWorldBounds(true)
    this.player.setDepth(10 + this.player.y)
    for (const dir of HERO_DIRS) {
      if (this.anims.exists(`walk-${dir}`)) continue
      this.anims.create({
        key: `walk-${dir}`,
        frames: [{ key: TEX.hero(dir, 0) }, { key: TEX.hero(dir, 1) }],
        frameRate: 7,
        repeat: -1,
      })
    }
  }
  private setupCamera(): void {
    const cam = this.cameras.main
    this.physics.world.setBounds(0, 0, this.plan.width, this.plan.height)
    cam.setBounds(0, 0, this.plan.width, this.plan.height)
    cam.setZoom(ZOOM_STEPS[this.zoomIndex])
    cam.startFollow(this.player, true, 0.14, 0.14)
    cam.setRoundPixels(true)
  }
  private setupInput(): void {
    const keyboard = this.input.keyboard
    if (!keyboard) return
    keyboard.addCapture('UP,DOWN,LEFT,RIGHT')
    this.keys = keyboard.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >
  }
  private setupBus(): void {
    this.unsubscribe.push(
      bus.on('rooms:badges', (badges) => this.applyBadges(badges)),
      bus.on('room:highlight', (roomId) => this.applyHighlight(roomId)),
      bus.on('room:goto', (roomId) => this.gotoRoom(roomId)),
      bus.on('camera:command', (command) => this.runCameraCommand(command)),
    )
    // game.destroy() emite DESTROY, e não SHUTDOWN. Sem ouvir os dois, a cena
    // descartada continuaria assinada no bus e quebraria a cena viva.
    const release = () => {
      this.torndown = true
      this.unsubscribe.forEach((off) => off())
      this.unsubscribe = []
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, release)
    this.events.once(Phaser.Scenes.Events.DESTROY, release)
  }
  // ------------------------------------------------------------- estado
  private applyBadges(badges: bus.BusEvents['rooms:badges']): void {
    if (this.torndown) return
    for (const badge of badges) {
      const view = this.roomViews.get(badge.roomId)
      if (!view) continue
      view.signPrimary.setText(view.placement.room.name.toUpperCase())
      view.signAlert.setText(
        badge.alert ? `${badge.primary}  ·  ${badge.alert}` : badge.primary,
      )
      view.signAlert.setColor(badge.health === 'late' ? '#f0938b' : '#b9c6d8')
    }
  }
  private applyHighlight(roomId: RoomId | null): void {
    if (this.torndown) return
    this.highlighted = roomId
    for (const [id, view] of this.roomViews) {
      if (id === roomId) this.drawOutline(view.outline, view.placement, 0.5)
      else view.outline.clear()
    }
  }
  /** Teleporte com transição curta: apaga, reposiciona, acende. */
  private gotoRoom(roomId: RoomId): void {
    if (this.torndown) return
    const view = this.roomViews.get(roomId)
    if (!view) return
    const target = view.placement.entry
    const cam = this.cameras.main
    cam.fadeOut(140, 11, 14, 19)
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      if (this.torndown) return
      this.player.setVelocity(0, 0)
      this.player.setPosition(target.x * TILE + TILE / 2, target.y * TILE + TILE / 2)
      this.player.setDepth(10 + this.player.y)
      this.resumeFollow()
      cam.centerOn(this.player.x, this.player.y)
      cam.fadeIn(180, 11, 14, 19)
    })
  }
  private runCameraCommand(command: bus.CameraCommand): void {
    if (this.torndown) return
    const cam = this.cameras.main
    if (command === 'overview') {
      this.cameraMode = 'overview'
      cam.stopFollow()
      const fit = Math.min(cam.width / this.plan.width, cam.height / this.plan.height) * 0.96
      cam.zoomTo(fit, 400, 'Sine.easeInOut')
      cam.pan(this.plan.width / 2, this.plan.height / 2, 400, 'Sine.easeInOut')
      this.emitCameraState(fit)
      return
    }
    if (command === 'follow') {
      this.resumeFollow()
      return
    }
    const step = command === 'zoom-in' ? 1 : -1
    this.zoomIndex = Phaser.Math.Clamp(this.zoomIndex + step, 0, ZOOM_STEPS.length - 1)
    if (this.cameraMode === 'overview') {
      this.resumeFollow()
      return
    }
    cam.zoomTo(ZOOM_STEPS[this.zoomIndex], 200, 'Sine.easeInOut')
    this.emitCameraState()
  }
  private resumeFollow(): void {
    const cam = this.cameras.main
    this.cameraMode = 'follow'
    cam.panEffect.reset()
    cam.startFollow(this.player, true, 0.14, 0.14)
    cam.zoomTo(ZOOM_STEPS[this.zoomIndex], 280, 'Sine.easeInOut')
    this.emitCameraState()
  }
  private emitCameraState(zoom?: number): void {
    bus.emit('camera:state', {
      zoom: zoom ?? ZOOM_STEPS[this.zoomIndex],
      mode: this.cameraMode,
    })
  }
  // ------------------------------------------------------------- loop
  update(): void {
    if (this.torndown || !this.keys || !this.player) return
    const keys = this.keys
    const left = keys.A.isDown || keys.LEFT.isDown
    const right = keys.D.isDown || keys.RIGHT.isDown
    const up = keys.W.isDown || keys.UP.isDown
    const down = keys.S.isDown || keys.DOWN.isDown
    const vector = new Phaser.Math.Vector2(
      (right ? 1 : 0) - (left ? 1 : 0),
      (down ? 1 : 0) - (up ? 1 : 0),
    )
    if (vector.lengthSq() > 0) {
      vector.normalize().scale(SPEED)
      if (this.cameraMode === 'overview') this.resumeFollow()
    }
    this.player.setVelocity(vector.x, vector.y)
    if (vector.lengthSq() > 0) {
      const facing: HeroDir =
        Math.abs(vector.x) > Math.abs(vector.y)
          ? vector.x > 0
            ? 'right'
            : 'left'
          : vector.y > 0
            ? 'down'
            : 'up'
      this.facing = facing
      this.player.anims.play(`walk-${facing}`, true)
    } else {
      this.player.anims.stop()
      this.player.setTexture(TEX.hero(this.facing, 0))
    }
    this.player.setDepth(10 + this.player.y)
    const room = roomAtPixel(this.plan, this.player.x, this.player.y)
    const roomId = room?.room.id ?? null
    if (roomId !== this.currentRoom) {
      this.currentRoom = roomId
      bus.emit('room:enter', roomId)
    }
  }
}
