import Joi from 'joi';
import { ROLES } from '../../shared/constants/roles.js';
import { validate } from '../../shared/middleware/validation.middleware.js';
import { passwordJoiField } from '../../shared/utils/passwordValidation.js';

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
  
  password: passwordJoiField('Password'),
  
  // Public registration is restricted to customer role only.
  role: Joi.string()
    .valid(ROLES.CUSTOMER)
    .default(ROLES.CUSTOMER)
    .messages({
      'any.only': 'Public registration is only available for customer accounts. Contact an administrator to create privileged accounts.'
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
  
  newPassword: passwordJoiField('New password')
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

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().required()
    .messages({ 'string.empty': 'Email is required', 'string.email': 'Please enter a valid email' })
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required()
    .messages({ 'string.empty': 'Reset token is required' }),
  newPassword: passwordJoiField('New password')
});

export { validate };
