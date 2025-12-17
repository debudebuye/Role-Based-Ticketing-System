/**
 * System Routes
 * Health checks, version info, and other system-level endpoints
 */

import { Router } from 'express';
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
 * GET /health (mounted at root)
 */
router.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    apiVersion: 'v1'
  });
});

export default router;