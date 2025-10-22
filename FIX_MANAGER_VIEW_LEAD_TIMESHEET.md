# Manager View Fix - Lead Timesheet Visibility

## Date: October 22, 2025

## Problem

When a lead:

1. Approved all employee timesheets for a project-week
2. Submitted their own timesheet

The manager could NOT see the project-week group in their review dashboard.

## Root Cause

In `TeamReviewServiceV2.ts` (line 193-216), the logic for **manager view** was:

```typescript
// FOR MANAGER VIEW: Hide groups where Lead hasn't completed all employee reviews
if (approverRole === "manager") {
  if (hasLead) {
    const hasIncompleteLeadReviews = projectWeekApprovals.some((approval) => {
      // Check if employees have pending lead approvals
      return (
        userRole === "employee" &&
        approval.lead_status === "pending" &&
        ts.status === "submitted"
      );
    });

    // ❌ BUG: Skip group if lead has incomplete reviews
    if (hasIncompleteLeadReviews) {
      continue; // Don't show this project-week
    }
  }
}
```

**The problem**: This logic **always** hides the project-week group if there are incomplete lead reviews, even when:

- Lead has already approved all employees
- Lead has submitted their own timesheet
- Manager needs to see the lead's timesheet

## Solution

Updated the logic to include an exception: **Show the project-week group if the lead has submitted their own timesheet**, even if some employees are still pending.

```typescript
// FOR MANAGER VIEW: Hide groups where Lead hasn't completed all employee reviews
// BUT show the group if Lead has submitted their own timesheet
if (approverRole === "manager" || approverRole === "super_admin") {
  if (hasLead) {
    // ✅ NEW: Check if lead has submitted their own timesheet
    const leadTimesheet = weekTimesheets.find(
      (t) =>
        t.user_id?.role === "lead" || t.user_id?._id?.toString() === leadInfo.id
    );

    const hasIncompleteLeadReviews = projectWeekApprovals.some((approval) => {
      // ... same check as before ...
    });

    // ✅ UPDATED: Skip ONLY if lead has incomplete reviews AND hasn't submitted
    if (hasIncompleteLeadReviews && !leadTimesheet) {
      continue;
    }
  }
}
```

## Impact

### Before Fix ❌

**Scenario**: Lead approves all employees + submits own timesheet

- Manager view: **Empty** (no project-week group shown)
- Lead's timesheet: **Hidden** from manager
- Result: Manager cannot approve lead's timesheet

### After Fix ✅

**Scenario**: Lead approves all employees + submits own timesheet

- Manager view: **Project-week group visible**
- Group contains:
  - All employee timesheets (lead_approved status)
  - Lead's own timesheet (submitted status)
- Result: Manager can now approve lead's timesheet

## Business Logic Alignment

This fix aligns with the requirement:

> "Manager can only view until lead reviewed the project-week and submitted his own timesheet"

The manager now sees:

1. **Employee timesheets** that have been lead_approved
2. **Lead's timesheet** that needs manager approval
3. The complete **project-week group** once lead has done their part

## Testing Scenarios

### Test 1: Lead Approved All + Submitted Own ✅

**Steps**:

1. Employee A submits timesheet
2. Employee B submits timesheet
3. Lead approves both employees
4. Lead submits their own timesheet

**Expected Result**:

- Manager sees project-week group with 3 users:
  - Employee A (lead_approved, manager_status: pending)
  - Employee B (lead_approved, manager_status: pending)
  - Lead (submitted, manager_status: pending)

### Test 2: Lead Has Incomplete Reviews ✅

**Steps**:

1. Employee A submits timesheet
2. Employee B submits timesheet
3. Lead approves only Employee A (Employee B still pending)
4. Lead has NOT submitted own timesheet

**Expected Result**:

- Manager does NOT see this project-week group
- Group is hidden until lead completes all reviews

### Test 3: Lead Submitted But Incomplete Reviews ⚠️ (Edge Case)

**Steps**:

1. Employee A submits timesheet
2. Lead submits their own timesheet
3. Employee B submits timesheet later (after lead submitted)

**Expected Result**:

- Manager WILL see the project-week group because lead submitted
- Group shows:
  - Employee A (possibly pending if lead hasn't reviewed yet)
  - Lead (submitted)
  - Employee B (pending lead approval)
- This allows manager to see lead's timesheet even if new submissions arrive

## Files Modified

- `backend/src/services/TeamReviewServiceV2.ts` (Lines 193-225)

## Status

- ✅ Backend fix implemented
- ✅ Compiled successfully
- ⏳ Needs testing in development environment
- ⏳ Needs QA verification

## Next Steps

1. Deploy to development environment
2. Test with real data (lead submission scenarios)
3. Verify manager can see and approve lead timesheets
4. Monitor for any edge cases

---

**Last Updated**: October 22, 2025
