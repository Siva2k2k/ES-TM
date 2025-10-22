# Billable Hours Adjustment - User Guide

## Overview

Managers can now adjust billable hours for employees' timesheets when reviewing project-week submissions. This feature allows for corrections when actual billable time differs from worked hours.

---

## How to Adjust Billable Hours

### Step 1: Navigate to Team Review

1. Go to **Team Review** page
2. Select your role (Manager/Management)
3. Choose the **Pending** or **All** tab

### Step 2: Locate the Project-Week Card

1. Find the project-week you want to review
2. Click **View User Details** to expand the card
3. You'll see all users who submitted timesheets for that project-week

### Step 3: Expand User Details

1. Click on a specific user's row to expand their details
2. Scroll down past the time entries
3. You'll see a **Billable Hours** section with a blue border

### Step 4: Review Current Hours

The Billable Hours section displays three values:

```
┌─────────────────────────────────────────────────┐
│  💵 Billable Hours                              │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐
│  │ Worked Hours │  │  Adjustment  │  │ Billable Hours │
│  │    40.0h     │  │    +0.0h     │  │     40.0h      │
│  └──────────────┘  └──────────────┘  └────────────────┘
│                                                 │
│  Adjust hours: [ 0.0  ]  [Save]                │
│                                                 │
│  * Use positive values to add hours, negative  │
│    to subtract. Example: +2 or -1.5            │
└─────────────────────────────────────────────────┘
```

- **Worked Hours**: Total hours from billable entries (read-only)
- **Adjustment**: Your modification (+/- hours)
- **Billable Hours**: Final billable amount (Worked + Adjustment)

### Step 5: Enter Adjustment

1. In the **"Adjust hours"** input field, enter:
   - Positive number to add hours: `2` or `+2`
   - Negative number to subtract hours: `-1.5`
   - Zero to remove adjustment: `0`
2. You can use decimals (e.g., `0.5`, `1.5`, `2.5`)

### Step 6: Save the Adjustment

1. Click the **Save** button
2. Wait for the save operation (button shows "Saving...")
3. The display updates automatically with new values

### Step 7: Verify the Change

After saving, the three boxes update:

- **Adjustment** shows your entered value (green if positive, red if negative)
- **Billable Hours** shows the new calculated total

---

## Examples

### Example 1: Add Overtime Hours

**Scenario**: Employee worked 40 hours but you want to bill 42 hours

```
Before:
  Worked Hours: 40.0h
  Adjustment: +0.0h
  Billable Hours: 40.0h

Action: Enter "2" and click Save

After:
  Worked Hours: 40.0h
  Adjustment: +2.0h  (green)
  Billable Hours: 42.0h
```

### Example 2: Subtract Non-Billable Time

**Scenario**: Employee worked 40 hours but 2 hours were non-billable meetings

```
Before:
  Worked Hours: 40.0h
  Adjustment: +0.0h
  Billable Hours: 40.0h

Action: Enter "-2" and click Save

After:
  Worked Hours: 40.0h
  Adjustment: -2.0h  (red)
  Billable Hours: 38.0h
```

### Example 3: Correct Previous Adjustment

**Scenario**: You already added 2 hours but need to change it to 3 hours

```
Before:
  Worked Hours: 40.0h
  Adjustment: +2.0h
  Billable Hours: 42.0h

Action: Enter "3" and click Save

After:
  Worked Hours: 40.0h
  Adjustment: +3.0h  (green)
  Billable Hours: 43.0h
```

### Example 4: Remove Adjustment

**Scenario**: Reset billable hours to match worked hours

```
Before:
  Worked Hours: 40.0h
  Adjustment: +2.0h
  Billable Hours: 42.0h

Action: Enter "0" and click Save

After:
  Worked Hours: 40.0h
  Adjustment: +0.0h
  Billable Hours: 40.0h
```

---

## Common Use Cases

### 1. Overtime Billing

- Employee worked standard hours but client approved overtime billing
- Add positive adjustment for agreed overtime hours

### 2. Pro Bono Work

- Some hours were volunteer/pro bono and shouldn't be billed
- Subtract those hours from billable amount

### 3. Client Discounts

- Client negotiated reduced billing for certain weeks
- Subtract discount hours from billable total

### 4. Training Time

- Employee included training time that isn't billable to client
- Subtract training hours from billable amount

### 5. Meeting Time

- Internal meetings were logged but shouldn't be client-billed
- Subtract meeting hours from billable amount

---

## Important Notes

### Permissions

- ✅ **Managers**: Can view and adjust billable hours
- ✅ **Super Admins**: Can view and adjust billable hours
- ❌ **Leads**: Can view but cannot adjust
- ❌ **Management**: Can view but cannot adjust
- ❌ **Employees**: Cannot access this feature

### Data Validation

- Only numeric values accepted (e.g., 1, 1.5, -2, -0.5)
- Invalid entries show error message
- Changes save immediately to database

### Workflow

- Adjustments can be made **anytime** during review
- Adjustments **do NOT** affect approval status
- You can approve/reject **before or after** adjusting
- Multiple adjustments allowed (latest value applies)

### Best Practices

1. **Document reasons**: Keep notes on why adjustments were made (manual tracking)
2. **Review carefully**: Double-check worked hours before adjusting
3. **Communicate**: Inform employees of significant adjustments
4. **Be consistent**: Use same criteria across all team members
5. **Client agreements**: Only adjust based on client contracts

---

## Troubleshooting

### "Failed to update billable adjustment"

**Cause**: Network error or insufficient permissions

**Solution**:

1. Check your internet connection
2. Verify you have Manager role for this project
3. Refresh the page and try again
4. Contact system administrator if persists

### Adjustment doesn't appear after save

**Cause**: Page needs refresh or browser cache issue

**Solution**:

1. Collapse and re-expand the user details
2. Refresh the browser page
3. Clear browser cache if problem persists

### Cannot click Save button

**Cause**: Button is disabled (saving in progress or invalid input)

**Solution**:

1. Wait for previous save to complete
2. Check that you entered a valid number
3. Look for error messages above the input field

---

## Privacy and Compliance

### Audit Trail

⚠️ **Important**: Currently, adjustments are NOT logged in audit trail.

- Keep manual records of significant adjustments
- Document business justification
- Future enhancement will add automatic audit logging

### Access Control

- All adjustments are tied to your user account
- System tracks who made each adjustment (database level)
- Adjustments visible to other managers with project access

### Billing Impact

- Adjusted billable hours affect billing calculations
- Review carefully before approving for billing
- Coordinate with accounting/billing team

---

## Keyboard Shortcuts

- **Tab**: Navigate to adjustment input
- **Enter**: Save adjustment (when input is focused)
- **Esc**: Cancel (click elsewhere without saving)

---

## Mobile Support

The billable hours adjustment interface is responsive and works on:

- ✅ Desktop browsers (Chrome, Firefox, Edge, Safari)
- ✅ Tablets (iPad, Android tablets)
- ⚠️ Mobile phones (functional but input may be small)

**Recommendation**: Use desktop or tablet for best experience

---

## Getting Help

If you encounter issues or have questions:

1. Check this user guide
2. Review the [Implementation Documentation](BILLABLE_HOURS_IMPLEMENTATION.md)
3. Contact your system administrator
4. Submit a support ticket with:
   - Your role and project name
   - User whose hours you're adjusting
   - Error message (if any)
   - Screenshot of the issue

---

## Feature Requests

Planned enhancements:

- [ ] Adjustment reason field (why adjustment was made)
- [ ] Adjustment history log (view past changes)
- [ ] Bulk adjustment (adjust multiple users at once)
- [ ] Approval for large adjustments (management approval required)
- [ ] Email notification to employees (when hours adjusted)
- [ ] Adjustment limits (max +/- hours per adjustment)
- [ ] Reporting integration (adjustments in billing reports)

Submit feature requests to your project manager or system administrator.

---

## Quick Reference Card

```
┌──────────────────────────────────────────────┐
│  BILLABLE HOURS ADJUSTMENT QUICK GUIDE       │
├──────────────────────────────────────────────┤
│                                              │
│  TO ADD HOURS:    Enter positive number      │
│  Example: 2 or +2 (adds 2 hours)            │
│                                              │
│  TO SUBTRACT:     Enter negative number      │
│  Example: -1.5 (removes 1.5 hours)          │
│                                              │
│  TO RESET:        Enter 0                    │
│                                              │
│  DECIMAL OK:      0.5, 1.5, 2.5, etc.       │
│                                              │
│  ALWAYS SAVE:     Click Save after change    │
│                                              │
│  ACCESS:          Manager/Super Admin only   │
│                                              │
└──────────────────────────────────────────────┘
```

Print this quick reference card and keep it handy!
