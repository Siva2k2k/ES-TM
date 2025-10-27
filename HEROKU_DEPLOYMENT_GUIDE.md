# 🚀 Heroku Deployment Guide - Timesheet Management System

## Overview
Complete guide to deploy your full-stack Timesheet Management System (React Frontend + Node.js Backend) to Heroku with MongoDB Atlas.

---

## 📋 Prerequisites Checklist

- [x] MongoDB Atlas setup complete and connected
- [ ] Heroku account created ([signup](https://signup.heroku.com/))
- [ ] Heroku CLI installed
- [ ] Git repository initialized
- [ ] Application tested locally with Atlas

---

## 🎯 Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│              Heroku Platform                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────┐   ┌──────────────────┐  │
│  │  Frontend App    │   │  Backend API     │  │
│  │  (Static Build)  │   │  (Node.js)       │  │
│  │  Port: 3000      │   │  Port: 5000      │  │
│  └──────────────────┘   └──────────────────┘  │
│           │                       │            │
│           └───────────┬───────────┘            │
│                       │                        │
└───────────────────────┼────────────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │  MongoDB Atlas   │
              │  (Cloud DB)      │
              └──────────────────┘
```

---

## 🛠️ Step 1: Install Heroku CLI

### Windows
```powershell
# Download and install from: https://devcenter.heroku.com/articles/heroku-cli
# Or using Chocolatey:
choco install heroku-cli
```

### Verify Installation
```powershell
heroku --version
# Should show: heroku/8.x.x
```

### Login to Heroku
```powershell
heroku login
# This will open browser for authentication
```

---

## 🏗️ Step 2: Prepare Your Application

### 2.1 Create Root Dockerfile for Heroku

Since Heroku uses a single Dockerfile, we need to create a multi-stage build that serves both frontend and backend.

Create `Dockerfile` in root directory:

```dockerfile
# Multi-stage Dockerfile for Heroku deployment
# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend with production environment variables
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Build Backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./
RUN npm ci

# Copy backend source
COPY backend/ ./

# Build backend TypeScript
RUN npm run build

# Stage 3: Production Runtime
FROM node:18-alpine AS production

WORKDIR /app

# Install production dependencies for backend
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --only=production

# Copy built backend from builder
COPY --from=backend-builder /app/backend/dist ./dist

# Copy built frontend from builder
WORKDIR /app
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Install serve to serve frontend
RUN npm install -g serve

# Create startup script
COPY <<'EOF' /app/start.sh
#!/bin/sh
# Start backend in background
cd /app/backend && node dist/index.js &

# Start frontend with serve
cd /app && serve -s frontend/dist -l $PORT
EOF

RUN chmod +x /app/start.sh

# Expose port (Heroku assigns dynamically via $PORT)
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:$PORT/health || exit 1

# Start both services
CMD ["/app/start.sh"]
```

### 2.2 Update heroku.yml

```yaml
build:
  docker:
    web: Dockerfile
  config:
    # These will be set via Heroku config vars (more secure)
    NODE_ENV: production
run:
  web: /app/start.sh
```

### 2.3 Create .dockerignore

```
node_modules
.git
.env
.env.*
npm-debug.log
*.log
dist
build
coverage
.vscode
.idea
*.md
frontend/node_modules
backend/node_modules
backend/dist
frontend/dist
mongo-backup
logs
```

---

## 🔐 Step 3: Prepare Environment Variables

### 3.1 Create Production Environment Template

Create `backend/.env.production.example`:

```bash
# Production Environment Variables Template

# Server Configuration
NODE_ENV=production
PORT=${PORT}  # Heroku assigns this dynamically

# MongoDB Atlas (REQUIRED)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/timesheet-management?retryWrites=true&w=majority

# JWT Secrets (CHANGE THESE!)
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-refresh-secret-change-this-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS & API
CORS_ORIGIN=https://your-app-name.herokuapp.com
FRONTEND_URL=https://your-app-name.herokuapp.com
API_VERSION=v1

# Email Configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com

# Optional
USE_TRANSACTIONS=false
```

---

## 🚀 Step 4: Deploy to Heroku

### 4.1 Create Heroku App

```powershell
# Create new Heroku app
heroku create your-timesheet-app

# Or if you want to specify region
heroku create your-timesheet-app --region us

# Set stack to container (for Docker)
heroku stack:set container -a your-timesheet-app
```

### 4.2 Set Environment Variables

```powershell
# Set all required environment variables
heroku config:set \
  NODE_ENV=production \
  MONGODB_URI="mongodb+srv://sivakumar_db_user:SivaCluster29@timesheet-management-cl.hnjw4hb.mongodb.net/timesheet-management?retryWrites=true&w=majority" \
  JWT_SECRET="$(openssl rand -hex 32)" \
  JWT_REFRESH_SECRET="$(openssl rand -hex 32)" \
  JWT_ACCESS_EXPIRY=15m \
  JWT_REFRESH_EXPIRY=7d \
  CORS_ORIGIN=https://your-timesheet-app.herokuapp.com \
  FRONTEND_URL=https://your-timesheet-app.herokuapp.com \
  API_VERSION=v1 \
  SMTP_HOST=smtp.gmail.com \
  SMTP_PORT=587 \
  SMTP_USER=ren996redsiv@gmail.com \
  SMTP_PASSWORD="ucno eqxk xhng njgg" \
  SMTP_FROM_EMAIL=ren996redsiv@gmail.com \
  USE_TRANSACTIONS=false

# For frontend build
heroku config:set \
  VITE_API_URL=https://your-timesheet-app.herokuapp.com/api
```

**Note**: Replace `your-timesheet-app` with your actual app name.

### 4.3 Verify Config Variables

```powershell
heroku config -a your-timesheet-app
```

### 4.4 Add MongoDB Atlas IP Whitelist

1. Go to MongoDB Atlas Dashboard
2. Navigate to **Network Access**
3. Click **Add IP Address**
4. Add `0.0.0.0/0` (allow all) or specific Heroku IP ranges
5. Click **Confirm**

### 4.5 Deploy Application

```powershell
# Make sure you're in the root directory
cd "d:\Web_dev\React\BOLT PHASE-2\ES-TM Claude"

# Initialize git if not already done
git init
git add .
git commit -m "Prepare for Heroku deployment"

# Add Heroku remote
heroku git:remote -a your-timesheet-app

# Push to Heroku (this triggers build and deployment)
git push heroku main

# Or if you're on a different branch
git push heroku codex:main
```

---

## 📊 Step 5: Monitor Deployment

### 5.1 Watch Build Logs

```powershell
heroku logs --tail -a your-timesheet-app
```

### 5.2 Check Deployment Status

```powershell
heroku ps -a your-timesheet-app
```

### 5.3 Open Your Application

```powershell
heroku open -a your-timesheet-app
```

---

## ✅ Step 6: Verify Deployment

### 6.1 Health Check

```powershell
curl https://your-timesheet-app.herokuapp.com/health
```

### 6.2 Test API Endpoints

```powershell
# Test backend API
curl https://your-timesheet-app.herokuapp.com/api/health

# Test database connection
curl https://your-timesheet-app.herokuapp.com/api/status
```

### 6.3 Test Frontend

Open browser: `https://your-timesheet-app.herokuapp.com`

---

## 🔧 Alternative Deployment: Separate Apps

If you prefer to deploy frontend and backend as separate Heroku apps:

### Backend Deployment

```powershell
# Create backend app
heroku create your-timesheet-api

# Set buildpack
heroku stack:set container -a your-timesheet-api

# Deploy backend
cd backend
git init
git add .
git commit -m "Backend deployment"
heroku git:remote -a your-timesheet-api
git push heroku main
```

### Frontend Deployment

```powershell
# Create frontend app
heroku create your-timesheet-frontend

# Set backend API URL
heroku config:set VITE_API_URL=https://your-timesheet-api.herokuapp.com/api -a your-timesheet-frontend

# Deploy frontend
cd frontend
git init
git add .
git commit -m "Frontend deployment"
heroku git:remote -a your-timesheet-frontend
git push heroku main
```

---

## 🆘 Troubleshooting

### Issue: Build Fails

```powershell
# Check build logs
heroku logs --tail -a your-timesheet-app

# Restart build
heroku restart -a your-timesheet-app
```

### Issue: Application Crashes

```powershell
# View crash logs
heroku logs --tail -a your-timesheet-app

# Check dyno status
heroku ps -a your-timesheet-app

# Restart dyno
heroku restart -a your-timesheet-app
```

### Issue: Database Connection Fails

1. Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
2. Check `MONGODB_URI` config var is correct
3. Verify database user has proper permissions

```powershell
# Check config
heroku config:get MONGODB_URI -a your-timesheet-app

# Update if needed
heroku config:set MONGODB_URI="your-connection-string" -a your-timesheet-app
```

### Issue: Environment Variables Not Loading

```powershell
# List all config vars
heroku config -a your-timesheet-app

# Set missing variables
heroku config:set VARIABLE_NAME=value -a your-timesheet-app
```

---

## 📈 Performance Optimization

### Enable Production Optimizations

```powershell
# Upgrade to better dyno (optional, costs money)
heroku dyno:resize web=standard-1x -a your-timesheet-app

# Enable auto-scaling (requires paid plan)
heroku ps:autoscale:enable web --min=1 --max=2 -a your-timesheet-app
```

### Monitor Performance

```powershell
# View metrics dashboard
heroku dashboard -a your-timesheet-app

# Check performance
heroku logs --ps web -a your-timesheet-app
```

---

## 🔐 Security Best Practices

### 1. Use Heroku Config Vars (Never commit .env)

✅ DO: `heroku config:set SECRET=value`  
❌ DON'T: Commit `.env` files to git

### 2. Rotate Secrets Regularly

```powershell
# Generate new JWT secret
heroku config:set JWT_SECRET="$(openssl rand -hex 32)" -a your-timesheet-app
```

### 3. Enable HTTPS Only

```powershell
# Force HTTPS (Heroku does this by default)
heroku config:set FORCE_HTTPS=true -a your-timesheet-app
```

### 4. Limit MongoDB Atlas Access

- Use specific IP ranges instead of `0.0.0.0/0` if possible
- Create separate database user for production
- Use strong passwords

---

## 💾 Database Management on Heroku

### Backup MongoDB Atlas

```powershell
# Run local backup script
cd backend
node scripts/backup-database.js
```

### Restore to Atlas

```powershell
node scripts/restore-to-atlas.js ./backups/backup-<timestamp>.json
```

---

## 🎯 Post-Deployment Checklist

- [ ] Application accessible at Heroku URL
- [ ] Login functionality works
- [ ] Database reads/writes successful
- [ ] Email notifications working
- [ ] All API endpoints functional
- [ ] Frontend displays correctly
- [ ] Mobile responsive
- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] MongoDB Atlas whitelist configured
- [ ] Error logging configured
- [ ] Performance monitoring enabled

---

## 📊 Monitoring & Maintenance

### View Application Logs

```powershell
# Real-time logs
heroku logs --tail -a your-timesheet-app

# Last 100 lines
heroku logs -n 100 -a your-timesheet-app

# Filter by severity
heroku logs --tail --level error -a your-timesheet-app
```

### Add Logging Add-on (Optional)

```powershell
# Papertrail for log management
heroku addons:create papertrail -a your-timesheet-app
```

### Set up Alerts

1. Go to Heroku Dashboard
2. Navigate to your app
3. Click "Metrics" tab
4. Configure alerts for:
   - Response time
   - Error rate
   - Memory usage

---

## 🚀 Continuous Deployment (CI/CD)

### Option 1: GitHub Integration

1. Go to Heroku Dashboard
2. Select your app → **Deploy** tab
3. Connect to GitHub repository
4. Enable **Automatic Deploys** from `main` branch

### Option 2: Heroku Pipelines

```powershell
# Create pipeline
heroku pipelines:create timesheet-pipeline

# Add app to pipeline
heroku pipelines:add timesheet-pipeline --app your-timesheet-app --stage production

# Enable review apps
heroku pipelines:setup timesheet-pipeline --ci
```

---

## 💰 Cost Estimation

### Free Tier (Hobby)
- 1 Web Dyno: **Free** (550-1000 hours/month)
- MongoDB Atlas M0: **Free**
- Total: **$0/month**

### Production Tier
- Standard-1X Dyno: **$25/month**
- MongoDB Atlas M10: **$57/month**
- Total: **~$82/month**

---

## 📚 Useful Commands Reference

```powershell
# App management
heroku apps:info -a your-timesheet-app
heroku restart -a your-timesheet-app
heroku ps:scale web=1 -a your-timesheet-app

# Logs
heroku logs --tail -a your-timesheet-app
heroku logs --source app -a your-timesheet-app

# Configuration
heroku config -a your-timesheet-app
heroku config:set VAR=value -a your-timesheet-app
heroku config:unset VAR -a your-timesheet-app

# Database
heroku pg:info -a your-timesheet-app  # If using Heroku Postgres
heroku run bash -a your-timesheet-app

# Deployment
git push heroku main
heroku releases -a your-timesheet-app
heroku rollback -a your-timesheet-app  # Rollback to previous version
```

---

## 🎉 Success Indicators

Your deployment is successful when:

✅ `heroku open` shows your application  
✅ Login works with database  
✅ Timesheets can be created/edited  
✅ Approval workflow functions  
✅ Email notifications sent  
✅ No errors in `heroku logs --tail`  
✅ Health check returns 200 OK  
✅ MongoDB Atlas shows active connections  

---

## 🔗 Additional Resources

- [Heroku Node.js Deployment](https://devcenter.heroku.com/articles/deploying-nodejs)
- [Heroku Docker Deployment](https://devcenter.heroku.com/articles/build-docker-images-heroku-yml)
- [MongoDB Atlas with Heroku](https://www.mongodb.com/developer/products/atlas/use-atlas-on-heroku/)
- [Heroku CLI Reference](https://devcenter.heroku.com/articles/heroku-cli-commands)

---

**Your application is now ready for production deployment on Heroku! 🚀**
