# 🚀 Heroku Deployment - Quick Start Guide

## Prerequisites Checklist
- [x] ✅ MongoDB Atlas connected and working
- [ ] Heroku account created
- [ ] Heroku CLI installed
- [ ] Git initialized in project

---

## 🎯 Quick Deploy (3 Steps)

### Step 1: Install Heroku CLI

**Windows:**
```powershell
# Download from: https://cli.heroku.com/install/windows-x64
# Or use Chocolatey:
choco install heroku-cli

# Verify
heroku --version

# Login
heroku login
```

### Step 2: Run Deployment Script

**PowerShell (Windows):**
```powershell
.\deploy-to-heroku.ps1 your-app-name
```

**Bash (Mac/Linux):**
```bash
chmod +x deploy-to-heroku.sh
./deploy-to-heroku.sh your-app-name
```

### Step 3: Verify Deployment

```powershell
# Open your app
heroku open -a your-app-name

# Check logs
heroku logs --tail -a your-app-name
```

---

## 📝 Manual Deployment Steps

### 1. Create Heroku App
```powershell
heroku create your-timesheet-app
heroku stack:set container -a your-timesheet-app
```

### 2. Set Environment Variables
```powershell
# MongoDB Atlas
heroku config:set MONGODB_URI="mongodb+srv://sivakumar_db_user:SivaCluster29@timesheet-management-cl.hnjw4hb.mongodb.net/timesheet-management?retryWrites=true&w=majority" -a your-timesheet-app

# Security
heroku config:set JWT_SECRET="your-secret-key-32-chars" -a your-timesheet-app
heroku config:set JWT_REFRESH_SECRET="your-refresh-secret-32-chars" -a your-timesheet-app

# App URLs
heroku config:set CORS_ORIGIN="https://your-timesheet-app.herokuapp.com" -a your-timesheet-app
heroku config:set FRONTEND_URL="https://your-timesheet-app.herokuapp.com" -a your-timesheet-app
heroku config:set VITE_API_URL="https://your-timesheet-app.herokuapp.com/api" -a your-timesheet-app

# Email (optional)
heroku config:set SMTP_HOST=smtp.gmail.com -a your-timesheet-app
heroku config:set SMTP_PORT=587 -a your-timesheet-app
heroku config:set SMTP_USER=your-email@gmail.com -a your-timesheet-app
heroku config:set SMTP_PASSWORD="your-app-password" -a your-timesheet-app
```

### 3. Deploy
```powershell
# Add Heroku remote
heroku git:remote -a your-timesheet-app

# Deploy (from main branch)
git push heroku main

# Or deploy from current branch
git push heroku codex:main
```

---

## 🔐 Important: MongoDB Atlas Setup

Before deploying, ensure:

1. **Whitelist Heroku IPs in Atlas:**
   - Go to MongoDB Atlas → Network Access
   - Click "Add IP Address"
   - Add `0.0.0.0/0` (allow all) for development
   - For production, use specific Heroku IP ranges

2. **Database User Permissions:**
   - User has readWrite access
   - Password is strong and URL-encoded if contains special characters

---

## 📊 Monitor Your Deployment

### View Logs
```powershell
# Real-time logs
heroku logs --tail -a your-timesheet-app

# Last 100 lines
heroku logs -n 100 -a your-timesheet-app

# Filter errors only
heroku logs --tail --level error -a your-timesheet-app
```

### Check Status
```powershell
# App info
heroku apps:info -a your-timesheet-app

# Dyno status
heroku ps -a your-timesheet-app

# Config variables
heroku config -a your-timesheet-app
```

### Restart App
```powershell
heroku restart -a your-timesheet-app
```

---

## 🆘 Troubleshooting

### Build Fails
```powershell
# Check build logs
heroku logs --tail -a your-timesheet-app

# Verify Dockerfile exists
ls Dockerfile

# Check heroku.yml
cat heroku.yml
```

### App Crashes
```powershell
# View crash logs
heroku logs --tail -a your-timesheet-app

# Check dyno status
heroku ps -a your-timesheet-app

# Restart
heroku restart -a your-timesheet-app
```

### Database Connection Fails
1. Check MongoDB Atlas Network Access includes `0.0.0.0/0`
2. Verify MONGODB_URI is correct: `heroku config:get MONGODB_URI -a your-timesheet-app`
3. Test connection locally with same URI
4. Check database user permissions

---

## 🎯 Post-Deployment Checklist

- [ ] App opens successfully
- [ ] Login works
- [ ] Database reads/writes work
- [ ] API endpoints respond
- [ ] Frontend displays correctly
- [ ] No errors in logs
- [ ] Email notifications working (if configured)
- [ ] MongoDB Atlas shows active connections

---

## 💰 Pricing

### Free Tier (Eco Dynos)
- **Cost**: $0/month
- **Hours**: 550-1000 hours/month
- **Good for**: Development, testing, demos

### Production Tier
- **Standard-1X**: $25/month
- **Performance-M**: $250/month
- **Good for**: Production apps with higher traffic

### MongoDB Atlas
- **M0 Cluster**: Free (perfect for development)
- **M10 Cluster**: ~$57/month (production)

---

## 🔗 Useful Links

- **Heroku Dashboard**: https://dashboard.heroku.com
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Your App**: https://your-timesheet-app.herokuapp.com
- **Heroku CLI Docs**: https://devcenter.heroku.com/articles/heroku-cli

---

## 📚 Common Commands

```powershell
# Deployment
git push heroku main
heroku releases -a your-app
heroku rollback -a your-app

# Management
heroku restart -a your-app
heroku ps:scale web=1 -a your-app
heroku maintenance:on -a your-app
heroku maintenance:off -a your-app

# Configuration
heroku config -a your-app
heroku config:set VAR=value -a your-app
heroku config:unset VAR -a your-app

# Monitoring
heroku logs --tail -a your-app
heroku ps -a your-app
heroku apps:info -a your-app

# Running commands
heroku run bash -a your-app
heroku run node scripts/seed.js -a your-app
```

---

## ✅ Success Indicators

Your deployment is successful when you see:

✅ `heroku open` shows your application  
✅ Login page loads  
✅ Database connection works  
✅ API endpoints respond  
✅ No errors in `heroku logs --tail`  
✅ Health check returns 200 OK  

---

**Need help?** Check the full guide: `HEROKU_DEPLOYMENT_GUIDE.md`

🎉 **Happy Deploying!**
