/**
 * Request ID Middleware
 *
 * Attaches a unique identifier to every incoming request.  The ID is:
 *   1. Read from the `X-Request-Id` header if the client sends one (supports
 *      distributed tracing across services).
 *   2. Otherwise generated as a cryptographically random v4-style UUID.
 *
 * The ID is set on `req.id` and included in the response header so the client
 * (or load balancer / observability tool) can correlate requests with logs.
 */

import { randomUUID } from 'crypto';

const requestId = (req, res, next) => {
  const id = req.headers['x-request-id'] || randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
};

export default requestId;
