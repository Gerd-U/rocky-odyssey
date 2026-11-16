import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Transforma el globo al arrancar el servidor: la primera visita no espera a compilarlo
    warmup: { clientFiles: ['./src/components/globe/GlobeView.tsx'] },
  },
  optimizeDeps: {
    // GlobeView se carga con React.lazy: sin esto Vite descubre react-globe.gl
    // tarde, re-optimiza a mitad de carga y puede duplicar React en dev.
    include: ['react-globe.gl', 'three', 'motion/react', 'react-router-dom'],
  },
})
