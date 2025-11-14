import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8892,
    proxy: {
      '/api': {
        // 使用Docker服务名，在容器内运行时指向backend容器
        target: process.env.VITE_API_URL || 'http://backend:8891',
        changeOrigin: true,
      },
    },
  },
});
