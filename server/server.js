import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import 'express-async-errors';

// Load environment variables first
dotenv.config();

// ── Validate required env vars before anything else ──────────────────────────
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length) {
  process.stderr.write(`❌ Missing required environment variables: ${missingEnv.join(', ')}\n`);
  process.exit(1);
}

import logger from './shared/utils/logger.js';
import { connectDB } from './shared/config/database.js';
import { setupSocketHandlers } from './shared/config/socket.js';
import { setupGlobalMiddleware, errorHandler } from './shared/middleware/index.js';
import { specs, swaggerUi } from './shared/config/swagger.js';
import { setupApiRoutes, setup404Handler } from './shared/routes/index.js';

// ── Process-level error guards ────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception — shutting down', { err });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection — shutting down', { err: reason instanceof Error ? reason : new Error(String(reason)) });
  process.exit(1);
});

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim()),
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Connect to MongoDB
connectDB();

// HTTP request logging
app.use(logger.httpMiddleware());

// Setup all global middleware
setupGlobalMiddleware(app, io);

// Swagger — dev/staging only
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customSiteTitle: 'Ticket Management API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      tryItOutEnabled: true
    }
  }));
}

// Setup all API routes with versioning
setupApiRoutes(app);

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler (must be very last)
setup404Handler(app);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, { env: process.env.NODE_ENV, port: PORT });
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
  }
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    const mongoose = (await import('mongoose')).default;
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  });
  // Force-kill after 30 s if connections linger
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
