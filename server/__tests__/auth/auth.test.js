/**
 * Auth API tests
 *
 * Covers:
 *  - Registration (happy path, duplicate email, invalid password, role restriction)
 *  - Login (happy path, wrong password, account lockout, inactive account)
 *  - Token refresh (valid cookie, missing cookie, reuse detection)
 *  - Protected route access (valid token, expired/invalid token)
 *  - Logout (clears refresh cookie)
 *  - Change password (invalidates sessions)
 *  - Forgot / reset password (token flow, enumeration prevention)
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
  loginUser,
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

// ── Registration ──────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/register', () => {
  it('registers a customer and returns accessToken + sets refresh cookie', async () => {
    const payload = makeUserPayload();
    const res = await request(app).post('/api/v1/auth/register').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.user.role).toBe('customer');

    // Refresh token must be in an HttpOnly cookie, NOT in the response body
    const cookies = res.headers['set-cookie'] ?? [];
    expect(cookies.some((c) => c.startsWith('refreshToken='))).toBe(true);
    expect(cookies.some((c) => c.toLowerCase().includes('httponly'))).toBe(true);
    expect(res.body.data.refreshToken).toBeUndefined();
  });

  it('rejects duplicate email with 400', async () => {
    const payload = makeUserPayload();
    await request(app).post('/api/v1/auth/register').send(payload);
    const res = await request(app).post('/api/v1/auth/register').send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects a weak password with 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(makeUserPayload({ password: 'password' }));

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('rejects a password without special characters', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(makeUserPayload({ password: 'TestPass1234' }));

    expect(res.status).toBe(400);
  });

  it('rejects registration with role=admin (public registration is customer-only)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(makeUserPayload({ role: 'admin' }));

    // Joi strips unknown / invalid enum values — role defaults to customer
    // OR returns 400 depending on schema config.  Either way the user must
    // not end up as admin.
    if (res.status === 201) {
      expect(res.body.data.user.role).toBe('customer');
    } else {
      expect(res.status).toBe(400);
    }
  });

  it('rejects missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'only@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });
});

// ── Login ─────────────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/login', () => {
  it('logs in with correct credentials and returns accessToken', async () => {
    const payload = makeUserPayload();
    await registerUser(app, payload);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: payload.email, password: payload.password });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe(payload.email);
  });

  it('rejects wrong password with 401', async () => {
    const payload = makeUserPayload();
    await registerUser(app, payload);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: payload.email, password: 'Wrong@Pass1' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects non-existent email with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: VALID_PASSWORD });

    expect(res.status).toBe(401);
  });

  it('locks account after 5 failed attempts', async () => {
    const payload = makeUserPayload();
    await registerUser(app, payload);

    // 5 wrong-password attempts
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: payload.email, password: 'Wrong@Pass1' });
    }

    // 6th attempt — even with correct password — should be locked (429)
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: payload.email, password: payload.password });

    expect(res.status).toBe(429);
  });

  it('rejects login for deactivated account', async () => {
    const { User } = await import('../../features/users/user.model.js');
    const payload = makeUserPayload();
    await registerUser(app, payload);
    await User.findOneAndUpdate({ email: payload.email }, { isActive: false });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: payload.email, password: payload.password });

    expect(res.status).toBe(401);
  });
});

// ── Token refresh ─────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/refresh', () => {
  it('issues a new accessToken when a valid refresh cookie is present', async () => {
    const payload = makeUserPayload();
    const { cookies } = await registerUser(app, payload);

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('returns 401 when no refresh cookie is sent', async () => {
    const res = await request(app).post('/api/v1/auth/refresh');
    expect(res.status).toBe(401);
  });

  it('detects refresh token reuse and invalidates all sessions', async () => {
    const payload = makeUserPayload();
    const { cookies } = await registerUser(app, payload);

    // First refresh — rotates the token
    await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookies);

    // Reuse the original (now superseded) cookie — must be rejected
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookies);

    expect(res.status).toBe(401);
  });
});

// ── Protected routes ──────────────────────────────────────────────────────────
describe('GET /api/v1/auth/profile (protected)', () => {
  it('returns profile for authenticated user', async () => {
    const payload = makeUserPayload();
    const { accessToken } = await registerUser(app, payload);

    const res = await request(app)
      .get('/api/v1/auth/profile')
      .set(bearer(accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(payload.email);
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/v1/auth/profile');
    expect(res.status).toBe(401);
  });

  it('returns 401 with a malformed token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/profile')
      .set({ Authorization: 'Bearer not.a.real.token' });

    expect(res.status).toBe(401);
  });
});

// ── Logout ────────────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/logout', () => {
  it('clears the refresh cookie and invalidates the session', async () => {
    const payload = makeUserPayload();
    const { accessToken, cookies } = await registerUser(app, payload);

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set(bearer(accessToken))
      .set('Cookie', cookies);

    expect(logoutRes.status).toBe(200);

    // The refresh cookie should be cleared (Max-Age=0 or Expires in the past)
    const setCookie = logoutRes.headers['set-cookie'] ?? [];
    const refreshCookie = setCookie.find((c) => c.startsWith('refreshToken='));
    expect(refreshCookie).toBeDefined();
    expect(
      refreshCookie.includes('Max-Age=0') ||
      refreshCookie.includes('Expires=Thu, 01 Jan 1970')
    ).toBe(true);

    // Subsequent refresh with the old cookie must fail
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookies);

    expect(refreshRes.status).toBe(401);
  });
});

// ── Change password ───────────────────────────────────────────────────────────
describe('PUT /api/v1/auth/change-password', () => {
  it('changes password and invalidates existing sessions', async () => {
    const payload = makeUserPayload();
    const { accessToken, cookies } = await registerUser(app, payload);
    const newPassword = 'NewPass@Zx9!';

    const changeRes = await request(app)
      .put('/api/v1/auth/change-password')
      .set(bearer(accessToken))
      .send({ currentPassword: payload.password, newPassword });

    expect(changeRes.status).toBe(200);

    // Old refresh token must no longer work
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookies);

    expect(refreshRes.status).toBe(401);

    // Can log in with new password
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: payload.email, password: newPassword });

    expect(loginRes.status).toBe(200);
  });

  it('rejects wrong current password', async () => {
    const payload = makeUserPayload();
    const { accessToken } = await registerUser(app, payload);

    const res = await request(app)
      .put('/api/v1/auth/change-password')
      .set(bearer(accessToken))
      .send({ currentPassword: 'Wrong@Zx9!', newPassword: 'NewPass@Zx9!' });

    expect(res.status).toBe(400);
  });
});

// ── Forgot / reset password ───────────────────────────────────────────────────
describe('POST /api/v1/auth/forgot-password', () => {
  it('always returns success to prevent user enumeration', async () => {
    // Non-existent email
    const res1 = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nobody@example.com' });

    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);

    // Existing email
    const payload = makeUserPayload();
    await registerUser(app, payload);

    const res2 = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: payload.email });

    expect(res2.status).toBe(200);
    expect(res2.body.success).toBe(true);

    // Both responses must be identical (no enumeration)
    expect(res1.body.message).toBe(res2.body.message);
  });
});

describe('POST /api/v1/auth/reset-password', () => {
  it('rejects an invalid reset token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: 'invalid-token', newPassword: 'NewPass@Zx9!' });

    expect(res.status).toBe(400);
  });

  it('resets password with a valid token and allows login with new password', async () => {
    const { User } = await import('../../features/users/user.model.js');
    const crypto = await import('crypto');

    const payload = makeUserPayload();
    await registerUser(app, payload);

    // Manually inject a reset token (simulates the email flow)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashed   = crypto.createHash('sha256').update(rawToken).digest('hex');
    await User.findOneAndUpdate(
      { email: payload.email },
      {
        passwordResetToken:  hashed,
        passwordResetExpiry: new Date(Date.now() + 60 * 60 * 1000),
      }
    );

    const newPassword = 'Reset@Zx9!';
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: rawToken, newPassword });

    expect(res.status).toBe(200);

    // Can log in with new password
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: payload.email, password: newPassword });

    expect(loginRes.status).toBe(200);
  });
});
