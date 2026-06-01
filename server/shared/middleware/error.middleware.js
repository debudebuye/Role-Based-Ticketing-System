import logger from '../utils/logger.js';
import { SystemError } from '../models/system-error.model.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Server Error';

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    message    = 'Resource not found';
    statusCode = 404;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    message    = 'Duplicate field value entered';
    statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    message    = Object.values(err.errors).map(v => v.message).join(', ');
    statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    message    = 'Invalid token';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    message    = 'Token expired';
    statusCode = 401;
  }

  // Log server errors (5xx) with full stack; client errors (4xx) at warn level
  if (statusCode >= 500) {
    logger.error('Unhandled server error', {
      err,
      method: req.method,
      url:    req.originalUrl,
      ip:     req.ip
    });

    // Persist to DB for admin error feed (fire-and-forget — never block the response)
    SystemError.create({
      message,
      stack:      err.stack,
      statusCode,
      method:     req.method,
      url:        req.originalUrl,
      userId:     req.user?._id   || null,
      userEmail:  req.user?.email || null,
      ip:         req.ip,
      userAgent:  req.get('user-agent'),
    }).catch(() => { /* swallow — logging failure must never crash the server */ });

  } else {
    logger.warn('Client error', {
      message,
      statusCode,
      method: req.method,
      url:    req.originalUrl
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Only expose stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
