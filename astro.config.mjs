// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // GitHub Pages: https://mhd1024.github.io/isna/
  // Kalau nanti pakai domain sendiri, ganti `site` ke domain itu dan hapus `base`.
  site: 'https://mhd1024.github.io',
  base: '/isna',
  build: { inlineStylesheets: 'auto' },
  vite: {
    plugins: [tailwindcss()],
    build: { chunkSizeWarningLimit: 700 },
  },
});
