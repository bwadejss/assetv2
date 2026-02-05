import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '', // Relative paths for better compatibility with GitHub Pages subdirectories
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      // Explicitly externalize dependencies provided by the browser's importmap
      // that are not installed in the local node_modules.
      external: ['html5-qrcode'],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    }
  }
});