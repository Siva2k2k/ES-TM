# Frontend Restructuring Plan - ES-TM Claude Timesheet Management System

## Executive Summary

This document outlines the comprehensive plan to restructure the frontend codebase from `d:\Web_dev\React\BOLT PHASE-2\ES-TM Claude\frontend` to achieve:

1. **Enhanced UI/UX** - Consistent, responsive, user-friendly interface
2. **SonarQube Compliance** - Cognitive complexity < 15
3. **Clean Architecture** - Following `frontendEnhanced` reference structure

---

## Current State Assessment

### Critical Issues Identified

| Category | Issue | Impact | Priority |
|----------|-------|--------|----------|
| **Cognitive Complexity** | EmployeeTimesheet.tsx (2,497 lines) | CC > 18 | CRITICAL |
| **Code Duplication** | 35% duplicate code in "Enhanced" variants | Maintenance burden | CRITICAL |
| **Debug Code** | 184 console.log statements | Performance, security | HIGH |
| **Component Size** | Average 625 lines (recommended: 300) | Maintainability | HIGH |
| **State Management** | 20+ useState hooks per component | Bug-prone | HIGH |
| **Form Handling** | Inline validation in 15+ files | Code duplication | MEDIUM |
| **Navigation** | Mixed horizontal/vertical patterns | UX inconsistency | MEDIUM |
| **Styling** | 322+ conditional className expressions | Code smell | MEDIUM |

### SonarQube Violations

- **S3776** - Cognitive Complexity: 15+ violations
- **S138** - Function too many lines: 12+ violations
- **S1488** - Too many state hooks: 8+ violations
- **S1192** - Duplicate string literals: 50+ violations
- **S2228** - Console logging: 184 violations
- **S1067** - Complex expressions: 322 violations

---

## Target Architecture (frontendEnhanced Reference)

### Technology Stack

**Core:**
- React 19.1.1
- TypeScript 5.8.3 (strict mode)
- Vite 7.1.2

**UI/Styling:**
- Radix UI (headless components)
- Tailwind CSS 3.4.17
- shadcn/ui pattern
- Lucide React icons

**Forms & Validation:**
- React Hook Form 7.62.0
- Zod 4.1.4
- @hookform/resolvers

**Routing:**
- React Router DOM 6.30.1

**State Management:**
- React Context API (minimal)
- React Query (recommended addition)

### Target Folder Structure

```
frontend/src/
├── assets/                    # Static assets, images
├── components/
│   ├── ui/                   # Primitive Radix UI wrappers
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── switch.tsx
│   │   ├── tabs.tsx
│   │   ├── toast.tsx
│   │   ├── tooltip.tsx
│   │   └── ToastProvider.tsx
│   ├── shared/               # Reusable business components
│   │   ├── StatusBadge.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── DataTable.tsx
│   │   ├── PageHeader.tsx
│   │   └── ConfirmDialog.tsx
│   ├── timesheet/            # Timesheet feature components
│   │   ├── TimesheetForm.tsx
│   │   ├── TimesheetCalendar.tsx
│   │   ├── TimesheetList.tsx
│   │   ├── TimesheetStatusView.tsx
│   │   └── index.ts
│   ├── projects/             # Project management components
│   │   ├── ProjectForm.tsx
│   │   ├── ProjectList.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── TaskManager.tsx
│   │   ├── MemberManagement.tsx
│   │   └── index.ts
│   ├── billing/              # Billing components
│   │   ├── BillingForm.tsx
│   │   ├── BillingList.tsx
│   │   ├── BillingSnapshot.tsx
│   │   └── index.ts
│   ├── reports/              # Reporting components
│   │   ├── ReportDashboard.tsx
│   │   ├── ReportBuilder.tsx
│   │   ├── ReportHistory.tsx
│   │   ├── LiveAnalytics.tsx
│   │   ├── CustomReportBuilder.tsx
│   │   └── index.ts
│   ├── users/                # User management components
│   │   ├── UserForm.tsx
│   │   ├── UserList.tsx
│   │   ├── UserProfile.tsx
│   │   ├── RoleSelector.tsx
│   │   └── index.ts
│   ├── clients/              # Client management components
│   │   ├── ClientForm.tsx
│   │   ├── ClientList.tsx
│   │   └── index.ts
│   ├── auth/                 # Authentication components
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── ForgotPassword.tsx
│   │   ├── ResetPassword.tsx
│   │   └── ProtectedRoute.tsx
│   └── audit/                # Audit logging components
│       ├── AuditLogTable.tsx
│       └── index.ts
├── hooks/                     # Custom React hooks
│   ├── useAuth.ts
│   ├── usePermissions.ts
│   ├── useForm.ts
│   ├── useTimesheet.ts
│   ├── useProjects.ts
│   ├── useBilling.ts
│   ├── useReports.ts
│   ├── useUsers.ts
│   ├── useClients.ts
│   ├── useModal.ts
│   ├── useMediaQuery.ts
│   └── index.ts
├── layouts/                   # Layout components
│   ├── AppLayout.tsx
│   ├── AuthLayout.tsx
│   ├── DashboardLayout.tsx
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   └── index.ts
├── pages/                     # Page components
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   ├── ResetPasswordPage.tsx
│   │   └── EmailVerificationPage.tsx
│   ├── dashboard/
│   │   ├── DashboardPage.tsx
│   │   ├── EmployeeDashboard.tsx
│   │   ├── LeadDashboard.tsx
│   │   ├── ManagerDashboard.tsx
│   │   ├── ManagementDashboard.tsx
│   │   └── AdminDashboard.tsx
│   ├── timesheets/
│   │   ├── TimesheetPage.tsx
│   │   └── TeamReviewPage.tsx
│   ├── projects/
│   │   └── ProjectManagementPage.tsx
│   ├── billing/
│   │   └── BillingManagementPage.tsx
│   ├── reports/
│   │   └── ReportsPage.tsx
│   ├── users/
│   │   └── UserManagementPage.tsx
│   ├── clients/
│   │   └── ClientManagementPage.tsx
│   ├── audit/
│   │   └── AuditLogsPage.tsx
│   ├── profile/
│   │   └── ProfilePage.tsx
│   ├── settings/
│   │   └── SystemSettingsPage.tsx
│   ├── UnauthorizedPage.tsx
│   └── NotFoundPage.tsx
├── services/                  # API service layer
│   ├── api.ts                # Base axios configuration
│   ├── auth.service.ts
│   ├── timesheet.service.ts
│   ├── project.service.ts
│   ├── billing.service.ts
│   ├── report.service.ts
│   ├── user.service.ts
│   ├── client.service.ts
│   ├── audit.service.ts
│   └── index.ts
├── store/                     # State management
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   ├── ProjectContext.tsx
│   └── index.ts
├── types/                     # TypeScript type definitions
│   ├── auth.types.ts
│   ├── timesheet.types.ts
│   ├── project.types.ts
│   ├── billing.types.ts
│   ├── report.types.ts
│   ├── user.types.ts
│   ├── client.types.ts
│   ├── audit.types.ts
│   └── index.ts
├── utils/                     # Utility functions
│   ├── validation.ts         # Centralized validation
│   ├── formatting.ts         # Date, currency formatting
│   ├── statusUtils.ts        # Status badge helpers
│   ├── permissions.ts        # Permission checking
│   ├── constants.ts          # App constants
│   ├── cn.ts                 # className utility (clsx + twMerge)
│   └── index.ts
├── App.tsx                    # Main application component
├── main.tsx                   # Application entry point
├── index.css                  # Global styles + Tailwind
└── vite-env.d.ts             # Vite type definitions
```

---

## Implementation Plan

### Phase 1: Foundation Setup (Week 1)

#### 1.1 Project Configuration ✅

**Tasks:**
- [ ] Upgrade dependencies to match frontendEnhanced
  - React 18.3 → 19.1
  - Vite 5.4 → 7.1
  - TypeScript 5.5 → 5.8
- [ ] Install new dependencies
  - Radix UI components (@radix-ui/*)
  - React Hook Form + Zod
  - class-variance-authority, clsx, tailwind-merge
- [ ] Update tailwind.config.js with shadcn/ui theme
- [ ] Update tsconfig.json to strict mode
- [ ] Configure path aliases in vite.config.ts

**Deliverables:**
- Updated package.json
- Configured tailwind.config.js
- Updated TypeScript configuration

**Estimated Time:** 1 day

---

#### 1.2 Base UI Component Library

**Tasks:**
- [ ] Create `components/ui/` directory
- [ ] Implement primitive components (15 components)
  - Button (primary, secondary, outline, ghost variants)
  - Input (text, email, password, number)
  - Label
  - Card (card, cardHeader, cardTitle, cardContent)
  - Dialog (dialog, dialogTrigger, dialogContent)
  - Select (select, selectTrigger, selectContent, selectItem)
  - Tabs (tabs, tabsList, tabsTrigger, tabsContent)
  - Switch
  - Tooltip
  - Toast + ToastProvider
  - Dropdown Menu
  - Form (formField, formItem, formLabel, formMessage)
- [ ] Create component documentation (Storybook optional)

**Complexity Reduction Strategy:**
- Each component < 100 lines
- Cognitive complexity < 5 per component
- Fully typed with TypeScript
- Accessible (ARIA attributes)

**Deliverables:**
- 15 UI components in `components/ui/`
- Consistent styling with Tailwind
- Type definitions

**Estimated Time:** 2 days

---

#### 1.3 Shared Components

**Tasks:**
- [ ] StatusBadge component (replace 8+ duplicates)
- [ ] LoadingSpinner component
- [ ] ErrorBoundary component
- [ ] ConfirmDialog component
- [ ] DataTable component (reusable table with sorting, filtering)
- [ ] PageHeader component

**Complexity Metrics:**
- Each component < 150 lines
- Cognitive complexity < 10
- Reusable across features

**Deliverables:**
- 6 shared components in `components/shared/`

**Estimated Time:** 2 days

---

#### 1.4 Utilities and Helpers

**Tasks:**
- [ ] Create `utils/validation.ts`
  - Email validation
  - Phone validation
  - Name validation
  - Date validation
  - Password strength validation
- [ ] Create `utils/formatting.ts`
  - formatDate (centralized date formatting)
  - formatCurrency
  - formatDuration
  - formatPercentage
- [ ] Create `utils/statusUtils.ts`
  - getStatusColor
  - getStatusIcon
  - getStatusLabel
- [ ] Create `utils/permissions.ts`
  - checkPermission
  - hasRole
  - canAccessResource
- [ ] Create `utils/cn.ts` (className helper)
- [ ] Create `utils/constants.ts`

**Complexity Reduction:**
- Remove 50+ duplicate string literals
- Centralize validation logic from 15+ files
- Reduce cognitive complexity by extracting helpers

**Deliverables:**
- 6 utility files in `utils/`
- Comprehensive type definitions

**Estimated Time:** 1 day

---

### Phase 2: Core Architecture Migration (Week 2)

#### 2.1 State Management Setup

**Tasks:**
- [ ] Migrate AuthContext to new structure
  - Add proper TypeScript types
  - Add useAuth hook
  - Add token refresh logic
- [ ] Create ThemeContext
  - Light/dark mode support
  - Persist theme preference
  - useTheme hook
- [ ] Refactor ProjectContext
  - Reduce complexity
  - Add proper error handling
  - Add useProjects hook

**Deliverables:**
- 3 context providers in `store/`
- Custom hooks for each context

**Estimated Time:** 1 day

---

#### 2.2 Layout Components

**Tasks:**
- [ ] Create AppLayout
  - Sidebar navigation
  - Header with user menu
  - Breadcrumbs
  - Main content area with <Outlet />
- [ ] Create AuthLayout
  - Centered card layout for login/register
  - Responsive design
- [ ] Create Sidebar component
  - Role-based navigation items
  - Collapsible sidebar
  - Active route highlighting
- [ ] Create Header component
  - User profile dropdown
  - Theme toggle
  - Notifications (future)

**Navigation Pattern:**
- Vertical sidebar (primary navigation)
- Horizontal tabs (secondary navigation within pages)
- Consistent across all pages

**Deliverables:**
- 4 layout components in `layouts/`
- Consistent navigation UX

**Estimated Time:** 2 days

---

#### 2.3 Routing Structure

**Tasks:**
- [ ] Update App.tsx with nested routes
- [ ] Create ProtectedRoute component
  - Authentication check
  - Role-based authorization
  - Redirect to login or unauthorized
- [ ] Define route structure
  - Public routes (/login, /register, etc.)
  - Protected routes (/)
  - Admin routes (/admin/*)
  - Role-specific routes

**Deliverables:**
- Updated App.tsx
- ProtectedRoute component
- Route configuration

**Estimated Time:** 1 day

---

#### 2.4 Service Layer Refactoring

**Tasks:**
- [ ] Create base API service (`services/api.ts`)
  - Axios instance configuration
  - Request/response interceptors
  - Token management
  - Error handling
- [ ] Refactor existing services
  - Consistent error handling
  - TypeScript return types
  - JSDoc documentation
- [ ] Create service index for exports

**Deliverables:**
- Base API configuration
- Refactored service files
- Consistent service pattern

**Estimated Time:** 1 day

---

### Phase 3: High-Complexity Component Refactoring (Week 3-4)

#### 3.1 Timesheet Components Refactoring

**Current:** EmployeeTimesheet.tsx (2,497 lines, CC > 18)

**Target Structure:**
```
components/timesheet/
├── TimesheetForm.tsx         (300 lines, CC < 10)
├── TimesheetCalendar.tsx     (250 lines, CC < 8)
├── TimesheetList.tsx         (200 lines, CC < 8)
├── TimesheetStatusView.tsx   (250 lines, CC < 10)
├── TimesheetEntry.tsx        (150 lines, CC < 5)
└── index.ts
```

**Tasks:**
- [ ] Extract form logic to `useTimesheetForm` hook
  - Form state management
  - Validation logic
  - Submit handling
- [ ] Extract validation to `useTimesheetValidation` hook
  - Zod schema definition
  - Custom validation rules
- [ ] Create TimesheetForm component
  - React Hook Form integration
  - Project/task selection
  - Date picker
  - Entry management
- [ ] Create TimesheetCalendar component
  - Calendar view
  - Day selection
  - Entry visualization
- [ ] Create TimesheetList component
  - Table view of timesheets
  - Sorting and filtering
  - Status badges
- [ ] Refactor TimesheetStatusView
  - Reduce complexity
  - Extract data transformations to hooks
- [ ] Create TimesheetPage
  - Compose all timesheet components
  - Handle view mode switching

**Complexity Reduction:**
- 20+ state hooks → useReducer or custom hooks
- Inline validation → Zod schemas
- Nested conditionals → Guard clauses + early returns
- Duplicate logic → Shared utilities

**Deliverables:**
- 6 components in `components/timesheet/`
- 3 custom hooks in `hooks/`
- `pages/timesheets/TimesheetPage.tsx`
- Cognitive complexity < 10 for all components

**Estimated Time:** 3 days

---

#### 3.2 Project Management Components Refactoring

**Current:** ProjectManagement.tsx (2,286 lines, CC > 15)

**Target Structure:**
```
components/projects/
├── ProjectForm.tsx           (250 lines, CC < 10)
├── ProjectList.tsx           (200 lines, CC < 8)
├── ProjectCard.tsx           (150 lines, CC < 5)
├── TaskManager.tsx           (300 lines, CC < 10)
├── MemberManagement.tsx      (250 lines, CC < 8)
└── index.ts
```

**Tasks:**
- [ ] Create `useProjects` hook
  - CRUD operations
  - State management
  - Error handling
- [ ] Create `useProjectForm` hook
  - Form state
  - Validation with Zod
- [ ] Create ProjectForm component
  - Create/edit project
  - Client selection
  - Date pickers
- [ ] Create ProjectList component
  - Project table
  - Search and filters
  - Sorting
- [ ] Create ProjectCard component
  - Project overview
  - Progress indicators
- [ ] Create TaskManager component
  - Task CRUD
  - Task assignment
- [ ] Consolidate ProjectMemberManagement
  - Merge with EnhancedProjectMemberManagement
  - Reduce duplication
- [ ] Create ProjectManagementPage
  - Compose all project components
  - Tab navigation

**Deliverables:**
- 6 components in `components/projects/`
- 2 custom hooks
- `pages/projects/ProjectManagementPage.tsx`
- Cognitive complexity < 10

**Estimated Time:** 3 days

---

#### 3.3 Team Review Component Refactoring

**Current:** TeamReview.tsx (1,298 lines, 60+ console.log)

**Target Structure:**
```
components/timesheets/
├── TeamReviewTable.tsx       (250 lines, CC < 10)
├── ApprovalActions.tsx       (150 lines, CC < 5)
└── TeamFilters.tsx           (150 lines, CC < 5)
```

**Tasks:**
- [ ] Remove all console.log statements (60+)
- [ ] Create `useTeamReview` hook
  - Fetch team timesheets
  - Approval/rejection logic
  - Filtering logic
- [ ] Create TeamReviewTable component
  - Display team timesheets
  - Approval actions
  - Status indicators
- [ ] Create ApprovalActions component
  - Approve/reject buttons
  - Bulk actions
  - Confirmation dialogs
- [ ] Create TeamFilters component
  - Date range filter
  - User filter
  - Status filter
- [ ] Create TeamReviewPage
  - Compose components
  - Handle approval workflow

**Deliverables:**
- 3 components
- 1 custom hook
- `pages/timesheets/TeamReviewPage.tsx`
- Zero console.log statements

**Estimated Time:** 2 days

---

#### 3.4 Billing Management Components

**Current:** BillingManagement.tsx + EnhancedBillingManagement.tsx (duplication)

**Target Structure:**
```
components/billing/
├── BillingForm.tsx           (250 lines, CC < 10)
├── BillingList.tsx           (200 lines, CC < 8)
├── BillingSnapshot.tsx       (150 lines, CC < 5)
└── index.ts
```

**Tasks:**
- [ ] Consolidate BillingManagement and EnhancedBillingManagement
  - Merge best features from both
  - Remove duplicates
- [ ] Create `useBilling` hook
  - CRUD operations
  - Snapshot generation
- [ ] Create BillingForm component
  - Create/edit billing records
  - Rate calculation
- [ ] Create BillingList component
  - Billing table
  - Filters
- [ ] Create BillingSnapshot component
  - Snapshot display
  - PDF export
- [ ] Create BillingManagementPage

**Deliverables:**
- 3 components in `components/billing/`
- 1 custom hook
- `pages/billing/BillingManagementPage.tsx`
- 35% less duplicate code

**Estimated Time:** 2 days

---

#### 3.5 Client Management Components

**Current:** ClientManagement.tsx (877 lines)

**Target Structure:**
```
components/clients/
├── ClientForm.tsx            (200 lines, CC < 8)
├── ClientList.tsx            (150 lines, CC < 5)
└── index.ts
```

**Tasks:**
- [ ] Extract duplicate validation logic
- [ ] Create `useClients` hook
  - CRUD operations
- [ ] Create `useClientForm` hook
  - Form state with React Hook Form
  - Zod validation schema
- [ ] Create ClientForm component
  - Create/edit clients
  - Email validation
- [ ] Create ClientList component
  - Client table
  - Search and filter
- [ ] Create ClientManagementPage

**Deliverables:**
- 2 components in `components/clients/`
- 2 custom hooks
- `pages/clients/ClientManagementPage.tsx`
- Centralized validation

**Estimated Time:** 1 day

---

#### 3.6 User Management Components

**Current:** UserManagement.tsx (833 lines)

**Target Structure:**
```
components/users/
├── UserForm.tsx              (250 lines, CC < 10)
├── UserList.tsx              (200 lines, CC < 8)
├── UserProfile.tsx           (150 lines, CC < 5)
├── RoleSelector.tsx          (100 lines, CC < 5)
└── index.ts
```

**Tasks:**
- [ ] Create `useUsers` hook
  - CRUD operations
  - Role management
- [ ] Create `useUserForm` hook
  - Form state
  - Validation
- [ ] Create UserForm component
  - Create/edit users
  - Role selection
  - Permission checkboxes
- [ ] Create UserList component
  - User table
  - Role filters
  - Approval actions
- [ ] Create UserProfile component
  - User details
  - Edit profile
- [ ] Create RoleSelector component
  - Reusable role dropdown
- [ ] Create UserManagementPage

**Deliverables:**
- 4 components in `components/users/`
- 2 custom hooks
- `pages/users/UserManagementPage.tsx`

**Estimated Time:** 2 days

---

#### 3.7 Reports Components Consolidation

**Current:** Reports.tsx, EnhancedReports.tsx, ReportDashboard.tsx, ReportBuilder.tsx, ReportHistory.tsx, CustomReportBuilder.tsx, LiveAnalyticsDashboard.tsx

**Target Structure:**
```
components/reports/
├── ReportDashboard.tsx       (250 lines, CC < 10)
├── ReportBuilder.tsx         (300 lines, CC < 10)
├── ReportHistory.tsx         (200 lines, CC < 8)
├── LiveAnalytics.tsx         (250 lines, CC < 10)
├── CustomReportBuilder.tsx   (300 lines, CC < 10)
└── index.ts
```

**Tasks:**
- [ ] Consolidate Reports.tsx and EnhancedReports.tsx
  - Remove duplication
- [ ] Create `useReports` hook
  - Fetch templates
  - Generate reports
  - Download handling
- [ ] Refactor ReportDashboard
  - Template grid
  - Category filters
- [ ] Refactor ReportBuilder
  - Form for report generation
  - Date range picker
  - Filter configuration
- [ ] Refactor ReportHistory
  - History table
  - Re-download action
- [ ] Refactor LiveAnalytics
  - Chart components
  - Real-time metrics
- [ ] Refactor CustomReportBuilder
  - Report template builder
  - Query builder
- [ ] Create ReportsPage
  - Tab navigation
  - Compose all report components

**Deliverables:**
- 5 components in `components/reports/`
- 1 custom hook
- `pages/reports/ReportsPage.tsx`
- No duplication

**Estimated Time:** 3 days

---

### Phase 4: Dashboard and Pages (Week 5)

#### 4.1 Role-Specific Dashboards

**Current:** RoleSpecificDashboard.tsx (987 lines)

**Target Structure:**
```
pages/dashboard/
├── DashboardPage.tsx         (100 lines, CC < 5) - Route dispatcher
├── EmployeeDashboard.tsx     (250 lines, CC < 10)
├── LeadDashboard.tsx         (250 lines, CC < 10)
├── ManagerDashboard.tsx      (250 lines, CC < 10)
├── ManagementDashboard.tsx   (250 lines, CC < 10)
└── AdminDashboard.tsx        (250 lines, CC < 10)
```

**Tasks:**
- [ ] Create DashboardPage dispatcher
  - Route to role-specific dashboard based on user role
- [ ] Create EmployeeDashboard
  - Personal metrics
  - Recent timesheets
  - Quick actions
- [ ] Create LeadDashboard
  - Team metrics
  - Pending approvals
  - Team timesheets
- [ ] Create ManagerDashboard
  - Project metrics
  - Resource allocation
  - Billing overview
- [ ] Create ManagementDashboard
  - Organizational metrics
  - Executive reports
  - Financial overview
- [ ] Create AdminDashboard
  - System metrics
  - User management
  - Audit logs

**Complexity Reduction:**
- Separate dashboards instead of conditional rendering
- Shared dashboard widgets as components
- Data fetching in custom hooks

**Deliverables:**
- 6 pages in `pages/dashboard/`
- Dashboard widget components
- Reduced complexity

**Estimated Time:** 3 days

---

#### 4.2 Authentication Pages

**Current:** LoginForm.tsx, ForgotPasswordModal.tsx, ResetPasswordPage.tsx

**Target Structure:**
```
pages/auth/
├── LoginPage.tsx             (200 lines, CC < 8)
├── RegisterPage.tsx          (200 lines, CC < 8)
├── ForgotPasswordPage.tsx    (150 lines, CC < 5)
├── ResetPasswordPage.tsx     (150 lines, CC < 5)
└── EmailVerificationPage.tsx (150 lines, CC < 5)
```

**Tasks:**
- [ ] Create LoginPage
  - Login form with React Hook Form + Zod
  - OAuth buttons (Google, GitHub)
  - Remember me checkbox
- [ ] Create RegisterPage
  - Registration form
  - Password strength indicator
- [ ] Create ForgotPasswordPage
  - Email input
  - Send reset link
- [ ] Refactor ResetPasswordPage
  - New password form
  - Password confirmation
- [ ] Create EmailVerificationPage
  - Verification status
  - Resend email button

**Deliverables:**
- 5 pages in `pages/auth/`
- Form validation with Zod
- Consistent styling

**Estimated Time:** 2 days

---

#### 4.3 Additional Pages

**Tasks:**
- [ ] Create ProfilePage
  - User profile display
  - Edit profile form
  - Change password
  - Avatar upload
- [ ] Create AuditLogsPage
  - Refactor from AuditLogs.tsx
  - Audit log table
  - Filters (user, action, date)
- [ ] Create SystemSettingsPage
  - System configuration
  - Feature toggles
- [ ] Create UnauthorizedPage
  - 401 error display
  - Back to dashboard link
- [ ] Create NotFoundPage
  - 404 error display
  - Back to home link

**Deliverables:**
- 5 additional pages
- Consistent page layout

**Estimated Time:** 2 days

---

### Phase 5: Forms and Validation (Week 6)

#### 5.1 React Hook Form Integration

**Tasks:**
- [ ] Create form components with React Hook Form
  - FormField wrapper component
  - FormItem component
  - FormLabel component
  - FormMessage component
- [ ] Integrate React Hook Form in all forms
  - Timesheet forms
  - Project forms
  - Billing forms
  - Client forms
  - User forms
- [ ] Remove manual form state management (20+ files)

**Complexity Reduction:**
- Remove 300+ lines of boilerplate form state
- Centralized validation
- Better error handling

**Deliverables:**
- Form components in `components/ui/`
- All forms using React Hook Form

**Estimated Time:** 3 days

---

#### 5.2 Zod Schema Validation

**Tasks:**
- [ ] Create Zod schemas in `types/` directory
  - timesheetSchema
  - projectSchema
  - billingSchema
  - clientSchema
  - userSchema
  - loginSchema
  - registerSchema
- [ ] Integrate schemas with React Hook Form
  - zodResolver in all forms
- [ ] Remove inline validation logic (15+ files)

**Complexity Reduction:**
- Single source of truth for validation
- Type safety from schemas
- Reduced duplicate validation code

**Deliverables:**
- Zod schemas in `types/`
- Form validation integrated

**Estimated Time:** 2 days

---

### Phase 6: UI/UX Enhancements (Week 7)

#### 6.1 Responsive Design

**Tasks:**
- [ ] Audit all components for mobile responsiveness
- [ ] Add responsive breakpoints
  - Mobile (< 640px)
  - Tablet (640px - 1024px)
  - Desktop (> 1024px)
- [ ] Implement mobile navigation
  - Hamburger menu
  - Drawer sidebar
- [ ] Test on multiple screen sizes
- [ ] Fix layout issues

**Deliverables:**
- Fully responsive UI
- Mobile-friendly navigation

**Estimated Time:** 2 days

---

#### 6.2 Accessibility Improvements

**Tasks:**
- [ ] Add ARIA labels to all interactive elements
- [ ] Ensure keyboard navigation works
- [ ] Add focus indicators
- [ ] Test with screen reader
- [ ] Add skip links
- [ ] Ensure color contrast meets WCAG AA

**Deliverables:**
- WCAG 2.1 AA compliant
- Keyboard navigation support

**Estimated Time:** 1 day

---

#### 6.3 Loading States and Error Handling

**Tasks:**
- [ ] Add loading spinners to all async operations
- [ ] Create skeleton loaders for data tables
- [ ] Implement error boundaries
- [ ] Standardize error messages
- [ ] Add retry logic for failed requests
- [ ] Add optimistic updates where appropriate

**Deliverables:**
- Consistent loading states
- Better error UX

**Estimated Time:** 2 days

---

#### 6.4 Toast Notifications

**Tasks:**
- [ ] Implement ToastProvider
- [ ] Replace all showError/showWarning with toast
- [ ] Add success notifications
- [ ] Add notification queue
- [ ] Add toast actions (undo, retry)

**Deliverables:**
- Consistent toast notifications
- Better user feedback

**Estimated Time:** 1 day

---

#### 6.5 Dark Mode Support

**Tasks:**
- [ ] Implement ThemeContext
- [ ] Add theme toggle in header
- [ ] Ensure all components support dark mode
- [ ] Persist theme preference in localStorage
- [ ] Test all pages in dark mode

**Deliverables:**
- Full dark mode support
- Theme persistence

**Estimated Time:** 1 day

---

### Phase 7: Code Quality and Cleanup (Week 8)

#### 7.1 Remove Debug Code

**Tasks:**
- [ ] Remove all 184 console.log statements
- [ ] Remove commented code
- [ ] Remove unused imports
- [ ] Remove unused variables
- [ ] Remove dead code

**Deliverables:**
- Clean codebase
- Zero console.log statements

**Estimated Time:** 1 day

---

#### 7.2 Remove Duplicate Code

**Tasks:**
- [ ] Consolidate "Enhanced" components
  - BillingManagement + EnhancedBillingManagement
  - Reports + EnhancedReports
  - ProjectMemberManagement + EnhancedProjectMemberManagement
- [ ] Extract duplicate validation logic
- [ ] Extract duplicate utility functions
- [ ] Remove duplicate string literals

**Deliverables:**
- 35% less code
- No "Enhanced" duplicates

**Estimated Time:** 2 days

---

#### 7.3 TypeScript Strict Mode

**Tasks:**
- [ ] Enable strict mode in tsconfig.json
- [ ] Fix all TypeScript errors
- [ ] Add proper type annotations
- [ ] Remove `any` types (use `unknown` instead)
- [ ] Add JSDoc comments to complex functions

**Deliverables:**
- Strict TypeScript compliance
- Better type safety

**Estimated Time:** 2 days

---

#### 7.4 ESLint and Prettier

**Tasks:**
- [ ] Configure ESLint rules
- [ ] Fix all ESLint warnings
- [ ] Configure Prettier
- [ ] Format all files with Prettier
- [ ] Add pre-commit hooks (husky + lint-staged)

**Deliverables:**
- Consistent code style
- Automated formatting

**Estimated Time:** 1 day

---

#### 7.5 SonarQube Compliance

**Tasks:**
- [ ] Run SonarQube analysis
- [ ] Fix all critical issues
- [ ] Fix all major issues
- [ ] Reduce cognitive complexity < 15 for all functions
- [ ] Achieve SonarQube quality gate pass

**Deliverables:**
- SonarQube quality gate passed
- Cognitive complexity < 15

**Estimated Time:** 2 days

---

### Phase 8: Testing and Documentation (Week 9)

#### 8.1 Unit Testing

**Tasks:**
- [ ] Write unit tests for utilities
  - validation.ts
  - formatting.ts
  - statusUtils.ts
  - permissions.ts
- [ ] Write tests for custom hooks
  - useAuth
  - usePermissions
  - useTimesheet
  - useProjects
- [ ] Write tests for services
  - auth.service.ts
  - timesheet.service.ts
  - project.service.ts
- [ ] Achieve 70%+ code coverage

**Deliverables:**
- 100+ unit tests
- 70%+ code coverage

**Estimated Time:** 3 days

---

#### 8.2 Integration Testing

**Tasks:**
- [ ] Write integration tests for critical flows
  - Login flow
  - Timesheet creation flow
  - Project creation flow
  - Report generation flow
- [ ] Test role-based access control
- [ ] Test error scenarios

**Deliverables:**
- 20+ integration tests
- Critical paths covered

**Estimated Time:** 2 days

---

#### 8.3 E2E Testing

**Tasks:**
- [ ] Set up Playwright (already in frontend package.json)
- [ ] Write E2E tests for user journeys
  - Employee timesheet submission
  - Lead approval workflow
  - Manager project creation
  - Admin user management
- [ ] Test on multiple browsers

**Deliverables:**
- 10+ E2E tests
- Cross-browser compatibility

**Estimated Time:** 2 days

---

#### 8.4 Documentation

**Tasks:**
- [ ] Create component documentation
  - Storybook (optional)
  - README for each feature
- [ ] Create developer guide
  - Setup instructions
  - Architecture overview
  - Coding standards
  - Git workflow
- [ ] Create user guide
  - Feature documentation
  - Screenshots
  - Video tutorials (optional)
- [ ] Update API documentation

**Deliverables:**
- Comprehensive documentation
- Developer onboarding guide

**Estimated Time:** 2 days

---

### Phase 9: Performance Optimization (Week 10)

#### 9.1 Code Splitting

**Tasks:**
- [ ] Implement lazy loading for pages
  - React.lazy() for all page components
  - Suspense with loading fallback
- [ ] Analyze bundle size
- [ ] Split large components
- [ ] Optimize imports

**Deliverables:**
- Smaller initial bundle
- Faster initial load

**Estimated Time:** 1 day

---

#### 9.2 Memoization

**Tasks:**
- [ ] Add useMemo to expensive computations (224+ array operations)
- [ ] Add useCallback to event handlers
- [ ] Add React.memo to pure components
- [ ] Measure performance improvements

**Deliverables:**
- Optimized re-renders
- Better performance

**Estimated Time:** 1 day

---

#### 9.3 React Query Integration (Optional)

**Tasks:**
- [ ] Install @tanstack/react-query
- [ ] Migrate data fetching to React Query
  - Timesheets
  - Projects
  - Users
  - Clients
- [ ] Implement caching strategy
- [ ] Add optimistic updates
- [ ] Add infinite scroll for large lists

**Deliverables:**
- Better data fetching
- Caching and invalidation
- Optimistic updates

**Estimated Time:** 3 days (optional)

---

### Phase 10: Final Review and Deployment (Week 11)

#### 10.1 Code Review

**Tasks:**
- [ ] Peer code review
- [ ] Address review comments
- [ ] Final cleanup

**Estimated Time:** 1 day

---

#### 10.2 QA Testing

**Tasks:**
- [ ] Manual testing of all features
- [ ] Test all user roles
- [ ] Test edge cases
- [ ] Test error scenarios
- [ ] Test on different browsers
- [ ] Test on different devices

**Estimated Time:** 2 days

---

#### 10.3 Performance Audit

**Tasks:**
- [ ] Run Lighthouse audit
- [ ] Optimize performance score
- [ ] Optimize accessibility score
- [ ] Optimize SEO score
- [ ] Optimize best practices score

**Deliverables:**
- Lighthouse score > 90 for all metrics

**Estimated Time:** 1 day

---

#### 10.4 Production Build

**Tasks:**
- [ ] Test production build locally
- [ ] Verify environment variables
- [ ] Verify API endpoints
- [ ] Test Docker build
- [ ] Deploy to staging environment
- [ ] Final testing on staging
- [ ] Deploy to production

**Deliverables:**
- Production-ready build
- Successful deployment

**Estimated Time:** 1 day

---

## Success Metrics

### Code Quality Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| **Cognitive Complexity** | > 18 | < 15 | SonarQube |
| **Average Component Size** | 625 lines | < 300 lines | LOC counter |
| **State Hooks per Component** | 11.2 avg | < 10 | Manual review |
| **Console Statements** | 184 | 0 | ESLint |
| **Code Duplication** | 35% | < 5% | SonarQube |
| **TypeScript Strict Mode** | No | Yes | tsconfig.json |
| **Test Coverage** | 0% | > 70% | Jest |

### Performance Metrics

| Metric | Target |
|--------|--------|
| **Lighthouse Performance** | > 90 |
| **Lighthouse Accessibility** | > 95 |
| **First Contentful Paint** | < 1.5s |
| **Time to Interactive** | < 3.0s |
| **Bundle Size** | < 500KB (gzip) |

### User Experience Metrics

| Metric | Target |
|--------|--------|
| **Mobile Responsive** | 100% |
| **WCAG 2.1 AA Compliance** | 100% |
| **Dark Mode Support** | Yes |
| **Form Validation** | Real-time |
| **Loading States** | All async operations |
| **Error Handling** | User-friendly messages |

---

## Risk Mitigation

### Risk 1: Breaking Changes

**Risk:** Refactoring may introduce bugs or break existing functionality

**Mitigation:**
- Incremental migration (one feature at a time)
- Comprehensive testing before merging
- Feature flags for new components
- Keep old components until new ones are tested

### Risk 2: Timeline Overrun

**Risk:** 11-week timeline may be optimistic

**Mitigation:**
- Prioritize critical components first
- Optional phases (React Query) can be deferred
- Parallel work on independent features
- Regular progress reviews

### Risk 3: Learning Curve

**Risk:** Team may need time to learn new libraries (Radix UI, React Hook Form, Zod)

**Mitigation:**
- Provide training sessions
- Create code examples and templates
- Pair programming for first few components
- Comprehensive documentation

### Risk 4: Regression

**Risk:** New code may not have feature parity with old code

**Mitigation:**
- Detailed feature checklist
- Side-by-side comparison testing
- User acceptance testing
- Beta testing with select users

---

## Dependencies and Prerequisites

### Required Tools

- Node.js 18+
- npm or yarn
- Git
- VS Code (recommended)
- SonarQube (for compliance check)

### Required Access

- GitHub repository access
- Backend API access
- Staging environment
- Production deployment access

### Team Requirements

- 2-3 frontend developers
- 1 UI/UX designer (for design system)
- 1 QA engineer
- 1 DevOps engineer (for deployment)

---

## Deliverables Checklist

### Phase 1-2 (Foundation)
- [ ] UI component library (15 components)
- [ ] Shared components (6 components)
- [ ] Utilities (6 files)
- [ ] State management (3 contexts)
- [ ] Layout components (4 components)
- [ ] Routing structure

### Phase 3-4 (Components & Pages)
- [ ] Timesheet components (6 components)
- [ ] Project components (6 components)
- [ ] Billing components (3 components)
- [ ] Client components (2 components)
- [ ] User components (4 components)
- [ ] Report components (5 components)
- [ ] Dashboard pages (6 pages)
- [ ] Auth pages (5 pages)
- [ ] Additional pages (5 pages)

### Phase 5-6 (Forms & UX)
- [ ] React Hook Form integration
- [ ] Zod schema validation
- [ ] Responsive design
- [ ] Accessibility improvements
- [ ] Loading states
- [ ] Toast notifications
- [ ] Dark mode

### Phase 7-8 (Quality & Testing)
- [ ] Debug code removed
- [ ] Duplicate code removed
- [ ] TypeScript strict mode
- [ ] ESLint/Prettier configured
- [ ] SonarQube compliance
- [ ] Unit tests (100+)
- [ ] Integration tests (20+)
- [ ] E2E tests (10+)
- [ ] Documentation

### Phase 9-10 (Optimization & Deployment)
- [ ] Code splitting
- [ ] Memoization
- [ ] Performance optimization
- [ ] Production build
- [ ] Deployment

---

## Conclusion

This restructuring plan will transform the current frontend codebase from a monolithic, high-complexity structure to a modern, maintainable, and user-friendly application. By following the phased approach, we can ensure:

1. **Code Quality:** Cognitive complexity < 15, SonarQube compliance
2. **User Experience:** Responsive, accessible, consistent UI
3. **Developer Experience:** Clean architecture, reusable components, comprehensive testing
4. **Performance:** Optimized bundle size, lazy loading, efficient re-renders
5. **Maintainability:** Separation of concerns, centralized logic, comprehensive documentation

**Total Estimated Timeline:** 11 weeks (with 2-3 developers)

**Next Steps:**
1. Review and approve this plan
2. Set up project tracking (Jira, GitHub Projects)
3. Assign team members to phases
4. Begin Phase 1: Foundation Setup

---

**Document Version:** 1.0
**Last Updated:** 2025-10-03
**Author:** Frontend Architecture Team
