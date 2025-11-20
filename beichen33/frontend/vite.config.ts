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
    host: '0.0.0.0', // 监听所有网络接口
    allowedHosts: ['beichen.706tech.cn', '.706tech.cn', 'localhost'], // 允许的域名
    strictPort: false,
    watch: {
      usePolling: false, // 禁用轮询，避免过度监听
      ignored: ['**/node_modules/**', '**/.git/**'],
    },
    hmr: {
      // 不指定 host，让浏览器使用当前访问的域名
      overlay: true,
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
