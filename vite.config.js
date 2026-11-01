import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['peaceville-icon.svg'],
      manifest: {
        name: 'Peaceville Estate',
        short_name: 'Peaceville',
        description: 'Estate operations and resident services.',
        theme_color: '#174a43',
        background_color: '#f5f4ed',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: '/peaceville-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
    }),
  ],
})
