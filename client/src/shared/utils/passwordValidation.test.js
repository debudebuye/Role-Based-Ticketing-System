import { describe, it, expect } from 'vitest';
import { validatePassword, getPasswordStrength } from './passwordValidation';

describe('validatePassword', () => {
  it('returns errors for empty password', () => {
    const errors = validatePassword('');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects password shorter than 8 chars', () => {
    const errors = validatePassword('Ab1!');
    expect(errors.some((e) => e.includes('8 characters'))).toBe(true);
  });

  it('rejects password without uppercase', () => {
    const errors = validatePassword('lowercase1!');
    expect(errors.some((e) => e.includes('uppercase'))).toBe(true);
  });

  it('rejects password without lowercase', () => {
    const errors = validatePassword('UPPERCASE1!');
    expect(errors.some((e) => e.includes('lowercase'))).toBe(true);
  });

  it('rejects password without number', () => {
    const errors = validatePassword('NoNumber!');
    expect(errors.some((e) => e.includes('number'))).toBe(true);
  });

  it('rejects password without special character', () => {
    const errors = validatePassword('NoSpecial1');
    expect(errors.some((e) => e.includes('special'))).toBe(true);
  });

  it('rejects common weak passwords', () => {
    const errors = validatePassword('password');
    expect(errors.some((e) => e.includes('common'))).toBe(true);
  });

  it('rejects repeated characters', () => {
    const errors = validatePassword('aaaabbbb1!');
    expect(errors.some((e) => e.includes('repeated'))).toBe(true);
  });

  it('rejects sequential characters', () => {
    const errors = validatePassword('abcdeF1!');
    expect(errors.some((e) => e.includes('sequential'))).toBe(true);
  });

  it('accepts a strong password', () => {
    const errors = validatePassword('MyStr0ng!Pass');
    expect(errors.length).toBe(0);
  });
});

describe('getPasswordStrength', () => {
  it('returns weak for short passwords', () => {
    const result = getPasswordStrength('abc');
    expect(result.strength).toBe('weak');
    expect(result.color).toBe('red');
  });

  it('returns medium for moderate passwords', () => {
    const result = getPasswordStrength('Abcdef1');
    expect(result.strength).toBe('medium');
  });

  it('returns strong for complex passwords', () => {
    const result = getPasswordStrength('MyStr0ng!Pass#2024');
    expect(result.strength).toBe('strong');
    expect(result.color).toBe('green');
  });

  it('returns percentage between 0 and 100', () => {
    const result = getPasswordStrength('test');
    expect(result.percentage).toBeGreaterThanOrEqual(0);
    expect(result.percentage).toBeLessThanOrEqual(100);
  });
});
