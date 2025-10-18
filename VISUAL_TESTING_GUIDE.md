# Visual Testing Guide - 3-Tier Timesheet Approval System

## Quick Start Testing

### Setup Test Users

You'll need 4 test users:

1. **Employee** (role: `employee`)
2. **Lead** (role: `lead`)
3. **Manager** (role: `manager`)
4. **Management** (role: `management`)

---

## Test Scenario 1: Recommended Path (Lead → Manager → Management)

### Step 1: Employee Submits Timesheet

**As Employee:**
1. Navigate to Timesheets
2. Create timesheet for current week
3. Add time entries for Project A
4. Submit timesheet
5. **Expected:** Status shows `submitted`

### Step 2: Lead Approves

**As Lead:**
1. Navigate to Team Review
2. **Expected UI:**
   - Page title: "Team Review - Project-week approval for lead"
   - See Employee's timesheet in "Pending" tab
   - Project-Week card shows Employee's name
   - Status badge: "Pending Approval"

3. Click on project-week card to expand
4. **Expected:**
   - Employee row shows status icon (yellow clock)
   - Status badge: "Pending"
   - Individual "Approve" and "Reject" buttons visible

5. Click "Approve" for Employee
6. **Expected:**
   - Success message: "Approved [Employee Name]'s timesheet for [Project Name]"
   - Timesheet moves to "Approved" tab
   - Employee's timesheet status: `lead_approved`

### Step 3: Manager Approves

**As Manager:**
1. Navigate to Team Review
2. **Expected UI:**
   - Page title: "Team Review - Project-week approval for manager"
   - See project-week card with Employee's timesheet
   - **NEW:** Approval path summary shows:
     - 🔵 Lead Approved: 1
     - 🟣 Direct Submit: 0
     - 🟢 Team Leads: 0

3. Expand project-week card
4. **Expected:**
   - Employee row shows **"Via Lead"** badge (blue)
   - Indicates this came through the recommended path

5. Click "Approve All"
6. **Expected:**
   - Success message
   - Timesheet status: `manager_approved`

### Step 4: Management Verifies

**As Management:**
1. Navigate to Team Review
2. **Expected UI:**
   - Page title: "Team Review - Project-week approval for management"
   - See project-week card
   - Status shows: "1/1 manager approved - Ready for final verification"

3. Click "Verify All"
4. **Expected:**
   - Success message: "Successfully verified 1 timesheet for [Project Name] - [Week Label]"
   - Timesheet status: `frozen`
   - Timesheet is_frozen: `true`

---

## Test Scenario 2: Direct Path (Manager Bypasses Lead)

### Step 1: Employee Submits

**As Employee:**
- Same as Scenario 1

### Step 2: Manager Directly Approves (Bypass Lead)

**As Manager:**
1. Navigate to Team Review
2. **Expected UI:**
   - See Employee's `submitted` timesheet
   - **NEW:** Approval path summary shows:
     - 🔵 Lead Approved: 0
     - 🟣 Direct Submit: 1  ← Employee waiting
     - 🟢 Team Leads: 0

3. Expand project-week card
4. **Expected:**
   - Employee row shows **"Direct"** badge (purple)
   - Indicates Manager can approve without Lead

5. Click "Approve" for Employee
6. **Expected:**
   - Backend marks `lead_status = 'not_required'`
   - Backend logs: "Manager directly approved employee timesheet, bypassing lead review"
   - Timesheet status: `manager_approved`
   - Success message

### Step 3: Management Verifies

**As Management:**
- Same as Scenario 1, Step 4

---

## Test Scenario 3: Lead's Own Timesheet

### Step 1: Lead Submits Timesheet

**As Lead:**
1. Navigate to Timesheets
2. Create and submit timesheet
3. **Expected:** Status `submitted`

### Step 2: Manager Approves Lead's Timesheet

**As Manager:**
1. Navigate to Team Review
2. **Expected UI:**
   - **NEW:** Approval path summary shows:
     - 🔵 Lead Approved: 0
     - 🟣 Direct Submit: 0
     - 🟢 Team Leads: 1  ← Lead's timesheet

3. Expand project-week card
4. **Expected:**
   - Lead row shows **"Team Lead"** badge (green text)
   - No "Via Lead" or "Direct" badge (Lead can't approve themselves)

5. Click "Approve" for Lead
6. **Expected:**
   - Timesheet status: `manager_approved`

### Step 3: Management Verifies

**As Management:**
- Same as Scenario 1, Step 4

---

## Test Scenario 4: Manager's Own Timesheet

### Step 1: Manager Submits

**As Manager:**
1. Create and submit timesheet
2. **Expected:** Status `submitted`

### Step 2: Management Verifies Manager's Timesheet

**As Management:**
1. Navigate to Team Review
2. **Expected UI:**
   - See Manager's timesheet
   - Status: `management_pending` (not `manager_approved`)

3. Click "Verify All"
4. **Expected:**
   - Timesheet status: `frozen`
   - Manager's timesheet auto-escalates to frozen

---

## Test Scenario 5: Rejection Flows

### Test 5a: Lead Rejects Employee

**As Lead:**
1. View Employee's `submitted` timesheet
2. Click "Reject"
3. Enter rejection reason (min 10 characters)
4. **Expected:**
   - Timesheet status: `lead_rejected`
   - Rejection reason stored
   - Employee can resubmit

### Test 5b: Manager Rejects Lead-Approved

**As Manager:**
1. View Employee's `lead_approved` timesheet
2. Click "Reject"
3. Enter rejection reason
4. **Expected:**
   - Timesheet status: `manager_rejected`
   - All approvals reset (lead_status back to pending)
   - Employee can resubmit

### Test 5c: Management Rejects Manager-Approved

**As Management:**
1. View `manager_approved` timesheet
2. Click "Reject"
3. Enter rejection reason
4. **Expected:**
   - Timesheet status: `management_rejected`
   - All approvals reset
   - Employee can resubmit

---

## Test Scenario 6: Auto-Escalation (Optional)

### Setup

1. **As Admin/Management:**
   - Edit Project settings
   - Enable `approval_settings.lead_approval_auto_escalates = true`

### Test Flow

**As Lead:**
1. Approve Employee's timesheet
2. **Expected:**
   - Timesheet status jumps directly to `manager_approved`
   - Skips manual Manager review
   - Backend marks both `lead_status` and `manager_status` as approved

**As Management:**
1. Verify timesheet (same as usual)

---

## Visual Indicators Checklist

### Manager View - Approval Path Summary

When expanded, check for:

```
┌─────────────────────────────────────────────────┐
│  🔵 Lead Approved: 2                           │
│  🟣 Direct Submit: 1                           │
│  🟢 Team Leads: 1                              │
└─────────────────────────────────────────────────┘
```

### User Row Badges

- **Via Lead** (Blue): `lead_approved` → recommended path
- **Direct** (Purple): `submitted` employee → bypassed Lead
- **Team Lead** (Green text): User is a Lead

### Status Badges

- **Green**: Approved
- **Red**: Rejected
- **Yellow**: Pending

### Stats Grid

Each project-week card shows:
- Users count (with pending count)
- Total hours
- Total entries
- Status (role-specific)

---

## API Response Verification

### Check Backend Filtering

**As Lead:**
- Network tab → `GET /api/v1/timesheets/project-weeks?status=pending`
- Response should ONLY contain Employees with `submitted` status

**As Manager:**
- Response should contain:
  - `lead_approved` timesheets
  - `submitted` employees
  - `submitted` leads/managers
  - `management_rejected` (resubmitted)

**As Management:**
- Response should ONLY contain:
  - `manager_approved` timesheets
  - `management_pending` (manager's own)

---

## Edge Cases to Test

1. **Multi-Manager Scenario:**
   - Assign multiple managers to one project
   - Verify all managers must approve before status changes

2. **Empty States:**
   - No timesheets in date range
   - No pending approvals
   - Verify friendly messages

3. **Pagination:**
   - Create 20+ project-weeks
   - Test page navigation
   - Test page size changes (10, 25, 50)

4. **Filters:**
   - Filter by project
   - Filter by week range
   - Search by project name
   - Verify results update correctly

5. **Refresh:**
   - Click refresh button
   - Verify loading indicator
   - Verify data updates

---

## Known Visual Elements

### Colors

- **Blue** (#3B82F6): Lead approval path
- **Purple** (#A855F7): Direct submission path
- **Green** (#10B981): Approved, Team Leads
- **Red** (#EF4444): Rejected
- **Yellow** (#F59E0B): Pending

### Icons

- ✅ CheckCircle: Approved
- ❌ XCircle: Rejected
- ⏰ Clock: Pending
- ⚠️ AlertCircle: Warning/Not Required

---

## Troubleshooting

### Issue: Lead can't see any timesheets

**Check:**
- Is Lead assigned to the project with `project_role = 'lead'`?
- Are there Employees with `submitted` status in the date range?
- Check browser console for errors

### Issue: Manager sees everything

**Check:**
- Backend filtering might be disabled
- Check `TeamReviewServiceV2.isTimesheetVisibleToRole()` is being called
- Verify approverRole is correctly passed

### Issue: Approval path badges not showing

**Check:**
- `approvalRole` prop is passed to `UserTimesheetDetails`
- User has `user_role` field populated
- Timesheet has correct `timesheet_status`

---

## Success Criteria

✅ All roles see only their relevant timesheets
✅ Approval paths are visually distinct
✅ Status badges update in real-time
✅ Rejection flows reset approvals correctly
✅ Bulk operations work for entire project-week
✅ Individual approve/reject works per user
✅ Auto-escalation bypasses Manager when enabled
✅ Management can freeze manager-approved timesheets

---

**Happy Testing!** 🎉
