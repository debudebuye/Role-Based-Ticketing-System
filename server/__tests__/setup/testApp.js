/**
 * testApp.js
 *
 * Creates a minimal Express app wired up exactly like the real server but
 * without calling server.listen().  Every test suite imports this so we get
 * a consistent, isolated app instance backed by an in-memory MongoDB.
 *
 * Usage:
 *   import { buildApp, connectTestDB, disconnectTestDB, clearCollections }
 *     from './testApp.js';
 *
 *   let app;
 *   beforeAll(async () => { await connectTestDB(); app = buildApp(); });
 *   afterAll(async  () => { await disconnectTestDB(); });
 *   afterEach(async () => { await clearCollections(); });
 */

import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import 'express-async-errors';

import { setupGlobalMiddleware, errorHandler } from '../../shared/middleware/index.js';
import { setupApiRoutes, setup404Handler } from '../../shared/routes/index.js';

// ── In-memory MongoDB ─────────────────────────────────────────────────────────
let mongod;

export async function connectTestDB() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri);
}

export async function disconnectTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
}

export async function clearCollections() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

// ── Stub Socket.IO instance ───────────────────────────────────────────────────
// Controllers call req.io.emitToRole / emitToUser / emitToTicket.
// We provide a no-op stub so tests don't need a real Socket.IO server.
const stubIo = {
  emitToRole:    () => {},
  emitToUser:    () => {},
  emitToTicket:  () => {},
  to:            () => ({ emit: () => {} }),
};

// ── App factory ───────────────────────────────────────────────────────────────
export function buildApp() {
  const app = express();

  // setupGlobalMiddleware wires up security, rate-limiting, body parsing,
  // versioning, and attaches req.io = io via setupCustomMiddleware.
  // We pass the stub io so controllers that call req.io.* don't throw.
  setupGlobalMiddleware(app, stubIo);

  setupApiRoutes(app);

  // Global error handler must come after routes
  app.use(errorHandler);

  // 404 handler must be last
  setup404Handler(app);

  return app;
}
