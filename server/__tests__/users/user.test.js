/**
 * User management API tests
 *
 * Covers:
 *  - Unauthenticated access returns 401
 *  - Customer blocked from user management (403)
 *  - Admin full CRUD + stats + agents
 *  - Manager access to user management
 *  - Pagination limit capped at 100
 */

import request from 'supertest';
import {
  buildApp,
  connectTestDB,
  disconnectTestDB,
  clearCollections,
} from '../setup/testApp.js';
import {
  makeUserPayload,
  registerUser,
  loginPrivilegedUser,
  createPrivilegedUser,
  bearer,
  VALID_PASSWORD,
} from '../setup/helpers.js';

let app;

beforeAll(async () => {
  await connectTestDB();
  app = buildApp();
});

afterAll(async () => {
  await disconnectTestDB();
});

afterEach(async () => {
  await clearCollections();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const newUserPayload = (overrides = {}) => ({
  name:     'New User',
  email:    `newuser-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
  password: VALID_PASSWORD,
  role:     'customer',
  ...overrides,
});

// ── Unauthenticated access ────────────────────────────────────────────────────
describe('Unauthenticated access', () => {
  it('GET /users returns 401', async () => {
    const res = await request(app).get('/api/v1/users');
    expect(res.status).toBe(401);
  });

  it('GET /users/stats returns 401', async () => {
    const res = await request(app).get('/api/v1/users/stats');
    expect(res.status).toBe(401);
  });

  it('GET /users/agents returns 401', async () => {
    const res = await request(app).get('/api/v1/users/agents');
    expect(res.status).toBe(401);
  });

  it('POST /users returns 401', async () => {
    const res = await request(app).post('/api/v1/users').send(newUserPayload());
    expect(res.status).toBe(401);
  });
});

// ── CUSTOMER ──────────────────────────────────────────────────────────────────
describe('CUSTOMER role', () => {
  let customerToken;

  beforeEach(async () => {
    ({ accessToken: customerToken } = await registerUser(app, makeUserPayload()));
  });

  it('cannot access GET /users (403)', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set(bearer(customerToken));

    expect(res.status).toBe(403);
  });

  it('cannot access GET /users/stats (403)', async () => {
    const res = await request(app)
      .get('/api/v1/users/stats')
      .set(bearer(customerToken));

    expect(res.status).toBe(403);
  });

  it('cannot access GET /users/agents (403)', async () => {
    const res = await request(app)
      .get('/api/v1/users/agents')
      .set(bearer(customerToken));

    expect(res.status).toBe(403);
  });

  it('cannot create a user via POST /users (403)', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set(bearer(customerToken))
      .send(newUserPayload());

    expect(res.status).toBe(403);
  });
});

// ── ADMIN ─────────────────────────────────────────────────────────────────────
describe('ADMIN role', () => {
  let adminToken;

  beforeEach(async () => {
    ({ accessToken: adminToken } = await loginPrivilegedUser(app, 'admin'));
  });

  it('can get all users', async () => {
    // Seed a couple of users
    await registerUser(app, makeUserPayload());
    await registerUser(app, makeUserPayload());

    const res = await request(app)
      .get('/api/v1/users')
      .set(bearer(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.users.length).toBeGreaterThanOrEqual(3);
  });

  it('can get user stats', async () => {
    const res = await request(app)
      .get('/api/v1/users/stats')
      .set(bearer(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.data.stats).toBeDefined();
    expect(typeof res.body.data.stats.total).toBe('number');
  });

  it('can get agents list', async () => {
    await createPrivilegedUser('agent');

    const res = await request(app)
      .get('/api/v1/users/agents')
      .set(bearer(adminToken));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.agents)).toBe(true);
    expect(res.body.data.agents.length).toBeGreaterThanOrEqual(1);
  });

  it('can create a user', async () => {
    const payload = newUserPayload({ role: 'agent' });

    const res = await request(app)
      .post('/api/v1/users')
      .set(bearer(adminToken))
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(payload.email);
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('can update a user', async () => {
    const created = await createPrivilegedUser('customer');

    const res = await request(app)
      .put(`/api/v1/users/${created._id}`)
      .set(bearer(adminToken))
      .send({ name: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe('Updated Name');
  });

  it('can delete a user', async () => {
    const created = await createPrivilegedUser('customer');

    const res = await request(app)
      .delete(`/api/v1/users/${created._id}`)
      .set(bearer(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify user is soft-deleted (deactivated)
    const getRes = await request(app)
      .get(`/api/v1/users/${created._id}`)
      .set(bearer(adminToken));

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.user.isActive).toBe(false);
  });
});

// ── MANAGER ───────────────────────────────────────────────────────────────────
describe('MANAGER role', () => {
  let managerToken;

  beforeEach(async () => {
    ({ accessToken: managerToken } = await loginPrivilegedUser(app, 'manager'));
  });

  it('can access GET /users', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set(bearer(managerToken));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('can access GET /users/stats', async () => {
    const res = await request(app)
      .get('/api/v1/users/stats')
      .set(bearer(managerToken));

    expect(res.status).toBe(200);
  });

  it('can create a user', async () => {
    const payload = newUserPayload({ role: 'customer' });

    const res = await request(app)
      .post('/api/v1/users')
      .set(bearer(managerToken))
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe(payload.email);
  });
});

// ── Pagination safety ─────────────────────────────────────────────────────────
describe('Pagination limit cap', () => {
  it('caps limit at 100 regardless of what is requested', async () => {
    const { accessToken } = await loginPrivilegedUser(app, 'admin');

    const res = await request(app)
      .get('/api/v1/users?limit=99999')
      .set(bearer(accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data.pagination.limit).toBeLessThanOrEqual(100);
  });
});
