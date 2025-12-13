/**
 * PM2 Ecosystem Configuration
 * JASPER Financial Architecture - VPS Deployment
 * Server: 72.61.201.237 (srv1145603.hstgr.cloud)
 */

module.exports = {
  apps: [
    // ============================================
    // JASPER Main Website - Static Server
    // Port: 3001
    // ============================================
    {
      name: 'jasper-main',
      cwd: '../jasper-main-site',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      watch: false,
      max_memory_restart: '200M',
      error_file: './logs/jasper-main-error.log',
      out_file: './logs/jasper-main-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },

    // ============================================
    // JASPER API - Express Server
    // Port: 3003
    // ============================================
    {
      name: 'jasper-api',
      cwd: './jasper-api',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
      },
      env_file: '.env.production',
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/jasper-api-error.log',
      out_file: './logs/jasper-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },

    // ============================================
    // JASPER Admin Portal Frontend - Next.js
    // Port: 3002
    // ============================================
    {
      name: 'jasper-portal',
      cwd: './jasper-portal-frontend',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
      env_file: '.env.production',
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/jasper-portal-error.log',
      out_file: './logs/jasper-portal-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },

    // ============================================
    // JASPER Client Portal - Next.js
    // Port: 3004
    // ============================================
    {
      name: 'jasper-client',
      cwd: './jasper-client-portal',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
      },
      env_file: '.env.production',
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/jasper-client-error.log',
      out_file: './logs/jasper-client-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],

  // ============================================
  // DEPLOYMENT CONFIGURATION
  // ============================================
  deploy: {
    production: {
      user: 'root',
      host: '72.61.201.237',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/jasper-financial-architecture.git',
      path: '/root/jasper-financial-architecture',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};
