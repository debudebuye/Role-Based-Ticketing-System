import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatRelativeTime,
  truncateText,
  capitalizeFirst,
  formatUserName,
  getInitials,
  debounce,
  generateTicketId,
  validateEmail,
  validatePassword,
  getStatusIcon,
  getPriorityIcon,
} from './helpers';

describe('truncateText', () => {
  it('returns empty string for falsy input', () => {
    expect(truncateText(null)).toBe('');
    expect(truncateText(undefined)).toBe('');
    expect(truncateText('')).toBe('');
  });

  it('returns text unchanged when under max length', () => {
    expect(truncateText('short', 100)).toBe('short');
  });

  it('truncates text exceeding max length with ellipsis', () => {
    const long = 'a'.repeat(150);
    expect(truncateText(long, 100)).toBe('a'.repeat(100) + '...');
  });

  it('uses default max length of 100', () => {
    const text = 'a'.repeat(101);
    expect(truncateText(text)).toBe('a'.repeat(100) + '...');
  });
});

describe('capitalizeFirst', () => {
  it('returns empty string for falsy input', () => {
    expect(capitalizeFirst(null)).toBe('');
    expect(capitalizeFirst('')).toBe('');
  });

  it('capitalizes first letter', () => {
    expect(capitalizeFirst('hello')).toBe('Hello');
  });

  it('handles single character', () => {
    expect(capitalizeFirst('a')).toBe('A');
  });
});

describe('formatUserName', () => {
  it('returns "Unknown User" for falsy input', () => {
    expect(formatUserName(null)).toBe('Unknown User');
    expect(formatUserName(undefined)).toBe('Unknown User');
  });

  it('returns name when available', () => {
    expect(formatUserName({ name: 'John', email: 'j@test.com' })).toBe('John');
  });

  it('falls back to email', () => {
    expect(formatUserName({ email: 'j@test.com' })).toBe('j@test.com');
  });
});

describe('getInitials', () => {
  it('returns "U" for falsy input', () => {
    expect(getInitials(null)).toBe('U');
    expect(getInitials('')).toBe('U');
  });

  it('returns single initial for single name', () => {
    expect(getInitials('John')).toBe('J');
  });

  it('returns two initials for full name', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('caps max at 2 characters', () => {
    expect(getInitials('John Michael Doe')).toBe('JM');
  });
});

describe('generateTicketId', () => {
  it('starts with TKT-', () => {
    expect(generateTicketId()).toMatch(/^TKT-/);
  });

  it('returns unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateTicketId()));
    expect(ids.size).toBe(100);
  });
});

describe('validateEmail', () => {
  it('accepts valid emails', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('test.user+tag@domain.co')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('notanemail')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
  });
});

describe('validatePassword (client)', () => {
  it('rejects short passwords', () => {
    expect(validatePassword('ab')).toBe(false);
  });

  it('accepts passwords with 6+ chars', () => {
    expect(validatePassword('123456')).toBe(true);
  });
});

describe('getStatusIcon', () => {
  it('returns correct icons', () => {
    expect(getStatusIcon('open')).toBe('🔵');
    expect(getStatusIcon('in_progress')).toBe('🟡');
    expect(getStatusIcon('resolved')).toBe('🟢');
    expect(getStatusIcon('closed')).toBe('⚫');
  });

  it('returns default for unknown status', () => {
    expect(getStatusIcon('unknown')).toBe('❓');
  });
});

describe('getPriorityIcon', () => {
  it('returns correct icons', () => {
    expect(getPriorityIcon('low')).toBe('🔽');
    expect(getPriorityIcon('medium')).toBe('➡️');
    expect(getPriorityIcon('high')).toBe('🔼');
    expect(getPriorityIcon('urgent')).toBe('🔴');
  });
});

describe('formatDate', () => {
  it('returns empty string for falsy input', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
  });

  it('formats a valid date string', () => {
    const result = formatDate('2024-01-15T10:30:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatRelativeTime', () => {
  it('returns empty string for falsy input', () => {
    expect(formatRelativeTime(null)).toBe('');
  });

  it('returns a string for a valid date', () => {
    const result = formatRelativeTime(new Date().toISOString());
    expect(typeof result).toBe('string');
    expect(result).toContain('ago');
  });
});

describe('debounce', () => {
  it('delays function execution', async () => {
    let callCount = 0;
    const fn = () => { callCount++; };
    const debounced = debounce(fn, 50);

    debounced();
    debounced();
    debounced();

    expect(callCount).toBe(0);

    await new Promise((r) => setTimeout(r, 100));
    expect(callCount).toBe(1);
  });
});
