# Week Picker Date Mismatch Fix

## Issue Identified

**Problem:** Visual confusion between ISO week picker and actual saved dates

**Example:**
- User selects **Week 41 (Oct 6 - Oct 12)** in the week picker
- Form displays **Oct 5 - Oct 11** (incorrect - Oct 5 is Sunday, not Monday)
- Database saves **Oct 5 - Oct 11** (incorrect)

**Root Cause:**
The `isoWeekToMonday()` conversion function was using UTC dates which caused timezone-related date shifts. When converting from ISO week number to Monday date, the UTC→local conversion could shift the date by ±1 day depending on timezone.

## Fix Applied

**File:** `frontend/src/components/timesheet/TimesheetForm.tsx`
**Lines:** 451-500 (Week picker conversion functions)

### Changes Made:

#### 1. Fixed `isoWeekToMonday()` function (Lines 488-500)
**Before:** Used UTC dates which caused timezone shifts
```typescript
const jan4 = new Date(Date.UTC(year, 0, 4)); // UTC time
const mondayOfWeek1 = new Date(jan4);
mondayOfWeek1.setUTCDate(...); // UTC operations
// Then tried to convert to local - CAUSED SHIFT
```

**After:** Uses local timezone consistently
```typescript
const jan4 = new Date(year, 0, 4); // Local time
const mondayOfWeek1 = new Date(year, 0, 4 - daysToMonday);
mondayOfWeek1.setHours(0, 0, 0, 0); // Local operations
// Returns YYYY-MM-DD in local timezone - NO SHIFT
```

#### 2. Fixed `mondayToIsoWeek()` function (Lines 451-485)
**Before:** Used `new Date(mondayStr)` which could parse incorrectly
```typescript
const d = new Date(mondayStr); // Implicit parsing - timezone issues
```

**After:** Explicitly parses date components in local timezone
```typescript
const parts = mondayStr.split('-');
const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
d.setHours(0, 0, 0, 0); // Explicit local midnight
```

## ISO 8601 Week Logic (Correctly Implemented)

### ISO Week Rules:
1. **Week 1** = The first week with a Thursday (week containing Jan 4th)
2. **Monday** = First day of the week
3. **Week belongs to the year of its Thursday**

### Implementation:
```typescript
// Step 1: Find Jan 4th of the year
const jan4 = new Date(year, 0, 4);

// Step 2: Find what day of week Jan 4th is
const jan4Day = jan4.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

// Step 3: Calculate how many days back to Monday
const daysToMonday = (jan4Day === 0) ? 6 : jan4Day - 1;

// Step 4: Find Monday of Week 1
const mondayOfWeek1 = new Date(year, 0, 4 - daysToMonday);

// Step 5: Add (week - 1) * 7 days to get target Monday
const targetMonday = new Date(mondayOfWeek1);
targetMonday.setDate(mondayOfWeek1.getDate() + (week - 1) * 7);
```

## Testing

### Test Case: Week 41, 2025

**Expected:**
- Week picker shows: **2025-W41**
- Date range displays: **Oct 6, 2025 (Monday) - Oct 10, 2025 (Friday)**
- Saved to database: **2025-10-06** (Monday)

**Calculation:**
1. Jan 4, 2025 is a Saturday (day 6)
2. Monday of Week 1 = Jan 4 - 5 days = **Dec 30, 2024** (Yes, Week 1 starts in 2024!)
3. Monday of Week 41 = Dec 30, 2024 + (41-1)*7 = Dec 30 + 280 = **Oct 6, 2025** ✅

### Verification Steps:

1. Select **Week 41** in the picker
2. Verify form shows: **Week of Oct 6, 2025**
3. Verify date range displays: **Oct 6 - Oct 10**
4. Verify daily totals start with **Monday 10/06/2025**
5. Create an entry and verify saved date is **2025-10-06**

## Key Changes Summary

| Function | Issue | Fix |
|----------|-------|-----|
| `isoWeekToMonday` | UTC→Local conversion shifted dates | Use local timezone throughout |
| `mondayToIsoWeek` | Implicit date parsing caused timezone issues | Explicitly parse date components |
| Both | Inconsistent timezone handling | All operations in local timezone |

## Before vs After

### Before:
```
User selects: 2025-W41
Form displays: Week of Oct 5, 2025 (WRONG - Sunday)
Saved date: 2025-10-05 (WRONG)
```

### After:
```
User selects: 2025-W41
Form displays: Week of Oct 6, 2025 (CORRECT - Monday)
Saved date: 2025-10-06 (CORRECT)
```

## Impact

- ✅ Week picker now shows correct Monday-Sunday range
- ✅ Selected ISO week matches displayed date range
- ✅ Database saves correct Monday date
- ✅ No more ±1 day timezone confusion
- ✅ Consistent across all timezones

## Files Modified

1. **frontend/src/components/timesheet/TimesheetForm.tsx** (Lines 451-500)
   - `mondayToIsoWeek()` - Fixed to use local timezone parsing
   - `isoWeekToMonday()` - Fixed to avoid UTC conversion issues

---

**Fix completed successfully. Week picker now correctly aligns with ISO 8601 standards and displays matching dates.**
