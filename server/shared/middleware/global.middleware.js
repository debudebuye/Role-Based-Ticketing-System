/**
 * Global Middleware Configuration
 * Centralizes all common middleware setup for the application
 */

import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import express from 'express';
import { validateApiVersion, addVersionInfo } from './version.middleware.js';

/**
 * Configure security middleware
 */
export const setupSecurity = (app) => {
  // Security headers
  app.use(helmet());
  
  // CORS configuration
  app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true
  }));
};

/**
 * Configure rate limiting
 */
export const setupRateLimit = (app) => {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
  
  // Apply rate limiting to all API routes
  app.use('/api/', limiter);
};

/**
 * Configure body parsing middleware
 */
export const setupBodyParsing = (app) => {
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
};

/**
 * Configure API versioning middleware
 */
export const setupVersioning = (app) => {
  // Apply versioning middleware to all API routes
  app.use('/api', validateApiVersion);
  app.use('/api', addVersionInfo);
};

/**
 * Configure custom middleware (like Socket.IO injection)
 */
export const setupCustomMiddleware = (app, io) => {
  // Make Socket.IO available to all routes
  app.use((req, res, next) => {
    req.io = io;
    next();
  });
};

/**
 * Setup all global middleware in the correct order
 */
export const setupGlobalMiddleware = (app, io) => {
  // 1. Security middleware (should be first)
  setupSecurity(app);
  
  // 2. Rate limiting
  setupRateLimit(app);
  
  // 3. Body parsing
  setupBodyParsing(app);
  
  // 4. API versioning
  setupVersioning(app);
  
  // 5. Custom middleware (Socket.IO, etc.)
  setupCustomMiddleware(app, io);
  
  console.log('✅ Global middleware configured');
};