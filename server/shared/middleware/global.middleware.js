import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import express from 'express';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';
import logger from '../utils/logger.js';
import { validateApiVersion, addVersionInfo } from './version.middleware.js';

// ── XSS sanitize middleware ───────────────────────────────────────────────────
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const clean = (obj) => {
      if (typeof obj === 'string') return xss(obj);
      if (Array.isArray(obj))     return obj.map(clean);
      if (obj && typeof obj === 'object') {
        return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, clean(v)]));
      }
      return obj;
    };
    req.body = clean(req.body);
  }
  next();
};

export const setupSecurity = (app) => {
  // Trust proxy when behind a load balancer / reverse proxy (needed for correct IP in rate limiting)
  const trustProxy = parseInt(process.env.TRUST_PROXY) || 0;
  if (trustProxy) {
    app.set('trust proxy', trustProxy);
  }

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'"],
        styleSrc:   ["'self'", "'unsafe-inline'"],
        imgSrc:     ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", ...(process.env.CORS_ORIGIN || 'http://localhost:5173').split(',')]
      }
    },
    hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: true }
  }));

  // Support comma-separated list of allowed origins
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true
  }));

  // Strip $ and . from query/body to prevent NoSQL injection
  app.use(mongoSanitize());

  // XSS-clean string fields in request body
  app.use(sanitizeBody);
};

// ── Rate limiters ─────────────────────────────────────────────────────────────
export const setupRateLimit = (app) => {
  // Strict limiter for auth endpoints (5 attempts / 15 min)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    message: 'Too many attempts, please try again in 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false
  });

  // General API limiter
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
  });

  app.use('/api/v1/auth/login',           authLimiter);
  app.use('/api/v1/auth/register',        authLimiter);
  app.use('/api/v1/auth/forgot-password', authLimiter);
  app.use('/api/v1/auth/reset-password',  authLimiter);
  app.use('/api/', generalLimiter);
};

export const setupBodyParsing = (app) => {
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  // Parse cookies — required for HttpOnly refresh token
  app.use(cookieParser());
};

export const setupVersioning = (app) => {
  app.use('/api', validateApiVersion);
  app.use('/api', addVersionInfo);
};

export const setupCustomMiddleware = (app, io) => {
  app.use((req, res, next) => {
    req.io = io;
    next();
  });
};

export const setupGlobalMiddleware = (app, io) => {
  setupSecurity(app);
  setupRateLimit(app);
  setupBodyParsing(app);
  setupVersioning(app);
  setupCustomMiddleware(app, io);
  logger.info('Global middleware configured');
};