import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({ strategies: 'injectManifest', srcDir: 'src', filename: 'sw.js', manifest: false, injectRegister: false, devOptions: { enabled: false } }),
  ],
  server: { proxy: { '/api': 'http://127.0.0.1:3008' } },
})
