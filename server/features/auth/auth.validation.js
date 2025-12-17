import Joi from 'joi';
import { ROLES } from '../../shared/constants/roles.js';

export const registerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 50 characters'
    }),
  
  email: Joi.string()
    .email()
    .lowercase()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address'
    }),
  
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .custom((value, helpers) => {
      // List of common weak passwords to reject
      const weakPasswords = [
        'password', 'password123', '12345678', 'qwerty123', 'admin123',
        'welcome123', 'letmein123', 'monkey123', '123456789', 'password1',
        'qwertyuiop', 'asdfghjkl', 'zxcvbnm123', 'iloveyou123', 'welcome1',
        'admin1234', 'root1234', 'test1234', 'user1234', 'guest1234'
      ];
      
      if (weakPasswords.includes(value.toLowerCase())) {
        return helpers.error('password.weak');
      }
      
      // Check for repeated characters (more than 3 in a row)
      if (/(.)\1{3,}/.test(value)) {
        return helpers.error('password.repeated');
      }
      
      // Check for sequential characters (like 123456 or abcdef)
      const sequences = ['0123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiopasdfghjklzxcvbnm'];
      for (const seq of sequences) {
        for (let i = 0; i <= seq.length - 4; i++) {
          if (value.toLowerCase().includes(seq.substring(i, i + 4))) {
            return helpers.error('password.sequential');
          }
        }
      }
      
      return value;
    })
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
      'password.weak': 'This password is too common and easily guessable. Please choose a stronger password',
      'password.repeated': 'Password cannot contain more than 3 repeated characters in a row',
      'password.sequential': 'Password cannot contain sequential characters (like 1234 or abcd)'
    }),
  
  role: Joi.string()
    .valid(...Object.values(ROLES))
    .default(ROLES.CUSTOMER)
    .messages({
      'any.only': `Role must be one of: ${Object.values(ROLES).join(', ')}`
    }),
  
  department: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow(''),
  
  phone: Joi.string()
    .trim()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'Please enter a valid phone number'
    })
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required'
    })
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'string.empty': 'Current password is required'
    }),
  
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .custom((value, helpers) => {
      // List of common weak passwords to reject
      const weakPasswords = [
        'password', 'password123', '12345678', 'qwerty123', 'admin123',
        'welcome123', 'letmein123', 'monkey123', '123456789', 'password1',
        'qwertyuiop', 'asdfghjkl', 'zxcvbnm123', 'iloveyou123', 'welcome1',
        'admin1234', 'root1234', 'test1234', 'user1234', 'guest1234'
      ];
      
      if (weakPasswords.includes(value.toLowerCase())) {
        return helpers.error('password.weak');
      }
      
      // Check for repeated characters (more than 3 in a row)
      if (/(.)\1{3,}/.test(value)) {
        return helpers.error('password.repeated');
      }
      
      // Check for sequential characters (like 123456 or abcdef)
      const sequences = ['0123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiopasdfghjklzxcvbnm'];
      for (const seq of sequences) {
        for (let i = 0; i <= seq.length - 4; i++) {
          if (value.toLowerCase().includes(seq.substring(i, i + 4))) {
            return helpers.error('password.sequential');
          }
        }
      }
      
      return value;
    })
    .messages({
      'string.empty': 'New password is required',
      'string.min': 'New password must be at least 8 characters long',
      'string.max': 'New password cannot exceed 128 characters',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
      'password.weak': 'This password is too common and easily guessable. Please choose a stronger password',
      'password.repeated': 'New password cannot contain more than 3 repeated characters in a row',
      'password.sequential': 'New password cannot contain sequential characters (like 1234 or abcd)'
    })
});

export const updateProfileSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 50 characters'
    }),
  
  department: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow(''),
  
  phone: Joi.string()
    .trim()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'Please enter a valid phone number'
    })
});

export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    req.body = value;
    next();
  };
};