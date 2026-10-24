import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

// GitHub Pages serves the app from /polski-b1/
export default defineConfig({
  base: '/polski-b1/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version.replace(/\.0$/, '')),
  },
  plugins: [
    preact(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/*.png', 'favicon.svg'],
      manifest: {
        name: 'Polski B1',
        short_name: 'Polski B1',
        description: 'Study Polish for the B1 exam',
        lang: 'en',
        start_url: '/polski-b1/',
        scope: '/polski-b1/',
        display: 'standalone',
        background_color: '#F3F0E9',
        theme_color: '#F3F0E9',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
      },
    }),
  ],
});
