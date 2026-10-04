import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json' with { type: 'json' }

// Für GitHub Pages läuft die App unter /<Repo-Name>/.
// Der Workflow setzt BASE_PATH automatisch, lokal ist es "/".
const base = process.env.BASE_PATH || '/'

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    // Spotify erlaubt für lokale Entwicklung nur 127.0.0.1 (nicht "localhost").
    host: '127.0.0.1',
    port: 5173,
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Spukify',
        short_name: 'Spukify',
        description: 'Dein Spotify – im eigenen Look. Steuert die Spotify-App per Spotify Connect.',
        lang: 'de',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#121212',
        theme_color: '#121212',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            // Cover-Bilder von Spotify zwischenspeichern
            urlPattern: /^https:\/\/(i\.scdn\.co|mosaic\.scdn\.co|image-cdn-[a-z0-9-]+\.spotifycdn\.com)\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'spotify-images',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
