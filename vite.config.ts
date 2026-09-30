import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // O chunk do Phaser passa de 500 kB por natureza, o aviso padrão não ajuda.
    chunkSizeWarningLimit: 1400,
    rolldownOptions: {
      output: {
        // Phaser é grande e estável. Em chunk separado, ele fica em cache
        // entre deploys e o bundle da interface continua leve.
        advancedChunks: {
          groups: [{ name: 'phaser', test: /node_modules[\\/]phaser/ }],
        },
      },
    },
  },
})
