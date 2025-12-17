/**
 * Swagger Configuration
 * API documentation setup using swagger-jsdoc and swagger-ui-express
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Role-Based Ticket Management System API',
      version: '1.0.0',
      description: `
        A comprehensive REST API for a role-based ticket management system.
        
        ## Features
        - JWT-based authentication
        - Role-based access control (Admin, Manager, Agent, Customer)
        - Real-time updates via WebSocket
        - Comprehensive ticket management
        - User management with hierarchical permissions
        
        ## Authentication
        Most endpoints require authentication. Include the JWT token in the Authorization header:
        \`Authorization: Bearer <your-jwt-token>\`
        
        ## Roles & Permissions
        - **Admin**: Full system access, user management, system configuration
        - **Manager**: Team management, ticket assignment, agent oversight
        - **Agent**: Assigned ticket management, status updates, customer communication
        - **Customer**: Ticket creation, own ticket viewing, commenting
      `,
      contact: {
        name: 'API Support',
        email: 'support@ticketmanagement.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Development server'
      },
      {
        url: 'https://api.ticketmanagement.com/api/v1',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login endpoint'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'email', 'password', 'role'],
          properties: {
            _id: {
              type: 'string',
              description: 'User ID',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              description: 'Full name of the user',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john.doe@example.com'
            },
            role: {
              type: 'string',
              enum: ['admin', 'manager', 'agent', 'customer'],
              description: 'User role in the system',
              example: 'agent'
            },
            department: {
              type: 'string',
              description: 'User department',
              example: 'Support'
            },
            phone: {
              type: 'string',
              description: 'Phone number',
              example: '+1234567890'
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the user is active',
              example: true
            },
            lastLogin: {
              type: 'string',
              format: 'date-time',
              description: 'Last login timestamp'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Ticket: {
          type: 'object',
          required: ['title', 'description', 'priority', 'category'],
          properties: {
            _id: {
              type: 'string',
              description: 'Ticket ID',
              example: '507f1f77bcf86cd799439011'
            },
            title: {
              type: 'string',
              description: 'Ticket title',
              example: 'Login Issue - Cannot Access Dashboard'
            },
            description: {
              type: 'string',
              description: 'Detailed description of the issue',
              example: 'User reports being unable to login to the dashboard'
            },
            status: {
              type: 'string',
              enum: ['open', 'in_progress', 'resolved', 'closed'],
              description: 'Current ticket status',
              example: 'open'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              description: 'Ticket priority level',
              example: 'high'
            },
            category: {
              type: 'string',
              enum: ['technical', 'billing', 'general', 'feature_request', 'bug_report', 'account', 'other'],
              description: 'Ticket category',
              example: 'technical'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Ticket tags',
              example: ['login', 'dashboard', 'authentication']
            },
            createdBy: {
              type: 'string',
              description: 'ID of user who created the ticket',
              example: '507f1f77bcf86cd799439011'
            },
            assignedTo: {
              type: 'string',
              description: 'ID of assigned agent',
              example: '507f1f77bcf86cd799439012'
            },
            assignedBy: {
              type: 'string',
              description: 'ID of user who assigned the ticket',
              example: '507f1f77bcf86cd799439013'
            },
            acceptanceStatus: {
              type: 'string',
              enum: ['pending', 'accepted', 'rejected'],
              description: 'Agent acceptance status',
              example: 'pending'
            },
            rejectionReason: {
              type: 'string',
              description: 'Reason for rejection if rejected',
              example: 'Workload too high - cannot take on additional tickets'
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              description: 'Ticket due date'
            },
            resolvedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Resolution timestamp'
            },
            closedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Closure timestamp'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Comment: {
          type: 'object',
          required: ['content'],
          properties: {
            _id: {
              type: 'string',
              description: 'Comment ID',
              example: '507f1f77bcf86cd799439011'
            },
            ticket: {
              type: 'string',
              description: 'Associated ticket ID',
              example: '507f1f77bcf86cd799439012'
            },
            author: {
              type: 'string',
              description: 'Comment author ID',
              example: '507f1f77bcf86cd799439013'
            },
            content: {
              type: 'string',
              description: 'Comment content',
              example: 'I have investigated this issue and found the root cause.'
            },
            isInternal: {
              type: 'boolean',
              description: 'Whether this is an internal comment',
              example: false
            },
            isEdited: {
              type: 'boolean',
              description: 'Whether the comment has been edited',
              example: false
            },
            editedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Edit timestamp'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message description'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'email'
                  },
                  message: {
                    type: 'string',
                    example: 'Email is required'
                  }
                }
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Authentication required'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Insufficient permissions'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Validation error',
                errors: [
                  {
                    field: 'email',
                    message: 'Email is required'
                  }
                ]
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Resource not found'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './features/*/routes/*.js',
    './features/*/*.routes.js',
    './shared/routes/*.js'
  ]
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };