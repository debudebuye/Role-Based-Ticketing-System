# Role-Based Ticket Management System

A production-ready MERN stack application with Feature-First architecture, implementing role-based access control and real-time updates.

## 🏗️ Architecture

This project follows **Feature-First (Domain-Driven) Architecture** - code is organized by business features, not technical layers.

### Tech Stack
- **Frontend**: React.js with Vite
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + bcrypt
- **Real-time**: Socket.io
- **Authorization**: Role-Based Access Control (RBAC)

### User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Admin** | Manage users & roles, System configuration, View global reports |
| **Manager** | Assign tickets, Set priority, Monitor agent performance |
| **Agent** | View assigned tickets, Update ticket status, Communicate with customers |
| **Customer** | Create tickets, View ticket status, Add comments |

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd ticket-management-system
```

2. Install backend dependencies
```bash
cd server
npm install
```

3. Install frontend dependencies
```bash
cd ../client
npm install
```

4. Environment Setup
```bash
# In server directory, create .env file
cp .env.example .env
# Update MongoDB connection string and JWT secret
```

5. Start the application
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

## 📁 Project Structure

### Backend (Feature-First)
```
server/
├── features/
│   ├── auth/           # Authentication logic
│   ├── users/          # User management
│   ├── tickets/        # Ticket operations
│   └── comments/       # Comment system
├── shared/
│   ├── middleware/     # Auth, RBAC, Error handling
│   ├── utils/          # Utilities
│   └── config/         # Configuration
├── app.js
└── server.js
```

### Frontend (Feature-First)
```
client/src/
├── features/
│   ├── auth/           # Login, Register
│   ├── tickets/        # Ticket management
│   ├── users/          # User management
│   └── dashboard/      # Role-based dashboards
├── shared/
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom hooks
│   └── utils/          # Utilities
├── App.jsx
└── main.jsx
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token

### Users (Admin/Manager only)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Tickets
- `GET /api/tickets` - List tickets (role-filtered)
- `POST /api/tickets` - Create ticket
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket

### Comments
- `GET /api/tickets/:id/comments` - Get ticket comments
- `POST /api/tickets/:id/comments` - Add comment

## 🔌 Real-time Events

- `ticket:created` - New ticket notification
- `ticket:updated` - Ticket status/priority changes
- `comment:added` - New comment on ticket
- `user:online` - User presence updates

## 🛡️ Security Features

- JWT-based authentication
- Role-based access control
- Input validation with Joi
- Rate limiting
- CORS protection
- Password hashing with bcrypt
- Protected routes (frontend & backend)

## 🧪 Testing

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

## 🚀 Deployment

### Backend (Node.js)
1. Set production environment variables
2. Build and deploy to your preferred platform (Heroku, AWS, etc.)

### Frontend (React)
1. Build the application: `npm run build`
2. Deploy to static hosting (Netlify, Vercel, etc.)

### Database
- Use MongoDB Atlas for production
- Ensure proper indexing for performance

## 📝 Environment Variables

### Server (.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ticket-system
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
BCRYPT_ROUNDS=12
```

### Client (.env)
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow Feature-First architecture
4. Add tests for new features
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details