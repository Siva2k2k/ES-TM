# Implementation Status - October 22, 2025

## Overview

This document summarizes the changes made to align the timesheet management system with the comprehensive business requirements provided.

---

## ✅ Completed Changes

### 1. Status Calculation Fix (CRITICAL)

**Problem**: When a lead approves one project-entry, the system was marking the timesheet as `lead_approved` even if other entries were rejected.

**Solution**: Added rejection checking before status updates.

**Files Modified**:

- `backend/src/services/TeamReviewApprovalService.ts`

**Changes**:

```typescript
// NEW METHODS ADDED:

// Check if any lead has rejected entries
private static async checkAnyLeadRejected(
  timesheetId: string,
  session: any
): Promise<boolean>

// Check if any manager has rejected entries
private static async checkAnyManagerRejected(
  timesheetId: string,
  session: any
): Promise<boolean>

// UPDATED APPROVAL LOGIC:
// Before approving, check if any rejection exists
const anyLeadRejected = await this.checkAnyLeadRejected(timesheetId, session);
if (anyLeadRejected) {
  newStatus = 'lead_rejected';
  timesheet.status = newStatus;
} else {
  // Only check for all approved if no rejections exist
  const allLeadsApproved = await this.checkAllLeadsApproved(timesheetId, session);
  if (allLeadsApproved) {
    newStatus = 'lead_approved';
    // ...
  }
}
```

**Impact**:

- ✅ If ANY entry is rejected → Timesheet stays `lead_rejected`
- ✅ If ALL entries are approved → Timesheet moves to `lead_approved`
- ✅ Partial approvals → Timesheet stays `submitted`

---

### 2. Billable Hours vs Worked Hours Distinction

**Problem**: No distinction between worked hours (actual hours) and billable hours (hours to bill client).

**Solution**: Added fields to track worked hours and manager adjustments.

**Files Modified**:

- `backend/src/models/TimesheetProjectApproval.ts`
- `backend/src/services/TimesheetService.ts`

**Schema Changes**:

```typescript
export interface ITimesheetProjectApproval {
  // ... existing fields ...

  // NEW FIELDS:
  worked_hours: number; // Sum of billable entry hours
  billable_hours: number; // worked_hours + billable_adjustment
  billable_adjustment: number; // Manager adjustment (+/-)
}
```

**Calculation Logic**:

```typescript
// On timesheet submission:
const workedHours = projectEntries
  .filter((e) => e.is_billable)
  .reduce((sum, e) => sum + e.hours, 0);

await TimesheetProjectApproval.create({
  // ... other fields ...
  worked_hours: workedHours,
  billable_hours: workedHours, // Initially same
  billable_adjustment: 0, // No adjustment initially
});
```

**Impact**:

- ✅ Clear separation between worked hours and billable hours
- ✅ Manager can adjust billable hours (+/- adjustment)
- ✅ Formula: Billable Hours = Worked Hours + Adjustment

---

### 3. Lead Submission Validation

**Problem**: Lead could submit their timesheet without reviewing employees' timesheets first.

**Solution**: Added validation to check all employees have been reviewed.

**Files Modified**:

- `backend/src/services/TeamReviewApprovalService.ts`
- `backend/src/services/TimesheetService.ts` (already had this)

**New Method**:

```typescript
static async validateLeadCanSubmit(
  leadId: string,
  weekStartDate: Date
): Promise<{
  canSubmit: boolean;
  reason?: string;
  pendingEmployees?: string[]
}>
```

**Logic**:

1. Find all projects where user is a lead
2. For each project, find all employees
3. Check if employee submitted timesheet for that week
4. Check if lead has reviewed the submission (lead_status !== 'pending')
5. If any employee is pending review, block lead submission

**Impact**:

- ✅ Lead cannot submit until all employees reviewed
- ✅ Clear error message showing which employees need review
- ✅ Enforces review hierarchy

---

### 4. Manager Billable Adjustment API

**Problem**: No way for managers to adjust billable hours.

**Solution**: Added API method to update adjustment.

**Files Modified**:

- `backend/src/services/TeamReviewApprovalService.ts`

**New Method**:

```typescript
static async updateBillableAdjustment(
  timesheetId: string,
  projectId: string,
  adjustment: number,
  managerId: string
): Promise<{
  success: boolean;
  approval?: any;
  error?: string
}>
```

**Usage**:

```typescript
// Manager adds 5 hours adjustment
await TeamReviewApprovalService.updateBillableAdjustment(
  timesheetId,
  projectId,
  5, // adjustment
  managerId
);

// Result:
// worked_hours: 40
// billable_adjustment: 5
// billable_hours: 45
```

**Impact**:

- ✅ Manager can adjust billable hours programmatically
- ✅ Adjustment is tracked separately from worked hours
- ✅ Frontend UI can call this API (needs implementation)

---

## 🚧 Pending Changes

### 1. Entry-Level Rejection (HIGH PRIORITY)

**Current State**: When lead/manager rejects, ALL entries in a project are marked as rejected.

**Required State**: Only specific rejected entries should be marked as rejected.

**Implementation Needed**:

```typescript
// NEW API ENDPOINT NEEDED:
POST /api/v1/team-review/reject-entries
{
  timesheetId: string;
  projectId: string;
  entryIds: string[]; // specific entries to reject
  reason: string;
}

// Frontend: Allow lead/manager to select which entries to reject
// Backend: Mark only selected entries as is_rejected = true
```

**Impact**:

- Employee can edit only rejected entries
- Partial rejection workflow becomes clearer
- Better granularity in approval process

---

### 2. Frontend Entry-Level Editing (HIGH PRIORITY)

**Current State**: When timesheet is rejected, ALL entries become editable.

**Required State**: Only entries with `is_rejected = true` should be editable.

**Files to Modify**:

- `frontend/src/components/timesheet/TimesheetForm.tsx`

**Required Change**:

```typescript
// Line ~935
const isEntryEditable = (entry: TimeEntry) => {
  // Create/edit mode: all editable
  if (mode === "edit" || timesheetStatus === "draft") {
    return true;
  }

  // Rejected timesheet: only rejected entries editable
  if (
    timesheetStatus === "lead_rejected" ||
    timesheetStatus === "manager_rejected"
  ) {
    return entry.is_rejected === true;
  }

  // Otherwise not editable
  return false;
};

// Apply to entry row:
<EntryRow
  entry={entry}
  isEditable={isEntryEditable(entry)}
  // ... other props
/>;
```

**Impact**:

- Clear visual indication of which entries need correction
- Prevents accidental editing of approved entries
- Aligns with business requirement

---

### 3. Manager Adjustment UI (MEDIUM PRIORITY)

**Current State**: No UI to adjust billable hours.

**Required State**: Manager can see worked hours and adjust billable hours.

**Files to Modify**:

- `frontend/src/pages/team-review/TeamReviewPageV2.tsx` (or equivalent)

**Required UI**:

```typescript
<div className="mt-4 p-4 bg-gray-50 rounded">
  <h4 className="font-semibold mb-2">Billable Hours</h4>

  <div className="grid grid-cols-3 gap-4 mb-2">
    <div>
      <label className="text-sm text-gray-600">Worked Hours</label>
      <div className="font-medium">{workedHours}h</div>
    </div>

    <div>
      <label className="text-sm text-gray-600">Adjustment</label>
      <input
        type="number"
        step="0.5"
        value={adjustment}
        onChange={(e) => setAdjustment(Number(e.target.value))}
        className="w-20 px-2 py-1 border rounded"
      />
    </div>

    <div>
      <label className="text-sm text-gray-600">Billable Hours</label>
      <div className="font-medium text-blue-600">
        {workedHours + adjustment}h
      </div>
    </div>
  </div>

  <button
    onClick={handleUpdateAdjustment}
    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
  >
    Update Adjustment
  </button>
</div>;

// Handler:
const handleUpdateAdjustment = async () => {
  const response = await fetch(`/api/v1/team-review/billable-adjustment`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      timesheetId,
      projectId,
      adjustment,
    }),
  });
  // ... handle response
};
```

**Impact**:

- Manager has clear control over billable hours
- Adjustment is transparent and tracked
- Aligns with business requirement

---

### 4. Management Verification Prerequisites (MEDIUM PRIORITY)

**Current State**: Management can verify if manager approved, regardless of manager's own timesheet.

**Required State**: Management can only verify if:

1. Manager has approved the project-week
2. Manager has submitted their own timesheet for that week

**Files to Modify**:

- `backend/src/services/TeamReviewApprovalService.ts` (bulk freeze method)

**Required Logic**:

```typescript
// In bulkFreezeProjectWeek method:
// Before freezing, check manager's timesheet
const managerTimesheet = await Timesheet.findOne({
  user_id: managerId,
  week_start_date: weekStartDate,
  status: { $in: ["submitted", "management_pending", "frozen"] },
  deleted_at: null,
});

if (!managerTimesheet) {
  throw new Error(
    "Manager must submit their own timesheet before management can verify"
  );
}
```

**Impact**:

- Enforces complete review hierarchy
- Manager cannot skip their own timesheet
- Aligns with business requirement

---

## 📊 Testing Scenarios

### Test 1: Entry-Level Rejection ✅ (Status Fixed, Entry-Level Pending)

**Steps**:

1. Employee submits timesheet with 3 projects (A, B, C)
2. Lead approves all entries in Project A
3. Lead rejects 2 entries in Project B
4. Lead approves all entries in Project C

**Expected Result**:

- Timesheet status: `lead_rejected` ✅ (Implemented)
- Only 2 entries in Project B should be editable ⏳ (Pending frontend)
- Status remains `lead_rejected` until all rejections fixed ✅ (Implemented)

**Current Status**: Backend logic ✅ | Frontend UI ⏳

---

### Test 2: Lead Submission Block ✅

**Steps**:

1. Employee submits timesheet for Week 1
2. Lead has not reviewed employee's timesheet
3. Lead tries to submit their own timesheet for Week 1

**Expected Result**:

- Error message: "You must review pending employee timesheets first"
- List of employees needing review

**Current Status**: ✅ Implemented

---

### Test 3: Manager Adjustment ⏳

**Steps**:

1. Manager approves timesheet with 40 worked hours
2. Manager adds +5 hours adjustment
3. System calculates billable hours

**Expected Result**:

- Worked Hours: 40h
- Adjustment: +5h
- Billable Hours: 45h

**Current Status**: Backend API ✅ | Frontend UI ⏳

---

### Test 4: Partial Approval ✅

**Steps**:

1. Employee submits timesheet with 2 projects
2. Lead approves Project A
3. Lead has not yet reviewed Project B

**Expected Result**:

- Timesheet status remains `submitted` (not `lead_approved`)
- Once Project B approved → status changes to `lead_approved`

**Current Status**: ✅ Implemented

---

## 🔄 Status Transition Flow

### Current Implementation ✅

```
Employee: draft → submitted
         ↓ (any rejection)
      lead_rejected
         ↓ (all approved)
      lead_approved → manager_approved → frozen

Lead:    draft → submitted → manager_approved → frozen

Manager: draft → submitted → management_pending → frozen
```

### Status Rules ✅ (Implemented)

1. **If ANY entry rejected** → Status = `lead_rejected` or `manager_rejected`
2. **If ALL entries approved** → Status = `lead_approved` or `manager_approved`
3. **Partial approval** → Status stays `submitted`
4. **Lead submission** → Blocked until all employees reviewed

---

## 📝 API Endpoints

### Existing Endpoints ✅

- `POST /api/v1/team-review/approve` - Approve project-week
- `POST /api/v1/team-review/reject` - Reject project-week
- `POST /api/v1/timesheets/:id/submit` - Submit timesheet (with validation)

### New Endpoints (Implemented) ✅

- _(Backend method exists, needs route)_ `PUT /api/v1/team-review/billable-adjustment`
  - Update manager's billable adjustment
  - Body: `{ timesheetId, projectId, adjustment }`

### Needed Endpoints ⏳

- `POST /api/v1/team-review/reject-entries`

  - Reject specific entries (not entire project)
  - Body: `{ timesheetId, projectId, entryIds[], reason }`

- `GET /api/v1/team-review/validate-lead-submission`
  - Check if lead can submit
  - Query: `{ weekStart }`
  - Response: `{ canSubmit, reason?, pendingEmployees[] }`

---

## 🎯 Priority Recommendations

### Immediate (Do First)

1. ✅ **DONE**: Fix status calculation for rejections
2. ⏳ **TODO**: Implement entry-level rejection API
3. ⏳ **TODO**: Update frontend to show only rejected entries as editable

### Short Term (Next Week)

4. ⏳ **TODO**: Add manager adjustment UI
5. ⏳ **TODO**: Add API route for billable adjustment
6. ⏳ **TODO**: Comprehensive testing with multiple scenarios

### Medium Term (Next Sprint)

7. ⏳ **TODO**: Management verification prerequisites
8. ⏳ **TODO**: Resubmission workflow and status tracking
9. ⏳ **TODO**: Audit trail for all adjustments

---

## 🐛 Known Issues

### 1. Project-Level Rejection (Current)

**Issue**: System rejects all entries in a project, not specific entries.
**Workaround**: None currently.
**Fix**: Implement entry-level rejection API.

### 2. Entry Editability (Current)

**Issue**: All entries become editable when timesheet is rejected.
**Workaround**: User guidance to only edit rejected entries.
**Fix**: Update TimesheetForm.tsx to check `entry.is_rejected`.

---

## 📚 Documentation

### Updated Documents

1. ✅ `COMPREHENSIVE_APPROVAL_SYSTEM_REFACTOR.md` - Full technical spec
2. ✅ `IMPLEMENTATION_STATUS_OCT_22_2025.md` - This document

### Existing Documentation (Still Valid)

- `TIMESHEET_3TIER_IMPLEMENTATION_COMPLETE.md`
- `IMPLEMENTATION_COMPLETE_SUMMARY.md`
- `TIMESHEET_APPROVAL_HIERARCHY_PLAN.md`

---

## 🎓 Key Learnings

1. **Status Calculation is Critical**: Small oversight in status logic can break entire approval workflow.

2. **Entry-Level Operations**: The system needs to support both project-level and entry-level operations:

   - Project-level: Bulk approve/reject all entries
   - Entry-level: Selectively approve/reject specific entries

3. **Validation Hierarchy**: Each role has prerequisites:

   - Employee: Must have entries for weekdays
   - Lead: Must review all employees before submitting
   - Manager: Must review all leads/employees
   - Management: Must verify manager's timesheet exists

4. **Worked vs Billable**: Clear distinction needed for billing accuracy:
   - Worked Hours = Actual time spent (audit trail)
   - Billable Hours = Amount to bill client (can be adjusted)

---

## 🚀 Next Steps

1. **Immediate**: Test the rejection status fix with real data
2. **Short Term**: Implement entry-level rejection UI
3. **Medium Term**: Complete manager adjustment feature
4. **Long Term**: Comprehensive E2E testing

---

## 👥 Stakeholder Sign-Off

- [ ] Backend Implementation - _Pending Review_
- [ ] Frontend Implementation - _In Progress_
- [ ] QA Testing - _Not Started_
- [ ] Product Owner Approval - _Not Started_

---

**Last Updated**: October 22, 2025
**Next Review Date**: October 29, 2025
