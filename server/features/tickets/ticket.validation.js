import Joi from 'joi';
import { TICKET_STATUS, TICKET_PRIORITY, TICKET_CATEGORIES } from '../../shared/constants/roles.js';

export const createTicketSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(5)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Title is required',
      'string.min': 'Title must be at least 5 characters',
      'string.max': 'Title cannot exceed 200 characters'
    }),
  
  description: Joi.string()
    .trim()
    .min(10)
    .max(2000)
    .required()
    .messages({
      'string.empty': 'Description is required',
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description cannot exceed 2000 characters'
    }),
  
  priority: Joi.string()
    .valid(...Object.values(TICKET_PRIORITY))
    .default(TICKET_PRIORITY.MEDIUM)
    .messages({
      'any.only': `Priority must be one of: ${Object.values(TICKET_PRIORITY).join(', ')}`
    }),
  
  category: Joi.string()
    .valid(...TICKET_CATEGORIES)
    .default('general')
    .messages({
      'any.only': `Category must be one of: ${TICKET_CATEGORIES.join(', ')}`
    }),
  
  tags: Joi.array()
    .items(Joi.string().trim().max(50))
    .max(10)
    .default([])
    .messages({
      'array.max': 'Maximum 10 tags allowed'
    }),
  
  dueDate: Joi.date()
    .min('now')
    .optional()
    .messages({
      'date.min': 'Due date cannot be in the past'
    }),
  
  metadata: Joi.object({
    browser: Joi.string().optional(),
    os: Joi.string().optional(),
    device: Joi.string().optional(),
    ipAddress: Joi.string().optional()
  }).optional()
});

export const updateTicketSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(5)
    .max(200)
    .optional()
    .messages({
      'string.min': 'Title must be at least 5 characters',
      'string.max': 'Title cannot exceed 200 characters'
    }),
  
  description: Joi.string()
    .trim()
    .min(10)
    .max(2000)
    .optional()
    .messages({
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description cannot exceed 2000 characters'
    }),
  
  status: Joi.string()
    .valid(...Object.values(TICKET_STATUS))
    .optional()
    .messages({
      'any.only': `Status must be one of: ${Object.values(TICKET_STATUS).join(', ')}`
    }),
  
  priority: Joi.string()
    .valid(...Object.values(TICKET_PRIORITY))
    .optional()
    .messages({
      'any.only': `Priority must be one of: ${Object.values(TICKET_PRIORITY).join(', ')}`
    }),
  
  category: Joi.string()
    .valid(...TICKET_CATEGORIES)
    .optional()
    .messages({
      'any.only': `Category must be one of: ${TICKET_CATEGORIES.join(', ')}`
    }),
  
  tags: Joi.array()
    .items(Joi.string().trim().max(50))
    .max(10)
    .optional()
    .messages({
      'array.max': 'Maximum 10 tags allowed'
    }),
  
  assignedTo: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .allow(null)
    .messages({
      'string.pattern.base': 'Invalid user ID format'
    }),
  
  dueDate: Joi.date()
    .optional()
    .allow(null)
});

export const assignTicketSchema = Joi.object({
  assignedTo: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.empty': 'Agent ID is required',
      'string.pattern.base': 'Invalid agent ID format'
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