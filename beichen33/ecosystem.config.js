// PM2 配置文件
// 使用方法: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      // 后端应用
      name: 'beichen33-backend',
      script: './backend/dist/main.js',
      cwd: './backend',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 8891,
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
    {
      // 前端应用 (如果需要用 PM2 serve 静态文件)
      // 注意：通常前端用 Nginx 托管，这个配置可选
      name: 'beichen33-frontend',
      script: 'serve',
      args: '-s dist -l 8892',
      cwd: './frontend',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      autorestart: true,
    },
  ],
};
