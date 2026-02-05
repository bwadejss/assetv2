import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Ensures assets load correctly on GitHub Pages subpaths
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      // Mark libraries from the import map as external so Rollup doesn't try to bundle them from node_modules
      external: [
        'react',
        'react-dom',
        'react-dom/client',
        'lucide-react',
        'docx',
        'html5-qrcode'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'html5-qrcode': 'Html5Qrcode'
        }
      }
    }
  }
});