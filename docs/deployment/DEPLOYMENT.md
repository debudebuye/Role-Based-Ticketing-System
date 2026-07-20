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

### Option 1: Docker Compose (recommended)

This is the fully supported production path. Everything runs in containers —
MongoDB, the Node API server, and the React app served by nginx.

#### Step 1 — Configure environment

```bash
# Copy the production template and fill in ALL values
cp .env.production.example .env
```

Key values to set in `.env`:

| Variable | What to set |
|---|---|
| `MONGO_ROOT_PASSWORD` | Strong random password (20+ chars) |
| `JWT_SECRET` | 64-char random hex — `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | Different 64-char random hex |
| `CORS_ORIGIN` | `https://yourdomain.com` |
| `CLIENT_URL` | `https://yourdomain.com` |
| `VITE_API_URL` | `https://yourdomain.com/api/v1` |
| `EMAIL_FROM` | `noreply@yourdomain.com` |
| `EMAIL_USER` | Gmail address |
| `EMAIL_PASSWORD` | Gmail App Password (not account password) |
| `CERT_PATH` | Path to TLS fullchain.pem on the host |
| `KEY_PATH` | Path to TLS privkey.pem on the host |

#### Step 2 — Obtain TLS certificates (Let's Encrypt)

```bash
# Install certbot on your server
sudo apt install certbot

# Stop any service on port 80 first, then:
sudo certbot certonly --standalone -d yourdomain.com

# Certs will be at:
#   /etc/letsencrypt/live/yourdomain.com/fullchain.pem
#   /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

> If SSL is terminated upstream (Cloudflare, AWS ALB), skip this step and
> remove the HTTPS server block from `client/nginx.conf` — nginx only needs
> to serve HTTP in that case.

#### Step 3 — Deploy

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

#### Step 4 — Create the first admin user

```bash
# Register via the app, then promote via the script:
docker exec ticket-server node scripts/promote-admin.js your@email.com
```

#### Updating

```bash
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

---

### Option 2: VPS with PM2 (no Docker)

Suitable for a single VPS where you want direct control.

```bash
# On the server
git clone <repo> && cd ticket-management-system

# Install dependencies
cd server && npm ci --omit=dev

# Set env vars (use a real .env or export them)
cp .env.production.example .env
# Edit .env

# Start with PM2 (defaults to 1 instance — safe for Socket.IO)
pm2 start pm2.config.cjs
pm2 save
pm2 startup   # follow the printed command to enable on boot
```

For the frontend, build locally and serve via nginx or upload to a CDN:

```bash
cd client
VITE_API_URL=https://yourdomain.com/api/v1 npm run build
# Upload dist/ to your server or CDN
```

See [nginx-sticky.md](./nginx-sticky.md) if you want to run multiple PM2
workers.

---

### Option 3: Managed platforms

| Service | Notes |
|---|---|
| **Railway / Render** | Connect GitHub repo, set env vars in dashboard, deploy `server/` as root |
| **Heroku** | `git subtree push --prefix server heroku main` — set config vars via `heroku config:set` |
| **Vercel / Netlify** | Frontend only — set `VITE_API_URL` as build env var, deploy `client/` |
| **MongoDB Atlas** | Use instead of the Docker mongo container — replace `MONGODB_URI` with the Atlas connection string |

---

## 🔧 Environment Variables Reference

See `.env.production.example` in the project root for a fully commented
production template.

### Quick reference

```env
# Server
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ticket-system

JWT_SECRET=<64-char-hex>
JWT_REFRESH_SECRET=<different-64-char-hex>
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

BCRYPT_ROUNDS=12
RATE_LIMIT_MAX=500
TRUST_PROXY=1

CORS_ORIGIN=https://yourdomain.com
CLIENT_URL=https://yourdomain.com

EMAIL_FROM=noreply@yourdomain.com
EMAIL_SERVICE=gmail
EMAIL_USER=you@gmail.com
EMAIL_PASSWORD=<app-password>
```

```env
# Client (baked in at build time)
VITE_API_URL=https://yourdomain.com/api/v1
VITE_SOCKET_URL=https://yourdomain.com
```

## 🔒 Production Security Checklist

Before going live, verify every item:

### Secrets
- [ ] `JWT_SECRET` is a 64-char random hex (not a placeholder or dictionary word)
- [ ] `JWT_REFRESH_SECRET` is a **different** 64-char random hex
- [ ] `MONGO_ROOT_PASSWORD` is 20+ random characters
- [ ] `EMAIL_PASSWORD` is a Gmail App Password, not your account password
- [ ] `.env` is in `.gitignore` and not committed to the repository

### Network
- [ ] HTTPS is enabled (TLS cert mounted, nginx HTTPS block active)
- [ ] `CORS_ORIGIN` is set to your exact frontend domain (not `*`, not `localhost`)
- [ ] MongoDB port (27017) is **not** exposed to the internet (handled by `docker-compose.prod.yml`)
- [ ] `TRUST_PROXY=1` is set when running behind nginx or a load balancer
- [ ] `RATE_LIMIT_MAX=500` (not 0) in production

### Application
- [ ] `NODE_ENV=production` (disables Swagger UI and verbose error messages)
- [ ] `EMAIL_FROM` is a real domain address (not `noreply@localhost`)
- [ ] `CLIENT_URL` is your production frontend URL (used in password-reset email links)
- [ ] `LOG_LEVEL=info` (not `debug` — debug logs can expose sensitive data)

### Database
- [ ] MongoDB Atlas or a replica set is used for production (not a single Docker container)
- [ ] Database user has least-privilege access
- [ ] Automated backups are configured

### Post-deploy
- [ ] Run the test suite: `cd server && npm test`
- [ ] Smoke test: register a user, create a ticket, test password reset email
- [ ] Check `/health` endpoint returns 200
- [ ] Verify Socket.IO connects (open browser dev tools → Network → WS)

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