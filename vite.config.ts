import { defineConfig } from 'vitest/config'

import { copyFileSync, existsSync, realpathSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// In dev the frontend calls API routes same-origin under `/api`; Vite rewrites
// and proxies them to the Elysia server so no CORS config or absolute URL is
// needed. The backend continues to mount its routes at the root (`/auth`, ...).
const apiTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:3000'
const configDir = fileURLToPath(new URL('.', import.meta.url))
const realConfigDir = realpathSync(configDir)

function githubPagesSpaFallback() {
  return {
    name: 'github-pages-spa-fallback',
    closeBundle() {
      const index = resolve(realConfigDir, 'dist/index.html')
      const fallback = resolve(realConfigDir, 'dist/404.html')
      if (existsSync(index)) {
        copyFileSync(index, fallback)
      }
    },
  }
}

const apiProxy = {
  '/api': {
    target: apiTarget,
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/api/, ''),
  },
}

// https://vite.dev/config/
export default defineConfig({
  base: '/personal-expense-tracker/',
  plugins: [
    tailwindcss(),
    vue(),
    vueDevTools(),
    githubPagesSpaFallback(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Personal Expense Tracker',
        short_name: 'Expense Tracker',
        description: 'Track expenses, budgets, trips, and recovery snapshots offline.',
        theme_color: '#7c3aed',
        background_color: '#f7f4ff',
        display: 'standalone',
        start_url: '/personal-expense-tracker/',
        scope: '/personal-expense-tracker/',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: apiProxy,
    fs: {
      allow: [configDir, realConfigDir],
    },
  },
  test: {
    environment: 'jsdom',
  },
})
