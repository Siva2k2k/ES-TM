# 🚀 MongoDB Atlas Migration Guide

## Overview

Complete guide to migrate your **timesheet-management** database from local MongoDB Compass to MongoDB Atlas for production deployment.

---

## 📊 Current Database Schema

### **Collections**: 21 total

- **Core**: users, clients, projects, projectmembers, tasks
- **Timesheet**: timesheets, timeentries, approvalhistories, timesheetprojectapprovals
- **Billing**: billingrates, billingadjustments, billingsnapshots, invoices
- **System**: companyholidays, notifications, notificationsettings, auditlogs, systemsettings, usersettings, reporttemplates, searchindices

### **Key Features**:

- ✅ Role-based access control (5 roles)
- ✅ 3-tier approval workflow (Lead → Manager → Management)
- ✅ Soft & hard delete support
- ✅ Comprehensive indexing for performance
- ✅ Project types: regular, internal, training
- ✅ Entry categories: project, leave, training, miscellaneous
- ✅ Flexible billing rate management

---

## 🎯 Migration Strategy

### **Prerequisites**

- [x] MongoDB Compass with local database
- [ ] MongoDB Atlas account
- [x] Node.js installed
- [x] Backup scripts available

---

## 📋 Step-by-Step Migration

### **Phase 1: Setup MongoDB Atlas**

#### 1.1 Create Atlas Account & Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Click **Create Cluster**
4. Choose:
   - **Free Tier (M0)** for development/testing
   - **M10+** for production
   - **Cloud Provider**: AWS/GCP/Azure
   - **Region**: Closest to your users/deployment

#### 1.2 Configure Network Access

1. Navigate to **Network Access** → **Add IP Address**
2. Options:
   - **Development**: Add your current IP or `0.0.0.0/0` (all IPs)
   - **Production**: Add specific server IPs

#### 1.3 Create Database User

1. Go to **Database Access** → **Add New Database User**
2. Create credentials:
   ```
   Username: timesheet_admin
   Password: <generate-strong-password>
   Database User Privileges: Atlas admin
   ```
3. **Save credentials securely!**

#### 1.4 Get Connection String

1. Click **Connect** on your cluster
2. Choose **Connect your application**
3. Driver: **Node.js**
4. Version: **5.5 or later**
5. Copy connection string:
   ```
   mongodb+srv://timesheet_admin:<password>@cluster0.xxxxx.mongodb.net/timesheet-management?retryWrites=true&w=majority
   ```

---

### **Phase 2: Prepare Local Environment**

#### 2.1 Update Environment Variables

Create/Update `.env` file in `backend/`:

```bash
# Local MongoDB (keep for backup)
MONGODB_URI=mongodb://Admin:1234@localhost:27017/timesheet-management?authSource=admin

# MongoDB Atlas (add this NEW)
MONGODB_ATLAS_URI=mongodb+srv://timesheet_admin:<password>@cluster0.xxxxx.mongodb.net/timesheet-management?retryWrites=true&w=majority

# For production deployment, use:
# MONGODB_URI=mongodb+srv://...
```

⚠️ **Replace**:

- `<password>` with your actual password
- `cluster0.xxxxx` with your cluster address

#### 2.2 Add to .gitignore

Ensure `.env` is in `.gitignore`:

```
.env
.env.local
.env.production
```

---

### **Phase 3: Migration Methods**

Choose one of the following methods:

---

## 🔧 **Method 1: Using mongodump/mongorestore (Recommended)**

### **Best for**: Production migrations, preserves indexes and structure perfectly

#### Step 1: Install MongoDB Database Tools

```powershell
# Download from: https://www.mongodb.com/try/download/database-tools
# Or install via Chocolatey:
choco install mongodb-database-tools
```

#### Step 2: Backup Local Database

```powershell
mongodump --uri="mongodb://Admin:1234@localhost:27017/timesheet-management?authSource=admin" --out=./mongo-backup

# Creates: ./mongo-backup/timesheet-management/
```

#### Step 3: Restore to Atlas

```powershell
mongorestore --uri="mongodb+srv://timesheet_admin:<password>@cluster0.xxxxx.mongodb.net/timesheet-management" ./mongo-backup/timesheet-management

# This preserves:
# ✅ All documents
# ✅ All indexes
# ✅ Collection structures
# ✅ Data types
```

#### Step 4: Verify Migration

```powershell
# Connect to Atlas using MongoDB Compass
# Connection string: mongodb+srv://timesheet_admin:<password>@cluster0.xxxxx.mongodb.net/

# Verify:
# - All 21 collections exist
# - Document counts match
# - Indexes are created
```

---

## 📦 **Method 2: Using Backup Scripts (Already Available)**

### **Best for**: JSON-based backups, easier to inspect data

#### Step 1: Create Backup

```powershell
cd backend
node scripts/backup-database.js

# Creates: backend/backups/backup-<timestamp>.json
# Example: backup-2025-10-27T10-30-00-000Z.json
```

#### Step 2: Restore to Atlas

```powershell
node scripts/restore-to-atlas.js ./backups/backup-2025-10-27T10-30-00-000Z.json

# Reads MONGODB_ATLAS_URI from .env
# Restores all collections and documents
```

#### Step 3: Verify

The script automatically verifies by:

- Listing all collections
- Counting documents in each collection

---

## 🔄 **Method 3: Using MongoDB Compass GUI (Easiest)**

### **Best for**: Small databases, visual verification

#### Step 1: Connect to Atlas in Compass

1. Open MongoDB Compass
2. Click **New Connection**
3. Paste Atlas connection string
4. Click **Connect**

#### Step 2: Export from Local

1. Connect to local database
2. For each collection:
   - Click collection → **Collection** tab
   - Click **Export** → **Export Full Collection**
   - Choose JSON
   - Save file

#### Step 3: Import to Atlas

1. Switch to Atlas connection in Compass
2. For each collection:
   - Click **Add Data** → **Import JSON or CSV file**
   - Select exported file
   - Click **Import**

⚠️ **Limitations**:

- Time-consuming for 21 collections
- Doesn't preserve indexes (need to recreate)

---

## ✅ Post-Migration Verification

### 1. Check Collection Count

```javascript
// In MongoDB Compass or Atlas UI
db.getCollectionNames().length;
// Should return: 21
```

### 2. Verify Document Counts

```javascript
// Run in Atlas shell
db.users.countDocuments();
db.projects.countDocuments();
db.timesheets.countDocuments();
db.timeentries.countDocuments();
// Compare with local counts
```

### 3. Test Application Connection

```powershell
cd backend
npm run dev

# Should connect to Atlas successfully
# Check logs for: "✅ MongoDB Connected Successfully!"
```

### 4. Verify Indexes

```javascript
// In Atlas shell, for each collection
db.users.getIndexes();
db.projects.getIndexes();
db.timesheets.getIndexes();

// Should see all indexes from schema
```

---

## 🔐 Security Best Practices

### 1. Environment Variables

```bash
# Development
MONGODB_URI=mongodb+srv://dev_user:dev_pass@dev-cluster...

# Production
MONGODB_URI=mongodb+srv://prod_user:prod_pass@prod-cluster...
```

### 2. Network Security

- **Development**: Allow your IP only
- **Production**: Add server IPs, use VPC peering if possible

### 3. User Permissions

- Create separate users for dev/staging/prod
- Use role-based access (readWrite for app, read for analytics)

### 4. Connection Pooling

Your current config is good:

```typescript
maxPoolSize: 10,
serverSelectionTimeoutMS: 5000,
socketTimeoutMS: 45000,
bufferCommands: false
```

---

## 🚀 Deployment Configuration

### For Heroku Deployment

1. **Set Config Var**:

```bash
heroku config:set MONGODB_URI="mongodb+srv://..."
```

2. **Update database.ts** (already configured):

```typescript
const mongoURI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/timesheet-management";
```

### For Other Platforms (Render, Railway, etc.)

1. Add environment variable in platform dashboard
2. Use the same variable name: `MONGODB_URI`
3. Value: Your Atlas connection string

---

## 📈 Performance Optimization

### 1. Enable MongoDB Atlas Performance Advisor

- Monitors slow queries
- Suggests index improvements

### 2. Set Up Alerts

- Configure alerts for:
  - High connection count
  - Memory usage
  - Slow queries

### 3. Enable Backup

- Atlas provides automated backups
- Configure retention period (7-365 days)
- Test restore process

---

## 🆘 Troubleshooting

### Issue: Connection Timeout

**Solution**:

1. Check IP whitelist in Atlas
2. Verify credentials
3. Check firewall settings

### Issue: Authentication Failed

**Solution**:

1. Verify username/password
2. Check database user privileges
3. Ensure special characters in password are URL-encoded

### Issue: Documents Not Found After Migration

**Solution**:

1. Check database name in connection string
2. Verify collection names (case-sensitive)
3. Re-run migration with verbose logging

### Issue: Slow Queries

**Solution**:

1. Check Performance Advisor in Atlas
2. Verify all indexes are created
3. Review query patterns

---

## 📊 Migration Checklist

### Pre-Migration

- [ ] Create MongoDB Atlas account and cluster
- [ ] Configure network access
- [ ] Create database user
- [ ] Get connection string
- [ ] Update .env files
- [ ] Test Atlas connection from local

### Migration

- [ ] Create backup of local database
- [ ] Run migration (choose method)
- [ ] Verify all collections migrated
- [ ] Verify document counts match
- [ ] Check indexes are created

### Post-Migration

- [ ] Update application to use Atlas URI
- [ ] Test all CRUD operations
- [ ] Test authentication flows
- [ ] Test timesheet submission workflow
- [ ] Test billing calculations
- [ ] Configure Atlas monitoring
- [ ] Set up automated backups
- [ ] Document connection string securely

### Production Deployment

- [ ] Use production Atlas cluster
- [ ] Configure production environment variables
- [ ] Enable Atlas backup
- [ ] Set up monitoring and alerts
- [ ] Configure VPC peering (if required)
- [ ] Test disaster recovery process

---

## 📚 Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Database Tools](https://docs.mongodb.com/database-tools/)
- [Mongoose Connection Guide](https://mongoosejs.com/docs/connections.html)
- [MongoDB Atlas Security](https://docs.atlas.mongodb.com/security/)

---

## 🎉 Summary

Your database schema is **well-designed** with:

- ✅ Proper indexing for performance
- ✅ Soft/hard delete support
- ✅ Comprehensive audit trails
- ✅ Type-safe TypeScript models
- ✅ Production-ready structure

**Recommended Migration Path**:

1. Use **Method 1 (mongodump/mongorestore)** for production
2. Use **Method 2 (backup scripts)** for quick testing
3. Always create backups before migration
4. Test thoroughly in development before production

---

**Need Help?**

- Check MongoDB Atlas support
- Review application logs
- Test with sample data first

**Good luck with your deployment! 🚀**
