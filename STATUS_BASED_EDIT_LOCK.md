# Status-Based Edit Locking for Timesheets

## Issue
Previously, submitted or approved timesheets could be opened in "edit mode" and users could make changes. The validation would only fail when clicking Save/Submit, showing an error message:
- ❌ Users could modify entries
- ❌ Only blocked at submission time
- ❌ Confusing UX - why allow editing if it can't be saved?
- ❌ Edit button was clickable for all statuses

## Fix Applied

### 1. Auto-Force View Mode for Non-Draft Timesheets

**File:** `frontend/src/pages/employee/EmployeeTimesheetPage.tsx`
**Lines:** 214-217

```typescript
// Force view mode for submitted, approved, or rejected timesheets
const status = detail.status?.toLowerCase();
const isNonEditable = status && status !== 'draft';
const finalMode = isNonEditable ? 'view' : mode;

setDetailMode(finalMode);
```

**Logic:**
- Check timesheet status when opening
- If status is NOT 'draft' → Force `'view'` mode
- Even if `handleEdit()` is called, it opens in view mode
- Prevents any editing before user can make changes

### 2. Added View Mode Info Alert

**File:** `frontend/src/components/timesheet/TimesheetForm.tsx`
**Lines:** 378-386

```typescript
{/* View Mode Alert */}
{isViewMode && (
  <Alert variant="info">
    <AlertTitle>View Only Mode</AlertTitle>
  </Alert>
)}
```

**Benefit:** Clear message explaining why editing is disabled

### 3. Disabled Edit Button for Non-Draft Timesheets

**File:** `frontend/src/components/timesheet/TimesheetList.tsx`
**Lines:** 522-524, 630-631

**Card View:**
```typescript
<Button
  variant="outline"
  size="sm"
  onClick={onEdit}
  disabled={timesheet.status !== 'draft'}  // ← Disable for non-draft
  title={timesheet.status !== 'draft'
    ? 'Only draft timesheets can be edited'  // ← Helpful tooltip
    : 'Edit Timesheet'}
>
  <EditIcon />
  <span>Edit</span>
</Button>
```

**Table View:** Same disabled logic applied

## Status Flow

### Draft Timesheet:
```
Status: 'draft'
→ Edit button: ENABLED ✅
→ Click Edit: Opens in EDIT mode ✅
→ Can modify entries: YES ✅
→ Can save/submit: YES ✅
```

### Submitted Timesheet:
```
Status: 'submitted' (or 'pending', 'manager_pending', etc.)
→ Edit button: DISABLED ❌ (grayed out)
→ Click Edit: Opens in VIEW mode (if somehow triggered)
→ Can modify entries: NO ❌
→ Shows alert: "View Only Mode"
→ No Save/Submit buttons
```

### Approved Timesheet:
```
Status: 'approved' (or 'manager_approved', 'verified', 'frozen')
→ Edit button: DISABLED ❌ (grayed out)
→ Click Edit: Opens in VIEW mode (if somehow triggered)
→ Can modify entries: NO ❌
→ Shows alert: "View Only Mode"
→ No Save/Submit buttons
```

### Rejected Timesheet:
```
Status: 'rejected' (or 'manager_rejected')
→ Edit button: DISABLED ❌ (grayed out)
→ Click Edit: Opens in VIEW mode (if somehow triggered)
→ Can modify entries: NO ❌
→ Shows alert: "View Only Mode"
→ No Save/Submit buttons
```

## User Experience

### Before Fix:
1. User sees submitted timesheet in list
2. Clicks "Edit" button (enabled)
3. Form opens in edit mode
4. User makes changes
5. Clicks "Save" or "Submit"
6. ❌ **Error:** "Cannot edit submitted timesheet"
7. User frustrated - why was editing allowed?

### After Fix:
1. User sees submitted timesheet in list
2. Edit button is **GRAYED OUT** with tooltip
3. Tooltip says: "Only draft timesheets can be edited"
4. If user somehow triggers edit (shouldn't be possible):
   - Opens in VIEW mode
   - Blue info alert: "View Only Mode - This timesheet is read-only"
   - No Save/Submit buttons
   - All inputs disabled
5. ✅ Clear expectation from the start

## Visual Indicators

### List View:
- **Draft:** Edit button **enabled** (blue outline)
- **Non-Draft:** Edit button **disabled** (gray, cannot click)
- **Hover tooltip:** Explains why disabled

### Form View (if opened in view mode):
- **Blue info alert** at top of form
- **"View Only Mode"** heading
- **Clear message:** "Only draft timesheets can be modified"
- **"Close"** button instead of "Cancel"
- **No action buttons** (Save/Submit hidden)
- **"View Only"** badge on each entry

## Code Changes Summary

| File | Lines | Change |
|------|-------|--------|
| `EmployeeTimesheetPage.tsx` | 214-217 | Auto-force view mode for non-draft |
| `TimesheetForm.tsx` | 378-386 | Added view mode info alert |
| `TimesheetList.tsx` | 522-524 | Disabled edit button (card view) |
| `TimesheetList.tsx` | 630-631 | Disabled edit button (table view) |

## Testing

### Test Cases:
1. ✅ Create draft timesheet → Edit button enabled
2. ✅ Submit timesheet → Edit button becomes disabled
3. ✅ Try to click disabled edit button → Cannot click (grayed out)
4. ✅ Hover over disabled edit button → Tooltip explains why
5. ✅ Open submitted timesheet via list click → Opens in view mode
6. ✅ View mode shows blue info alert
7. ✅ View mode has no Save/Submit buttons
8. ✅ Approved timesheet → Edit button disabled
9. ✅ Rejected timesheet → Edit button disabled
10. ✅ Only draft timesheet → Edit button enabled

## Benefits

1. **Prevents Confusion:** Edit button disabled = clear signal
2. **Better UX:** No wasted effort making changes that can't be saved
3. **Helpful Tooltips:** Explains WHY editing is disabled
4. **Visual Feedback:** Grayed out button, info alert, badges
5. **Proactive Prevention:** Blocks editing BEFORE user tries
6. **Consistent State:** Status determines editability throughout

---

**Status:** ✅ COMPLETED
**Impact:** Users cannot edit non-draft timesheets from the start
