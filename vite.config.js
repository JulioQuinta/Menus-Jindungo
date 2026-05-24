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
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/jindungo_logo_v3.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/jindungo_logo_v3.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html}', '**/jindungo_logo_v3.png'], // Apenas código e o logotipo principal essencial
        maximumFileSizeToCacheInBytes: 5000000, // [NEW] Allow files up to 5MB to be cached (important for large bundles)
        runtimeCaching: [
          {
            // Cache para Imagens do Supabase (Menus/Itens)
            urlPattern: ({ url }) => url.origin.includes('supabase.co'),
            handler: 'StaleWhileRevalidate', // Carrega rápido da cache, mas atualiza se houver nova versão
            options: {
              cacheName: 'supabase-images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 dias
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // [NEW] Cache para a DB do Supabase (Offline Menu Support)
            urlPattern: ({ url }) => url.origin.includes('supabase.co') && url.pathname.includes('/rest/v1/'),
            handler: 'NetworkFirst', // Tenta rede 1º (para dados frescos), se falhar usa a cache (Offline App)
            options: {
              cacheName: 'supabase-api-db',
              networkTimeoutSeconds: 3, // Se a rede angolana demorar > 3s, devolve logo a cache
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 Dias de fallback DB local
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache para Google Fonts
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 ano
              },
            },
          },
          {
            // Cache para Ativos Estáticos (Vite Assets)
            urlPattern: ({ request }) => request.destination === 'script' || request.destination === 'style' || request.destination === 'worker',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
            },
          },
        ],
      },
    })
  ],
  server: {
    port: 5174,
    host: true, // Expose to network
    allowedHosts: ['all', '.loca.lt'], // Enable localtunnel external hosts
  },
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    emptyOutDir: true, // Garante que o Vite limpa a pasta dist antes de buildar
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-utils': ['lucide-react', 'react-hot-toast', '@supabase/supabase-js'],
        }
      }
    }
  }
})
