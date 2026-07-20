/**
 * Test helpers — shared factories and utilities used across all test suites.
 */

import request from 'supertest';

// ── User factories ────────────────────────────────────────────────────────────

/** Valid password that satisfies all Joi password rules */
export const VALID_PASSWORD = 'Test@Zx9!';

export const makeUserPayload = (overrides = {}) => ({
  name:     'Test User',
  email:    `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
  password: VALID_PASSWORD,
  role:     'customer',
  ...overrides,
});

/**
 * Register a user via the API and return { user, accessToken, cookies }.
 * `cookies` is the raw Set-Cookie header array (contains the refresh token).
 */
export async function registerUser(app, payload) {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send(payload);

  if (res.status !== 201) {
    throw new Error(`registerUser failed: ${JSON.stringify(res.body)}`);
  }

  return {
    user:        res.body.data.user,
    accessToken: res.body.data.accessToken,
    cookies:     res.headers['set-cookie'] ?? [],
  };
}

/**
 * Login via the API and return { user, accessToken, cookies }.
 */
export async function loginUser(app, email, password = VALID_PASSWORD) {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });

  if (res.status !== 200) {
    throw new Error(`loginUser failed: ${JSON.stringify(res.body)}`);
  }

  return {
    user:        res.body.data.user,
    accessToken: res.body.data.accessToken,
    cookies:     res.headers['set-cookie'] ?? [],
  };
}

/**
 * Directly create a privileged user (admin / manager / agent) by bypassing
 * the public registration endpoint (which only allows 'customer').
 * Uses the User model directly so we don't need an admin token to seed.
 */
export async function createPrivilegedUser(role, overrides = {}) {
  // Dynamic import so the model is only loaded after DB is connected
  const { User } = await import('../../features/users/user.model.js');
  const user = await User.create({
    name:     `${role} User`,
    email:    `${role}-${Date.now()}@example.com`,
    password: VALID_PASSWORD,
    role,
    isActive: true,
    ...overrides,
  });
  return user;
}

/** Convenience: create + login a privileged user, return { user, accessToken } */
export async function loginPrivilegedUser(app, role, overrides = {}) {
  const dbUser = await createPrivilegedUser(role, overrides);
  const { accessToken, cookies } = await loginUser(app, dbUser.email);
  return { user: dbUser, accessToken, cookies };
}

/** Auth header helper */
export const bearer = (token) => ({ Authorization: `Bearer ${token}` });
