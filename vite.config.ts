import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@features': '/src/features',
      '@hooks': '/src/hooks',
      '@stores': '/src/stores',
      '@services': '/src/services',
      '@types': '/src/types',
      '@utils': '/src/utils',
      '@layouts': '/src/layouts',
      '@pages': '/src/pages',
      '@assets': '/src/assets',
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'https://cc7d-42-116-239-137.ngrok-free.app',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'https://cc7d-42-116-239-137.ngrok-free.app',
        ws: true,
      },
    },
  },
});
