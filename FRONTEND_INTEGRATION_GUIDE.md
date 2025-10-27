# Frontend Integration Guide
## Edge Case Handling - Leave, Holidays, Training, Miscellaneous, and Defaulters

This guide explains how to integrate the new edge case handling features into your frontend application.

---

## 📋 Table of Contents

1. [New Services](#new-services)
2. [New Components](#new-components)
3. [Integration Examples](#integration-examples)
4. [Routing Setup](#routing-setup)
5. [API Endpoints Reference](#api-endpoints-reference)

---

## 🔧 New Services

### 1. CompanyHolidayService

Located: `src/services/CompanyHolidayService.ts`

**Purpose**: Manage company holidays and check if dates are holidays

**Key Methods**:
```typescript
// Get all holidays with optional filters
CompanyHolidayService.getHolidays({ year: 2025, is_active: true })

// Get upcoming holidays
CompanyHolidayService.getUpcomingHolidays(30) // next 30 days

// Check if a specific date is a holiday
CompanyHolidayService.checkHoliday('2025-01-01')

// Create/Update/Delete holidays (Admin only)
CompanyHolidayService.createHoliday({ name, date, holiday_type })
CompanyHolidayService.updateHoliday(id, { name, is_active })
CompanyHolidayService.deleteHoliday(id)
```

### 2. DefaulterService

Located: `src/services/DefaulterService.ts`

**Purpose**: Track team members who haven't submitted timesheets

**Key Methods**:
```typescript
// Get defaulters for a project-week
DefaulterService.getProjectDefaulters(projectId, weekStart)

// Get all defaulters for a manager
DefaulterService.getManagerDefaulters(managerId, weekStart)

// Validate no defaulters (for approval button state)
DefaulterService.validateNoDefaulters(projectId, weekStart)

// Send reminder notifications
DefaulterService.notifyDefaulters(projectId, weekStartDate)
```

### 3. TimesheetService (Updated)

Located: `src/services/TimesheetService.ts`

**New Methods**:
```typescript
// Add leave entry
TimesheetService.addLeaveEntry(
  timesheetId,
  date,
  'full_day', // or 'morning', 'afternoon'
  description
)

// Add miscellaneous entry (company events)
TimesheetService.addMiscellaneousEntry(
  timesheetId,
  date,
  'Annual Company Meet',
  8 // hours
)

// Add project entry
TimesheetService.addProjectEntry(timesheetId, {
  projectId,
  date,
  hours,
  taskType: 'project_task',
  taskId,
  isBillable: true
})

// Add training entry
TimesheetService.addTrainingEntry(timesheetId, {
  date,
  hours,
  taskType: 'custom_task',
  customTaskDescription: 'React Training'
})
```

---

## 🎨 New Components

### 1. LeaveEntryForm

Located: `src/components/timesheet/LeaveEntryForm.tsx`

**Purpose**: Allow employees to log leave entries

**Features**:
- Automatic holiday checking (blocks leave on holidays)
- Auto-calculates hours based on session (morning=4h, afternoon=4h, full_day=8h)
- Validates against company holiday calendar

**Usage**:
```tsx
import { LeaveEntryForm } from '@/components/timesheet/LeaveEntryForm';

<LeaveEntryForm
  timesheetId={timesheetId}
  onSuccess={() => {
    // Refresh timesheet entries
    loadEntries();
  }}
  onCancel={() => setShowLeaveForm(false)}
/>
```

### 2. MiscellaneousEntryForm

Located: `src/components/timesheet/MiscellaneousEntryForm.tsx`

**Purpose**: Log company events and non-project activities

**Features**:
- Pre-defined activity list (Annual Company Meet, Training, etc.)
- Custom activity input
- Auto-marks as non-billable
- Skips Lead approval (goes to Manager directly)

**Usage**:
```tsx
import { MiscellaneousEntryForm } from '@/components/timesheet/MiscellaneousEntryForm';

<MiscellaneousEntryForm
  timesheetId={timesheetId}
  onSuccess={() => loadEntries()}
  onCancel={() => setShowMiscForm(false)}
/>
```

### 3. DefaulterList

Located: `src/components/team-review/DefaulterList.tsx`

**Purpose**: Display team members who haven't submitted timesheets

**Features**:
- Shows days overdue with color coding
- Send reminder notifications button
- Blocks approval actions via callback
- Auto-refreshes validation state

**Usage**:
```tsx
import { DefaulterList } from '@/components/team-review/DefaulterList';

const [canApprove, setCanApprove] = useState(false);

<DefaulterList
  projectId={projectId}
  weekStart={weekStart}
  onValidationChange={(canProceed, count) => {
    setCanApprove(canProceed);
    // Disable approval buttons if count > 0
  }}
/>

{/* Approval button */}
<button disabled={!canApprove}>
  Approve All
</button>
```

### 4. HolidayManagement

Located: `src/components/settings/HolidayManagement.tsx`

**Purpose**: Admin interface for managing company holidays

**Features**:
- CRUD operations for holidays
- Year selector
- Holiday type categorization (public, company, optional)
- Active/Inactive toggle
- Sortable table view

**Usage**:
```tsx
import { HolidayManagement } from '@/components/settings/HolidayManagement';

// In admin settings page
<HolidayManagement />
```

---

## 💡 Integration Examples

### Example 1: Timesheet Entry Form with Categories

Add entry category selection to your timesheet form:

```tsx
import { useState } from 'react';
import { LeaveEntryForm } from '@/components/timesheet/LeaveEntryForm';
import { MiscellaneousEntryForm } from '@/components/timesheet/MiscellaneousEntryForm';

const TimesheetEntryPage = ({ timesheetId }) => {
  const [entryType, setEntryType] = useState<'project' | 'leave' | 'misc' | 'training'>('project');

  return (
    <div>
      {/* Entry Type Selector */}
      <div className="mb-4">
        <label>Entry Type:</label>
        <select value={entryType} onChange={(e) => setEntryType(e.target.value)}>
          <option value="project">Project Work</option>
          <option value="leave">Leave</option>
          <option value="misc">Miscellaneous (Events)</option>
          <option value="training">Training</option>
        </select>
      </div>

      {/* Conditional Forms */}
      {entryType === 'leave' && (
        <LeaveEntryForm
          timesheetId={timesheetId}
          onSuccess={() => loadEntries()}
        />
      )}

      {entryType === 'misc' && (
        <MiscellaneousEntryForm
          timesheetId={timesheetId}
          onSuccess={() => loadEntries()}
        />
      )}

      {entryType === 'project' && (
        {/* Your existing project entry form */}
      )}

      {entryType === 'training' && (
        {/* Training entry form - auto-finds Training Program project */}
      )}
    </div>
  );
};
```

### Example 2: Team Review Page with Defaulter Tracking

Integrate defaulter tracking into team review:

```tsx
import { useState, useEffect } from 'react';
import { DefaulterList } from '@/components/team-review/DefaulterList';

const TeamReviewPage = ({ projectId, weekStart }) => {
  const [canApproveOrReject, setCanApproveOrReject] = useState(false);
  const [defaulterCount, setDefaulterCount] = useState(0);

  return (
    <div>
      <h2>Team Review - {projectId}</h2>

      {/* Defaulter Warning/List */}
      <DefaulterList
        projectId={projectId}
        weekStart={weekStart}
        onValidationChange={(canProceed, count) => {
          setCanApproveOrReject(canProceed);
          setDefaulterCount(count);
        }}
      />

      {/* Approval Actions - Disabled if defaulters exist */}
      <div className="mt-6">
        <button
          onClick={handleApproveAll}
          disabled={!canApproveOrReject}
          className={`px-4 py-2 rounded ${
            canApproveOrReject
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Approve All {!canApproveOrReject && `(${defaulterCount} pending)`}
        </button>

        <button
          onClick={handleRejectAll}
          disabled={!canApproveOrReject}
          className={`ml-3 px-4 py-2 rounded ${
            canApproveOrReject
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Reject All
        </button>
      </div>
    </div>
  );
};
```

### Example 3: Holiday-Aware Calendar

Add holiday indicators to your timesheet calendar:

```tsx
import { useState, useEffect } from 'react';
import { CompanyHolidayService, type CompanyHoliday } from '@/services/CompanyHolidayService';

const TimesheetCalendar = ({ weekStart, weekEnd }) => {
  const [holidays, setHolidays] = useState<CompanyHoliday[]>([]);

  useEffect(() => {
    const loadHolidays = async () => {
      const result = await CompanyHolidayService.getHolidaysInRange(
        weekStart,
        weekEnd
      );
      if (!result.error) {
        setHolidays(result.holidays);
      }
    };
    loadHolidays();
  }, [weekStart, weekEnd]);

  const isHoliday = (date: string) => {
    return holidays.some(h =>
      new Date(h.date).toISOString().split('T')[0] === date
    );
  };

  const getHolidayName = (date: string) => {
    const holiday = holidays.find(h =>
      new Date(h.date).toISOString().split('T')[0] === date
    );
    return holiday?.name;
  };

  return (
    <div className="calendar">
      {daysOfWeek.map((date) => (
        <div
          key={date}
          className={`calendar-day ${
            isHoliday(date) ? 'bg-red-50 border-red-200' : ''
          }`}
        >
          <div className="date">{date}</div>
          {isHoliday(date) && (
            <div className="text-xs text-red-600">
              🏖️ {getHolidayName(date)}
            </div>
          )}
          {/* Entry input - disabled on holidays */}
          <input
            type="number"
            disabled={isHoliday(date)}
            placeholder={isHoliday(date) ? 'Holiday' : 'Hours'}
          />
        </div>
      ))}
    </div>
  );
};
```

---

## 🛣️ Routing Setup

Add new routes to your router configuration:

```tsx
// In your router file (e.g., App.tsx or routes.tsx)
import { HolidayManagementPage } from '@/pages/admin/HolidayManagementPage';

const routes = [
  // ... existing routes

  // Admin routes
  {
    path: '/admin/holidays',
    element: <HolidayManagementPage />,
    roles: ['super_admin', 'management'] // Restrict to admins
  },

  // ... other routes
];
```

Add navigation menu item:

```tsx
// In admin sidebar/navigation
<NavLink to="/admin/holidays">
  <CalendarIcon className="w-5 h-5" />
  <span>Holiday Management</span>
</NavLink>
```

---

## 📡 API Endpoints Reference

### Holiday Endpoints
```
GET    /api/holidays                    - Get all holidays (with filters)
GET    /api/holidays/upcoming?days=30   - Get upcoming holidays
GET    /api/holidays/:id                - Get holiday by ID
POST   /api/holidays                    - Create holiday (Admin)
PUT    /api/holidays/:id                - Update holiday (Admin)
DELETE /api/holidays/:id                - Delete holiday (Admin)
GET    /api/holidays/check/:date        - Check if date is holiday
```

### Defaulter Endpoints
```
GET    /api/defaulters/:projectId/:weekStart              - Get project defaulters
GET    /api/defaulters/manager/:managerId/:weekStart      - Get manager defaulters
GET    /api/defaulters/stats?managerId=&weekStartDate=    - Get defaulter stats
POST   /api/defaulters/notify                             - Send reminders
GET    /api/defaulters/validate/:projectId/:weekStart     - Validate (for button state)
```

### Timesheet Entry Endpoints
```
POST   /api/timesheets/:id/entries/leave          - Add leave entry
POST   /api/timesheets/:id/entries/miscellaneous  - Add misc entry
POST   /api/timesheets/:id/entries/project        - Add project entry
POST   /api/timesheets/:id/entries/training       - Add training entry
```

---

## 🎯 Key Integration Points

### 1. Approval Workflow Changes

**Leave and Miscellaneous entries skip Lead approval:**
- These entries go directly from Employee → Manager → Management
- Update your approval flow logic to filter by `entry_category`

### 2. Billing Changes

**Only regular project entries are billable:**
- Training project entries: Non-billable
- Internal project entries: Non-billable
- Leave entries: Non-billable
- Miscellaneous entries: Non-billable

### 3. Validation Changes

**Dynamic weekly hour validation:**
- Min hours: 0-40h (adjusted for holidays and leave)
- Max hours: 52h (normal weeks), proportional for extended weeks
- Use `ValidationConfigService` on backend for calculations

### 4. Extended Week Handling

**Month-end weeks (when month ends Mon-Wed):**
- Week extends to include those days (e.g., 10-11 days total)
- Following week becomes partial (Thu-Sun, 3-4 days)
- Predicted 7 days in advance for user notification

---

## ✅ Testing Checklist

- [ ] Leave entries block on holidays
- [ ] Leave hours auto-calculate based on session
- [ ] Miscellaneous entries skip Lead approval
- [ ] Defaulter list blocks approval buttons
- [ ] Holiday calendar displays in timesheet
- [ ] Admin can create/edit/delete holidays
- [ ] Training entries auto-find Training Program project
- [ ] Billing excludes non-billable entries
- [ ] Extended weeks calculate max hours correctly
- [ ] Reminder notifications send to defaulters

---

## 🐛 Common Issues

### Issue: "Leave entry rejected - holiday not found"
**Solution**: Ensure holidays are created in admin panel for the year

### Issue: "Training project not found"
**Solution**: Create a project with `project_type: 'training'` and status 'active'

### Issue: "Approval button not disabled despite defaulters"
**Solution**: Check that `DefaulterList` component's `onValidationChange` callback is wired correctly

### Issue: "Billing includes training/leave hours"
**Solution**: Backend BillingService filters by `entry_category='project'` and `project_type='regular'` - no frontend change needed

---

## 📞 Support

For issues or questions:
1. Check backend logs for API errors
2. Verify user roles/permissions
3. Test API endpoints directly using Postman/curl
4. Review browser console for frontend errors

---

**Last Updated**: 2025-01-26
**Version**: 1.0.0
