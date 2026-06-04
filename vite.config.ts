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
        target: 'https://0c9d-14-233-186-38.ngrok-free.app',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'https://0c9d-14-233-186-38.ngrok-free.app',
        ws: true,
      },
    },
  },
});
