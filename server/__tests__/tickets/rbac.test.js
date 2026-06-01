/**
 * Ticket RBAC tests
 *
 * Verifies that every role can only do what it's supposed to:
 *
 *  CUSTOMER  — create own tickets, view own tickets, cannot see others'
 *  AGENT     — view assigned + unassigned-open tickets, update status only
 *              on accepted tickets, cannot assign or delete
 *  MANAGER   — view all, assign, update, cannot delete
 *  ADMIN     — full access including delete
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
  title:       'Test ticket title here',
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

// ── Unauthenticated access ────────────────────────────────────────────────────
describe('Unauthenticated access', () => {
  it('GET /tickets returns 401', async () => {
    const res = await request(app).get('/api/v1/tickets');
    expect(res.status).toBe(401);
  });

  it('POST /tickets returns 401', async () => {
    const res = await request(app).post('/api/v1/tickets').send(ticketPayload());
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
    ({ accessToken: customerToken } = await registerUser(app, p1));
    ({ accessToken: customer2Token } = await registerUser(app, p2));
  });

  it('can create a ticket', async () => {
    const res = await createTicketAs(customerToken);
    expect(res.status).toBe(201);
    expect(res.body.data.ticket._id).toBeDefined();
  });

  it('can view own tickets', async () => {
    await createTicketAs(customerToken);
    const res = await request(app)
      .get('/api/v1/tickets')
      .set(bearer(customerToken));

    expect(res.status).toBe(200);
    expect(res.body.data.tickets.length).toBe(1);
  });

  it('cannot see another customer\'s tickets', async () => {
    // customer2 creates a ticket
    await createTicketAs(customer2Token);

    // customer1 should see 0 tickets
    const res = await request(app)
      .get('/api/v1/tickets')
      .set(bearer(customerToken));

    expect(res.status).toBe(200);
    expect(res.body.data.tickets.length).toBe(0);
  });

  it('cannot access another customer\'s ticket by ID', async () => {
    const createRes = await createTicketAs(customer2Token);
    const ticketId  = createRes.body.data.ticket._id;

    const res = await request(app)
      .get(`/api/v1/tickets/${ticketId}`)
      .set(bearer(customerToken));

    expect(res.status).toBe(403);
  });

  it('cannot assign a ticket', async () => {
    const createRes = await createTicketAs(customerToken);
    const ticketId  = createRes.body.data.ticket._id;

    const res = await request(app)
      .put(`/api/v1/tickets/${ticketId}/assign`)
      .set(bearer(customerToken))
      .send({ assignedTo: '507f1f77bcf86cd799439011' });

    expect(res.status).toBe(403);
  });

  it('cannot delete a ticket they do not own', async () => {
    const createRes = await createTicketAs(customer2Token);
    const ticketId  = createRes.body.data.ticket._id;

    const res = await request(app)
      .delete(`/api/v1/tickets/${ticketId}`)
      .set(bearer(customerToken));

    expect(res.status).toBe(403);
  });

  it('can delete their own ticket', async () => {
    const createRes = await createTicketAs(customerToken);
    const ticketId  = createRes.body.data.ticket._id;

    // Can delete while still open and unassigned
    const res = await request(app)
      .delete(`/api/v1/tickets/${ticketId}`)
      .set(bearer(customerToken));

    expect(res.status).toBe(200);
  });

  it('cannot delete their own ticket once it is in_progress', async () => {
    const { user: agentUser, accessToken: agentToken } = await loginPrivilegedUser(app, 'agent');
    const { accessToken: managerToken } = await loginPrivilegedUser(app, 'manager');

    const createRes = await createTicketAs(customerToken);
    const ticketId  = createRes.body.data.ticket._id;

    // Assign → accept → now in_progress
    await request(app)
      .put(`/api/v1/tickets/${ticketId}/assign`)
      .set(bearer(managerToken))
      .send({ assignedTo: agentUser._id.toString() });

    await request(app)
      .put(`/api/v1/tickets/${ticketId}/accept`)
      .set(bearer(agentToken));

    const res = await request(app)
      .delete(`/api/v1/tickets/${ticketId}`)
      .set(bearer(customerToken));

    expect(res.status).toBe(403);
  });
});

// ── AGENT ─────────────────────────────────────────────────────────────────────
describe('AGENT role', () => {
  let agentToken;
  let agentUser;
  let managerToken;
  let customerToken;

  beforeEach(async () => {
    ({ user: agentUser,   accessToken: agentToken   } = await loginPrivilegedUser(app, 'agent'));
    ({ accessToken: managerToken } = await loginPrivilegedUser(app, 'manager'));
    ({ accessToken: customerToken } = await registerUser(app, makeUserPayload()));
  });

  it('can see unassigned open tickets', async () => {
    await createTicketAs(customerToken);

    const res = await request(app)
      .get('/api/v1/tickets')
      .set(bearer(agentToken));

    expect(res.status).toBe(200);
    expect(res.body.data.tickets.length).toBeGreaterThan(0);
  });

  it('cannot assign a ticket', async () => {
    const createRes = await createTicketAs(customerToken);
    const ticketId  = createRes.body.data.ticket._id;

    const res = await request(app)
      .put(`/api/v1/tickets/${ticketId}/assign`)
      .set(bearer(agentToken))
      .send({ assignedTo: agentUser._id.toString() });

    expect(res.status).toBe(403);
  });

  it('can accept a ticket assigned to them', async () => {
    const createRes = await createTicketAs(customerToken);
    const ticketId  = createRes.body.data.ticket._id;

    // Manager assigns to agent
    await request(app)
      .put(`/api/v1/tickets/${ticketId}/assign`)
      .set(bearer(managerToken))
      .send({ assignedTo: agentUser._id.toString() });

    const res = await request(app)
      .put(`/api/v1/tickets/${ticketId}/accept`)
      .set(bearer(agentToken));

    expect(res.status).toBe(200);
    expect(res.body.data.ticket.acceptanceStatus).toBe('accepted');
  });

  it('can update status on an accepted ticket', async () => {
    const createRes = await createTicketAs(customerToken);
    const ticketId  = createRes.body.data.ticket._id;

    await request(app)
      .put(`/api/v1/tickets/${ticketId}/assign`)
      .set(bearer(managerToken))
      .send({ assignedTo: agentUser._id.toString() });

    await request(app)
      .put(`/api/v1/tickets/${ticketId}/accept`)
      .set(bearer(agentToken));

    const res = await request(app)
      .put(`/api/v1/tickets/${ticketId}`)
      .set(bearer(agentToken))
      .send({ status: 'resolved' });

    expect(res.status).toBe(200);
    expect(res.body.data.ticket.status).toBe('resolved');
  });

  it('cannot update fields other than status', async () => {
    const createRes = await createTicketAs(customerToken);
    const ticketId  = createRes.body.data.ticket._id;

    await request(app)
      .put(`/api/v1/tickets/${ticketId}/assign`)
      .set(bearer(managerToken))
      .send({ assignedTo: agentUser._id.toString() });

    await request(app)
      .put(`/api/v1/tickets/${ticketId}/accept`)
      .set(bearer(agentToken));

    const res = await request(app)
      .put(`/api/v1/tickets/${ticketId}`)
      .set(bearer(agentToken))
      .send({ priority: 'urgent' });

    expect(res.status).toBe(403);
  });

  it('cannot update status on a ticket not assigned to them', async () => {
    const createRes = await createTicketAs(customerToken);
    const ticketId  = createRes.body.data.ticket._id;

    // Ticket is unassigned — agent cannot update it
    const res = await request(app)
      .put(`/api/v1/tickets/${ticketId}`)
      .set(bearer(agentToken))
      .send({ status: 'resolved' });

    expect(res.status).toBe(403);
  });

  it('can reject a ticket assigned to them', async () => {
    const createRes = await createTicketAs(customerToken);
    const ticketId  = createRes.body.data.ticket._id;

    await request(app)
      .put(`/api/v1/tickets/${ticketId}/assign`)
      .set(bearer(managerToken))
      .send({ assignedTo: agentUser._id.toString() });

    const res = await request(app)
      .put(`/api/v1/tickets/${ticketId}/reject`)
      .set(bearer(agentToken))
      .send({ reason: 'Workload too high to handle this ticket right now.' });

    expect(res.status).toBe(200);
    expect(res.body.data.ticket.acceptanceStatus).toBe('rejected');
  });

  it('cannot delete a ticket', async () => {
    const createRes = await createTicketAs(customerToken);
    const ticketId  = createRes.body.data.ticket._id;

    const res = await request(app)
      .delete(`/api/v1/tickets/${ticketId}`)
      .set(bearer(agentToken));

    expect(res.status).toBe(403);
  });
});

// ── MANAGER ───────────────────────────────────────────────────────────────────
describe('MANAGER role', () => {
  let managerToken;
  let agentUser;
  let customerToken;

  beforeEach(async () => {
    ({ accessToken: managerToken } = await loginPrivilegedUser(app, 'manager'));
    ({ user: agentUser }           = await loginPrivilegedUser(app, 'agent'));
    ({ accessToken: customerToken } = await registerUser(app, makeUserPayload()));
  });

  it('can view all tickets', async () => {
    await createTicketAs(customerToken);

    const res = await request(app)
      .get('/api/v1/tickets')
      .set(bearer(managerToken));

    expect(res.status).toBe(200);
    expect(res.body.data.tickets.length).toBe(1);
  });

  it('can assign a ticket to an agent', async () => {
    const createRes = await createTicketAs(customerToken);
    const ticketId  = createRes.body.data.ticket._id;

    const res = await request(app)
      .put(`/api/v1/tickets/${ticketId}/assign`)
      .set(bearer(managerToken))
      .send({ assignedTo: agentUser._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.data.ticket.assignedTo).toBeDefined();
  });

  it('cannot delete a ticket', async () => {
    const createRes = await createTicketAs(customerToken);
    const ticketId  = createRes.body.data.ticket._id;

    const res = await request(app)
      .delete(`/api/v1/tickets/${ticketId}`)
      .set(bearer(managerToken));

    expect(res.status).toBe(403);
  });

  it('can view audit log', async () => {
    const createRes = await createTicketAs(customerToken);
    const ticketId  = createRes.body.data.ticket._id;

    const res = await request(app)
      .get(`/api/v1/tickets/${ticketId}/audit`)
      .set(bearer(managerToken));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.logs)).toBe(true);
  });
});

// ── ADMIN ─────────────────────────────────────────────────────────────────────
describe('ADMIN role', () => {
  let adminToken;
  let customerToken;

  beforeEach(async () => {
    ({ accessToken: adminToken }    = await loginPrivilegedUser(app, 'admin'));
    ({ accessToken: customerToken } = await registerUser(app, makeUserPayload()));
  });

  it('can view all tickets', async () => {
    await createTicketAs(customerToken);

    const res = await request(app)
      .get('/api/v1/tickets')
      .set(bearer(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.data.tickets.length).toBe(1);
  });

  it('can delete any ticket', async () => {
    const createRes = await createTicketAs(customerToken);
    const ticketId  = createRes.body.data.ticket._id;

    const res = await request(app)
      .delete(`/api/v1/tickets/${ticketId}`)
      .set(bearer(adminToken));

    expect(res.status).toBe(200);
  });

  it('deleted ticket is no longer visible', async () => {
    const createRes = await createTicketAs(customerToken);
    const ticketId  = createRes.body.data.ticket._id;

    await request(app)
      .delete(`/api/v1/tickets/${ticketId}`)
      .set(bearer(adminToken));

    const res = await request(app)
      .get(`/api/v1/tickets/${ticketId}`)
      .set(bearer(adminToken));

    expect(res.status).toBe(404);
  });

  it('can view audit log', async () => {
    const createRes = await createTicketAs(customerToken);
    const ticketId  = createRes.body.data.ticket._id;

    const res = await request(app)
      .get(`/api/v1/tickets/${ticketId}/audit`)
      .set(bearer(adminToken));

    expect(res.status).toBe(200);
  });
});

// ── Pagination safety ─────────────────────────────────────────────────────────
describe('Pagination limit cap', () => {
  it('caps limit at 100 regardless of what is requested', async () => {
    const { accessToken } = await loginPrivilegedUser(app, 'admin');

    const res = await request(app)
      .get('/api/v1/tickets?limit=99999')
      .set(bearer(accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data.pagination.limit).toBeLessThanOrEqual(100);
  });
});
