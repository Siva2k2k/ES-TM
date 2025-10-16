# Approval History Feature - User Guide

## Overview
The Approval History feature provides employees with complete visibility into the approval process for their submitted timesheets, supporting multi-manager scenarios with project-wise approval tracking.

## Accessing Approval History

### From Timesheet List View

1. **Navigate to "My Timesheets"**
   - Go to the Employee Timesheet page
   - View your list of timesheets

2. **Locate the History Button**
   - The "History" button appears on all submitted timesheets
   - Draft timesheets do not show the history button (no approvals yet)
   - Button is located next to the "Edit" button

3. **Click "History"**
   - Opens the Approval History modal
   - Displays complete approval timeline

### From Table View

1. **Switch to Table View**
   - Click the "Table" button in the top-right corner
   - Timesheets display in a tabular format

2. **Find the Actions Column**
   - Last column on the right
   - Contains "History" and "Edit" buttons

3. **Click "History"**
   - Opens the same Approval History modal

## Understanding the Approval History Modal

### Modal Structure

```
┌─────────────────────────────────────────────────────────┐
│  📄 Approval History                              [X]    │
│  Week of Jan 1, 2025 - John Doe                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ⏰ Current Approval Status                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Project Alpha                                   │   │
│  │  8 hours • 5 entries                            │   │
│  │                                                  │   │
│  │  ✓ Lead: Jane Smith - Approved                 │   │
│  │  ⏰ Manager: Bob Johnson - Pending              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  📄 Timeline (3 actions)                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ✓ Approved                    🛡️ lead          │   │
│  │  │  Jane Smith                 Jan 15, 2:30 PM  │   │
│  │  │  Project: Project Alpha                      │   │
│  │  │  Submitted → Lead Approved                   │   │
│  │  └──────────────────────────────────────────────│   │
│  │                                                  │   │
│  │  ✓ Approved                    🛡️ manager       │   │
│  │  │  Alice Brown                Jan 14, 10:15 AM │   │
│  │  │  Project: Project Beta                       │   │
│  │  │  Submitted → Manager Approved                │   │
│  │  └──────────────────────────────────────────────│   │
│  │                                                  │   │
│  │  ✗ Rejected                    🛡️ manager       │   │
│  │     Mike Davis                 Jan 13, 3:45 PM  │   │
│  │     Project: Project Gamma                      │   │
│  │     Submitted → Rejected                        │   │
│  │     Reason: Hours exceed project allocation     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  Overall Status: Submitted                              │
└─────────────────────────────────────────────────────────┘
```

## Current Approval Status Section

### What It Shows
- **Project-wise breakdown** of approval status
- **Current state** of each approval (not historical)
- **Pending approvals** that still need action

### Status Indicators

#### Lead Approval (if applicable)
- ✅ **Green**: Approved by lead
- ⏰ **Yellow**: Pending lead approval
- ❌ **Red**: Rejected by lead

#### Manager Approval (always required)
- ✅ **Green**: Approved by manager
- ⏰ **Yellow**: Pending manager approval
- ❌ **Red**: Rejected by manager

### Example Scenarios

#### Scenario 1: Fully Approved Project
```
Project Alpha
8 hours • 5 entries

✓ Lead: Jane Smith - Approved
✓ Manager: Bob Johnson - Approved
```

#### Scenario 2: Partially Approved Project
```
Project Beta
12 hours • 8 entries

✓ Lead: Jane Smith - Approved
⏰ Manager: Bob Johnson - Pending
```

#### Scenario 3: Rejected Project
```
Project Gamma
6 hours • 4 entries

✓ Lead: Jane Smith - Approved
❌ Manager: Mike Davis - Rejected
Reason: Hours exceed project allocation
```

## Timeline Section

### What It Shows
- **Complete history** of all approval actions
- **Chronological order** (newest first)
- **Detailed information** for each action

### Timeline Entry Components

#### 1. Action Icon & Type
- ✅ **Approved**: Green checkmark
- ❌ **Rejected**: Red X
- 👁️ **Verified**: Blue eye (Management verification)
- 💰 **Billed**: Purple dollar sign

#### 2. Approver Information
- **Name**: Full name of approver
- **Role**: Badge showing role (Lead, Manager, Management, Super Admin)
- **Timestamp**: Date and time of action

#### 3. Project Information
- **Project Name**: Which project the approval relates to

#### 4. Status Transition
- **Before**: Status before the action
- **After**: Status after the action
- Example: `Submitted → Manager Approved`

#### 5. Rejection Reason (if applicable)
- **Red box**: Highlighted rejection reason
- **Detailed explanation**: Why the timesheet was rejected

### Reading the Timeline

#### Example 1: Approval Flow
```
✓ Approved                    🛡️ manager
  Bob Johnson                 Jan 15, 2:30 PM
  Project: Project Alpha
  Lead Approved → Manager Approved
```
**Interpretation**: Bob Johnson (Manager) approved the timesheet for Project Alpha on Jan 15 at 2:30 PM, changing status from "Lead Approved" to "Manager Approved".

#### Example 2: Rejection Flow
```
✗ Rejected                    🛡️ lead
  Jane Smith                  Jan 14, 10:15 AM
  Project: Project Beta
  Submitted → Rejected
  
  Reason:
  Time entries do not match project tasks. Please review and resubmit.
```
**Interpretation**: Jane Smith (Lead) rejected the timesheet for Project Beta on Jan 14 at 10:15 AM with a specific reason.

## Multi-Manager Scenarios

### Understanding Multi-Manager Approval

When you work on multiple projects with different managers, each project requires separate approval:

#### Example: 3 Projects, 3 Managers

**Your Timesheet**:
- Project A (Manager: Alice) - 10 hours
- Project B (Manager: Bob) - 15 hours
- Project C (Manager: Carol) - 8 hours

**Approval Process**:
1. You submit timesheet
2. Alice approves Project A ✅
3. Bob approves Project B ✅
4. Carol is still reviewing Project C ⏰

**Result**: Timesheet status remains "Submitted" until ALL managers approve.

### Timeline for Multi-Manager Approval

```
Timeline (5 actions)

✓ Approved                    🛡️ manager
  Alice Brown                 Jan 15, 3:00 PM
  Project: Project A
  Submitted → Manager Approved

✓ Approved                    🛡️ manager
  Bob Johnson                 Jan 15, 2:30 PM
  Project: Project B
  Submitted → Manager Approved

✓ Approved                    🛡️ lead
  Jane Smith                  Jan 15, 11:00 AM
  Project: Project B
  Submitted → Lead Approved

✓ Approved                    🛡️ lead
  Mike Davis                  Jan 15, 10:30 AM
  Project: Project A
  Submitted → Lead Approved

📤 Submitted                   🛡️ employee
  You                         Jan 15, 9:00 AM
  All Projects
  Draft → Submitted
```

## Status Meanings

### Timesheet Statuses

| Status | Meaning | What Happens Next |
|--------|---------|-------------------|
| **Draft** | You're still editing | Submit when ready |
| **Submitted** | Waiting for approvals | Managers review |
| **Lead Approved** | Lead approved (if applicable) | Manager needs to approve |
| **Manager Approved** | All managers approved | Management can verify |
| **Frozen** | Management verified | Ready for billing |
| **Billed** | Processed for payment | Complete |
| **Rejected** | Needs corrections | Fix issues and resubmit |

### Approval Statuses (Per Project)

| Status | Icon | Color | Meaning |
|--------|------|-------|---------|
| **Approved** | ✅ | Green | Approved by this approver |
| **Pending** | ⏰ | Yellow | Waiting for this approver |
| **Rejected** | ❌ | Red | Rejected by this approver |
| **Not Required** | - | Gray | This approval not needed |

## Common Questions

### Q: Why don't I see a History button?
**A**: History buttons only appear on submitted timesheets. Draft timesheets have no approval history yet.

### Q: Why is my timesheet still "Submitted" when some managers approved?
**A**: Your timesheet needs approval from ALL managers on ALL projects. Check the Current Approval Status section to see which approvals are pending.

### Q: What does "Lead Approved" mean?
**A**: Some projects have a Lead role. If your project has a lead, they must approve before the manager. This is an additional approval step.

### Q: Can I see who rejected my timesheet?
**A**: Yes! The timeline shows the approver's name, role, and rejection reason. Look for red ❌ entries in the timeline.

### Q: What should I do if my timesheet is rejected?
**A**: 
1. Read the rejection reason in the timeline
2. Go back to edit your timesheet
3. Fix the issues mentioned
4. Resubmit for approval

### Q: How do I know if all approvals are complete?
**A**: Check the "Overall Status" at the bottom of the Current Approval Status section. When all approvals are complete, the status changes to "Manager Approved" or "Frozen".

### Q: What's the difference between "Manager Approved" and "Frozen"?
**A**: They're the same! "Frozen" means all manager approvals are complete and the timesheet is locked for changes.

### Q: What does "Verified" mean in the timeline?
**A**: Management (higher level) has verified the timesheet. This happens after all manager approvals and before billing.

### Q: What does "Billed" mean?
**A**: Your timesheet has been processed for payment. This is the final status.

## Tips for Using Approval History

### 1. Check Before Asking
Before asking your manager about approval status, check the history to see if they've already acted.

### 2. Understand Rejection Reasons
Read rejection reasons carefully. They tell you exactly what needs to be fixed.

### 3. Track Approval Progress
Use the Current Approval Status section to see which approvals are still pending.

### 4. Learn Approval Patterns
Over time, you'll learn how long approvals typically take and can plan accordingly.

### 5. Keep Records
The approval history serves as a record of all actions. Useful for disputes or questions.

## Mobile Usage

### On Small Screens
- History button shows icon only (💬)
- Modal is full-screen for better readability
- Timeline entries stack vertically
- Touch-friendly buttons and interactions

### On Tablets
- History button shows icon + text
- Modal is centered with max width
- Timeline entries are more spacious
- Optimized for touch and mouse

## Accessibility

### Keyboard Navigation
- **Tab**: Move between buttons
- **Enter/Space**: Activate buttons
- **Escape**: Close modal

### Screen Readers
- All icons have text alternatives
- Status changes are announced
- Timeline is properly structured

## Troubleshooting

### Issue: Modal won't open
**Solution**: Refresh the page and try again. Check your internet connection.

### Issue: History shows "No Approval History"
**Solution**: This is normal for newly submitted timesheets. Wait for approvers to take action.

### Issue: Loading takes too long
**Solution**: Check your internet connection. If problem persists, contact support.

### Issue: Error message appears
**Solution**: Click "Try Again" button. If error persists, refresh the page or contact support.

## Support

If you encounter issues or have questions about approval history:
1. Check this guide first
2. Ask your manager or team lead
3. Contact IT support
4. Submit a help desk ticket

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Feature**: Approval History for Timesheets
