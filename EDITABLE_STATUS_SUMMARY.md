# Editable Timesheet Status Summary

## Status-Based Editing Rules

### ✅ Editable Statuses (Can Edit)
- **draft** - New timesheets, not yet submitted
- **rejected** - Rejected by manager, needs corrections
- **manager_rejected** - Rejected by project manager
- **management_rejected** - Rejected by upper management

### ❌ View-Only Statuses (Cannot Edit)
- **submitted** - Awaiting approval
- **pending** - In approval process
- **manager_pending** - Waiting for manager approval
- **management_pending** - Waiting for management approval
- **approved** - Fully approved
- **manager_approved** - Approved by manager
- **management_approved** - Approved by management
- **verified** - Verified and locked
- **frozen** - Frozen, historical record

## Implementation

### 1. Auto-Force View Mode
**File:** `EmployeeTimesheetPage.tsx:214-217`

```typescript
const status = detail.status?.toLowerCase();
const isEditable = !status || status === 'draft' || status === 'rejected' ||
                   status === 'manager_rejected' || status === 'management_rejected';
const finalMode = isEditable ? mode : 'view';
```

### 2. Edit Button State
**File:** `TimesheetList.tsx:522, 634`

```typescript
<Button
  onClick={onEdit}
  disabled={timesheet.status !== 'draft' && timesheet.status !== 'rejected'}
  title={
    timesheet.status === 'draft' || timesheet.status === 'rejected'
      ? 'Edit Timesheet'
      : 'Only draft and rejected timesheets can be edited'
  }
>
  Edit
</Button>
```

### 3. View Mode Alert
**File:** `TimesheetForm.tsx:383`

```
"This timesheet is read-only and cannot be edited.
Only draft and rejected timesheets can be modified."
```

## User Workflows

### Draft Timesheet Flow:
```
1. Create new timesheet → Status: draft
2. Edit button: ✅ ENABLED
3. Click Edit → Opens in EDIT mode
4. Make changes → Can save
5. Submit → Status: submitted
6. Edit button: ❌ DISABLED
```

### Rejected Timesheet Flow:
```
1. Timesheet rejected → Status: rejected
2. Edit button: ✅ ENABLED
3. Click Edit → Opens in EDIT mode
4. Fix issues based on rejection reason
5. Can save changes
6. Resubmit → Status: submitted
7. Edit button: ❌ DISABLED (again)
```

### Submitted Timesheet Flow:
```
1. Timesheet submitted → Status: submitted
2. Edit button: ❌ DISABLED (grayed out)
3. Tooltip: "Only draft and rejected timesheets can be edited"
4. Click timesheet → Opens in VIEW mode only
5. Info alert shown
6. Cannot modify
```

### Approved Timesheet Flow:
```
1. Timesheet approved → Status: approved
2. Edit button: ❌ DISABLED (grayed out)
3. Cannot edit (historical record)
4. Opens in VIEW mode only
```

## Visual Indicators

| Status | Edit Button | Tooltip | Opens As |
|--------|-------------|---------|----------|
| draft | ✅ Enabled (Blue) | "Edit Timesheet" | Edit mode |
| rejected | ✅ Enabled (Blue) | "Edit Timesheet" | Edit mode |
| submitted | ❌ Disabled (Gray) | "Only draft and rejected..." | View mode |
| approved | ❌ Disabled (Gray) | "Only draft and rejected..." | View mode |
| pending | ❌ Disabled (Gray) | "Only draft and rejected..." | View mode |

## Benefits

1. **Allows Corrections:** Rejected timesheets can be edited to fix issues
2. **Prevents Confusion:** Can't edit submitted/approved timesheets
3. **Clear Feedback:** Tooltips explain why editing is disabled
4. **Proper Workflow:** Draft → Submit → Review → Reject/Approve → (if rejected) Edit → Resubmit
5. **Data Integrity:** Approved timesheets remain locked

## Files Modified

1. `EmployeeTimesheetPage.tsx:214-217` - Auto-force view mode logic
2. `TimesheetForm.tsx:383` - View mode alert message
3. `TimesheetList.tsx:522` - Edit button disabled logic (card view)
4. `TimesheetList.tsx:634` - Edit button disabled logic (table view)

---

**Status:** ✅ COMPLETED
**Result:** Draft and rejected timesheets are editable, all others are view-only
