import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        // Mantém o three.js fora do chunk de entrada: a primeira pintura é só
        // DOM e GSAP, e o 3D chega quando a primeira secção o pedir.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@react-three')) return 'r3f'
          if (id.includes('three')) return 'three'
          if (id.includes('gsap')) return 'gsap'
        },
      },
    },
  },
})
