import Joi from 'joi';
import { ROLES } from '../../shared/constants/roles.js';

export const createUserSchema = Joi.object({
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
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters',
      'string.max': 'Password cannot exceed 128 characters'
    }),
  
  role: Joi.string()
    .valid(...Object.values(ROLES))
    .required()
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
    .optional()
    .allow('')
    .messages({
      'string.base': 'Phone number must be a string'
    }),
  
  isActive: Joi.boolean()
    .default(true)
});

export const updateUserSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 50 characters'
    }),
  
  role: Joi.string()
    .valid(...Object.values(ROLES))
    .optional()
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
    }),
  
  isActive: Joi.boolean()
    .optional()
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