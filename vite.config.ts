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
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4300',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:4300',
        ws: true,
      },
    },
  },
});
