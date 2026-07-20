# API Documentation

Complete API reference for the Role-Based Ticket Management System.

## � Insteractive Documentation (Swagger UI)

**Access the interactive API documentation:**
- **Development**: http://localhost:5000/api-docs
- **Production**: https://your-domain.com/api-docs

### Features
- 🧪 **Try It Out**: Test endpoints directly from the browser
- 🔐 **Built-in Authentication**: JWT token management
- 📋 **Real-time Validation**: Request/response schema validation
- 📖 **Comprehensive Examples**: Complete request/response examples
- 🔍 **Search & Filter**: Find endpoints quickly

### Getting Started with Swagger
1. Navigate to the Swagger UI URL above
2. Click the **"Authorize"** button (🔒 icon)
3. Enter your JWT token: `Bearer <your-token>`
4. Use the `/auth/login` endpoint to get a token if needed
5. Test any endpoint with the **"Try it out"** button

## 🔗 Base URL
```
Development: http://localhost:5000/api/v1
Production: https://your-domain.com/api/v1
```

## 📋 API Versioning

This API uses URL path versioning. The current stable version is **v1**.

### Version Information
- **Current Version**: v1
- **Supported Versions**: v1
- **Legacy Support**: Requests to `/api/*` (without version) are redirected to `/api/v1/*`

### Version Endpoints
```http
GET /api/version          # Get version information
GET /health              # Health check with version info
```

### Version Headers
All responses include version information in headers:
- `X-API-Version`: The version used for this request
- `X-API-Current-Version`: The current stable version
- `X-API-Deprecation-Warning`: Present if using a deprecated version
- `X-API-Sunset-Date`: Sunset date for deprecated versions

## 🔐 Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## 📋 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

## 🔑 Authentication Endpoints

### Register User
```http
POST /api/v1/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "customer",
  "department": "IT",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "token": "jwt_token_here"
  }
}
```

### Login User
```http
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get Profile
```http
GET /api/v1/auth/profile
```
*Requires authentication*

### Update Profile
```http
PUT /api/v1/auth/profile
```
*Requires authentication*

**Request Body:**
```json
{
  "name": "John Smith",
  "department": "Support",
  "phone": "+1234567890"
}
```

### Change Password
```http
PUT /api/v1/auth/change-password
```
*Requires authentication*

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### Refresh Token
```http
POST /api/v1/auth/refresh
```
*Requires authentication*

## 👥 User Management Endpoints

*Admin/Manager access required*

### Get All Users
```http
GET /api/v1/users?page=1&limit=10&role=customer&search=john
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `role` (optional): Filter by role
- `isActive` (optional): Filter by active status
- `search` (optional): Search by name, email, or department

### Get User by ID
```http
GET /api/v1/users/:id
```

### Create User
```http
POST /api/v1/users
```
*Admin access required*

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "role": "agent",
  "department": "Support",
  "isActive": true
}
```

### Update User
```http
PUT /api/v1/users/:id
```
*Admin access required*

### Delete User (Deactivate)
```http
DELETE /api/v1/users/:id
```
*Admin access required*

### Get User Statistics
```http
GET /api/v1/users/stats
```

### Get Agents List
```http
GET /api/v1/users/agents
```

## 🎫 Ticket Endpoints

### Get All Tickets
```http
GET /api/v1/tickets?page=1&limit=10&status=open&priority=high
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Filter by status (open, in_progress, resolved, closed)
- `priority` (optional): Filter by priority (low, medium, high, urgent)
- `category` (optional): Filter by category
- `assignedTo` (optional): Filter by assigned agent ID
- `search` (optional): Search in title and description
- `dateFrom` (optional): Filter from date
- `dateTo` (optional): Filter to date

**Response:**
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "_id": "ticket_id",
        "title": "Login issue",
        "description": "Cannot login to mobile app",
        "status": "open",
        "priority": "high",
        "category": "technical",
        "createdBy": {
          "_id": "user_id",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "assignedTo": null,
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### Get Ticket by ID
```http
GET /api/v1/tickets/:id
```

### Create Ticket
```http
POST /api/v1/tickets
```

**Request Body:**
```json
{
  "title": "Cannot access dashboard",
  "description": "Getting 500 error when trying to access the main dashboard",
  "priority": "high",
  "category": "technical",
  "tags": ["dashboard", "error", "500"],
  "dueDate": "2024-01-20T00:00:00Z"
}
```

### Update Ticket
```http
PUT /api/v1/tickets/:id
```

**Request Body:**
```json
{
  "title": "Updated title",
  "status": "in_progress",
  "priority": "urgent",
  "assignedTo": "agent_user_id"
}
```

### Delete Ticket
```http
DELETE /api/v1/tickets/:id
```
*Admin or ticket creator only*

### Assign Ticket
```http
PUT /api/v1/tickets/:id/assign
```
*Admin/Manager access required*

**Request Body:**
```json
{
  "assignedTo": "agent_user_id"
}
```

### Get Ticket Statistics
```http
GET /api/v1/tickets/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 150,
      "open": 25,
      "inProgress": 30,
      "resolved": 80,
      "closed": 15,
      "urgent": 5,
      "high": 20,
      "avgResolutionTime": 4.2
    }
  }
}
```

## 💬 Comment Endpoints

### Get Ticket Comments
```http
GET /api/v1/comments/ticket/:ticketId?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "_id": "comment_id",
        "content": "I'm looking into this issue now.",
        "author": {
          "_id": "user_id",
          "name": "Agent Smith",
          "email": "agent@example.com",
          "role": "agent"
        },
        "ticket": "ticket_id",
        "isInternal": false,
        "createdAt": "2024-01-15T11:00:00Z",
        "isEdited": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

### Create Comment
```http
POST /api/v1/comments/ticket/:ticketId
```

**Request Body:**
```json
{
  "content": "Thank you for reporting this issue. I'll investigate and get back to you soon.",
  "isInternal": false
}
```

### Update Comment
```http
PUT /api/v1/comments/:id
```
*Author only, within 15 minutes*

**Request Body:**
```json
{
  "content": "Updated comment content"
}
```

### Delete Comment
```http
DELETE /api/v1/comments/:id
```
*Admin or comment author only*

### Get Comment by ID
```http
GET /api/v1/comments/:id
```

## 🔌 WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Client Events

#### Join Ticket Room
```javascript
socket.emit('ticket:join', ticketId);
```

#### Leave Ticket Room
```javascript
socket.emit('ticket:leave', ticketId);
```

#### Typing Indicator
```javascript
socket.emit('comment:typing', {
  ticketId: 'ticket_id',
  isTyping: true
});
```

### Server Events

#### Ticket Events
```javascript
// New ticket created
socket.on('ticket:created', (data) => {
  console.log('New ticket:', data.ticket);
});

// Ticket updated
socket.on('ticket:updated', (data) => {
  console.log('Ticket updated:', data.ticket);
  console.log('Updated by:', data.updatedBy);
});

// Ticket assigned
socket.on('ticket:assigned', (data) => {
  console.log('Ticket assigned:', data.ticket);
  console.log('Assigned by:', data.assignedBy);
});

// Ticket deleted
socket.on('ticket:deleted', (data) => {
  console.log('Ticket deleted:', data.ticketId);
});
```

#### Comment Events
```javascript
// New comment added
socket.on('comment:added', (data) => {
  console.log('New comment:', data.comment);
  console.log('On ticket:', data.ticketId);
});

// Comment updated
socket.on('comment:updated', (data) => {
  console.log('Comment updated:', data.comment);
});

// Comment deleted
socket.on('comment:deleted', (data) => {
  console.log('Comment deleted:', data.commentId);
  console.log('From ticket:', data.ticketId);
});

// Typing indicator
socket.on('comment:typing', (data) => {
  console.log(`${data.userName} is typing...`);
});
```

#### User Events
```javascript
// User online
socket.on('user:online', (data) => {
  console.log('User online:', data.name);
});

// User offline
socket.on('user:offline', (data) => {
  console.log('User offline:', data.name);
});

// User created
socket.on('user:created', (data) => {
  console.log('New user:', data.user);
});

// User updated
socket.on('user:updated', (data) => {
  console.log('User updated:', data.user);
});

// Profile updated (personal)
socket.on('profile:updated', (data) => {
  console.log('Your profile updated:', data.user);
});
```

## 🚨 Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

## 🔒 Role-Based Access Control

### Permissions by Role

#### Customer
- Create tickets
- View own tickets
- Add comments to own tickets
- Update own profile

#### Agent
- View assigned tickets
- Update ticket status
- Add comments to assigned tickets
- Update own profile

#### Manager
- View all tickets
- Assign tickets to agents
- Set ticket priority
- Manage agents
- View reports

#### Admin
- Full system access
- Manage all users
- System configuration
- View global reports
- Delete tickets/comments

### Protected Endpoints

| Endpoint | Customer | Agent | Manager | Admin |
|----------|----------|-------|---------|-------|
| `POST /tickets` | ✅ | ✅ | ✅ | ✅ |
| `GET /tickets` | Own only | Assigned | All | All |
| `PUT /tickets/:id/assign` | ❌ | ❌ | ✅ | ✅ |
| `GET /users` | ❌ | ❌ | ✅ | ✅ |
| `POST /users` | ❌ | ❌ | ❌ | ✅ |
| `DELETE /users/:id` | ❌ | ❌ | ❌ | ✅ |

## 📊 Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 login attempts per 15 minutes per IP
- **WebSocket**: Connection-based throttling

## 🧪 Testing the API

### Using cURL

#### Register a user
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "customer"
  }'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### Create a ticket
```bash
curl -X POST http://localhost:5000/api/v1/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Test ticket",
    "description": "This is a test ticket",
    "priority": "medium",
    "category": "general"
  }'
```

#### Get version information
```bash
curl -X GET http://localhost:5000/api/version \
  -H "Content-Type: application/json"
```

### Using Postman

Import the following collection:
```json
{
  "info": {
    "name": "Ticket Management API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{jwt_token}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:5000/api/v1"
    },
    {
      "key": "api_version",
      "value": "v1"
    }
  ]
}
```

---

For more information, see the main README.md file.