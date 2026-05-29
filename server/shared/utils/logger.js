/**
 * Structured logger
 *
 * In production, outputs newline-delimited JSON (compatible with Datadog,
 * CloudWatch, Loki, etc.). In development, outputs human-readable text.
 *
 * Usage:
 *   import logger from '../utils/logger.js';
 *   logger.info('Server started', { port: 5000 });
 *   logger.error('Something broke', { err });
 */

const isProd = process.env.NODE_ENV === 'production';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

// Respect LOG_LEVEL env var; default to 'debug' in dev, 'info' in production
const configuredLevel = process.env.LOG_LEVEL || (isProd ? 'info' : 'debug');
const activeLevel = LEVELS[configuredLevel] ?? LEVELS.info;
const COLORS = {
  error: '\x1b[31m', // red
  warn:  '\x1b[33m', // yellow
  info:  '\x1b[36m', // cyan
  debug: '\x1b[90m', // grey
  reset: '\x1b[0m'
};

function serialize(level, message, meta = {}) {
  if (isProd) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...flattenMeta(meta)
    });
  }

  const color = COLORS[level] || '';
  const ts    = new Date().toISOString();
  const metaStr = Object.keys(meta).length
    ? ' ' + JSON.stringify(meta, null, 0)
    : '';
  return `${color}[${ts}] ${level.toUpperCase().padEnd(5)} ${message}${metaStr}${COLORS.reset}`;
}

// Flatten error objects so they survive JSON.stringify
function flattenMeta(meta) {
  const out = {};
  for (const [k, v] of Object.entries(meta)) {
    if (v instanceof Error) {
      out[k] = { message: v.message, stack: v.stack, name: v.name };
    } else {
      out[k] = v;
    }
  }
  return out;
}

function log(level, message, meta = {}) {
  // Skip if this level is below the configured threshold
  if (LEVELS[level] > activeLevel) return;

  const line = serialize(level, message, meta);
  if (level === 'error' || level === 'warn') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
}

const logger = {
  error: (msg, meta = {}) => log('error', msg, meta),
  warn:  (msg, meta = {}) => log('warn',  msg, meta),
  info:  (msg, meta = {}) => log('info',  msg, meta),
  debug: (msg, meta = {}) => log('debug', msg, meta),

  // Express request logger middleware (replaces morgan in production)
  httpMiddleware: () => (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      const level = res.statusCode >= 500 ? 'error'
                  : res.statusCode >= 400 ? 'warn'
                  : 'info';
      log(level, `${req.method} ${req.originalUrl}`, {
        status: res.statusCode,
        ms,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
    });
    next();
  }
};

export default logger;
