import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'web',
  plugins: [react()],
  build: { outDir: '../dist/web', emptyOutDir: true },
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3000', ws: true },
      '/__test__': 'http://localhost:3000',
    },
  },
});
