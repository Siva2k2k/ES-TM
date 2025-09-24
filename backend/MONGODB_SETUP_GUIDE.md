# MongoDB User Setup Guide

## Problem

Your MongoDB instance has authentication enabled but the user `Admin:1234` from your .env file doesn't exist.

## Solution Options

### Option A: Create MongoDB User (Recommended)

1. **Open Command Prompt/PowerShell as Administrator**

2. **Connect to MongoDB shell:**

   ```
   mongosh
   ```

3. **Switch to admin database:**

   ```javascript
   use admin
   ```

4. **Create the admin user:**

   ```javascript
   db.createUser({
     user: "Admin",
     pwd: "1234",
     roles: [
       { role: "userAdminAnyDatabase", db: "admin" },
       { role: "readWriteAnyDatabase", db: "admin" },
     ],
   });
   ```

5. **Exit MongoDB shell:**

   ```javascript
   exit;
   ```

6. **Test the connection** (run in your backend folder):
   ```
   npm run test:auth
   ```

### Option B: Disable Authentication (Quick Fix)

If Option A doesn't work, you can disable authentication in MongoDB:

1. **Find your MongoDB configuration file** (usually `mongod.cfg` in MongoDB installation folder)

2. **Edit the config file and comment out security settings:**

   ```yaml
   # security:
   #   authorization: enabled
   ```

3. **Restart MongoDB service:**
   ```
   net stop MongoDB
   net start MongoDB
   ```

### Option C: Use Different Credentials

If you have existing MongoDB users, update your `.env` file with the correct credentials.

## Verification Commands

After setting up the user, run these commands to verify:

```bash
# Test basic connection
npm run test:noauth

# Test with authentication
npm run test:auth

# Start the backend server
npm run dev
```

## Common Issues

1. **"Authentication failed"** - Wrong username/password
2. **"Command requires authentication"** - User doesn't have proper roles
3. **"Connection refused"** - MongoDB service not running

## Need Help?

If you encounter issues:

1. Check if MongoDB service is running: `services.msc` -> look for MongoDB
2. Check MongoDB logs for error messages
3. Try connecting with MongoDB Compass using the same credentials
