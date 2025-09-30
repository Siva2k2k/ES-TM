# Testing Execution Guide

## 🚀 How to Run the Tests

### Prerequisites

1. **Ensure your servers are running:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start
   # Should be running on http://localhost:3001

   # Terminal 2 - Frontend
   cd frontend
   npm start
   # Should be running on http://localhost:3000
   ```

2. **Verify test users exist in your database:**
   - `admin@company.com` (Super Admin)
   - `management@company.com` (Management)
   - `manager@company.com` (Manager)
   - `lead@company.com` (Lead)
   - `employee1@company.com` (Employee)

   All with password: `admin123`

### Option 1: Automated API Testing

```bash
# Navigate to testing directory
cd testing

# Install dependencies
npm install

# Run API tests
npm run test:api
```

This will:
- ✅ Test authentication for all roles
- ✅ Test billing endpoints with role permissions
- ✅ Test client management APIs
- ✅ Test dashboard endpoints
- ✅ Generate detailed JSON report

### Option 2: Automated Frontend Testing

```bash
# Navigate to testing directory
cd testing

# Install Playwright if not installed
npm install playwright
npx playwright install

# Run frontend tests
npm run test:frontend
```

This will:
- ✅ Test login for all roles
- ✅ Test navigation accessibility
- ✅ Test role-specific dashboard content
- ✅ Test feature access permissions
- ✅ Generate visual test report

### Option 3: Run Both Test Suites

```bash
cd testing
npm run test:all
```

### Option 4: Manual Testing

Use the comprehensive manual testing checklist:
```bash
# Open the checklist
open MANUAL_TESTING_CHECKLIST.md
```

Follow each section systematically for thorough testing.

## 📊 Understanding Test Results

### API Test Results

The API tests will show results like:
```
[SUCCESS] LOGIN - super_admin: Token obtained for Super Admin
[SUCCESS] BILLING_DASHBOARD - super_admin: Status: 200
[SUCCESS] BILLING_DASHBOARD - manager: Status: 403 (Expected: 403)
[FAILED] CLIENT_CREATION - employee: Status: 403 (Expected: 403)
```

**Status Meanings:**
- **SUCCESS**: Test passed as expected
- **FAILED**: Test failed unexpectedly
- **NEEDS_REAL_DATA**: Test needs actual database entries

### Frontend Test Results

Frontend tests will show:
```
[SUCCESS] LOGIN - management: Logged in as Management
[SUCCESS] NAVIGATION - management: Billing Management found in navigation
[SUCCESS] BILLING_ACCESS - employee: Access correctly denied
[FAILED] DASHBOARD_CONTENT - manager: "Team Overview" missing in dashboard
```

## 🔍 Troubleshooting Common Issues

### Backend Issues

**"Connection refused" errors:**
- Ensure backend is running on port 3001
- Check database connection
- Verify environment variables

**"Authentication failed" errors:**
- Verify test users exist in database
- Check password hashing matches
- Ensure JWT secret is correct

**"Permission denied" errors (unexpected):**
- Check user roles in database
- Verify middleware is properly implemented
- Check route authentication

### Frontend Issues

**"Login failed" errors:**
- Ensure frontend can reach backend API
- Check CORS configuration
- Verify login endpoint is working

**"Access denied" (unexpected):**
- Check role-based routing
- Verify user context is properly set
- Check authentication token storage

**"Navigation missing" errors:**
- Ensure new components are properly imported
- Check routing configuration
- Verify navigation component updates

### Database Issues

**Missing test data:**
```sql
-- Create test users if missing
INSERT INTO users (email, password, role, full_name) VALUES
('admin@company.com', '$hashed_password', 'super_admin', 'System Admin'),
('management@company.com', '$hashed_password', 'management', 'Management User'),
('manager@company.com', '$hashed_password', 'manager', 'Manager User'),
('lead@company.com', '$hashed_password', 'lead', 'Lead User'),
('employee1@company.com', '$hashed_password', 'employee', 'Employee User');
```

## 📋 Test Coverage Analysis

### Backend Coverage
- ✅ Authentication endpoints
- ✅ Billing management APIs
- ✅ Client management APIs
- ✅ Dashboard data APIs
- ✅ Role-based permissions
- ✅ Error handling

### Frontend Coverage
- ✅ Login functionality
- ✅ Navigation access control
- ✅ Role-specific dashboards
- ✅ Feature accessibility
- ✅ Form submissions
- ✅ Error states

### Missing Coverage (Manual Testing Required)
- ⚠️ Complex user workflows
- ⚠️ Edge case scenarios
- ⚠️ Performance under load
- ⚠️ Cross-browser compatibility
- ⚠️ Mobile responsiveness

## 🎯 Success Criteria

### API Tests Success Criteria
- [ ] All authentication tests pass
- [ ] Role permissions correctly enforced
- [ ] Data filtering works properly
- [ ] Error handling is appropriate
- [ ] 90%+ test pass rate

### Frontend Tests Success Criteria
- [ ] All users can login
- [ ] Navigation reflects role permissions
- [ ] Dashboard content is role-specific
- [ ] Access control works properly
- [ ] UI elements render correctly
- [ ] 95%+ test pass rate

### Overall Success Criteria
- [ ] No critical security vulnerabilities
- [ ] All role-based features work correctly
- [ ] Performance is acceptable
- [ ] User experience is intuitive
- [ ] Data integrity is maintained

## 🔄 Continuous Testing

### Daily Testing
```bash
# Quick API health check
curl http://localhost:3001/api/health

# Quick login test
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"admin123"}'
```

### Pre-Deployment Testing
```bash
# Run full test suite
cd testing
npm run test:all

# Check test coverage
npm run coverage

# Performance testing
npm run test:performance
```

### Post-Deployment Testing
- [ ] Smoke tests in production environment
- [ ] User acceptance testing
- [ ] Monitor error rates
- [ ] Performance monitoring

## 📞 Support

If you encounter issues:

1. **Check the logs:**
   - Backend: Check server console
   - Frontend: Check browser console
   - Database: Check database logs

2. **Review the implementation:**
   - Compare with IMPLEMENTATION_SUMMARY.md
   - Check API endpoints are correctly implemented
   - Verify component imports and routing

3. **Common fixes:**
   - Restart servers
   - Clear browser cache
   - Check environment variables
   - Verify database connectivity

4. **Get help:**
   - Review error messages carefully
   - Check the detailed test output
   - Compare expected vs actual behavior
   - Use browser developer tools

---

**Remember**: These tests validate that the enhanced features work correctly with proper role-based access control. The goal is to ensure security, functionality, and user experience across all user roles.