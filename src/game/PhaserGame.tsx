import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { OfficeScene, type WorldSpec } from './OfficeScene'
import { PALETTE } from './palette'

/**
 * Ponte com o Phaser. Recebe a planta já filtrada por permissões: o que não
 * está em world.rooms não chega à cena e portanto não existe no mapa.
 */
export default function PhaserGame({ world }: { world: WorldSpec }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    const parent = hostRef.current
    if (!parent) return

    // O WebGL não aceita framebuffer 0x0: sem tamanho inicial explícito, um
    // boot antes do layout resolver derruba o renderer.
    const rect = parent.getBoundingClientRect()
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      backgroundColor: PALETTE.exterior,
      pixelArt: true,
      roundPixels: true,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.NO_CENTER,
        width: Math.max(320, Math.floor(rect.width) || window.innerWidth),
        height: Math.max(240, Math.floor(rect.height) || window.innerHeight),
      },
      physics: {
        default: 'arcade',
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
      },
    })
    gameRef.current = game

    return () => {
      gameRef.current = null
      game.destroy(true)
    }
  }, [])

  useEffect(() => {
    const game = gameRef.current
    if (!game || !world.rooms.length) return

    const apply = () => {
      const existing = game.scene.getScene('office')
      if (existing) existing.scene.restart(world)
      else game.scene.add('office', OfficeScene, true, world)
    }

    if (game.isBooted) apply()
    else game.events.once(Phaser.Core.Events.READY, apply)
  }, [world])

  return <div className="game-host" ref={hostRef} />
}
