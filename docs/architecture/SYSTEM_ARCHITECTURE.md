# System Architecture

## 🏗️ Overview

The Role-Based Ticket Management System follows a **Feature-First (Domain-Driven) Architecture** where code is organized by business features rather than technical layers. This approach promotes better maintainability, scalability, and team collaboration.

## 🎯 Architecture Principles

### 1. Feature-First Organization
- Code is grouped by business domain (auth, tickets, users, etc.)
- Each feature contains its own models, controllers, services, and views
- Shared utilities and components are centralized

### 2. Role-Based Access Control (RBAC)
- Four distinct user roles: Admin, Manager, Agent, Customer
- Hierarchical permission system
- Both frontend and backend authorization

### 3. Real-time Communication
- WebSocket integration for live updates
- Event-driven architecture for notifications
- Optimistic UI updates

## 🏛️ System Components

### Frontend Architecture (React.js)

```
client/src/
├── features/                    # Business features
│   ├── auth/                   # Authentication & authorization
│   │   ├── components/         # Login, Register forms
│   │   ├── pages/             # Auth pages
│   │   ├── auth.context.jsx   # Auth state management
│   │   └── auth.service.js    # API calls
│   ├── dashboard/             # Role-based dashboards
│   │   ├── admin/             # Admin dashboard
│   │   ├── manager/           # Manager dashboard
│   │   ├── agent/             # Agent dashboard
│   │   └── customer/          # Customer dashboard
│   ├── tickets/               # Ticket management
│   │   ├── admin/             # Admin ticket views
│   │   ├── agent/             # Agent ticket views
│   │   ├── customer/          # Customer ticket views
│   │   ├── manager/           # Manager ticket views
│   │   ├── components/        # Shared ticket components
│   │   ├── pages/             # Ticket pages
│   │   └── ticket.service.js  # Ticket API calls
│   ├── users/                 # User management
│   │   ├── components/        # User forms & modals
│   │   ├── pages/             # User management pages
│   │   └── user.service.js    # User API calls
│   └── settings/              # Application settings
├── shared/                    # Shared resources
│   ├── components/            # Reusable UI components
│   │   ├── Layout.jsx         # Main layout
│   │   ├── ProtectedRoute.jsx # Route protection
│   │   └── ...
│   ├── hooks/                 # Custom React hooks
│   ├── utils/                 # Utility functions
│   │   ├── api.js            # API client configuration
│   │   ├── constants.js      # Application constants
│   │   └── helpers.js        # Helper functions
│   └── styles/               # Global styles
├── App.jsx                   # Main application component
└── main.jsx                  # Application entry point
```

### Backend Architecture (Node.js/Express)

```
server/
├── features/                  # Business features
│   ├── auth/                 # Authentication
│   │   ├── auth.controller.js # Request handlers
│   │   ├── auth.service.js   # Business logic
│   │   ├── auth.routes.js    # Route definitions
│   │   └── auth.validation.js # Input validation
│   ├── users/                # User management
│   │   ├── user.model.js     # MongoDB schema
│   │   ├── user.controller.js
│   │   ├── user.service.js
│   │   ├── user.routes.js
│   │   └── user.validation.js
│   ├── tickets/              # Ticket management
│   │   ├── ticket.model.js
│   │   ├── ticket.controller.js
│   │   ├── ticket.service.js
│   │   ├── ticket.routes.js
│   │   └── ticket.validation.js
│   └── comments/             # Comment system
├── shared/                   # Shared resources
│   ├── middleware/           # Express middleware
│   │   ├── auth.middleware.js    # JWT authentication
│   │   ├── role.middleware.js    # RBAC authorization
│   │   ├── error.middleware.js   # Error handling
│   │   ├── validation.middleware.js # Input validation
│   │   └── rate-limit.middleware.js # Rate limiting
│   ├── config/               # Configuration
│   │   ├── database.js       # MongoDB connection
│   │   ├── socket.js         # WebSocket setup
│   │   └── cors.js          # CORS configuration
│   ├── constants/            # Application constants
│   │   └── roles.js         # Role definitions
│   ├── utils/               # Utility functions
│   └── routes/              # Route aggregation
├── scripts/                 # Utility scripts
│   ├── seed.js             # Database seeding
│   └── create-admin.js     # Admin user creation
├── app.js                  # Express app configuration
└── server.js               # Server entry point
```

## 🔐 Security Architecture

### Authentication Flow
1. User submits credentials
2. Server validates and generates JWT
3. Client stores JWT in memory/localStorage
4. JWT included in subsequent requests
5. Server validates JWT on protected routes

### Authorization Layers
1. **Route Level**: Express middleware checks user roles
2. **Service Level**: Business logic validates permissions
3. **Frontend Level**: UI components hide/show based on roles
4. **Database Level**: Query filters based on user context

### Role Hierarchy
```
Admin (Highest)
├── Full system access
├── User management
├── System configuration
└── Global reporting

Manager
├── Team management
├── Ticket assignment
├── Performance monitoring
└── Agent oversight

Agent
├── Assigned ticket management
├── Status updates
├── Customer communication
└── Comment system

Customer (Lowest)
├── Ticket creation
├── Own ticket viewing
├── Comment on own tickets
└── Status tracking
```

## 🔄 Data Flow Architecture

### Request Flow
1. **Client Request** → API Gateway
2. **Authentication** → JWT validation
3. **Authorization** → Role-based access check
4. **Validation** → Input sanitization
5. **Business Logic** → Service layer processing
6. **Database** → Data persistence
7. **Response** → JSON response to client

### Real-time Updates
1. **Action Trigger** → User performs action
2. **Database Update** → Data is persisted
3. **Event Emission** → WebSocket event sent
4. **Client Reception** → Real-time UI update
5. **State Sync** → Application state updated

## 🗄️ Database Design

### MongoDB Collections

#### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum),
  department: String,
  phone: String,
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Tickets Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  status: String (enum),
  priority: String (enum),
  category: String,
  tags: [String],
  createdBy: ObjectId (ref: User),
  assignedTo: ObjectId (ref: User),
  assignedBy: ObjectId (ref: User),
  assignedAt: Date,
  acceptanceStatus: String (enum),
  acceptedAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  resolvedAt: Date,
  closedAt: Date,
  dueDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Comments Collection
```javascript
{
  _id: ObjectId,
  ticket: ObjectId (ref: Ticket),
  author: ObjectId (ref: User),
  content: String,
  isInternal: Boolean,
  isEdited: Boolean,
  editedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 Deployment Architecture

### Development Environment
- **Frontend**: Vite dev server (port 5173)
- **Backend**: Node.js server (port 5000)
- **Database**: Local MongoDB instance
- **WebSocket**: Socket.io integration

### Production Environment
- **Frontend**: Static files served by CDN
- **Backend**: Node.js server with PM2
- **Database**: MongoDB Atlas cluster
- **Load Balancer**: Nginx reverse proxy
- **SSL**: Let's Encrypt certificates

## 📊 Performance Considerations

### Frontend Optimization
- Code splitting by routes and features
- Lazy loading of components
- React Query for efficient data fetching
- Memoization of expensive computations

### Backend Optimization
- Database indexing on frequently queried fields
- Connection pooling for MongoDB
- Caching with Redis (future enhancement)
- Rate limiting to prevent abuse

### Database Optimization
- Compound indexes for complex queries
- Aggregation pipelines for reporting
- Data archiving for old tickets
- Regular performance monitoring

## 🔮 Future Enhancements

### Scalability Improvements
- Microservices architecture migration
- Redis caching layer
- Message queue for background jobs
- Horizontal scaling with load balancers

### Feature Additions
- File attachment system
- Advanced reporting dashboard
- Email notification system
- Mobile application support

### Security Enhancements
- Two-factor authentication
- OAuth integration
- Audit logging system
- Advanced threat detection