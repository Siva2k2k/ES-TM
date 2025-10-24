# Enhanced Timesheet Validation Integration Guide

This guide provides step-by-step instructions for integrating the enhanced timesheet validation system into your existing ES-TM Claude application.

## 🚀 Quick Start Integration

### Step 1: Add User Profile Extensions

First, we need to extend the User type to support training periods and employee status:

**File: `frontend/src/types/index.ts`** (Add to existing User interface)

```typescript
// Add these fields to your existing User interface
export interface User {
  // ... existing fields
  employee_status?: "regular" | "training" | "partial" | "between";
  training_period?: {
    start_date: Date;
    end_date: Date;
    allow_flexible_hours: boolean;
    training_category?: string;
  };
  approved_leave_days?: Date[];
  assignment_percentage?: number; // For partial assignments
}
```

### Step 2: Update AuthContext to Support Enhanced Validation

**File: `frontend/src/store/contexts/AuthContext.tsx`** (Add after line 15)

```typescript
// Add these to AuthContextType interface
interface AuthContextType {
  // ... existing fields
  getEmployeeValidationConfig: () => {
    employeeStatus: EmployeeWorkStatus;
    projectAssignments: any[];
    trainingPeriod?: any;
    approvedLeave: Date[];
  };
  updateEmployeeStatus: (status: EmployeeWorkStatus) => void;
}
```

**Add these methods to AuthProvider:**

```typescript
// Add after line 80 in AuthProvider
const getEmployeeValidationConfig = useCallback(() => {
  if (!currentUser)
    return {
      employeeStatus: "regular" as EmployeeWorkStatus,
      projectAssignments: [],
      approvedLeave: [],
    };

  return {
    employeeStatus: (currentUser.employee_status ||
      "regular") as EmployeeWorkStatus,
    projectAssignments: [], // Will be populated from ProjectContext
    trainingPeriod: currentUser.training_period,
    approvedLeave: currentUser.approved_leave_days || [],
  };
}, [currentUser]);

const updateEmployeeStatus = useCallback(
  (status: EmployeeWorkStatus) => {
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        employee_status: status,
      });
    }
  },
  [currentUser]
);
```

### Step 3: Integrate Enhanced Validation in TimesheetForm

**File: `frontend/src/components/timesheet/TimesheetForm.tsx`** (Replace around line 20)

```typescript
// Add these imports at the top
import { useEnhancedValidation } from "../../hooks/useEnhancedValidation";
import {
  EntryTypeSelector,
  TrainingCategorySelector,
  LeaveTypeSelector,
  DynamicHourRange,
  ValidationMessages,
} from "./EnhancedTimesheetComponents";
import { EmployeeWorkStatus } from "../../types/validation-enhancements";

// Add after the existing useTimesheetForm hook (around line 100)
const { getEmployeeValidationConfig } = useAuth();
const validationConfig = getEmployeeValidationConfig();

// Use enhanced validation if needed
const enhancedValidation = useEnhancedValidation(form.watch, {
  employeeStatus: validationConfig.employeeStatus,
  projectAssignments: validationConfig.projectAssignments,
  trainingPeriod: validationConfig.trainingPeriod,
  approvedLeave: validationConfig.approvedLeave,
  allowTraining: true,
  allowLeave: true,
});

// Determine which validation to use
const shouldUseEnhanced = enhancedValidation.shouldUseEnhancedValidation;
const currentValidation = shouldUseEnhanced
  ? enhancedValidation
  : {
      isValid: true,
      blockingErrors: [],
      warnings: [],
      recommendations: [],
      dynamicHourRange: "40-56h",
      validationSummary: "Standard validation",
    };
```

### Step 4: Update TimesheetForm UI Components

**Replace the weekly total display section (around line 442):**

```tsx
{
  /* Enhanced Weekly Total with Dynamic Range */
}
<div className="text-center">
  <p className="text-sm font-medium text-gray-700">Weekly Total</p>
  <p
    className={`text-2xl font-bold ${
      weeklyTotal > 56
        ? "text-red-600"
        : weeklyTotal >= 40
        ? "text-green-600"
        : "text-yellow-600"
    }`}
  >
    {formatDuration(weeklyTotal)}
  </p>
  {shouldUseEnhanced && (
    <DynamicHourRange
      hourRange={currentValidation.dynamicHourRange}
      validationSummary={currentValidation.validationSummary}
      showDetails={true}
    />
  )}
</div>;
```

**Update the entry type selection (around line 1200):**

```tsx
{
  /* Enhanced Entry Type Selection */
}
<EntryTypeSelector
  control={control}
  index={index}
  employeeStatus={validationConfig.employeeStatus}
  allowTraining={true}
  allowLeave={true}
  onTypeChange={(entryType) => {
    // Reset conditional fields when type changes
    if (entryType !== "training") {
      setValue(`entries.${index}.training_category`, "");
    }
    if (entryType !== "leave") {
      setValue(`entries.${index}.leave_type`, "");
    }
    if (entryType === "leave" || entryType === "training") {
      setValue(`entries.${index}.is_billable`, false);
    }
  }}
/>;

{
  /* Conditional Training Category */
}
<TrainingCategorySelector
  control={control}
  index={index}
  show={watch(`entries.${index}.entry_type`) === "training"}
/>;

{
  /* Conditional Leave Type */
}
<LeaveTypeSelector
  control={control}
  index={index}
  show={watch(`entries.${index}.entry_type`) === "leave"}
/>;
```

**Add enhanced validation messages (around line 350):**

```tsx
{
  /* Enhanced Validation Messages */
}
{
  shouldUseEnhanced && (
    <ValidationMessages
      blockingErrors={currentValidation.blockingErrors}
      warnings={currentValidation.warnings}
      recommendations={currentValidation.recommendations}
      showRecommendations={true}
    />
  );
}
```

### Step 5: Update Backend TimesheetService Integration

**File: `backend/src/services/TimesheetService.ts`** (Add around line 50)

```typescript
// Import enhanced validation service
import {
  EnhancedTimesheetValidationService,
  EnhancedTimeEntry
} from './EnhancedTimesheetValidationService';

// Add method to create validation config from user data
private static createValidationConfigFromUser(
  user: IUser,
  weekStartDate: Date
): BackendValidationConfig {
  // Get user's project assignments
  const projectAssignments = user.project_assignments || [];

  // Get approved leave days (from HR system or user profile)
  const approvedLeave = user.approved_leave_days || [];

  return EnhancedTimesheetValidationService.createValidationConfig(
    user,
    weekStartDate,
    projectAssignments,
    approvedLeave
  );
}
```

**Update the validation logic in createTimesheet method (around line 200):**

```typescript
// Enhanced validation integration
const validationConfig = this.createValidationConfigFromUser(
  user,
  normalizedWeekStart
);

if (
  EnhancedTimesheetValidationService.shouldUseEnhancedValidation(
    validationConfig
  )
) {
  // Use enhanced validation
  const enhancedEntries: EnhancedTimeEntry[] = sanitizedEntries.map(
    (entry) => ({
      ...entry,
      date: new Date(entry.date),
      entry_type: entry.entry_type as any,
      leave_type: entry.leave_type as any,
      training_category: entry.training_category,
    })
  );

  const validationResult =
    EnhancedTimesheetValidationService.validateEnhancedTimesheet(
      enhancedEntries,
      validationConfig
    );

  if (!validationResult.is_valid) {
    throw new ValidationError(validationResult.blocking_errors.join("; "));
  }

  // Log warnings for audit
  if (validationResult.warnings.length > 0) {
    console.log("Timesheet validation warnings:", validationResult.warnings);
  }
} else {
  // Use existing validation logic for regular employees
  // ... existing validation code
}
```

### Step 6: Database Schema Updates (Optional - No Breaking Changes)

The enhanced validation works with existing schema but you can optionally add these fields:

**User Collection Enhancement:**

```javascript
// Optional: Add to User schema
{
  employee_status: {
    type: String,
    enum: ['regular', 'training', 'partial', 'between'],
    default: 'regular'
  },
  training_period: {
    start_date: Date,
    end_date: Date,
    allow_flexible_hours: { type: Boolean, default: false },
    training_category: String
  },
  approved_leave_days: [Date],
  assignment_percentage: { type: Number, default: 100 }
}
```

**TimeEntry Collection Enhancement:**

```javascript
// Optional: Add to TimeEntry schema
{
  entry_type: {
    type: String,
    enum: ['project_task', 'custom_task', 'non_project', 'leave', 'holiday', 'training'],
    default: 'project_task'
  },
  leave_type: {
    type: String,
    enum: ['sick_leave', 'vacation', 'personal_leave', 'emergency_leave',
           'maternity_paternity', 'bereavement', 'jury_duty', 'training_leave']
  },
  training_category: String,
  is_approved_leave: { type: Boolean, default: false },
  supervisor_notes: String
}
```

## 🎯 Feature Rollout Strategy

### Phase 1: Basic Integration (Immediate)

1. Add enhanced validation files to the project
2. Integrate enhanced validation hook in TimesheetForm
3. Add dynamic hour range display
4. Test with regular employees (should see no changes)

### Phase 2: Training Support (Week 1)

1. Add training entry type selector
2. Enable training period validation
3. Test with training employees
4. Add admin controls for training period management

### Phase 3: Leave Integration (Week 2)

1. Add leave entry type selector
2. Integrate with leave approval system
3. Test leave day adjustments
4. Add leave calendar integration

### Phase 4: Mid-Week Assignments (Week 3)

1. Add project assignment date tracking
2. Enable mid-week join detection
3. Test partial week scenarios
4. Add admin notification for mid-week assignments

## 🔧 Configuration Options

### Environment Variables

```bash
# Enable enhanced validation features
ENHANCED_VALIDATION_ENABLED=true
TRAINING_VALIDATION_ENABLED=true
LEAVE_VALIDATION_ENABLED=true
PARTIAL_WEEK_VALIDATION_ENABLED=true

# Default validation settings
DEFAULT_MIN_TRAINING_HOURS=6
DEFAULT_FLEXIBLE_SCHEDULE=true
WEEKEND_WORK_ALLOWED=false
```

### Feature Flags (in AuthContext or Config)

```typescript
const featureFlags = {
  enhancedValidation: true,
  trainingPeriodSupport: true,
  leaveValidation: true,
  partialWeekSupport: true,
  dynamicHourRanges: true,
};
```

## 🧪 Testing Integration

### 1. Create Test Scenarios

**File: `frontend/src/components/timesheet/__tests__/enhanced-validation.test.tsx`**

```typescript
import { renderHook } from "@testing-library/react";
import { useEnhancedValidation } from "../../../hooks/useEnhancedValidation";
import { EmployeeWorkStatus } from "../../../types/validation-enhancements";

describe("Enhanced Validation Integration", () => {
  test("training employee gets flexible validation", () => {
    const mockWatch = jest
      .fn()
      .mockReturnValue([
        { entry_type: "training", hours: 6, date: "2025-10-24" },
      ]);

    const { result } = renderHook(() =>
      useEnhancedValidation(mockWatch, {
        employeeStatus: EmployeeWorkStatus.TRAINING,
        allowTraining: true,
      })
    );

    expect(result.current.shouldUseEnhancedValidation).toBe(true);
    expect(result.current.dynamicHourRange).toContain("flexible");
  });
});
```

### 2. Manual Testing Checklist

- [ ] Regular employee sees standard validation (no changes)
- [ ] Training employee can log training hours with flexible validation
- [ ] Mid-week assignment adjusts hour requirements correctly
- [ ] Leave days reduce weekly requirements appropriately
- [ ] Dynamic hour ranges display correctly
- [ ] Validation messages are context-appropriate
- [ ] Backend validation matches frontend validation

## 🚨 Troubleshooting Common Issues

### Issue 1: Type Errors

**Problem:** TypeScript errors with enhanced types
**Solution:** Ensure all new type files are imported correctly:

```typescript
// Add to your main types/index.ts
export * from "./validation-enhancements";
export * from "./enhanced-timesheet.schemas";
```

### Issue 2: Validation Not Activating

**Problem:** Enhanced validation not triggering
**Solution:** Check employee status detection:

```typescript
// Debug employee status
console.log("Employee status:", validationConfig.employeeStatus);
console.log(
  "Should use enhanced:",
  enhancedValidation.shouldUseEnhancedValidation
);
```

### Issue 3: UI Components Not Showing

**Problem:** Enhanced components not rendering
**Solution:** Verify conditional rendering:

```typescript
// Ensure proper condition checks
{
  shouldUseEnhanced && <EnhancedComponent />;
}
```

## 📊 Monitoring & Analytics

### Key Metrics to Track

1. **Validation Usage**: Track how often enhanced validation is used vs standard
2. **Training Completion**: Monitor training hour completion rates
3. **Partial Week Frequency**: Track mid-week assignment frequency
4. **Leave Integration**: Monitor leave day validation accuracy

### Logging Enhancement

```typescript
// Add to your logging service
const logValidationEvent = (event: {
  userId: string;
  validationType: "standard" | "enhanced";
  employeeStatus: string;
  weekStartDate: string;
  totalHours: number;
  validationResult: "pass" | "fail";
  errors?: string[];
}) => {
  // Send to analytics service
  analytics.track("timesheet_validation", event);
};
```

## 🎉 Success Criteria

Your integration is successful when:

✅ **Backward Compatibility**: Existing employees experience no changes
✅ **Training Support**: Training employees can log flexible hours without validation errors
✅ **Mid-Week Assignments**: Partial week scenarios show appropriate hour requirements
✅ **Leave Integration**: Leave days automatically adjust weekly requirements
✅ **Dynamic UI**: Hour ranges and validation messages adapt to context
✅ **Performance**: No noticeable performance impact on form interactions

## 🔄 Rollback Plan

If issues arise, you can safely rollback by:

1. **Disable Enhanced Validation**: Set feature flag to false
2. **Revert TimesheetForm**: Remove enhanced validation hook usage
3. **Keep Files**: Leave enhanced validation files for future use
4. **Database**: No schema changes needed for rollback

The enhanced system is designed to be completely optional and non-breaking, allowing for safe experimentation and gradual rollout.
