/**
 * setEnvVars.js — referenced by jest.config.js → setupFiles
 *
 * Runs inside every Jest worker process before any test file is loaded.
 * Sets the environment variables that the app code reads at import time
 * (e.g. JWT_SECRET used in auth.service.js module scope).
 */

process.env.NODE_ENV            = 'test';
process.env.JWT_SECRET          = 'test-jwt-secret-at-least-32-chars-long!!';
process.env.JWT_REFRESH_SECRET  = 'test-refresh-secret-at-least-32-chars!!';
process.env.JWT_EXPIRE          = '15m';
process.env.JWT_REFRESH_EXPIRE  = '7d';
process.env.BCRYPT_ROUNDS       = '4';   // fast hashing in tests
process.env.CORS_ORIGIN         = 'http://localhost:5173';
process.env.EMAIL_FROM          = 'test@example.com';
process.env.CLIENT_URL          = 'http://localhost:5173';
// MONGODB_URI is set per-suite by connectTestDB() before mongoose.connect()
