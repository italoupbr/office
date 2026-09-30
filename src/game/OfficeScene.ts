import Phaser from 'phaser'
import type { DeskSummary, RoomId } from '../types'
import { STATUS_COLOR } from '../lib/status'
import * as bus from './bus'
import {
  DECOR,
  DESKS,
  MAP_H,
  MAP_W,
  ROOMS,
  SOLID_TILES,
  SPAWN,
  TILE,
  buildTileGrid,
  roomAtPixel,
  type DeskDef,
} from './layout'
import { PALETTE, toNum } from './palette'
import {
  HERO_DIRS,
  TEX,
  buildTextures,
  markerSlot,
  paperSlot,
  type HeroDir,
} from './textures'

const ZOOM_STEPS = [0.6, 0.8, 1, 1.25, 1.5, 2]
const DEFAULT_ZOOM = 4
const SPEED = 175
const MAX_PAPERS = 3

interface DeskView {
  def: DeskDef
  body: Phaser.Physics.Arcade.Image
  papers: Phaser.GameObjects.Image[]
  extra: Phaser.GameObjects.Text
  marker: Phaser.GameObjects.Image
}

export class OfficeScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private solids!: Phaser.Physics.Arcade.StaticGroup
  private deskViews = new Map<string, DeskView>()
  private selection!: Phaser.GameObjects.Graphics
  private zoomIndex = DEFAULT_ZOOM
  private mode: 'follow' | 'overview' = 'follow'
  private facing: HeroDir = 'down'
  private currentRoom: RoomId | null = null
  private selectedDeskId: string | null = null
  private unsubscribe: (() => void)[] = []

  constructor() {
    super('office')
  }

  create(): void {
    const grid = buildTileGrid()
    buildTextures(this, grid)

    this.cameras.main.setBackgroundColor(PALETTE.exterior)

    const map = this.make.tilemap({ data: grid, tileWidth: TILE, tileHeight: TILE })
    const tileset = map.addTilesetImage(TEX.tileset, TEX.tileset, TILE, TILE, 0, 0)
    if (!tileset) throw new Error('tileset não pôde ser registrado')
    const floor = map.createLayer(0, tileset, 0, 0)
    if (!floor) throw new Error('camada de piso não pôde ser criada')
    floor.setCollision(SOLID_TILES)
    floor.setDepth(0)

    this.add.image(0, 0, TEX.overlay).setOrigin(0, 0).setDepth(1)

    this.solids = this.physics.add.staticGroup()

    this.buildRoomLabels()
    this.buildDecor()
    this.buildDesks()

    this.selection = this.add.graphics().setDepth(9)

    this.buildPlayer()
    this.physics.add.collider(this.player, floor)
    this.physics.add.collider(this.player, this.solids)

    this.setupCamera()
    this.setupInput()
    this.setupBus()

    this.emitCameraState()
  }

  // ------------------------------------------------------------- construção

  private buildRoomLabels(): void {
    for (const room of ROOMS) {
      const x = (room.rect.x + room.rect.w / 2) * TILE
      const y = (room.rect.y + 1.5) * TILE
      this.add
        .text(x, y, room.name.toUpperCase(), {
          fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
          fontSize: '13px',
          color: '#f6f3ec',
        })
        .setOrigin(0.5)
        .setResolution(2)
        .setShadow(0, 1, 'rgba(11,14,19,0.65)', 2)
        .setDepth(2)
    }
  }

  private buildDecor(): void {
    for (const decor of DECOR) {
      const x = decor.x * TILE
      const y = decor.y * TILE
      let image: Phaser.GameObjects.Image

      if (decor.kind === 'plant') {
        // A textura da planta é mais alta que um tile, então o vaso fica
        // alinhado ao tile e a folhagem invade o tile de cima.
        image = this.add.image(x, y + TILE, TEX.plant).setOrigin(0, 1)
      } else if (decor.kind === 'sofa') {
        image = this.add.image(x, y, TEX.sofa(decor.accent ?? PALETTE.sofaBase)).setOrigin(0, 0)
      } else if (decor.kind === 'counter') {
        image = this.add.image(x, y, TEX.counter(decor.accent ?? PALETTE.deskTop)).setOrigin(0, 0)
      } else {
        image = this.add.image(x, y, TEX.board(decor.accent ?? PALETTE.deskTop)).setOrigin(0, 0)
      }

      image.setDepth(10 + y + TILE)

      if (decor.solid) this.addSolid(x, y, decor.w * TILE, decor.h * TILE)
    }
  }

  /** Corpo estático sem sprite, para mobiliário que bloqueia o caminho. */
  private addSolid(x: number, y: number, w: number, h: number): void {
    const zone = this.add.zone(x + w / 2, y + h / 2, w, h)
    this.solids.add(zone)
    const body = zone.body as Phaser.Physics.Arcade.StaticBody | null
    body?.setSize(w, h)
  }

  private buildDesks(): void {
    for (const def of DESKS) {
      const x = def.x * TILE
      const y = def.y * TILE
      const deskH = def.h * TILE
      const deskW = def.w * TILE

      for (const chair of def.chairs) {
        this.add
          .image(chair.x * TILE, chair.y * TILE, TEX.chair)
          .setOrigin(0, 0)
          .setDepth(10 + chair.y * TILE)
      }

      const body = this.physics.add.staticImage(x, y, TEX.desk(def.id)).setOrigin(0, 0)
      body.refreshBody()
      body.setDepth(10 + y + deskH)
      body.setInteractive({ useHandCursor: true })
      body.on('pointerover', () => body.setTint(0xd8e2f0))
      body.on('pointerout', () => body.clearTint())
      body.on('pointerdown', () => bus.emit('desk:click', def.id))

      const papers: Phaser.GameObjects.Image[] = []
      for (let i = 0; i < MAX_PAPERS; i += 1) {
        const slot = paperSlot(i, deskH)
        const paper = this.add
          .image(x + slot.x, y + slot.y, TEX.paper)
          .setOrigin(0, 0)
          .setDepth(11 + y + deskH)
          .setVisible(false)
        papers.push(paper)
      }

      const extra = this.add
        .text(x + 7, y + deskH - 44, '', {
          fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
          fontSize: '11px',
          color: '#2b313c',
        })
        .setOrigin(0, 0)
        .setResolution(2)
        .setDepth(11 + y + deskH)
        .setVisible(false)

      const mSlot = markerSlot(deskW)
      const marker = this.add
        .image(x + mSlot.x, y + mSlot.y, TEX.marker)
        .setOrigin(0, 0)
        .setDepth(12 + y + deskH)
        .setVisible(false)

      this.tweens.add({
        targets: marker,
        alpha: { from: 1, to: 0.35 },
        duration: 780,
        yoyo: true,
        repeat: -1,
      })

      this.deskViews.set(def.id, { def, body, papers, extra, marker })
    }
  }

  private buildPlayer(): void {
    this.player = this.physics.add.sprite(
      SPAWN.x * TILE + TILE / 2,
      SPAWN.y * TILE + TILE / 2,
      TEX.hero('down', 0),
    )
    this.player.setOrigin(0.5, 0.8)
    this.player.setSize(14, 10)
    this.player.setOffset(5, 21)
    this.player.setCollideWorldBounds(true)
    this.player.setDepth(10 + this.player.y)

    for (const dir of HERO_DIRS) {
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
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H)
    cam.setBounds(0, 0, MAP_W, MAP_H)
    cam.setZoom(ZOOM_STEPS[this.zoomIndex])
    cam.startFollow(this.player, true, 0.12, 0.12)
    cam.setRoundPixels(true)
  }

  private setupInput(): void {
    const keyboard = this.input.keyboard
    if (!keyboard) return
    keyboard.addCapture('UP,DOWN,LEFT,RIGHT,SPACE')
    this.keys = keyboard.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >
  }

  private setupBus(): void {
    this.unsubscribe.push(
      bus.on('desks:update', (summaries) => this.applySummaries(summaries)),
      bus.on('desk:selected', (deskId) => this.drawSelection(deskId)),
      bus.on('camera:command', (command) => this.runCameraCommand(command)),
    )

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe.forEach((off) => off())
      this.unsubscribe = []
    })
  }

  // ------------------------------------------------------------- estado

  private applySummaries(summaries: DeskSummary[]): void {
    const byDesk = new Map(summaries.map((s) => [s.deskId, s]))

    for (const [deskId, view] of this.deskViews) {
      const summary = byDesk.get(deskId)
      const total = summary?.total ?? 0
      const statuses = summary?.statuses ?? []

      view.papers.forEach((paper, index) => {
        const status = statuses[index]
        if (!status) {
          paper.setVisible(false)
          return
        }
        paper.setVisible(true)
        paper.setTint(toNum(STATUS_COLOR[status]))
      })

      const hidden = total - MAX_PAPERS
      view.extra.setVisible(hidden > 0)
      if (hidden > 0) view.extra.setText(`+${hidden}`)

      view.marker.setVisible((summary?.overdue ?? 0) > 0)
      view.body.setAlpha(total === 0 ? 0.78 : 1)
    }

    if (this.selectedDeskId) this.drawSelection(this.selectedDeskId)
  }

  private drawSelection(deskId: string | null): void {
    this.selectedDeskId = deskId
    this.selection.clear()
    if (!deskId) return
    const view = this.deskViews.get(deskId)
    if (!view) return

    const room = ROOMS.find((r) => r.id === view.def.roomId)
    const color = toNum(room?.accent ?? '#ffffff')
    const x = view.def.x * TILE - 3
    const y = view.def.y * TILE - 3
    const w = view.def.w * TILE + 6
    const h = view.def.h * TILE + 6

    this.selection.lineStyle(2, 0xffffff, 0.9)
    this.selection.strokeRect(x, y, w, h)
    this.selection.lineStyle(4, color, 0.55)
    this.selection.strokeRect(x - 2, y - 2, w + 4, h + 4)
  }

  private runCameraCommand(command: bus.CameraCommand): void {
    const cam = this.cameras.main

    if (command === 'overview') {
      this.mode = 'overview'
      cam.stopFollow()
      const fit = Math.min(cam.width / MAP_W, cam.height / MAP_H) * 0.97
      cam.zoomTo(fit, 420, 'Sine.easeInOut')
      cam.pan(MAP_W / 2, MAP_H / 2, 420, 'Sine.easeInOut')
      this.emitCameraState(fit)
      return
    }

    if (command === 'follow') {
      this.resumeFollow()
      return
    }

    const step = command === 'zoom-in' ? 1 : -1
    this.zoomIndex = Phaser.Math.Clamp(this.zoomIndex + step, 0, ZOOM_STEPS.length - 1)
    if (this.mode === 'overview') {
      this.resumeFollow()
      return
    }
    cam.zoomTo(ZOOM_STEPS[this.zoomIndex], 200, 'Sine.easeInOut')
    this.emitCameraState()
  }

  private resumeFollow(): void {
    const cam = this.cameras.main
    this.mode = 'follow'
    cam.panEffect.reset()
    cam.startFollow(this.player, true, 0.12, 0.12)
    cam.zoomTo(ZOOM_STEPS[this.zoomIndex], 300, 'Sine.easeInOut')
    this.emitCameraState()
  }

  private emitCameraState(zoom?: number): void {
    bus.emit('camera:state', {
      zoom: zoom ?? ZOOM_STEPS[this.zoomIndex],
      mode: this.mode,
    })
  }

  // ------------------------------------------------------------- loop

  update(): void {
    const keys = this.keys
    if (!keys) return

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
      // Mover em visão geral devolve a câmera ao personagem, sem precisar
      // voltar no botão.
      if (this.mode === 'overview') this.resumeFollow()
    }
    this.player.setVelocity(vector.x, vector.y)

    if (vector.lengthSq() > 0) {
      const nextFacing: HeroDir =
        Math.abs(vector.x) > Math.abs(vector.y)
          ? vector.x > 0
            ? 'right'
            : 'left'
          : vector.y > 0
            ? 'down'
            : 'up'
      this.facing = nextFacing
      this.player.anims.play(`walk-${nextFacing}`, true)
    } else {
      this.player.anims.stop()
      this.player.setTexture(TEX.hero(this.facing, 0))
    }

    this.player.setDepth(10 + this.player.y)

    const room = roomAtPixel(this.player.x, this.player.y)
    const roomId = room?.id ?? null
    if (roomId !== this.currentRoom) {
      this.currentRoom = roomId
      bus.emit('room:enter', roomId)
    }
  }
}
