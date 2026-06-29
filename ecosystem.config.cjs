module.exports = {
  apps: [
    {
      name: 'patent-hash-backend',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',

      // Fallback env (when --env flag is not passed)
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },

      // Loaded when you run: pm2 start ecosystem.config.cjs --env production
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },

      // Log files (create a logs/ folder first)
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
