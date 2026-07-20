/**
 * PM2 Ecosystem File
 *
 * Usage:
 *   pm2 start pm2.config.cjs              — start in production mode
 *   pm2 start pm2.config.cjs --env dev    — start in development mode
 *   pm2 reload pm2.config.cjs             — zero-downtime reload
 *   pm2 stop ticket-server                — stop
 *   pm2 logs ticket-server                — tail logs
 *   pm2 monit                             — live dashboard
 *
 * Save process list so it survives reboots:
 *   pm2 save
 *   pm2 startup   (follow the printed command to enable on boot)
 */

module.exports = {
  apps: [
    {
      // ── Identity ────────────────────────────────────────────────────────────
      name: 'ticket-server',
      script: 'server.js',

      // ── Clustering ──────────────────────────────────────────────────────────
      // Socket.IO requires sticky sessions in cluster mode so that all requests
      // from a given client hit the same worker (the long-poll fallback breaks
      // otherwise).  We default to 1 instance which is safe on any setup.
      //
      // To scale up:
      //   1. Enable sticky sessions in your nginx / AWS ALB config (see docs/nginx-sticky.md)
      //   2. Set WEB_CONCURRENCY env var to the number of cores you want to use,
      //      or set instances to 'max' to use all available cores.
      instances: process.env.WEB_CONCURRENCY || 1,
      exec_mode: 'cluster',

      // ── Restart policy ───────────────────────────────────────────────────────
      // Restart automatically on crash, but back off exponentially to avoid
      // a crash loop hammering the database.
      autorestart:      true,
      max_restarts:     10,
      min_uptime:       '5s',
      restart_delay:    4000,   // ms between restarts
      exp_backoff_restart_delay: 100,

      // ── Memory guard ─────────────────────────────────────────────────────────
      // Restart the process if it exceeds 512 MB.  Tune to your server's RAM.
      max_memory_restart: '512M',

      // ── Logging ──────────────────────────────────────────────────────────────
      // PM2 merges stdout/stderr from all cluster workers into these files.
      out_file:   './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // ── Environment: production (default) ────────────────────────────────────
      env: {
        NODE_ENV:    'production',
        PORT:        5000,
        // All secrets must be set in the OS environment or a .env file loaded
        // before PM2 starts.  Do NOT hardcode secrets here.
      },

      // ── Environment: development ──────────────────────────────────────────────
      env_dev: {
        NODE_ENV:    'development',
        PORT:        5000,
        instances:   1,
        watch:       true,
        ignore_watch: ['node_modules', 'logs', '__tests__'],
      },

      // ── Graceful shutdown ─────────────────────────────────────────────────────
      // Give the server 30 s to finish in-flight requests before SIGKILL.
      kill_timeout:    30000,
      listen_timeout:  10000,

      // ── Source maps ───────────────────────────────────────────────────────────
      source_map_support: false,
    },
  ],
};
