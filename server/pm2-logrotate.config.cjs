/**
 * PM2 Log Rotation Configuration
 *
 * Install the PM2 log rotate module:
 *   pm2 install pm2-logrotate
 *
 * Then apply this config:
 *   pm2 set pm2-logrotate:max_size 10M       # rotate when file exceeds 10 MB
 *   pm2 set pm2-logrotate:retain 7           # keep 7 rotated files
 *   pm2 set pm2-logrotate:compress true      # gzip old logs
 *   pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
 *   pm2 set pm2-logrotate:rotateInterval '0 0 * * *'  # daily at midnight
 *   pm2 set pm2-logrotate:workerInterval 30  # check every 30 seconds
 *
 * To apply in one shot after installing pm2-logrotate:
 *   pm2 set pm2-logrotate:max_size 10M && pm2 set pm2-logrotate:retain 7 && pm2 set pm2-logrotate:compress true
 */

module.exports = {
  apps: [
    {
      name: 'pm2-logrotate',
      script: 'pm2-logrotate',
      autorestart: true,
      max_memory_restart: '50M',
      env: {
        PM2_LOG_ROTATE: true,
      },
    },
  ],
};
