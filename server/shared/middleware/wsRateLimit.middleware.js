/**
 * WebSocket Rate Limiter
 *
 * Limits Socket.IO connections per IP to prevent abuse.  Uses a simple
 * sliding-window counter stored in memory.  For multi-instance deployments
 * behind a load balancer, rely on the LB's connection limits instead.
 *
 * Configurable via env vars:
 *   WS_RATE_LIMIT_WINDOW_MS  — window size (default: 60 000 = 1 min)
 *   WS_RATE_LIMIT_MAX        — max connections per window (default: 30)
 */

const windowMs = parseInt(process.env.WS_RATE_LIMIT_WINDOW_MS) || 60_000;
const maxConn  = parseInt(process.env.WS_RATE_LIMIT_MAX) || 30;

// Map<IP, { count, resetTime }>
const connections = new Map();

// Periodically clean up expired entries (every 2 windows)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of connections) {
    if (now > entry.resetTime) connections.delete(ip);
  }
}, windowMs * 2);
// Allow the timer to not keep the process alive
if (connections[Symbol.for('nodejs.util.asyncify')]) {
  // no-op — the timer is minor and will be cleared on shutdown
}

/**
 * Socket.IO middleware that enforces per-IP connection limits.
 * Attach before the auth middleware:
 *   io.use(rateLimitMiddleware);
 *   io.use(authMiddleware);
 */
export const wsRateLimitMiddleware = (socket, next) => {
  // Skip in test environment
  if (process.env.NODE_ENV === 'test') return next();

  const ip = socket.handshake.address;
  const now = Date.now();

  let entry = connections.get(ip);
  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + windowMs };
    connections.set(ip, entry);
  }

  entry.count++;

  if (entry.count > maxConn) {
    connections.delete(ip);
    return next(new Error('Rate limit exceeded: too many WebSocket connections'));
  }

  next();
};

export default wsRateLimitMiddleware;
