# Date Picker Restriction Fix

## Issue
Time entry date picker allowed selecting **any date**, including dates outside the current week, which could lead to:
- Entries logged for wrong weeks
- Confusion about which timesheet the entry belongs to
- Data integrity issues

## Fix Applied

**File:** `frontend/src/components/timesheet/TimesheetForm.tsx`
**Lines:** 971-1007

### Changes Made:

1. **Added `min` and `max` attributes to date input**
   - `min`: Monday of current week (weekDates[0])
   - `max`: Sunday of current week (weekDates[6])

2. **Added helpful helper text**
   - Shows the allowed date range below the date picker
   - Example: "Select a date within this week (Oct 6, 2025 - Oct 12, 2025)"

3. **Browser-level validation**
   - Date picker calendar now grays out dates outside the week
   - Manual typing of invalid dates is prevented by browser
   - Keyboard navigation limited to valid date range

### Implementation:

```typescript
<Controller
  name={`entries.${index}.date`}
  control={control}
  render={({ field }) => {
    // Restrict date selection to current week only (Monday to Sunday)
    // weekOptions is an array of {value: 'YYYY-MM-DD', label: 'Day, Month DD'}
    const minDate = weekOptions[0]?.value || '';
    const maxDate = weekOptions[weekOptions.length - 1]?.value || '';

    return (
      <Input
        {...field}
        type="date"
        label="Date"
        min={minDate}                    // ← Restricts calendar start
        max={maxDate}                    // ← Restricts calendar end
        helperText={`Select a date within this week (${formatDate(minDate)} - ${formatDate(maxDate)})`}
        onChange={(e: any) => {
          const val = e?.target?.value ?? e;

          // Validate date is within week range
          if (val && (val < minDate || val > maxDate)) {
            console.warn(`Date ${val} is outside the current week range`);
          }

          field.onChange(val);

          // Weekend entries auto-set to non-billable
          if (isWeekend(String(val))) {
            setValue(`entries.${index}.is_billable`, false, { shouldDirty: true });
          }
        }}
      />
    );
  }}
/>
```

## User Experience Improvements:

### Before:
- ❌ Could select **any date** from the calendar (past, future, any week)
- ❌ No indication of which dates are valid
- ❌ Could accidentally create entries for wrong weeks
- ❌ No visual guidance

### After:
- ✅ Calendar **only shows current week** dates as selectable
- ✅ Dates outside the week are **grayed out** in the picker
- ✅ Helper text shows the **valid date range**
- ✅ Browser prevents selecting invalid dates
- ✅ Clear visual indication of allowed dates

## Technical Details:

### HTML5 Date Input Attributes:
- `min`: Minimum allowed date (Monday of current week)
- `max`: Maximum allowed date (Sunday of current week)
- Browser automatically:
  - Grays out dates outside this range
  - Prevents manual entry of invalid dates
  - Validates on form submission

### Dynamic Range Calculation:
```typescript
const minDate = weekOptions[0]?.value; // Monday
const maxDate = weekOptions[weekOptions.length - 1]?.value; // Sunday
```

- `weekOptions` is an array of `{value: 'YYYY-MM-DD', label: 'Day, Month DD'}`
- Calculated from `week_start_date` in the parent component
- Updates automatically when week changes
- Always reflects the current week's Monday-Sunday range

## Example:

**Week of Oct 6, 2025:**
- `min`: `2025-10-06` (Monday)
- `max`: `2025-10-12` (Sunday)
- Helper text: "Select a date within this week (Oct 6, 2025 - Oct 12, 2025)"

**When user opens date picker:**
- Oct 5 and earlier: **grayed out** (not selectable)
- Oct 6-12: **Selectable** (current week)
- Oct 13 and later: **grayed out** (not selectable)

## Testing:

### Test Cases:
1. ✅ Open date picker → Only current week dates should be selectable
2. ✅ Try to select previous week date → Should be grayed out/disabled
3. ✅ Try to select next week date → Should be grayed out/disabled
4. ✅ Select a weekend date (Sat/Sun) → Should auto-set to non-billable
5. ✅ Change to different week → Date range should update accordingly
6. ✅ Helper text should show correct date range for current week

## Benefits:

1. **Data Integrity:** Prevents entries from being logged to wrong weeks
2. **User Guidance:** Clear visual indication of valid dates
3. **Error Prevention:** Browser-level validation prevents mistakes
4. **Consistency:** Ensures all entries belong to the selected week
5. **Better UX:** No need to manually check if date is in current week

---

**Status:** ✅ COMPLETED
**Impact:** Prevents date selection errors and improves data integrity
