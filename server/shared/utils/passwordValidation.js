/**
 * Shared password validation for Joi schemas
 * Single source of truth for weak-password list, sequential/repeated checks
 */

import Joi from 'joi';

const WEAK_PASSWORDS = [
  'password', 'password123', '12345678', 'qwerty123', 'admin123',
  'welcome123', 'letmein123', 'monkey123', '123456789', 'password1',
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm123', 'iloveyou123', 'welcome1',
  'admin1234', 'root1234', 'test1234', 'user1234', 'guest1234'
];

const SEQUENCES = ['0123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiopasdfghjklzxcvbnm'];

/**
 * Joi custom validator for strong passwords.
 * Checks: weak-password list, repeated chars (3+), sequential chars (4+).
 * Use inside a Joi.string().custom() call.
 */
export const strongPasswordValidator = (value, helpers) => {
  if (WEAK_PASSWORDS.includes(value.toLowerCase())) {
    return helpers.error('password.weak');
  }

  if (/(.)\1{3,}/.test(value)) {
    return helpers.error('password.repeated');
  }

  for (const seq of SEQUENCES) {
    for (let i = 0; i <= seq.length - 4; i++) {
      if (value.toLowerCase().includes(seq.substring(i, i + 4))) {
        return helpers.error('password.sequential');
      }
    }
  }

  return value;
};

/**
 * Common Joi string schema for a strong password field.
 * Call with a label prefix for context-appropriate messages, e.g.
 *   passwordJoiField('New password', 'newPassword')
 */
export const passwordJoiField = (label = 'Password') =>
  Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .custom(strongPasswordValidator)
    .messages({
      'string.empty':         `${label} is required`,
      'string.min':           `${label} must be at least 8 characters long`,
      'string.max':           `${label} cannot exceed 128 characters`,
      'string.pattern.base':  `${label} must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)`,
      'password.weak':        'This password is too common and easily guessable. Please choose a stronger password',
      'password.repeated':    `${label} cannot contain more than 3 repeated characters in a row`,
      'password.sequential':  `${label} cannot contain sequential characters (like 1234 or abcd)`
    });
