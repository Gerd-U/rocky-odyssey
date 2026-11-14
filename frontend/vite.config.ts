import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    // GlobeView se carga con React.lazy: sin esto Vite descubre react-globe.gl
    // tarde, re-optimiza a mitad de carga y puede duplicar React en dev.
    include: ['react-globe.gl', 'three', 'motion/react', 'react-router-dom'],
  },
})
