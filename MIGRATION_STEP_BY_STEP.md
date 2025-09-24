# 🚀 Complete Migration Guide: Supabase → MongoDB + Node.js

## 📋 **Table of Contents**

1. [Prerequisites](#prerequisites)
2. [Phase 1: Database Setup](#phase-1-database-setup)
3. [Phase 2: Backend Configuration](#phase-2-backend-configuration)
4. [Phase 3: API Development](#phase-3-api-development)
5. [Phase 4: Frontend Integration](#phase-4-frontend-integration)
6. [Phase 5: Testing & Deployment](#phase-5-testing--deployment)

---

## 🔧 **Prerequisites**

### **Software Requirements**

- **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
- **MongoDB Community**: Download from [mongodb.com](https://www.mongodb.com/try/download/community)
- **MongoDB Compass** (GUI): Download from [mongodb.com/compass](https://www.mongodb.com/try/download/compass)
- **Git**: For version control
- **VS Code**: Recommended editor

### **Knowledge Requirements**

- Basic JavaScript/TypeScript
- Understanding of REST APIs
- Basic MongoDB concepts (documents, collections)

---

## 📊 **Phase 1: Database Setup**

### **Step 1.1: Install MongoDB**

```bash
# Windows (using Chocolatey)
choco install mongodb

# Or download installer from:
# https://www.mongodb.com/try/download/community

# Mac (using Homebrew)
brew install mongodb-community

# Ubuntu/Debian
sudo apt install mongodb
```

### **Step 1.2: Start MongoDB Service**

```bash
# Windows
net start MongoDB

# Mac/Linux
brew services start mongodb-community
# or
sudo systemctl start mongod
```

### **Step 1.3: Verify Installation**

```bash
# Connect to MongoDB
mongosh

# Should show MongoDB shell
# Type 'exit' to quit
```

### **Step 1.4: Install MongoDB Compass (Optional)**

- Download and install MongoDB Compass
- Connect to: `mongodb://localhost:27017`
- Create database: `timesheet-management`

---

## ⚙️ **Phase 2: Backend Configuration**

### **Step 2.1: Environment Setup**

Your `.env` file is already configured! Just verify these key settings:

```bash
# In backend/.env
MONGODB_URI=mongodb://localhost:27017/timesheet-management
JWT_ACCESS_SECRET=your-super-secret-access-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
```

### **Step 2.2: Install Dependencies**

```bash
cd backend
npm install
```

### **Step 2.3: Test Backend Connection**

```bash
# Start the backend server
npm run dev

# Should see:
# ✅ MongoDB Connected: localhost:27017
# 🚀 Server running on http://localhost:5000
```

---

## 🔌 **Phase 3: API Development**

### **Step 3.1: Create Your First Route**

Create a simple test endpoint to verify everything works:

```typescript
// backend/src/routes/test.ts
import { Router } from "express";
import { User } from "../models";

const router = Router();

// Test endpoint
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database: "connected",
  });
});

// Test database connection
router.get("/users/count", async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ userCount: count });
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
```

### **Step 3.2: Register the Route**

```typescript
// Add to backend/src/routes/index.ts
import testRoutes from "./test";

// Register routes
app.use("/api/test", testRoutes);
```

### **Step 3.3: Create Your First User**

```bash
# Test in MongoDB Compass or create a seed script
# backend/src/scripts/createFirstUser.ts

import { User } from '../models';
import { connectDB } from '../config/database';
import bcrypt from 'bcryptjs';

const createFirstUser = async () => {
  await connectDB();

  const hashedPassword = await bcrypt.hash('admin123', 12);

  const admin = new User({
    email: 'admin@company.com',
    full_name: 'System Administrator',
    role: 'super_admin',
    hourly_rate: 0,
    is_active: true,
    is_approved_by_super_admin: true,
    password_hash: hashedPassword
  });

  await admin.save();
  console.log('✅ Admin user created!');
  process.exit(0);
};

createFirstUser();
```

### **Step 3.4: Test Your API**

```bash
# Test the health endpoint
curl http://localhost:5000/api/test/health

# Should return:
# {"status":"OK","timestamp":"...","database":"connected"}
```

---

## 🌐 **Phase 4: Frontend Integration**

### **Step 4.1: Update Frontend Service**

Update your frontend to call the new Node.js backend:

```typescript
// frontend/src/services/ApiService.ts
const API_BASE_URL = "http://localhost:5000/api";

export class ApiService {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Add JWT token if available
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  static async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  static async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Add PUT, DELETE methods as needed
}
```

### **Step 4.2: Create Authentication Service**

```typescript
// frontend/src/services/AuthService.ts
import { ApiService } from "./ApiService";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export class AuthService {
  static async login(
    credentials: LoginCredentials
  ): Promise<{ user: User; token: string }> {
    const response = await ApiService.post<{ user: User; token: string }>(
      "/auth/login",
      credentials
    );

    // Store token
    localStorage.setItem("auth_token", response.token);

    return response;
  }

  static async getCurrentUser(): Promise<User> {
    return ApiService.get<User>("/auth/me");
  }

  static logout(): void {
    localStorage.removeItem("auth_token");
  }

  static getToken(): string | null {
    return localStorage.getItem("auth_token");
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
```

### **Step 4.3: Update Your Components**

Replace Supabase calls with your new services:

```typescript
// Before (Supabase)
const { data, error } = await supabase.from("timesheets").select("*");

// After (Node.js API)
const timesheets = await ApiService.get<Timesheet[]>("/timesheets");
```

---

## 🧪 **Phase 5: Testing & Deployment**

### **Step 5.1: Create Basic Tests**

```typescript
// backend/__tests__/api.test.ts
import request from "supertest";
import app from "../src/index";

describe("API Health Check", () => {
  test("GET /api/test/health should return OK", async () => {
    const response = await request(app).get("/api/test/health").expect(200);

    expect(response.body.status).toBe("OK");
  });
});
```

### **Step 5.2: Run Tests**

```bash
# Install testing dependencies
npm install --save-dev jest @types/jest supertest @types/supertest

# Add test script to package.json
"test": "jest"

# Run tests
npm test
```

### **Step 5.3: Production Deployment**

```bash
# Build for production
npm run build

# Start production server
npm start

# Or use PM2 for production
npm install -g pm2
pm2 start dist/index.js --name "timesheet-api"
```

---

## 🎯 **Quick Start Commands**

Once everything is set up, your daily workflow:

```bash
# Terminal 1: Start MongoDB (if not running as service)
mongod

# Terminal 2: Start backend
cd backend
npm run dev

# Terminal 3: Start frontend
cd frontend
npm run dev

# Terminal 4: Monitor logs
cd backend/logs
tail -f combined.log
```

---

## 🚨 **Troubleshooting**

### **Common Issues & Solutions**

**1. MongoDB Connection Failed**

```bash
# Check if MongoDB is running
mongosh
# If fails, start MongoDB service
net start MongoDB  # Windows
sudo systemctl start mongod  # Linux
```

**2. Port Already in Use**

```bash
# Kill process on port 5000
npx kill-port 5000
```

**3. CORS Issues**

```typescript
// Add to backend/src/index.ts
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
```

**4. JWT Token Issues**

- Check if `JWT_ACCESS_SECRET` is set in `.env`
- Verify token format in localStorage
- Check token expiration

---

## 📚 **Learning Resources**

### **MongoDB**

- [MongoDB University](https://university.mongodb.com/) - Free courses
- [MongoDB Docs](https://docs.mongodb.com/)
- [Mongoose Docs](https://mongoosejs.com/docs/)

### **Node.js/Express**

- [Express.js Guide](https://expressjs.com/en/guide/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### **Authentication**

- [JWT.io](https://jwt.io/) - JWT debugger
- [Passport.js Docs](http://www.passportjs.org/docs/)

---

## 🎉 **Next Steps**

After completing this migration:

1. **Implement Timesheet API**: Use the existing models to create CRUD operations
2. **Add Authentication**: Implement login/logout functionality
3. **Create Role-based Access**: Use the existing role system
4. **Add Real-time Features**: Implement Socket.io for live updates
5. **Setup Monitoring**: Add logging and error tracking
6. **Deploy to Production**: Use services like Railway, Render, or AWS

**You're now ready to build a production-ready timesheet application! 🚀**
