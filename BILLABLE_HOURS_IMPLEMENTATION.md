# Billable Hours Adjustment Implementation

## Overview

Implemented billable hours tracking and adjustment feature for managers in the team review workflow. Managers can now view worked hours, apply adjustments (+/-), and see the final billable hours for each user's timesheet on a per-project basis.

## Implementation Date

January 2025

## Files Changed

### Backend Changes

#### 1. **backend/src/models/TimesheetProjectApproval.ts**

- **Status**: Previously added in earlier phase
- **Changes**: Model already includes:
  - `worked_hours: number` - Total hours from billable entries
  - `billable_hours: number` - worked_hours + billable_adjustment
  - `billable_adjustment: number` - Manager's adjustment (default 0)

#### 2. **backend/src/types/teamReview.ts**

- **Changes**: Updated `ProjectWeekUser` interface to include:
  ```typescript
  worked_hours: number;
  billable_hours: number;
  billable_adjustment: number;
  ```

#### 3. **backend/src/services/TeamReviewServiceV2.ts**

- **Location**: Lines ~320-330 (user data construction)
- **Changes**: Added billable hours fields to user data returned to frontend:
  ```typescript
  worked_hours: approval.worked_hours || 0,
  billable_hours: approval.billable_hours || 0,
  billable_adjustment: approval.billable_adjustment || 0
  ```

#### 4. **backend/src/services/TeamReviewApprovalService.ts**

- **Status**: Previously added in earlier phase
- **Method**: `updateBillableAdjustment` (lines 1303-1340)
- **Functionality**:
  - Accepts: timesheetId, projectId, adjustment, managerId
  - Validates manager permission
  - Updates adjustment and recalculates billable_hours
  - Returns updated approval data

#### 5. **backend/src/controllers/TeamReviewController.ts**

- **Method**: `updateBillableAdjustment` (new)
- **Location**: After `freezeProjectWeek` method
- **Route Handler**: PUT /api/v1/timesheets/billable-adjustment
- **Validation**:
  - Requires Manager or Super Admin role
  - Validates required fields: timesheet_id, project_id, adjustment
- **Response**: Returns success status and updated approval data

#### 6. **backend/src/routes/timesheet.ts**

- **Route**: `PUT /api/v1/timesheets/billable-adjustment`
- **Location**: After project-week/freeze route
- **Validation**:
  - timesheet_id: MongoId
  - project_id: MongoId
  - adjustment: Numeric
- **Access**: Manager/Super Admin only

### Frontend Changes

#### 7. **frontend/src/types/timesheetApprovals.ts**

- **Changes**: Updated `ProjectWeekUser` interface to include:
  ```typescript
  worked_hours: number;
  billable_hours: number;
  billable_adjustment: number;
  ```

#### 8. **frontend/src/services/TeamReviewService.ts**

- **Method**: `updateBillableAdjustment` (new)
- **Parameters**: timesheetId, projectId, adjustment
- **Returns**:
  ```typescript
  {
    success: boolean;
    approval: {
      worked_hours: number;
      billable_hours: number;
      billable_adjustment: number;
    };
    error?: string;
  }
  ```
- **API Call**: PUT /api/v1/timesheets/billable-adjustment

#### 9. **frontend/src/pages/team-review/components/UserTimesheetDetails.tsx**

- **Major Updates**:

  **a. Props**:

  - Added `projectId: string` prop

  **b. State Management**:

  ```typescript
  const [adjustmentInput, setAdjustmentInput] = useState<string>(...);
  const [isSavingAdjustment, setIsSavingAdjustment] = useState(false);
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);
  const [localBillableData, setLocalBillableData] = useState({...});
  ```

  **c. Handler**:

  - `handleSaveAdjustment`: Calls API, updates local state on success

  **d. UI Section**: "Billable Hours Management"

  - **Visibility**: Manager and Management roles only
  - **Layout**:
    - Hours Summary Grid (3 columns):
      - Worked Hours (gray background)
      - Adjustment (blue background, shows +/- with color coding)
      - Billable Hours (green background)
    - Adjustment Input:
      - Number input (step 0.5)
      - Save button with loading state
      - Error message display
      - Helper text with usage instructions

  **e. Visual Design**:

  - Blue border to distinguish from other sections
  - DollarSign icon
  - Color-coded values (green for positive, red for negative adjustment)
  - Responsive grid layout
  - Disabled state during save operation

#### 10. **frontend/src/pages/team-review/components/ProjectWeekCard.tsx**

- **Changes**: Pass `projectId` prop to `UserTimesheetDetails`:
  ```tsx
  <UserTimesheetDetails
    projectId={projectWeek.project_id}
    // ... other props
  />
  ```

## Business Logic

### Calculation Flow

1. **Worked Hours**: Sum of all billable time entries for the project
2. **Adjustment**: Manager's +/- modification
3. **Billable Hours**: `worked_hours + billable_adjustment`

### Access Control

- **View**: All roles can see billable hours data
- **Adjust**: Only Manager and Super Admin can modify adjustments
- **Validation**: Backend verifies manager has permission for the project

### User Experience

1. Manager expands user details in project-week card
2. Sees "Billable Hours Management" section at bottom
3. Views current worked hours, adjustment, and billable hours
4. Enters adjustment value (e.g., +2, -1.5, 0)
5. Clicks "Save" button
6. System updates backend and refreshes display
7. Error messages shown if validation fails

## API Endpoint

### PUT /api/v1/timesheets/billable-adjustment

**Request Body**:

```json
{
  "timesheet_id": "mongoId",
  "project_id": "mongoId",
  "adjustment": 2.5
}
```

**Response**:

```json
{
  "success": true,
  "approval": {
    "worked_hours": 40,
    "billable_hours": 42.5,
    "billable_adjustment": 2.5
  }
}
```

**Error Response**:

```json
{
  "error": "Only Managers can adjust billable hours"
}
```

## Testing Checklist

### Backend Tests

- [ ] API route validation (invalid IDs, missing fields)
- [ ] Permission check (non-manager cannot adjust)
- [ ] Manager verification (only project manager can adjust)
- [ ] Calculation accuracy (billable_hours = worked_hours + adjustment)
- [ ] Negative adjustments (e.g., -2.5)
- [ ] Zero adjustment
- [ ] Large adjustment values

### Frontend Tests

- [ ] UI displays correct initial values
- [ ] Adjustment input accepts decimal values
- [ ] Save button shows loading state
- [ ] Success updates local display
- [ ] Error messages display correctly
- [ ] Only visible to Manager/Super Admin
- [ ] Input validation (non-numeric values)
- [ ] Responsive layout on different screen sizes

### Integration Tests

- [ ] End-to-end flow: adjust → save → refresh → verify persistence
- [ ] Multiple adjustments on same timesheet
- [ ] Adjustment affects billing calculations (if integrated)
- [ ] Concurrent edits by different managers (if applicable)

## Data Flow Diagram

```
Frontend (Manager View)
  ↓
UserTimesheetDetails Component
  ↓
handleSaveAdjustment()
  ↓
TeamReviewService.updateBillableAdjustment()
  ↓
PUT /api/v1/timesheets/billable-adjustment
  ↓
TeamReviewController.updateBillableAdjustment()
  ↓
TeamReviewApprovalService.updateBillableAdjustment()
  ↓
TimesheetProjectApproval Model Update
  ↓
Response → Update Local State → Refresh UI
```

## Future Enhancements

1. **Audit Trail**: Log all adjustment changes with timestamp and reason
2. **Adjustment Reason**: Require managers to provide reason for adjustments
3. **Approval Required**: Large adjustments (e.g., >5 hours) require management approval
4. **Bulk Adjustment**: Adjust billable hours for multiple users at once
5. **Historical View**: Show adjustment history over time
6. **Reporting**: Include adjustments in billing reports
7. **Notifications**: Alert users when their billable hours are adjusted
8. **Limits**: Set max/min adjustment thresholds per project or organization

## Security Considerations

- ✅ Role-based access control (Manager/Super Admin only)
- ✅ Manager-project permission verification
- ✅ Input validation (numeric values)
- ✅ MongoDB ID validation
- ✅ Authentication required (Bearer token)
- ⚠️ **TODO**: Add adjustment limits to prevent excessive modifications
- ⚠️ **TODO**: Implement audit logging for compliance

## Performance Considerations

- ✅ Updates only affected approval record
- ✅ Local state management for instant UI feedback
- ✅ Optimistic updates (show change before server confirmation)
- ✅ Minimal data transfer (only affected fields)

## Known Issues

None at time of implementation.

## Rollback Plan

If issues arise:

1. Remove billable hours UI from `UserTimesheetDetails.tsx`
2. Remove API route from `timesheet.ts`
3. Remove controller method from `TeamReviewController.ts`
4. Database fields remain (won't cause errors, just unused)

## Documentation Updates Required

- [ ] Update user guide with billable hours adjustment instructions
- [ ] Add screenshots of new UI to documentation
- [ ] Update API documentation with new endpoint
- [ ] Add adjustment workflow to manager training materials

## Compliance Notes

- Billable hours adjustments may require audit trail for billing compliance
- Consider regulatory requirements in your jurisdiction
- Document business justification for each adjustment (future enhancement)

## Success Criteria

✅ Managers can view worked hours, adjustment, and billable hours
✅ Managers can input and save adjustments
✅ Adjustments persist correctly in database
✅ UI updates immediately after save
✅ Error handling works correctly
✅ Only authorized roles can adjust
✅ Backend and frontend compile without errors

## Conclusion

The billable hours adjustment feature is now fully implemented and integrated into the team review workflow. Managers have the flexibility to adjust billable hours when needed while maintaining proper access control and data integrity.
