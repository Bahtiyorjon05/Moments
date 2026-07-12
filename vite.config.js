import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// We only use nsfwjs's MobileNetV2 model — stub the other (huge) bundled models
// so ~33MB of Inception weights don't end up in the build.
const excludeHeavyModels = {
  name: 'exclude-heavy-nsfw-models',
  enforce: 'pre',
  load(id) {
    if (/nsfwjs[\\/].*models[\\/](inception_v3|mobilenet_v2_mid)[\\/]/.test(id)) return 'export default {}'
    return null
  },
}

export default defineConfig({
  plugins: [
    excludeHeavyModels,
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Moments — Share your best moments',
        short_name: 'Moments',
        description: 'Photos, videos, reels, stories & real-time chat. Share your best moments.',
        theme_color: '#0b0b12',
        background_color: '#08080d',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['social', 'photo', 'lifestyle'],
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Don't precache the huge ML model / tfjs chunks — they load on demand.
        globIgnores: ['**/group1-shard*.js', '**/model.min-*.js'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/api/],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Never let the service worker touch the API — always go to network.
            urlPattern: ({ url }) => url.pathname.startsWith('/api'),
            handler: 'NetworkOnly',
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://picsum.photos' || url.origin === 'https://i.pravatar.cc',
            handler: 'CacheFirst',
            options: { cacheName: 'moments-images', expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 14 } },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: { port: 5173, open: true },
})
