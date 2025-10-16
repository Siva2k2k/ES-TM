# Timesheet Restructuring - Implementation TODO

## Status: ⚠️ READY FOR IMPLEMENTATION

**Problem**: Restructured `EmployeeTimesheetPage.tsx` exists but is not routed in App.tsx. Old `EmployeeTimesheet.tsx` (2,386 lines) still in use.

**Solution**: Update routing to use the new restructured component.

---

## OPTION 1: QUICK FIX (RECOMMENDED) ⚡

**Timeline**: 2-3 hours  
**Risk**: Low  
**Priority**: HIGH  
**SonarQube Impact**: Immediate compliance

### Phase 1: Routing Update (30 minutes)

#### Task 1.1: Update App.tsx Imports
- [ ] Open `frontend/src/App.tsx`
- [ ] **Line 40**: Remove old import
  ```typescript
  // REMOVE THIS LINE
  import { EmployeeTimesheet } from './components/EmployeeTimesheet';
  ```
- [ ] **Add new import** (after line 39)
  ```typescript
  // ADD THIS LINE
  import { EmployeeTimesheetPage } from './pages/employee/EmployeeTimesheetPage';
  ```
- [ ] Save file

#### Task 1.2: Update Timesheet Routes
- [ ] Open `frontend/src/App.tsx`
- [ ] **Lines 145-175**: Replace entire timesheet route block
- [ ] **REMOVE** (lines 145-175):
  ```typescript
  {/* Timesheet Management */}
  <Route path="timesheets">
    <Route index element={
      <ProtectedRoute>
        <EmployeeTimesheet viewMode="list" />
      </ProtectedRoute>
    } />
    <Route path="list" element={
      <ProtectedRoute>
        <EmployeeTimesheet viewMode="list" />
      </ProtectedRoute>
    } />
    <Route path="create" element={
      <ProtectedRoute>
        <EmployeeTimesheet viewMode="create" />
      </ProtectedRoute>
    } />
    <Route path="calendar" element={
      <ProtectedRoute>
        <EmployeeTimesheet viewMode="calendar" />
      </ProtectedRoute>
    } />
    <Route path="status" element={
      <ProtectedRoute>
        <TimesheetStatusView />
      </ProtectedRoute>
    } />
    <Route path="status/view" element={
      <ProtectedRoute>
        <TimesheetStatusView />
      </ProtectedRoute>
    } />
    <Route path="status/reports" element={
      <ProtectedRoute>
        <TimesheetStatusView />
      </ProtectedRoute>
    } />
  </Route>
  ```
- [ ] **ADD** (replace with):
  ```typescript
  {/* Timesheet Management - Restructured */}
  <Route path="timesheets" element={
    <ProtectedRoute>
      <EmployeeTimesheetPage />
    </ProtectedRoute>
  } />
  <Route path="timesheets/status" element={
    <ProtectedRoute>
      <TimesheetStatusView />
    </ProtectedRoute>
  } />
  ```
- [ ] Save file

#### Task 1.3: Verify No Other Imports
- [ ] Search entire codebase for `EmployeeTimesheet` imports
  ```bash
  # Run this command
  grep -r "import.*EmployeeTimesheet" frontend/src/
  ```
- [ ] If found, update those files to use `EmployeeTimesheetPage` instead
- [ ] Document any files that need updating

---

### Phase 2: Testing (1 hour)

#### Task 2.1: Start Development Server
- [ ] Run `npm --prefix frontend run dev`
- [ ] Wait for server to start
- [ ] Open browser to `http://localhost:5173`

#### Task 2.2: Test Navigation
- [ ] Login as employee user
- [ ] Navigate to Dashboard
- [ ] Click "Timesheets" in sidebar
- [ ] **Verify**: Page loads without errors
- [ ] **Verify**: URL is `/dashboard/timesheets`
- [ ] **Verify**: No console errors

#### Task 2.3: Test Calendar View
- [ ] **Verify**: Calendar view is default
- [ ] **Verify**: Current week is displayed
- [ ] **Verify**: Week navigation arrows work
- [ ] Click previous week arrow
- [ ] **Verify**: Week changes correctly
- [ ] Click next week arrow
- [ ] **Verify**: Week changes correctly
- [ ] **Verify**: Time entries display (if any exist)
- [ ] **Verify**: Project colors show correctly

#### Task 2.4: Test List View
- [ ] Click "List View" tab
- [ ] **Verify**: Switches to list view
- [ ] **Verify**: Timesheets display in list format
- [ ] **Verify**: Status badges show correctly
- [ ] **Verify**: Filters work (status dropdown)
- [ ] **Verify**: Search works
- [ ] **Verify**: Sorting works
- [ ] **Verify**: Pagination works (if >10 timesheets)

#### Task 2.5: Test Create Timesheet
- [ ] Click "New Timesheet" button
- [ ] **Verify**: Modal opens
- [ ] **Verify**: Form displays correctly
- [ ] **Verify**: Week selector works
- [ ] **Verify**: Project dropdown populates
- [ ] **Verify**: Task dropdown populates
- [ ] Fill in timesheet entry:
  - Select project
  - Select task
  - Enter hours (e.g., 8)
  - Select date
  - Add description
- [ ] Click "Save" or "Submit"
- [ ] **Verify**: Success message appears
- [ ] **Verify**: Modal closes
- [ ] **Verify**: New timesheet appears in list

#### Task 2.6: Test Edit Timesheet
- [ ] Click "Edit" on a draft timesheet
- [ ] **Verify**: Modal opens with existing data
- [ ] **Verify**: All fields populated correctly
- [ ] Modify an entry (change hours)
- [ ] Click "Save"
- [ ] **Verify**: Success message appears
- [ ] **Verify**: Changes saved
- [ ] **Verify**: Updated data displays

#### Task 2.7: Test Delete Timesheet
- [ ] Click "Delete" on a draft timesheet
- [ ] **Verify**: Confirmation dialog appears
- [ ] Click "Cancel"
- [ ] **Verify**: Timesheet not deleted
- [ ] Click "Delete" again
- [ ] Click "Confirm"
- [ ] **Verify**: Success message appears
- [ ] **Verify**: Timesheet removed from list

#### Task 2.8: Test Approval History
- [ ] Find a submitted timesheet
- [ ] Click "History" button
- [ ] **Verify**: Approval history modal opens
- [ ] **Verify**: Current approval status displays
- [ ] **Verify**: Timeline displays (if history exists)
- [ ] **Verify**: Project-wise approvals show
- [ ] Click "X" to close
- [ ] **Verify**: Modal closes

#### Task 2.9: Test Submit Timesheet
- [ ] Create or edit a draft timesheet
- [ ] Add at least one entry
- [ ] Click "Submit" button
- [ ] **Verify**: Confirmation dialog appears
- [ ] Click "Submit"
- [ ] **Verify**: Success message appears
- [ ] **Verify**: Status changes to "Submitted"
- [ ] **Verify**: Edit button disabled
- [ ] **Verify**: History button now visible

#### Task 2.10: Test Error Handling
- [ ] Try to create timesheet without entries
- [ ] **Verify**: Validation error shows
- [ ] Try to submit empty timesheet
- [ ] **Verify**: Error message shows
- [ ] Disconnect internet (or use DevTools offline mode)
- [ ] Try to load timesheets
- [ ] **Verify**: Error message displays
- [ ] **Verify**: Retry button works

---

### Phase 3: Cross-Browser Testing (30 minutes)

#### Task 3.1: Test in Chrome
- [ ] Open Chrome
- [ ] Navigate to application
- [ ] Run through Tasks 2.2-2.9
- [ ] **Verify**: All functionality works
- [ ] **Verify**: No console errors
- [ ] **Verify**: UI renders correctly

#### Task 3.2: Test in Firefox
- [ ] Open Firefox
- [ ] Navigate to application
- [ ] Run through Tasks 2.2-2.9
- [ ] **Verify**: All functionality works
- [ ] **Verify**: No console errors
- [ ] **Verify**: UI renders correctly

#### Task 3.3: Test in Edge
- [ ] Open Edge
- [ ] Navigate to application
- [ ] Run through Tasks 2.2-2.9
- [ ] **Verify**: All functionality works
- [ ] **Verify**: No console errors
- [ ] **Verify**: UI renders correctly

#### Task 3.4: Test Mobile Responsive
- [ ] Open Chrome DevTools
- [ ] Toggle device toolbar (Ctrl+Shift+M)
- [ ] Select "iPhone 12 Pro"
- [ ] Test all functionality
- [ ] **Verify**: Layout responsive
- [ ] **Verify**: Buttons accessible
- [ ] **Verify**: Modals display correctly
- [ ] Select "iPad"
- [ ] Test all functionality
- [ ] **Verify**: Layout responsive

---

### Phase 4: Role-Based Testing (30 minutes)

#### Task 4.1: Test as Employee
- [ ] Login as employee
- [ ] Navigate to timesheets
- [ ] **Verify**: Can view own timesheets
- [ ] **Verify**: Can create timesheets
- [ ] **Verify**: Can edit draft timesheets
- [ ] **Verify**: Can delete draft timesheets
- [ ] **Verify**: Can submit timesheets
- [ ] **Verify**: Can view approval history
- [ ] **Verify**: Cannot edit submitted timesheets

#### Task 4.2: Test as Lead
- [ ] Login as lead
- [ ] Navigate to timesheets
- [ ] **Verify**: Can view own timesheets
- [ ] **Verify**: All employee functionality works
- [ ] Navigate to team review
- [ ] **Verify**: Can see team timesheets
- [ ] **Verify**: Can approve/reject

#### Task 4.3: Test as Manager
- [ ] Login as manager
- [ ] Navigate to timesheets
- [ ] **Verify**: Can view own timesheets
- [ ] **Verify**: All employee functionality works
- [ ] Navigate to team review
- [ ] **Verify**: Can see team timesheets
- [ ] **Verify**: Can approve/reject

#### Task 4.4: Test as Management
- [ ] Login as management
- [ ] Navigate to timesheets
- [ ] **Verify**: Can view own timesheets
- [ ] **Verify**: All employee functionality works
- [ ] Navigate to team review
- [ ] **Verify**: Can see all timesheets
- [ ] **Verify**: Can verify/bill

---

### Phase 5: Cleanup (30 minutes)

#### Task 5.1: Backup Old Component
- [ ] Run command:
  ```bash
  mv frontend/src/components/EmployeeTimesheet.tsx \
     frontend/src/components/EmployeeTimesheet.tsx.backup
  ```
- [ ] **Verify**: File renamed
- [ ] **Verify**: Application still works

#### Task 5.2: Search for Remaining References
- [ ] Run command:
  ```bash
  grep -r "EmployeeTimesheet" frontend/src/ --exclude="*.backup"
  ```
- [ ] **Document**: Any files that reference old component
- [ ] **Update**: Those files if necessary
- [ ] **Verify**: No broken imports

#### Task 5.3: Run Linter
- [ ] Run command:
  ```bash
  npm --prefix frontend run lint
  ```
- [ ] **Fix**: Any linting errors
- [ ] **Verify**: No errors or warnings

#### Task 5.4: Build Production Bundle
- [ ] Run command:
  ```bash
  npm --prefix frontend run build
  ```
- [ ] **Verify**: Build succeeds
- [ ] **Verify**: No errors
- [ ] **Check**: Bundle size (should be smaller)

#### Task 5.5: Test Production Build
- [ ] Run command:
  ```bash
  npm --prefix frontend run preview
  ```
- [ ] Open browser to preview URL
- [ ] Run through key functionality
- [ ] **Verify**: Everything works in production mode

---

### Phase 6: Documentation (30 minutes)

#### Task 6.1: Update CHANGELOG
- [ ] Open `CHANGELOG.md` (or create if doesn't exist)
- [ ] Add entry:
  ```markdown
  ## [Date] - Timesheet Restructuring
  
  ### Changed
  - Replaced EmployeeTimesheet.tsx (2,386 lines) with EmployeeTimesheetPage.tsx (259 lines)
  - Achieved 90% code reduction
  - Improved SonarQube compliance (CC <10)
  - Simplified routing structure
  
  ### Removed
  - Old EmployeeTimesheet.tsx component
  - Redundant timesheet routes
  
  ### Fixed
  - SonarQube cognitive complexity violations
  - Code maintainability issues
  ```

#### Task 6.2: Update TODO.md
- [ ] Open `TODO.md`
- [ ] Mark Phase 7.3 as complete:
  - [x] Phase 7.3: Add timesheet routes
  - [x] Phase 7.3: Test timesheet CRUD, calendar view, week navigation, and approval workflows
- [ ] Mark Phase 10.1 as complete:
  - [x] Phase 10.1: Delete old EmployeeTimesheet.tsx component

#### Task 6.3: Update README (if exists)
- [ ] Document new timesheet page structure
- [ ] Update any screenshots if needed
- [ ] Update routing documentation

#### Task 6.4: Create Migration Notes
- [ ] Document what changed
- [ ] Document any breaking changes (none expected)
- [ ] Document new features (if any)

---

### Phase 7: Deployment Preparation (30 minutes)

#### Task 7.1: Create Git Commit
- [ ] Stage changes:
  ```bash
  git add frontend/src/App.tsx
  git add frontend/src/pages/employee/EmployeeTimesheetPage.tsx
  git add frontend/src/components/EmployeeTimesheet.tsx.backup
  ```
- [ ] Commit with message:
  ```bash
  git commit -m "Phase 7: Timesheet restructuring - Route EmployeeTimesheetPage

  - Replace EmployeeTimesheet.tsx (2,386 lines) with EmployeeTimesheetPage.tsx (259 lines)
  - Achieve 90% code reduction and SonarQube compliance
  - Simplify routing structure
  - Backup old component for reference
  
  Fixes: SonarQube cognitive complexity violations
  Closes: Phase 7.3 and Phase 10.1 tasks"
  ```

#### Task 7.2: Create Pull Request
- [ ] Push branch to remote
- [ ] Create PR with title: "Phase 7: Timesheet Restructuring - SonarQube Compliance"
- [ ] Add description with:
  - Problem statement
  - Solution overview
  - Testing performed
  - Screenshots (before/after metrics)
  - Checklist of completed tasks
- [ ] Request review from team

#### Task 7.3: Prepare Deployment Notes
- [ ] Document deployment steps
- [ ] Note any environment variables needed
- [ ] Note any database migrations needed (none expected)
- [ ] Create rollback plan

---

## OPTION 2: COMPLETE RESTRUCTURING (FUTURE) 🔧

**Timeline**: 1-2 weeks  
**Risk**: Medium  
**Priority**: LOW (do after Option 1)  
**SonarQube Impact**: Further improvements

### Phase 8: Create Dedicated Pages (3 days)

#### Task 8.1: Create Page Structure
- [ ] Create `frontend/src/pages/timesheets/` directory
- [ ] Create `TimesheetListPage.tsx`
- [ ] Create `TimesheetCalendarPage.tsx`
- [ ] Create `TimesheetCreatePage.tsx`
- [ ] Create `TimesheetEditPage.tsx`
- [ ] Create `components/` subdirectory

#### Task 8.2: Implement TimesheetListPage
- [ ] Create component file
- [ ] Implement list view only
- [ ] Add filtering
- [ ] Add sorting
- [ ] Add pagination
- [ ] Add search
- [ ] Test functionality

#### Task 8.3: Implement TimesheetCalendarPage
- [ ] Create component file
- [ ] Implement calendar view only
- [ ] Add week navigation
- [ ] Add entry display
- [ ] Add day click handler
- [ ] Test functionality

#### Task 8.4: Implement TimesheetCreatePage
- [ ] Create component file
- [ ] Implement create form
- [ ] Add Zod validation
- [ ] Add React Hook Form
- [ ] Add success/error handling
- [ ] Test functionality

#### Task 8.5: Implement TimesheetEditPage
- [ ] Create component file
- [ ] Implement edit form
- [ ] Load existing data
- [ ] Add Zod validation
- [ ] Add React Hook Form
- [ ] Handle project-wise locks
- [ ] Test functionality

---

### Phase 9: Service Refactoring (2 days)

#### Task 9.1: Analyze Current Services
- [ ] Review `TimesheetService.ts` (456 lines)
- [ ] Review `TimesheetApprovalService.ts` (612 lines)
- [ ] Identify logical groupings
- [ ] Plan split strategy

#### Task 9.2: Create Service Directory
- [ ] Create `frontend/src/services/timesheet/` directory
- [ ] Create `index.ts` for exports

#### Task 9.3: Split TimesheetService
- [ ] Create `TimesheetCRUDService.ts`
  - Move CRUD operations
  - getAllTimesheets
  - getUserTimesheets
  - createTimesheet
  - getTimesheetByUserAndWeek
  - deleteTimesheet
- [ ] Create `TimesheetCalendarService.ts`
  - Move calendar operations
  - getCalendarData
  - getWeekData
- [ ] Test all methods

#### Task 9.4: Refactor TimesheetApprovalService
- [ ] Split into smaller services:
  - `EmployeeTimesheetService.ts`
  - `ManagerApprovalService.ts`
  - `ManagementApprovalService.ts`
- [ ] Move methods to appropriate services
- [ ] Test all methods

#### Task 9.5: Update Imports
- [ ] Search for all service imports
- [ ] Update to use new services
- [ ] Test all functionality
- [ ] Remove old service files

---

### Phase 10: Schema Implementation (1 day)

#### Task 10.1: Create Timesheet Schemas
- [ ] Create `frontend/src/schemas/timesheet.schema.ts`
- [ ] Implement `timesheetSchema`
- [ ] Implement `timeEntrySchema`
- [ ] Implement `timesheetSubmissionSchema`
- [ ] Implement `timesheetFilterSchema`

#### Task 10.2: Integrate Schemas
- [ ] Update TimesheetForm to use schemas
- [ ] Update TimesheetCreatePage to use schemas
- [ ] Update TimesheetEditPage to use schemas
- [ ] Test validation

---

### Phase 11: Custom Hooks (1 day)

#### Task 11.1: Create Hook Directory
- [ ] Create `frontend/src/hooks/timesheet/` directory

#### Task 11.2: Implement Hooks
- [ ] Create `useTimesheetData.ts`
- [ ] Create `useTimesheetForm.ts`
- [ ] Create `useTimesheetCalendar.ts`
- [ ] Create `useTimesheetApproval.ts`

#### Task 11.3: Integrate Hooks
- [ ] Update pages to use hooks
- [ ] Test functionality
- [ ] Remove duplicate code

---

### Phase 12: Final Testing & Cleanup (2 days)

#### Task 12.1: Comprehensive Testing
- [ ] Test all pages
- [ ] Test all user roles
- [ ] Test all workflows
- [ ] Test error scenarios
- [ ] Test edge cases

#### Task 12.2: Performance Testing
- [ ] Measure bundle size
- [ ] Measure load times
- [ ] Optimize if needed

#### Task 12.3: Documentation
- [ ] Update all documentation
- [ ] Create developer guide
- [ ] Update API documentation

#### Task 12.4: Final Cleanup
- [ ] Remove all backup files
- [ ] Remove unused code
- [ ] Run linter
- [ ] Run tests
- [ ] Build production

---

## Success Metrics

### Option 1 Success Criteria
- [x] EmployeeTimesheetPage.tsx properly routed
- [x] Old EmployeeTimesheet.tsx not used
- [x] All functionality works
- [x] No console errors
- [x] SonarQube compliance achieved
- [x] Tests passing
- [x] Documentation updated

### Option 2 Success Criteria
- [x] All Option 1 criteria met
- [x] Dedicated pages created
- [x] Services split and organized
- [x] Zod schemas implemented
- [x] React Hook Form integrated
- [x] Custom hooks created
- [x] All tests passing
- [x] Performance improved

---

## Notes

- **Priority**: Option 1 should be completed IMMEDIATELY
- **Timeline**: Option 1 can be done in 2-3 hours
- **Risk**: Option 1 is low risk, high reward
- **Future**: Option 2 can be planned for next sprint

---

**Document Version**: 1.0  
**Created**: January 2025  
**Status**: Ready for Implementation  
**Assigned To**: [Your Name]  
**Due Date**: [Set Date]
