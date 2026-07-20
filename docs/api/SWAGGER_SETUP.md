# Swagger API Documentation Setup

## Overview

This document describes the Swagger/OpenAPI documentation setup for the Role-Based Ticket Management System API.

## Access

The interactive API documentation is available at:
- **Development**: http://localhost:5000/api-docs
- **Production**: https://api.ticketmanagement.com/api-docs

## Features

### Interactive Documentation
- **Try It Out**: Test API endpoints directly from the documentation
- **Authentication**: Built-in JWT token management
- **Request/Response Examples**: Comprehensive examples for all endpoints
- **Schema Validation**: Real-time validation of request payloads

### API Coverage

#### Authentication Endpoints (`/api/v1/auth`)
- User registration and login
- Profile management
- Password changes
- Token refresh

#### User Management (`/api/v1/users`)
- User CRUD operations with role-based permissions
- User statistics and filtering
- Agent listing for ticket assignment
- Hierarchical role management

#### Ticket Management (`/api/v1/tickets`)
- Comprehensive ticket CRUD operations
- Role-based filtering and access control
- Ticket assignment and acceptance/rejection workflow
- Status updates and priority management
- Advanced search and filtering

#### Comment System (`/api/v1/comments`)
- Ticket comment management
- Internal vs public comments
- Comment editing and deletion
- Pagination and filtering

## Authentication in Swagger UI

### Getting Started
1. Navigate to `/api-docs`
2. Click the "Authorize" button (🔒 icon)
3. Enter your JWT token in the format: `Bearer <your-token>`
4. Click "Authorize"

### Obtaining a Token
1. Use the `/auth/login` endpoint to authenticate
2. Copy the `token` from the response
3. Use it in the Authorization header for protected endpoints

## Configuration

### Swagger Configuration File
Location: `server/shared/config/swagger.js`

Key features:
- OpenAPI 3.0 specification
- Comprehensive schema definitions
- Reusable response components
- Security scheme configuration
- Multiple server environments

### Route Documentation
Each route file contains JSDoc comments with Swagger annotations:
- `server/features/auth/auth.routes.js`
- `server/features/users/user.routes.js`
- `server/features/tickets/ticket.routes.js`
- `server/features/comments/comment.routes.js`

## Schema Definitions

### Core Schemas
- **User**: Complete user object with role-based properties
- **Ticket**: Comprehensive ticket structure with workflow states
- **Comment**: Comment system with internal/external visibility
- **Error**: Standardized error response format
- **Success**: Standardized success response format

### Response Components
- **UnauthorizedError**: 401 authentication required
- **ForbiddenError**: 403 insufficient permissions
- **ValidationError**: 400 request validation errors
- **NotFoundError**: 404 resource not found

## Role-Based Documentation

### Admin Endpoints
- Full user management capabilities
- System-wide ticket access
- All administrative functions

### Manager Endpoints
- Team user management (agents/customers only)
- Ticket assignment and oversight
- Department-level statistics

### Agent Endpoints
- Assigned ticket management
- Accept/reject workflow
- Customer communication

### Customer Endpoints
- Personal ticket creation and management
- Comment on own tickets
- View own ticket history

## Best Practices

### Using the Documentation
1. **Start with Authentication**: Always authenticate first
2. **Check Permissions**: Verify your role has access to endpoints
3. **Validate Payloads**: Use the schema definitions for request structure
4. **Handle Errors**: Review error response formats
5. **Test Thoroughly**: Use the "Try It Out" feature for validation

### Development Workflow
1. **Document First**: Add Swagger annotations when creating new endpoints
2. **Test Documentation**: Verify examples work in Swagger UI
3. **Keep Updated**: Maintain documentation alongside code changes
4. **Review Schemas**: Ensure schema definitions match actual models

## Customization

### UI Customization
The Swagger UI includes:
- Custom CSS to hide the top bar
- Persistent authorization
- Request duration display
- Collapsed sections by default
- Search and filter capabilities

### Adding New Endpoints
1. Add JSDoc comments with `@swagger` annotations
2. Define request/response schemas
3. Include proper error responses
4. Test in Swagger UI
5. Update this documentation if needed

## Troubleshooting

### Common Issues
1. **401 Unauthorized**: Ensure JWT token is properly formatted
2. **403 Forbidden**: Check user role permissions
3. **Schema Validation**: Verify request payload matches schema
4. **CORS Issues**: Ensure proper CORS configuration

### Debug Mode
Enable detailed logging by setting:
```env
NODE_ENV=development
```

## Security Considerations

### Token Management
- Tokens expire after configured time
- Use refresh endpoint for token renewal
- Never expose tokens in logs or client-side code

### Role Validation
- All endpoints validate user roles
- Hierarchical permissions are enforced
- Managers cannot access admin-only functions

### Data Protection
- Sensitive data is excluded from responses
- Internal comments are filtered by role
- User data access is role-restricted

## Maintenance

### Regular Updates
- Keep Swagger dependencies updated
- Review and update examples
- Validate all endpoints work correctly
- Update schema definitions for model changes

### Performance
- Documentation generation is cached
- Minimal impact on API performance
- Separate documentation server for production (recommended)