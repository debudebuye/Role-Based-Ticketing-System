/**
 * Middleware Index
 * Centralized exports for all middleware modules
 */

// Global middleware setup
export { setupGlobalMiddleware } from './global.middleware.js';

// Individual middleware modules
export { errorHandler } from './error.middleware.js';
export { authenticate, optionalAuth } from './auth.middleware.js';
export { authorize, requireRole, requireOwnershipOrRole } from './role.middleware.js';
export { 
  validateApiVersion, 
  addVersionInfo, 
  getVersionInfo,
  isVersionSupported,
  getLatestVersion 
} from './version.middleware.js';