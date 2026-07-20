/**
 * Email service tests
 *
 * Covers:
 *  - Service initializes in test mode with mock transporter
 *  - sendEmail sends via mock transporter without error
 *  - sendWelcomeEmail calls sendMail with correct recipient
 *  - sendPasswordResetEmail calls sendMail with reset URL
 *  - Template loading falls back to basic template for missing templates
 */

import emailService from '../../shared/services/email.service.js';

beforeEach(async () => {
  emailService.initialized = false;
  emailService.transporter = null;
  emailService.emailMode   = null;
  await emailService.initializeTransporter();
});

// ── Initialization ────────────────────────────────────────────────────────────
describe('EmailService initialization', () => {
  it('initializes with mock transporter in test mode', async () => {
    expect(emailService.transporter).toBeDefined();
    expect(typeof emailService.transporter.sendMail).toBe('function');
    expect(emailService.emailMode).toBe('mock');
    expect(emailService.initialized).toBe(true);
  });
});

// ── sendEmail ─────────────────────────────────────────────────────────────────
describe('sendEmail', () => {
  it('sends via mock transporter without error', async () => {
    const result = await emailService.sendEmail({
      to:      'recipient@example.com',
      subject: 'Test Subject',
      html:    '<p>Test body</p>',
    });

    expect(result).toBeDefined();
    expect(result.messageId).toBeDefined();
    expect(result.messageId).toMatch(/^test-mock-/);
  });
});

// ── sendWelcomeEmail ──────────────────────────────────────────────────────────
describe('sendWelcomeEmail', () => {
  it('calls sendMail with correct recipient', async () => {
    const originalSendMail = emailService.transporter.sendMail;
    let capturedOptions   = null;

    emailService.transporter.sendMail = async (opts) => {
      capturedOptions = opts;
      return { messageId: 'test-mock-welcome' };
    };

    await emailService.sendWelcomeEmail({
      name:  'Test User',
      email: 'newuser@example.com',
      role:  'customer',
    });

    expect(capturedOptions).not.toBeNull();
    expect(capturedOptions.to).toBe('newuser@example.com');
    expect(capturedOptions.subject).toBe('Welcome to Ticket Management System');

    emailService.transporter.sendMail = originalSendMail;
  });
});

// ── sendPasswordResetEmail ────────────────────────────────────────────────────
describe('sendPasswordResetEmail', () => {
  it('calls sendMail with reset URL containing the token', async () => {
    const originalSendMail = emailService.transporter.sendMail;
    let capturedOptions   = null;

    emailService.transporter.sendMail = async (opts) => {
      capturedOptions = opts;
      return { messageId: 'test-mock-reset' };
    };

    const resetToken = 'abc123-reset-token';
    await emailService.sendPasswordResetEmail(
      { name: 'Test User', email: 'user@example.com' },
      resetToken,
    );

    expect(capturedOptions).not.toBeNull();
    expect(capturedOptions.to).toBe('user@example.com');
    expect(capturedOptions.subject).toBe('Password Reset Request');
    expect(capturedOptions.html).toContain(resetToken);

    emailService.transporter.sendMail = originalSendMail;
  });
});

// ── Template fallback ─────────────────────────────────────────────────────────
describe('Template fallback', () => {
  it('falls back to basic template for a missing template name', async () => {
    const html = await emailService.loadTemplate('non-existent-template-xyz', {
      subject: 'Fallback Test',
      content: 'Fallback content',
    });

    expect(html).toBeDefined();
    expect(typeof html).toBe('string');
    expect(html).toContain('Fallback Test');
    expect(html).toContain('Fallback content');
  });
});
