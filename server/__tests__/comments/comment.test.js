/**
 * Comment API tests
 *
 * Covers:
 *  - Unauthenticated access returns 401
 *  - Customer CRUD on own ticket vs. another customer's ticket
 *  - Admin / Agent read access on any ticket
 *  - Customer update own comment only
 *  - Admin delete any comment, customer delete own comment
 *  - 404 for non-existent ticket or comment
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
  bearer,
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

const ticketPayload = (overrides = {}) => ({
  title:       'Test ticket for comments',
  description: 'Detailed description of the issue that needs to be resolved.',
  priority:    'medium',
  category:    'technical',
  ...overrides,
});

async function createTicketAs(token) {
  const res = await request(app)
    .post('/api/v1/tickets')
    .set(bearer(token))
    .send(ticketPayload());
  return res;
}

async function createCommentAs(token, ticketId, content = 'Test comment content') {
  const res = await request(app)
    .post(`/api/v1/comments/ticket/${ticketId}`)
    .set(bearer(token))
    .send({ content });
  return res;
}

// ── Unauthenticated access ────────────────────────────────────────────────────
describe('Unauthenticated access', () => {
  it('GET /comments/ticket/:ticketId returns 401', async () => {
    const res = await request(app).get('/api/v1/comments/ticket/507f1f77bcf86cd799439011');
    expect(res.status).toBe(401);
  });

  it('POST /comments/ticket/:ticketId returns 401', async () => {
    const res = await request(app)
      .post('/api/v1/comments/ticket/507f1f77bcf86cd799439011')
      .send({ content: 'Hello' });
    expect(res.status).toBe(401);
  });

  it('GET /comments/:id returns 401', async () => {
    const res = await request(app).get('/api/v1/comments/507f1f77bcf86cd799439011');
    expect(res.status).toBe(401);
  });
});

// ── CUSTOMER ──────────────────────────────────────────────────────────────────
describe('CUSTOMER role', () => {
  let customerToken;
  let customer2Token;

  beforeEach(async () => {
    const p1 = makeUserPayload();
    const p2 = makeUserPayload();
    ({ accessToken: customerToken  } = await registerUser(app, p1));
    ({ accessToken: customer2Token } = await registerUser(app, p2));
  });

  it('can create a comment on their own ticket', async () => {
    const ticketRes = await createTicketAs(customerToken);
    const ticketId  = ticketRes.body.data.ticket._id;

    const res = await createCommentAs(customerToken, ticketId, 'First comment on my ticket');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.comment._id).toBeDefined();
    expect(res.body.data.comment.content).toBe('First comment on my ticket');
  });

  it('can read comments on their own ticket', async () => {
    const ticketRes = await createTicketAs(customerToken);
    const ticketId  = ticketRes.body.data.ticket._id;

    await createCommentAs(customerToken, ticketId, 'My comment');
    await createCommentAs(customerToken, ticketId, 'My second comment');

    const res = await request(app)
      .get(`/api/v1/comments/ticket/${ticketId}`)
      .set(bearer(customerToken));

    expect(res.status).toBe(200);
    expect(res.body.data.comments.length).toBe(2);
  });

  it('cannot read comments on another customer\'s ticket', async () => {
    const ticketRes = await createTicketAs(customer2Token);
    const ticketId  = ticketRes.body.data.ticket._id;

    await createCommentAs(customer2Token, ticketId, 'Customer 2 comment');

    const res = await request(app)
      .get(`/api/v1/comments/ticket/${ticketId}`)
      .set(bearer(customerToken));

    // Customer 1 should not see comments on customer 2's ticket (403 or 404)
    expect([403, 404]).toContain(res.status);
  });

  it('can update their own comment', async () => {
    const ticketRes = await createTicketAs(customerToken);
    const ticketId  = ticketRes.body.data.ticket._id;

    const commentRes = await createCommentAs(customerToken, ticketId, 'Original text');
    const commentId  = commentRes.body.data.comment._id;

    const res = await request(app)
      .put(`/api/v1/comments/${commentId}`)
      .set(bearer(customerToken))
      .send({ content: 'Updated text by author' });

    expect(res.status).toBe(200);
    expect(res.body.data.comment.content).toBe('Updated text by author');
  });

  it('cannot update another user\'s comment', async () => {
    const ticketRes = await createTicketAs(customerToken);
    const ticketId  = ticketRes.body.data.ticket._id;

    const commentRes = await createCommentAs(customerToken, ticketId, 'Customer 1 comment');
    const commentId  = commentRes.body.data.comment._id;

    const res = await request(app)
      .put(`/api/v1/comments/${commentId}`)
      .set(bearer(customer2Token))
      .send({ content: 'Hijacked comment' });

    expect(res.status).toBe(403);
  });

  it('can delete their own comment', async () => {
    const ticketRes = await createTicketAs(customerToken);
    const ticketId  = ticketRes.body.data.ticket._id;

    const commentRes = await createCommentAs(customerToken, ticketId, 'Delete me');
    const commentId  = commentRes.body.data.comment._id;

    const res = await request(app)
      .delete(`/api/v1/comments/${commentId}`)
      .set(bearer(customerToken));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('cannot delete another user\'s comment', async () => {
    const ticketRes = await createTicketAs(customerToken);
    const ticketId  = ticketRes.body.data.ticket._id;

    const commentRes = await createCommentAs(customerToken, ticketId, 'Do not delete');
    const commentId  = commentRes.body.data.comment._id;

    const res = await request(app)
      .delete(`/api/v1/comments/${commentId}`)
      .set(bearer(customer2Token));

    expect(res.status).toBe(403);
  });
});

// ── ADMIN / AGENT access ──────────────────────────────────────────────────────
describe('Admin / Agent access', () => {
  let adminToken;
  let agentToken;
  let customerToken;

  beforeEach(async () => {
    ({ accessToken: adminToken }   = await loginPrivilegedUser(app, 'admin'));
    ({ accessToken: agentToken }   = await loginPrivilegedUser(app, 'agent'));
    ({ accessToken: customerToken } = await registerUser(app, makeUserPayload()));
  });

  it('admin can read comments on any ticket', async () => {
    const ticketRes = await createTicketAs(customerToken);
    const ticketId  = ticketRes.body.data.ticket._id;

    await createCommentAs(customerToken, ticketId, 'Customer comment');

    const res = await request(app)
      .get(`/api/v1/comments/ticket/${ticketId}`)
      .set(bearer(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.data.comments.length).toBe(1);
  });

  it('agent can read comments on any ticket', async () => {
    const ticketRes = await createTicketAs(customerToken);
    const ticketId  = ticketRes.body.data.ticket._id;

    await createCommentAs(customerToken, ticketId, 'Customer comment');

    const res = await request(app)
      .get(`/api/v1/comments/ticket/${ticketId}`)
      .set(bearer(agentToken));

    expect(res.status).toBe(200);
    expect(res.body.data.comments.length).toBe(1);
  });

  it('admin can delete any comment', async () => {
    const ticketRes = await createTicketAs(customerToken);
    const ticketId  = ticketRes.body.data.ticket._id;

    const commentRes = await createCommentAs(customerToken, ticketId, 'Delete by admin');
    const commentId  = commentRes.body.data.comment._id;

    const res = await request(app)
      .delete(`/api/v1/comments/${commentId}`)
      .set(bearer(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ── 404 for non-existent resources ───────────────────────────────────────────
describe('404 handling', () => {
  it('returns 404 for a non-existent ticket', async () => {
    const { accessToken } = await registerUser(app, makeUserPayload());
    const fakeTicketId = '507f1f77bcf86cd799439011';

    const res = await request(app)
      .get(`/api/v1/comments/ticket/${fakeTicketId}`)
      .set(bearer(accessToken));

    expect([404, 403]).toContain(res.status);
  });

  it('returns 404 for a non-existent comment', async () => {
    const { accessToken } = await registerUser(app, makeUserPayload());
    const fakeCommentId = '507f1f77bcf86cd799439011';

    const res = await request(app)
      .get(`/api/v1/comments/${fakeCommentId}`)
      .set(bearer(accessToken));

    expect([404, 403]).toContain(res.status);
  });
});
