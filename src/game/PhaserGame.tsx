import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { OfficeScene } from './OfficeScene'
import { PALETTE } from './palette'

/**
 * Monta e destrói a instância do Phaser. A comunicação com a interface passa
 * só pelo bus, então este componente não recebe nem devolve dados de negócio.
 */
export default function PhaserGame() {
  const hostRef = useRef<HTMLDivElement>(null)

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
      scene: [OfficeScene],
    })

    return () => {
      game.destroy(true)
    }
  }, [])

  return <div className="game-host" ref={hostRef} />
}
