# Timesheet Management System

A production-ready full-stack timesheet management application built with React, TypeScript, Node.js, and Supabase.

> **🎯 Complete Setup Guide**: This README contains everything you need to run the application - setup instructions, commands, environment configuration, and project structure all in one place.

## 🚀 **Quick Start**

### **Get Started in 3 Steps**

```bash
# 1. Install dependencies
npm run install-deps

# 2. Start development server
npm run dev

# 3. Open your browser
# Visit: http://localhost:5173
```

### **Prerequisites**

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher

## 📋 **Development Commands**

### **Daily Development**

```bash
# Start development server (frontend only)
npm run dev

# Install all project dependencies
npm run install-deps
```

### **Build & Test**

```bash
# Build for production
npm run build

# Run tests
npm run test

# Lint code
npm run lint

# Preview production build
npm run preview
```

### **Full Command Reference**

| Command                | Description              |
| ---------------------- | ------------------------ |
| `npm run dev`          | Start development server |
| `npm run build`        | Build for production     |
| `npm run test`         | Run all tests            |
| `npm run lint`         | Check code quality       |
| `npm run install-deps` | Install all dependencies |
| `npm run preview`      | Preview production build |
| `npm run clean`        | Clean build files        |

## 🔧 **Environment Setup**

### **Supabase Configuration (Optional for Development)**

For full functionality, configure Supabase:

1. **Create a Supabase project** at [https://app.supabase.com/](https://app.supabase.com/)

2. **Get your credentials**:

   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy the Project URL and anon/public key

3. **Configure environment variables**:

   ```bash
   # Copy the example file
   cp frontend/.env.example frontend/.env

   # Update with your Supabase credentials
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key
   ```

**Note**: The application works in development mode without Supabase configuration, but authentication and data persistence will show warnings.

## 🏗️ **Project Structure**

```
timesheet-management-system/
├── frontend/                 # React TypeScript application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── forms/       # Form components
│   │   │   └── ui/          # Basic UI components
│   │   ├── pages/           # Page components (route components)
│   │   ├── layouts/         # Layout components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API service layer
│   │   ├── store/           # State management (Context providers)
│   │   │   └── contexts/    # React Context providers
│   │   ├── utils/           # Utility functions
│   │   ├── types/           # TypeScript type definitions
│   │   ├── lib/             # External library configurations
│   │   └── tests/           # Test utilities
│   ├── public/              # Static assets
│   ├── __tests__/           # Test files
│   │   ├── component/       # Component tests
│   │   ├── e2e/            # End-to-end tests
│   │   ├── integration/     # Integration tests
│   │   └── unit/           # Unit tests
│   ├── package.json
│   ├── vite.config.ts       # Vite configuration
│   ├── tsconfig.json        # TypeScript configuration
│   └── tailwind.config.js   # Tailwind CSS configuration
├── backend/                  # Node.js TypeScript API
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Route handlers
│   │   ├── dbrepo/          # Database operations
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/          # Database schemas
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic layer
│   │   ├── types/           # TypeScript definitions
│   │   ├── utils/           # Helper functions
│   │   └── validators/      # Input validation schemas
│   ├── package.json
│   └── tsconfig.json
├── docs/                     # Project documentation
├── package.json              # Root workspace configuration
├── docker-compose.yml        # Multi-service orchestration
└── README.md                 # This file
```

## 📁 **Detailed Structure**

### **Frontend Structure**

- **`components/`** - Reusable UI components
  - `forms/` - Form-specific components (LoginForm, etc.)
  - `ui/` - Basic UI components (buttons, inputs, etc.)
- **`pages/`** - Route-level components
  - Dashboard components, main app pages
- **`layouts/`** - Application layout components
  - `MainLayout.tsx` - Main app layout with sidebar/header
  - `AuthLayout.tsx` - Authentication pages layout
- **`hooks/`** - Custom React hooks
  - `useRoleManager.ts` - Role management hook
- **`services/`** - API communication layer
  - Service classes for different domains
- **`store/`** - State management
  - `contexts/` - React Context providers
- **`utils/`** - Utility functions and helpers
  - `timesheetValidation.ts` - Business logic utilities
- **`types/`** - TypeScript type definitions
  - Centralized type definitions

### **Backend Structure**

- **`controllers/`** - HTTP request handlers
- **`services/`** - Business logic layer
- **`dbrepo/`** - Database access layer
- **`models/`** - Database schemas
- **`routes/`** - API route definitions
- **`middleware/`** - Custom middleware functions
- **`validators/`** - Input validation schemas
- **`utils/`** - Helper functions
- **`types/`** - TypeScript type definitions

## 🛠️ **Development**

### **Path Aliases**

The project uses TypeScript path aliases for cleaner imports:

```typescript
// Frontend aliases
import Component from "@components/Component";
import { useHook } from "@hooks/useHook";
import { ApiService } from "@services/ApiService";
import type { User } from "@types/index";

// Backend aliases
import { Controller } from "@controllers/Controller";
import { Service } from "@services/Service";
import { Model } from "@models/Model";
```

### **Advanced Development**

#### **Frontend Commands (in frontend/ folder)**

```bash
cd frontend

# Development
npm run dev              # Vite dev server (http://localhost:5173)
npm run build           # Production build
npm run preview         # Preview production build

# Testing
npm run test            # Run tests
npm run test:watch      # Watch mode tests
npm run test:ui         # Test with UI
npm run test:e2e        # End-to-end tests
npm run test:e2e:ui     # E2E tests with UI

# Code Quality
npm run lint            # Check code style
npm run lint:fix        # Auto-fix lint issues
```

#### **Backend Commands (in backend/ folder)**

```bash
cd backend

npm run dev             # Start development server
npm run build           # Build TypeScript
npm run start           # Start production server
npm run seed            # Seed database
npm run clean           # Clean build files
```

## 🎯 **Common Workflows**

### **First Time Setup**

```bash
# 1. Clone and navigate to project
git clone <repository-url>
cd timesheet-management-system

# 2. Install all dependencies
npm run install-deps

# 3. Set up environment (optional)
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your Supabase credentials

# 4. Start development
npm run dev
```

### **Daily Development**

```bash
# Just run this from root
npm run dev
```

### **Before Committing**

```bash
# Check everything is working
npm run lint
npm run test
npm run build
```

### **Production Deployment**

```bash
# Build for production
npm run build

# Built files will be in frontend/dist/
```

## 🔧 **Configuration**

### **TypeScript Configuration**

- **Frontend**: Uses Vite with path mapping for clean imports
- **Backend**: Uses ts-node with module aliases

### **Build Tools**

- **Frontend**: Vite for fast builds and HMR
- **Backend**: TypeScript compiler with nodemon for development

### **Styling**

- **Tailwind CSS** for utility-first styling
- **PostCSS** for CSS processing

## 🐳 **Docker Deployment**

```bash
# Build and start with Docker Compose
docker-compose up --build

# Production deployment
docker-compose -f docker-compose.prod.yml up --build
```

## 📚 **Key Features**

- ✅ **Full-stack TypeScript** - End-to-end type safety
- ✅ **Monorepo structure** - Organized workspace with proper separation
- ✅ **Path aliases** - Clean import statements
- ✅ **Hot reloading** - Fast development experience
- ✅ **Comprehensive testing** - Unit, integration, and E2E tests
- ✅ **Production ready** - Docker containerization
- ✅ **Modern tooling** - Vite, ESLint, Prettier, Playwright

## 🤝 **Contributing**

1. Follow the established folder structure
2. Use TypeScript path aliases for imports
3. Write tests for new features
4. Follow the existing code style
5. Update documentation as needed

## � **Technical Notes**

- **Primary Focus**: React frontend application with TypeScript
- **Simple Commands**: Streamlined scripts for easy development
- **Environment**: Works without Supabase but shows warnings
- **Development**: Uses Vite for fast development and building
- **Testing**: Vitest for unit tests, Playwright for E2E tests
- **Styling**: Tailwind CSS for utility-first styling

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Missing dependencies**: Run `npm run install-deps`
2. **Supabase warnings**: Update `.env` file or ignore for development
3. **Port conflicts**: Vite runs on http://localhost:5173 by default
4. **TypeScript errors**: Ensure all dependencies are installed

### **Development Server Not Starting?**

```bash
# Clean and reinstall
npm run clean
npm run install-deps
npm run dev
```

## 🤝 **Contributing**

1. Follow the established folder structure
2. Use TypeScript path aliases for imports
3. Write tests for new features
4. Run `npm run lint` before committing
5. Update documentation as needed

## �📄 **License**

[Add your license information here]

---

**🎉 Ready to go? Just run `npm run dev` to get started!**
