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
      // We allow Vite to bundle these for production to avoid Import Map runtime issues
      // while keeping them available via CDN for development/ESM environments.
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    }
  }
});