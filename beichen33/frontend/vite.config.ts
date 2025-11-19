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
    host: true, // 接受所有主机名
    strictPort: false,
    hmr: {
      // 让客户端使用当前访问的域名，适应不同部署环境
      clientPort: 8892,
    },
    proxy: {
      '/api': {
        // 使用Docker服务名，在容器内运行时指向backend容器
        target: process.env.VITE_API_URL || 'http://backend:8891',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    port: 8892,
  },
});
