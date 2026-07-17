import Joi from 'joi';
import { validate } from '../../shared/middleware/validation.middleware.js';

export const createCommentSchema = Joi.object({
  content: Joi.string()
    .trim()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'string.empty': 'Comment content is required',
      'string.min': 'Comment cannot be empty',
      'string.max': 'Comment cannot exceed 1000 characters'
    }),
  
  isInternal: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'isInternal must be a boolean value'
    })
});

export const updateCommentSchema = Joi.object({
  content: Joi.string()
    .trim()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'string.empty': 'Comment content is required',
      'string.min': 'Comment cannot be empty',
      'string.max': 'Comment cannot exceed 1000 characters'
    })
});

export { validate };