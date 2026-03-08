import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Menús Jindungos',
        short_name: 'Jindungo',
        description: 'Menu Digital Premium para Restaurantes',
        theme_color: '#4A0404',
        background_color: '#121212',
        icons: [
          {
            src: '/jindungo_long.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/jindungo_long.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
              },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://api.supabase.co', // Adjust if needed
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-cache',
            },
          },
        ],
      },
    })
  ],
  server: {
    port: 5176,
    host: true, // Expose to network
    allowedHosts: ['all', '.loca.lt'], // Enable localtunnel external hosts
  },
})
