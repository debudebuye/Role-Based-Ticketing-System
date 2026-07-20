/**
 * System Routes
 * Health checks, version info, and other system-level endpoints
 */

import { Router } from 'express';
import mongoose from 'mongoose';
import { getVersionInfo } from '../middleware/version.middleware.js';

const router = Router();

/**
 * API version information endpoint
 * GET /api/version
 */
router.get('/version', (req, res) => {
  const versionInfo = getVersionInfo();
  res.status(200).json({
    success: true,
    data: {
      ...versionInfo,
      apiInfo: {
        name: 'Ticket Management API',
        description: 'Role-based ticket management system API',
        documentation: '/api/docs'
      }
    }
  });
});

/**
 * Health check endpoint
 * GET /health
 *
 * Returns 200 when the server and database are healthy.
 * Returns 503 when the database is unavailable — load balancers
 * use this to stop routing traffic to unhealthy instances.
 */
router.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbHealthy = dbState === 1;

  const status = {
    status:      dbHealthy ? 'OK' : 'DEGRADED',
    timestamp:   new Date().toISOString(),
    environment: process.env.NODE_ENV,
    apiVersion:  'v1',
    services: {
      database: {
        status: dbHealthy ? 'connected' : 'disconnected',
        state:  dbState
      }
    }
  };

  res.status(dbHealthy ? 200 : 503).json(status);
});

export default router;