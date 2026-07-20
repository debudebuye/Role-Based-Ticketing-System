import { describe, it, expect } from 'vitest';
import { isTokenExpired, getTokenExpiration, isTokenValid } from './tokenUtils';

function makeToken(payload) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const sig = 'fakesignature';
  return `${header}.${body}.${sig}`;
}

describe('isTokenExpired', () => {
  it('returns true for null/undefined', () => {
    expect(isTokenExpired(null)).toBe(true);
    expect(isTokenExpired(undefined)).toBe(true);
  });

  it('returns true for expired token', () => {
    const token = makeToken({ exp: Math.floor(Date.now() / 1000) - 3600 });
    expect(isTokenExpired(token)).toBe(true);
  });

  it('returns false for valid token', () => {
    const token = makeToken({ exp: Math.floor(Date.now() / 1000) + 3600 });
    expect(isTokenExpired(token)).toBe(false);
  });

  it('returns true for malformed token', () => {
    expect(isTokenExpired('not.a.jwt')).toBe(true);
  });
});

describe('getTokenExpiration', () => {
  it('returns null for null/undefined', () => {
    expect(getTokenExpiration(null)).toBeNull();
    expect(getTokenExpiration(undefined)).toBeNull();
  });

  it('returns Date for valid token', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = makeToken({ exp });
    const result = getTokenExpiration(token);
    expect(result).toBeInstanceOf(Date);
    expect(result.getTime()).toBe(exp * 1000);
  });

  it('returns null for malformed token', () => {
    expect(getTokenExpiration('bad')).toBeNull();
  });
});

describe('isTokenValid', () => {
  it('returns false for null', () => {
    expect(isTokenValid(null)).toBeFalsy();
  });

  it('returns true for non-expired token', () => {
    const token = makeToken({ exp: Math.floor(Date.now() / 1000) + 3600 });
    expect(isTokenValid(token)).toBe(true);
  });

  it('returns false for expired token', () => {
    const token = makeToken({ exp: Math.floor(Date.now() / 1000) - 3600 });
    expect(isTokenValid(token)).toBe(false);
  });
});
