# Deployment Guide

This guide covers deploying the Role-Based Ticket Management System to production.

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- Git

### 1. Clone and Setup
```bash
git clone <repository-url>
cd ticket-management-system

# Backend setup
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Frontend setup  
cd ../client
npm install
cp .env.example .env
# Edit .env with your API URLs
```

### 2. Start Development Servers
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend  
cd client
npm run dev
```

### 3. Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/health

## 🏭 Production Deployment

### Backend Deployment Options

#### Option 1: Heroku
```bash
# In server directory
heroku create your-app-name-api
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-mongodb-atlas-uri
heroku config:set JWT_SECRET=your-super-secure-jwt-secret
heroku config:set CORS_ORIGIN=https://your-frontend-domain.com
git subtree push --prefix server heroku main
```

#### Option 2: Railway
```bash
# In server directory
railway login
railway new
railway add
railway deploy
```

#### Option 3: DigitalOcean App Platform
1. Connect your GitHub repository
2. Select the `server` folder as root
3. Set environment variables in the dashboard
4. Deploy

### Frontend Deployment Options

#### Option 1: Netlify
```bash
# In client directory
npm run build
# Upload dist folder to Netlify or connect GitHub repo
```

#### Option 2: Vercel
```bash
# In client directory
vercel --prod
```

#### Option 3: AWS S3 + CloudFront
```bash
# In client directory
npm run build
aws s3 sync dist/ s3://your-bucket-name
# Configure CloudFront distribution
```

### Database Setup (MongoDB Atlas)

1. Create MongoDB Atlas account
2. Create new cluster
3. Create database user
4. Whitelist IP addresses (0.0.0.0/0 for development)
5. Get connection string
6. Update MONGODB_URI in environment variables

## 🔧 Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ticket-system
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters-long
JWT_EXPIRE=7d
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://your-frontend-domain.com
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend-domain.com/api
VITE_SOCKET_URL=https://your-backend-domain.com
```

## 🔒 Security Checklist

### Backend Security
- [ ] Strong JWT secret (32+ characters)
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] MongoDB connection secured
- [ ] Environment variables secured
- [ ] Error messages don't expose sensitive data

### Frontend Security
- [ ] HTTPS enabled
- [ ] API URLs use HTTPS
- [ ] No sensitive data in localStorage
- [ ] XSS protection enabled
- [ ] Content Security Policy configured

## 📊 Monitoring & Logging

### Backend Monitoring
```javascript
// Add to server.js
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Health Checks
- Backend: `GET /health`
- Database connectivity check
- Memory usage monitoring
- Response time monitoring

## 🚀 Performance Optimization

### Backend
- Enable gzip compression
- Implement caching (Redis)
- Database indexing
- Connection pooling
- Load balancing

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- CDN for static assets
- Service worker for caching

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: "your-app-name-api"
          heroku_email: "your-email@example.com"
          appdir: "server"

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v1.2
        with:
          publish-dir: './client/dist'
          production-branch: main
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 🧪 Testing in Production

### Smoke Tests
1. User registration/login
2. Ticket creation
3. Role-based access
4. Real-time updates
5. API response times

### Load Testing
```bash
# Using Artillery
npm install -g artillery
artillery quick --count 10 --num 100 https://your-api-domain.com/health
```

## 📱 Mobile Considerations

### Progressive Web App (PWA)
- Add service worker
- Web app manifest
- Offline functionality
- Push notifications

## 🔧 Troubleshooting

### Common Issues

#### CORS Errors
- Check CORS_ORIGIN environment variable
- Ensure frontend URL matches exactly
- Include protocol (https://)

#### Database Connection
- Verify MongoDB URI
- Check network access (IP whitelist)
- Confirm database user permissions

#### JWT Issues
- Ensure JWT_SECRET is set
- Check token expiration
- Verify token format

#### Socket.IO Connection
- Check VITE_SOCKET_URL
- Ensure WebSocket support
- Verify CORS for Socket.IO

### Debug Commands
```bash
# Backend logs
heroku logs --tail -a your-app-name-api

# Database connection test
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(console.error)"

# Frontend build test
cd client && npm run build
```

## 📈 Scaling Considerations

### Horizontal Scaling
- Load balancer configuration
- Session management (Redis)
- Database sharding
- CDN implementation

### Vertical Scaling
- Server resource monitoring
- Database optimization
- Caching strategies
- Code optimization

## 🔐 Backup Strategy

### Database Backups
- Automated daily backups
- Point-in-time recovery
- Cross-region replication
- Backup testing procedures

### Code Backups
- Git repository backups
- Environment configuration backups
- Documentation backups

## 📞 Support & Maintenance

### Monitoring Alerts
- Server downtime
- High error rates
- Database issues
- Performance degradation

### Update Procedures
- Dependency updates
- Security patches
- Feature deployments
- Rollback procedures

---

For additional support, please refer to the main README.md or create an issue in the repository.