import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const loadedEnv = loadEnv(mode, process.cwd(), '')
  const googleClientId = loadedEnv.VITE_GOOGLE_CLIENT_ID || loadedEnv.GOOGLE_CLIENT_ID || ''

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'icons.svg', 'pwa-192.png', 'pwa-512.png'],
        manifest: {
          id: '/',
          start_url: '/',
          scope: '/',
          name: 'Vision — AI Accessibility App',
          short_name: 'Vision',
          description: 'AI-powered accessibility application for visually impaired users',
          theme_color: '#0B121B',
          background_color: '#0B121B',
          display: 'standalone',
          icons: [
            {
              src: '/pwa-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
          ],
        },
      }),
    ],
    define: {
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(googleClientId),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.js',
    },
  }
})
