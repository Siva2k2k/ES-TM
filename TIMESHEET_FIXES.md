# Timesheet System Fixes - Implementation Plan

## Issues Fixed:

### A. Create Timesheet
1. ✅ Week Select Logic - Monday is week start (already correct)
2. ✅ Weekend logic - Saturday(6) and Sunday(0) detection (already correct)
3. ✅ Business Validation - Enhanced with blocking errors
4. ✅ Submit for Approval - Validation enforced before submission

### B. List/Table View
5. ✅ View mode on click - Already implemented
6. ✅ No search - Not present (requirement met)
7. ✅ Improved filtering - Date range filters enhanced

## Changes Made:

### 1. TimesheetForm.tsx
- Enhanced `getValidationWarnings()` to separate **warnings** vs **blocking errors**
- Business validation now BLOCKS submission if:
  - Weekday hours < 8 or > 10
  - Weekly total > 56 hours
- Warnings (non-blocking):
  - Missing weekday entries
  - Weekend hours > 10
  - Weekend billable entries (auto-corrected)

### 2. TimesheetList.tsx
- Period filter already includes date ranges
- Status filter appropriate for timesheet states
- No search functionality (as required)

### 3. Backend TimesheetService.ts
- Weekend validation enforced server-side
- Daily limits validated (8-10 for weekdays, any for weekends)
- Weekly limit < 56 hours

## Testing Checklist:
- [ ] Create timesheet with weekday < 8 hours - should BLOCK submission
- [ ] Create timesheet with weekday > 10 hours - should BLOCK submission
- [ ] Create timesheet with weekly > 56 hours - should BLOCK submission
- [ ] Create timesheet with weekend hours - should be non-billable
- [ ] List view should open timesheets in VIEW mode
- [ ] Filter by date range should work
- [ ] Filter by status should work
- [ ] Weekend entries should auto-set to non-billable
