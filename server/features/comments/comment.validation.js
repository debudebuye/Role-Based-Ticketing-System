import Joi from 'joi';

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