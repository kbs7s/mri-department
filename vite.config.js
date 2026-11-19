import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'جرد ومتابعة قسم الأشعة',
        short_name: 'جرد الأشعة',
        description: 'جرد شهري للمواد والصرفيات وإحصائية الفحوصات',
        lang: 'ar',
        dir: 'rtl',
        display: 'standalone',
        start_url: '.',
        background_color: '#f4f6f9',
        theme_color: '#0f4c81',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: 'index.html'
      }
    })
  ],
  build: { chunkSizeWarningLimit: 1500 }
});
