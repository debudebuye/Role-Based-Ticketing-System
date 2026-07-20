/**
 * System routes tests
 *
 * Covers:
 *  - GET /health returns 200 with status OK when DB is connected
 *  - GET /health response shape (status, timestamp, environment)
 *  - GET /api/version returns version info
 */

import request from 'supertest';
import {
  buildApp,
  connectTestDB,
  disconnectTestDB,
} from '../setup/testApp.js';

let app;

beforeAll(async () => {
  await connectTestDB();
  app = buildApp();
});

afterAll(async () => {
  await disconnectTestDB();
});

// ── Health check ──────────────────────────────────────────────────────────────
describe('GET /health', () => {
  it('returns 200 with status OK when DB is connected', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  it('returns status, timestamp, and environment fields', async () => {
    const res = await request(app).get('/health');

    expect(res.body.status).toBeDefined();
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.environment).toBeDefined();
    expect(res.body.apiVersion).toBeDefined();
    expect(res.body.services).toBeDefined();
    expect(res.body.services.database).toBeDefined();
  });

  it('reports database as connected', async () => {
    const res = await request(app).get('/health');

    expect(res.body.services.database.status).toBe('connected');
  });
});

// ── Version info ──────────────────────────────────────────────────────────────
describe('GET /api/version', () => {
  it('returns 200 with version data', async () => {
    const res = await request(app).get('/api/version');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('includes API info fields', async () => {
    const res = await request(app).get('/api/version');

    expect(res.body.data.apiInfo).toBeDefined();
    expect(res.body.data.apiInfo.name).toBe('Ticket Management API');
  });
});
