# Manual Testing Checklist for Enhanced Features

## Prerequisites
- [ ] Backend server running on http://localhost:3001
- [ ] Frontend server running on http://localhost:3000
- [ ] Database populated with sample data
- [ ] Test users available with correct roles

## 🔐 Authentication Testing

### Test Users
- [ ] `admin@company.com` (Super Admin) - password: `admin123`
- [ ] `management@company.com` (Management) - password: `admin123`
- [ ] `manager@company.com` (Manager) - password: `admin123`
- [ ] `lead@company.com` (Lead) - password: `admin123`
- [ ] `employee1@company.com` (Employee) - password: `admin123`

### Login Tests
- [ ] All users can login successfully
- [ ] Correct redirect to dashboard after login
- [ ] Role information displays correctly in UI
- [ ] JWT tokens are properly stored and used

## 👑 Super Admin Testing (`admin@company.com`)

### Navigation & Access
- [ ] Can access Dashboard
- [ ] Can access Billing Management
- [ ] Can access Client Management
- [ ] Can access Reports & Analytics
- [ ] No forbidden sections

### Dashboard Features
- [ ] System Overview metrics display
  - [ ] Total users count
  - [ ] Active users count
  - [ ] Pending approvals count
  - [ ] Total/active projects count
- [ ] Timesheet Metrics section
  - [ ] Total timesheets
  - [ ] Pending approval count
  - [ ] Frozen timesheets
  - [ ] Average hours per week
- [ ] Financial Overview
  - [ ] Total revenue
  - [ ] Monthly revenue
  - [ ] Billable hours
  - [ ] Average hourly rate
- [ ] User Activity table
  - [ ] Shows recent user activity
  - [ ] Displays user roles and status

### Billing Management
#### Dashboard Tab
- [ ] Revenue metrics cards display
- [ ] Revenue by project breakdown shows
- [ ] Generate snapshot button works
- [ ] All financial data is accurate

#### Summaries Tab
- [ ] Period filter (weekly/monthly) works
- [ ] Filter type (project/employee) works
- [ ] Date range picker functions
- [ ] All projects appear in project dropdown
- [ ] All employees appear in employee dropdown
- [ ] Summary calculations are correct
- [ ] Can edit billable hours (edit buttons visible)
- [ ] Edit modal opens with correct values
- [ ] Hour changes save successfully
- [ ] Changes reflect immediately in UI

#### Reports Tab
- [ ] CSV export button works
- [ ] PDF export button works
- [ ] Excel export button works
- [ ] Export generates correctly formatted files

### Client Management
- [ ] Can view all clients in system
- [ ] "Add Client" button is visible
- [ ] Can create new client
  - [ ] Form validation works
  - [ ] Required fields enforced
  - [ ] Email validation works
  - [ ] Success message appears
  - [ ] New client appears in list
- [ ] Can edit existing clients
  - [ ] Pre-populated form data
  - [ ] Changes save successfully
  - [ ] Updated data reflects in list
- [ ] Can activate/deactivate clients
  - [ ] Status changes reflect immediately
  - [ ] Proper validation for deactivation
- [ ] Can delete clients (with validation)
  - [ ] Cannot delete clients with active projects
  - [ ] Confirmation dialog appears
  - [ ] Soft delete works properly
- [ ] Search functionality works
- [ ] Filter by status works
- [ ] Client details modal shows complete information

### Reports & Analytics
- [ ] Report Templates tab shows all templates
- [ ] Report History tab shows generated reports
- [ ] Analytics tab shows live metrics
- [ ] Can generate reports from templates
- [ ] Report generation modal works
- [ ] Different format options available
- [ ] Date range selection works

## 🏢 Management Testing (`management@company.com`)

### Expected Access (Same as Super Admin)
- [ ] Full access to Billing Management
- [ ] Full access to Client Management
- [ ] Management-focused Dashboard
- [ ] Full Reports access

### Dashboard Differences
- [ ] Organization Overview (not system-wide)
- [ ] Project Health metrics
- [ ] Billing metrics
- [ ] Team Performance data

### Billing Management
- [ ] Same functionality as Super Admin
- [ ] Can edit billable hours
- [ ] Can generate all reports

### Client Management
- [ ] Same functionality as Super Admin
- [ ] Full CRUD operations

## 👨‍💼 Manager Testing (`manager@company.com`)

### Navigation & Access
- [ ] Can access Dashboard ✅
- [ ] CANNOT access Billing Management ❌
- [ ] Can access Client Management (limited) ✅
- [ ] Can access Reports (limited) ✅

### Dashboard Features
- [ ] Team Overview section
  - [ ] Team size count
  - [ ] Active projects (managed only)
  - [ ] Pending timesheets count
  - [ ] Team utilization percentage
- [ ] Project Status
  - [ ] Only managed projects appear
  - [ ] Project completion percentages
  - [ ] Budget status indicators
  - [ ] Team size for each project
- [ ] Team Members section
  - [ ] Direct reports only
  - [ ] Current projects count
  - [ ] Pending timesheets
  - [ ] Weekly hours
  - [ ] Status indicators
- [ ] Timesheet Approvals
  - [ ] Only team member timesheets
  - [ ] Approval queue functionality
  - [ ] Priority indicators

### Client Management (Limited)
- [ ] Can view clients from managed projects only
- [ ] CANNOT create new clients ❌
- [ ] CANNOT edit clients ❌
- [ ] CANNOT delete clients ❌
- [ ] No "Add Client" button visible
- [ ] Search and filter work on allowed clients

### Reports (Limited)
- [ ] Team-focused report templates only
- [ ] Can generate reports for managed team/projects
- [ ] Cannot access organization-wide reports

### Billing Management (Forbidden)
- [ ] No "Billing Management" in navigation
- [ ] Direct URL access shows "Access Denied"
- [ ] 403 error for billing API calls

## 👨‍💻 Lead Testing (`lead@company.com`)

### Navigation & Access
- [ ] Can access Dashboard ✅
- [ ] CANNOT access Billing Management ❌
- [ ] Can access Client Management (view-only) ✅
- [ ] Limited or NO access to Reports ❌

### Dashboard Features
- [ ] Task Overview section
  - [ ] Assigned tasks count
  - [ ] Completed tasks count
  - [ ] Overdue tasks count
  - [ ] Team tasks count
- [ ] Project Coordination
  - [ ] Projects where assigned as lead
  - [ ] Team size information
  - [ ] Active tasks count
  - [ ] Completion percentages
- [ ] Team Collaboration
  - [ ] Shared project team members
  - [ ] Collaboration metrics
  - [ ] Pending tasks for team members

### Client Management (View-Only)
- [ ] Can view clients from assigned projects
- [ ] CANNOT create/edit/delete clients ❌
- [ ] No management buttons visible
- [ ] Search functionality available

### Forbidden Access
- [ ] No "Billing Management" in navigation
- [ ] No or limited "Reports" access
- [ ] Direct access shows appropriate denials

## 👨‍🔧 Employee Testing (`employee1@company.com`)

### Navigation & Access
- [ ] Can access Dashboard ✅
- [ ] CANNOT access Billing Management ❌
- [ ] Can access Client Management (view-only) ✅
- [ ] CANNOT access Reports ❌

### Dashboard Features
- [ ] Personal Overview
  - [ ] Current projects count
  - [ ] Assigned tasks count
  - [ ] Completed tasks count
  - [ ] Weekly hours total
- [ ] Timesheet Status
  - [ ] Current week information
  - [ ] Timesheet status
  - [ ] Total hours logged
  - [ ] Billable hours count
  - [ ] Submission capabilities
- [ ] Project Assignments
  - [ ] Assigned projects only
  - [ ] Role in each project
  - [ ] Active tasks count
  - [ ] Hours logged per project
  - [ ] Billable status indicators
- [ ] Recent Activity
  - [ ] Personal activity feed
  - [ ] Recent actions and updates

### Client Management (View-Only)
- [ ] Can view clients from assigned projects only
- [ ] CANNOT create/edit/delete clients ❌
- [ ] No management capabilities
- [ ] Limited search results

### Forbidden Access
- [ ] No "Billing Management" in navigation
- [ ] No "Reports" in navigation
- [ ] Direct access shows "Access Denied"
- [ ] API calls return 403 errors

## 🔒 Security Testing

### Role-Based Access Control
- [ ] Users cannot access features above their permission level
- [ ] API endpoints respect role permissions
- [ ] Direct URL access is properly protected
- [ ] JWT tokens contain correct role information

### Data Filtering
- [ ] Managers only see their managed projects/employees
- [ ] Leads only see their assigned projects
- [ ] Employees only see their personal data
- [ ] Client lists are filtered appropriately

### Error Handling
- [ ] 403 errors for unauthorized access
- [ ] Proper error messages in UI
- [ ] No sensitive data in error responses
- [ ] Graceful handling of network errors

## 📊 Data Validation Testing

### Billing Management
- [ ] Revenue calculations are accurate
- [ ] Hour editing updates totals correctly
- [ ] Date range filtering works properly
- [ ] Export files contain correct data

### Client Management
- [ ] Form validation prevents invalid data
- [ ] Email format validation works
- [ ] Required field validation enforced
- [ ] Duplicate client names prevented

### Dashboard Metrics
- [ ] Counts and calculations are accurate
- [ ] Real-time updates work properly
- [ ] Role-specific data filtering is correct

## 🎨 UI/UX Testing

### Responsive Design
- [ ] Works on desktop (1920x1080)
- [ ] Works on tablet (768x1024)
- [ ] Works on mobile (375x667)
- [ ] Navigation adapts to screen size

### User Experience
- [ ] Loading states display properly
- [ ] Error messages are user-friendly
- [ ] Success confirmations appear
- [ ] Forms are intuitive and well-labeled
- [ ] Tables are sortable and filterable

### Performance
- [ ] Pages load within acceptable time
- [ ] Large data sets render efficiently
- [ ] No memory leaks in long sessions
- [ ] API responses are reasonable

## ⚠️ Edge Case Testing

### Data Edge Cases
- [ ] Empty states display properly
- [ ] Handle missing or null data
- [ ] Large numbers format correctly
- [ ] Date edge cases (leap years, timezones)

### User Edge Cases
- [ ] User with no projects assigned
- [ ] Manager with no team members
- [ ] Client with no associated projects
- [ ] New user with minimal permissions

### System Edge Cases
- [ ] Network connectivity issues
- [ ] Session timeout handling
- [ ] Concurrent user actions
- [ ] Database connection issues

## 📝 Bug Tracking

| Issue | Severity | Role | Component | Status |
|-------|----------|------|-----------|--------|
| Example: Edit button not showing | High | Manager | Billing | Open |

### Severity Levels
- **Critical**: Breaks core functionality
- **High**: Major feature doesn't work
- **Medium**: Minor feature issue
- **Low**: UI/UX improvement needed

## ✅ Test Completion Checklist

- [ ] All authentication tests passed
- [ ] All role-specific tests completed
- [ ] Security tests validated
- [ ] Data validation confirmed
- [ ] UI/UX tests completed
- [ ] Edge cases tested
- [ ] Performance acceptable
- [ ] Bug list compiled
- [ ] Test results documented

## 📋 Final Sign-Off

**Tested By**: _________________
**Date**: _________________
**Overall Status**: ⬜ PASS / ⬜ FAIL / ⬜ NEEDS WORK

**Notes**:
_________________________________________________
_________________________________________________
_________________________________________________