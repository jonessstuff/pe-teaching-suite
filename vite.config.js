import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // We register + drive update checks manually in src/main.jsx so a
      // standalone mobile PWA that stays open (or resumes from background)
      // still picks up new releases. Disable the plugin's auto-injected
      // registration to avoid registering the service worker twice.
      injectRegister: null,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'PlansK12 — Lesson Planning for Specialists',
        short_name: 'PlansK12',
        description: 'AI lesson planning for PE, Art, Music, Library & STEM specialists',
        theme_color: '#0a0d12',
        background_color: '#0a0d12',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        // Take control immediately and purge precache entries from prior
        // releases, so a new build's module list replaces the old one instead
        // of being served from a stale cache.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-cache', networkTimeoutSeconds: 10 },
          },
        ],
      },
    }),
  ],
})
