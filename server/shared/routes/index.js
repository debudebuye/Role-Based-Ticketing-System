/**
 * Routes Index
 * Centralized route configuration and versioning
 */

// Import system routes
import systemRoutes from './system.routes.js';

// Import feature routes
import authRoutes from '../../features/auth/auth.routes.js';
import userRoutes from '../../features/users/user.routes.js';
import ticketRoutes from '../../features/tickets/ticket.routes.js';
import commentRoutes from '../../features/comments/comment.routes.js';

/**
 * Setup API v1 routes
 */
export const setupV1Routes = (app) => {
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/tickets', ticketRoutes);
  app.use('/api/v1/comments', commentRoutes);
  
  console.log('✅ API v1 routes configured');
};

/**
 * Setup legacy route redirects for backward compatibility
 */
export const setupLegacyRoutes = (app) => {
  // For GET requests, use redirects
  app.get('/api/auth*', (req, res) => {
    const newUrl = req.originalUrl.replace('/api/auth', '/api/v1/auth');
    res.redirect(301, newUrl);
  });
  
  app.get('/api/users*', (req, res) => {
    const newUrl = req.originalUrl.replace('/api/users', '/api/v1/users');
    res.redirect(301, newUrl);
  });
  
  app.get('/api/tickets*', (req, res) => {
    const newUrl = req.originalUrl.replace('/api/tickets', '/api/v1/tickets');
    res.redirect(301, newUrl);
  });
  
  app.get('/api/comments*', (req, res) => {
    const newUrl = req.originalUrl.replace('/api/comments', '/api/v1/comments');
    res.redirect(301, newUrl);
  });
  
  // For non-GET requests, return a helpful error message instead of redirect
  app.use('/api/auth*', (req, res) => {
    res.status(410).json({
      success: false,
      message: 'This endpoint has moved. Please update your client to use the versioned API.',
      newEndpoint: req.originalUrl.replace('/api/auth', '/api/v1/auth'),
      documentation: '/api/version'
    });
  });
  
  app.use('/api/users*', (req, res) => {
    res.status(410).json({
      success: false,
      message: 'This endpoint has moved. Please update your client to use the versioned API.',
      newEndpoint: req.originalUrl.replace('/api/users', '/api/v1/users'),
      documentation: '/api/version'
    });
  });
  
  app.use('/api/tickets*', (req, res) => {
    res.status(410).json({
      success: false,
      message: 'This endpoint has moved. Please update your client to use the versioned API.',
      newEndpoint: req.originalUrl.replace('/api/tickets', '/api/v1/tickets'),
      documentation: '/api/version'
    });
  });
  
  app.use('/api/comments*', (req, res) => {
    res.status(410).json({
      success: false,
      message: 'This endpoint has moved. Please update your client to use the versioned API.',
      newEndpoint: req.originalUrl.replace('/api/comments', '/api/v1/comments'),
      documentation: '/api/version'
    });
  });
  
  console.log('✅ Legacy route redirects configured');
};

/**
 * Setup system routes (health, version, etc.)
 */
export const setupSystemRoutes = (app) => {
  // System routes (health check at root level, version under /api)
  app.use('/health', systemRoutes);
  app.use('/api', systemRoutes);
  
  console.log('✅ System routes configured');
};

/**
 * Setup 404 handler (must be last)
 */
export const setup404Handler = (app) => {
  app.use('*', (req, res) => {
    res.status(404).json({ 
      success: false, 
      message: `Route ${req.originalUrl} not found`,
      availableEndpoints: {
        health: '/health',
        version: '/api/version',
        api: '/api/v1/*'
      }
    });
  });
  
  console.log('✅ 404 handler configured');
};

/**
 * Setup all API routes
 */
export const setupApiRoutes = (app) => {
  // System routes (health, version info)
  setupSystemRoutes(app);
  
  // Current version routes
  setupV1Routes(app);
  
  // Legacy compatibility
  setupLegacyRoutes(app);
  
  // Future versions can be added here
  // setupV2Routes(app);
};