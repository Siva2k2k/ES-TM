# Comprehensive Approval System Refactor

## Date: October 22, 2025

## Overview

This document outlines the comprehensive refactor needed to align the timesheet management system with the detailed business requirements.

---

## Key Business Logic Changes

### A. Timesheet Creation ✅ (Mostly Implemented)

- **Status**: Draft → Submitted
- **Validation**: 8-10 hours/day, <52 hours/week, weekday entries mandatory
- **Current Implementation**: Mostly correct

### B. Project-Week Grouping ✅ (Implemented)

- Group users by project for a specific week
- Show worked hours and billable hours
- **Current Implementation**: Correct

### C. Lead Review (NEEDS MAJOR CHANGES)

#### Current Issues:

1. ❌ System rejects at PROJECT level, not ENTRY level
2. ❌ Lead can submit even if employees haven't submitted
3. ❌ No check for "all entries approved" vs "any entry rejected"

#### Required Changes:

1. **Entry-Level Rejection**: When lead rejects, mark individual entries as rejected (not all entries in project)
2. **Lead Submission Block**: Lead cannot submit until all employees on their projects have been reviewed
3. **Status Logic**:
   - If ANY entry is rejected → Timesheet status = `lead_rejected`
   - If ALL entries are approved → Timesheet status = `lead_approved`
   - Partial approval → Timesheet stays `submitted`

### D. Manager Review (NEEDS CHANGES)

#### Current Issues:

1. ❌ No billable hours adjustment functionality
2. ❌ No distinction between worked hours and billable hours
3. ❌ Status calculation doesn't check entry-level status

#### Required Changes:

1. **Billable Hours Adjustment**:
   - Worked Hours = Sum of hours from billable entries
   - Billable Hours = Worked Hours + Adjustment
   - Manager can edit `billable_adjustment` field
2. **Entry-Level Status Check**: Similar to lead, check if all entries approved
3. **Lead's Timesheet**: Direct path submitted → manager_approved

### E. Management Review (NEEDS CHANGES)

#### Current Issues:

1. ❌ Can verify before manager submits their own timesheet
2. ❌ No check for manager's timesheet submission

#### Required Changes:

1. **Verification Conditions**:
   - Project-week must be manager_approved
   - Manager's own timesheet for that week must be submitted/approved
2. **Bulk Freeze**: All entries move to 'frozen' status

---

## Database Schema Changes

### 1. TimesheetProjectApproval Model ✅ (UPDATED)

```typescript
export interface ITimesheetProjectApproval {
  // ... existing fields ...

  // NEW: Billable hours management
  worked_hours: number; // Sum of billable entry hours
  billable_hours: number; // worked_hours + billable_adjustment
  billable_adjustment: number; // Manager adjustment (+/-)
}
```

### 2. TimeEntry Model ✅ (Already has these)

```typescript
export interface ITimeEntry {
  // ... existing fields ...

  is_rejected: boolean; // ✅ Already exists
  rejection_reason?: string; // ✅ Already exists
  rejected_by?: ObjectId; // ✅ Already exists
}
```

---

## Backend Service Changes

### 1. TeamReviewApprovalService.ts

#### A. Rejection Logic (MAJOR CHANGE)

**Current**: Rejects all entries in a project
**Required**: Reject only specific entries

```typescript
// BEFORE (Line ~355)
await TimeEntry.updateMany(
  { timesheet_id, project_id },
  { $set: { is_rejected: true, rejection_reason, ... } }
);

// AFTER (NEW APPROACH)
// Lead/Manager can specify which entries to reject
// Or reject entire project-week (all entries)
static async rejectTimesheetEntries(
  timesheetId: string,
  projectId: string,
  entryIds: string[], // specific entries to reject
  approverId: string,
  approverRole: string,
  reason: string
): Promise<ApprovalResponse>
```

#### B. Approval Status Calculation (CRITICAL FIX)

**Current**: Checks if all PROJECT approvals are complete
**Required**: Check if all ENTRIES are approved

```typescript
// NEW METHOD NEEDED
private static async checkTimesheetEntriesStatus(
  timesheetId: string,
  session: any
): Promise<{
  allApproved: boolean;
  anyRejected: boolean;
  pendingCount: number;
}> {
  const entries = await TimeEntry.find({ timesheet_id });

  const anyRejected = entries.some(e => e.is_rejected);
  const allApproved = entries.every(e => /* entry is approved */);
  const pendingCount = entries.filter(e => /* entry is pending */).length;

  return { allApproved, anyRejected, pendingCount };
}
```

#### C. Lead Submission Validation (NEW)

```typescript
// NEW METHOD
static async validateLeadCanSubmit(
  leadId: string,
  weekStart: Date
): Promise<{ canSubmit: boolean; reason?: string }> {
  // Find all projects where user is lead
  const projects = await ProjectMember.find({
    user_id: leadId,
    role: 'lead'
  });

  // For each project, check if all employees have been reviewed
  for (const project of projects) {
    const employees = await ProjectMember.find({
      project_id: project.project_id,
      role: 'employee'
    });

    for (const employee of employees) {
      const timesheet = await Timesheet.findOne({
        user_id: employee.user_id,
        week_start_date: weekStart,
        status: 'submitted'
      });

      if (timesheet) {
        const approval = await TimesheetProjectApproval.findOne({
          timesheet_id: timesheet._id,
          project_id: project.project_id,
          lead_status: 'pending'
        });

        if (approval) {
          return {
            canSubmit: false,
            reason: `Employee ${employee.user_name} has pending timesheet that needs review`
          };
        }
      }
    }
  }

  return { canSubmit: true };
}
```

#### D. Manager Adjustment API (NEW)

```typescript
// NEW METHOD
static async updateBillableAdjustment(
  timesheetId: string,
  projectId: string,
  adjustment: number,
  managerId: string
): Promise<{ success: boolean; error?: string }> {
  const approval = await TimesheetProjectApproval.findOne({
    timesheet_id: timesheetId,
    project_id: projectId,
    manager_id: managerId
  });

  if (!approval) {
    throw new Error('Project approval not found');
  }

  approval.billable_adjustment = adjustment;
  approval.billable_hours = approval.worked_hours + adjustment;
  await approval.save();

  return { success: true };
}
```

### 2. TimesheetService.ts

#### A. Submission Validation (UPDATE)

```typescript
// UPDATE submitTimesheet method (Line ~900)
static async submitTimesheet(
  timesheetId: string,
  currentUser: AuthUser
): Promise<{ success: boolean; error?: string }> {
  // ... existing validation ...

  // NEW: Check if lead can submit
  if (currentUser.role === 'lead') {
    const validation = await TeamReviewApprovalService.validateLeadCanSubmit(
      currentUser.id,
      timesheet.week_start_date
    );

    if (!validation.canSubmit) {
      return {
        success: false,
        error: validation.reason
      };
    }
  }

  // ... rest of the method ...
}
```

---

## Frontend Changes

### 1. TimesheetForm.tsx (Entry-Level Editing)

#### Current Issue:

- When timesheet is rejected, ALL entries become editable
- Should only rejected entries be editable

#### Required Change:

```typescript
// Line ~935
const isEntryEditable = (entry: TimeEntry) => {
  // If in create/edit mode, all entries editable
  if (mode === "edit" || timesheetStatus === "draft") {
    return true;
  }

  // If timesheet is rejected, only rejected entries are editable
  if (
    timesheetStatus === "lead_rejected" ||
    timesheetStatus === "manager_rejected"
  ) {
    return entry.is_rejected === true;
  }

  // Otherwise, not editable
  return false;
};
```

### 2. TeamReviewPageV2.tsx (Manager Adjustment UI)

#### Add Adjustment Input:

```typescript
// NEW COMPONENT
<div className="mt-2">
  <label className="text-sm font-medium">Billable Adjustment:</label>
  <input
    type="number"
    step="0.5"
    value={billableAdjustment}
    onChange={(e) => setBillableAdjustment(Number(e.target.value))}
    className="w-24 px-2 py-1 border rounded"
  />
  <div className="text-xs text-gray-600">
    Worked Hours: {workedHours}h | Billable Hours:{" "}
    {workedHours + billableAdjustment}h
  </div>
</div>
```

### 3. Lead Submission Validation (NEW)

```typescript
// In TimesheetForm.tsx, before submission
const validateLeadSubmission = async () => {
  if (userRole === "lead") {
    const response = await fetch(
      `/api/v1/team-review/validate-lead-submission?weekStart=${weekStartDate}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await response.json();
    if (!data.canSubmit) {
      setError(data.reason);
      return false;
    }
  }
  return true;
};
```

---

## API Endpoints (NEW/UPDATED)

### 1. POST /api/v1/team-review/reject-entries

```typescript
// Reject specific entries (not entire project)
{
  timesheetId: string;
  projectId: string;
  entryIds: string[]; // specific entries to reject
  reason: string;
}
```

### 2. PUT /api/v1/team-review/billable-adjustment

```typescript
// Update billable adjustment
{
  timesheetId: string;
  projectId: string;
  adjustment: number;
}
```

### 3. GET /api/v1/team-review/validate-lead-submission

```typescript
// Check if lead can submit
Query: { weekStart: string }
Response: { canSubmit: boolean; reason?: string }
```

---

## Implementation Priority

### Phase 1: Critical Fixes (DO FIRST) ✅

1. ✅ Fix `checkAllLeadsApproved` to check for rejections
2. ✅ Fix `checkAllManagersApproved` to check for rejections
3. ✅ Add billable adjustment fields to model
4. ✅ Calculate worked hours on submission

### Phase 2: Entry-Level Rejection (HIGH PRIORITY)

1. Update rejection logic to support entry-level rejection
2. Add UI to select which entries to reject
3. Update frontend to show only rejected entries as editable

### Phase 3: Lead Submission Validation (HIGH PRIORITY)

1. Implement `validateLeadCanSubmit` method
2. Add validation in submission flow
3. Show clear error message to lead

### Phase 4: Manager Adjustment (MEDIUM PRIORITY)

1. Add adjustment API endpoint
2. Add adjustment UI in team review
3. Update billable hours calculation

### Phase 5: Management Verification (MEDIUM PRIORITY)

1. Add check for manager's timesheet submission
2. Update bulk verification logic
3. Add validation in management review page

---

## Testing Scenarios

### Test 1: Entry-Level Rejection

1. Employee submits timesheet with 3 projects
2. Lead approves Project A
3. Lead rejects 2 entries in Project B
4. Lead approves Project C
5. **Expected**: Timesheet status = `lead_rejected`, only 2 entries editable

### Test 2: Lead Submission Block

1. Employee submits timesheet
2. Lead tries to submit their own timesheet
3. **Expected**: Error - "You must review employee timesheets first"

### Test 3: Manager Adjustment

1. Manager approves timesheet with 40 worked hours
2. Manager adds +5 adjustment
3. **Expected**: Billable hours = 45, Worked hours = 40

### Test 4: Partial Approval

1. Employee submits with 2 projects
2. Lead approves Project A
3. **Expected**: Timesheet status remains `submitted` (not `lead_approved`)

---

## Notes

- The current implementation (Phase 1) has been completed
- Entry-level rejection requires significant refactor
- Consider backward compatibility with existing data
- Test thoroughly with multiple scenarios
- Update documentation as changes are implemented
