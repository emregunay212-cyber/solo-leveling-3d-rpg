import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    fs: {
      allow: [
        path.resolve(__dirname),
        path.resolve(__dirname, '..'),
        path.resolve(__dirname, '../../../node_modules'),
        path.resolve(__dirname, '../../..'),
      ],
    },
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
  },
  optimizeDeps: {
    exclude: ['@babylonjs/havok'],
  },
});
