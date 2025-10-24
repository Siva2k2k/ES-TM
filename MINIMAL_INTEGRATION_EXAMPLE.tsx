// Example: Minimal Integration for TimesheetForm.tsx
// Add this to your existing TimesheetForm component

// 1. ADD IMPORTS (add these to your existing imports around line 20)
import { useEnhancedValidation } from '../../hooks/useEnhancedValidation';
import { 
  DynamicHourRange,
  ValidationMessages 
} from './EnhancedTimesheetComponents';
import { EmployeeWorkStatus } from '../../types/validation-enhancements';

// 2. ADD ENHANCED VALIDATION HOOK (add after your existing useTimesheetForm hook around line 100)
export function TimesheetForm({ /* existing props */ }: TimesheetFormProps) {
  const { currentUser } = useAuth();
  
  // Your existing hooks...
  const form = useTimesheetForm(/* existing options */);
  
  // ADD THIS: Enhanced validation integration
  const enhancedValidation = useEnhancedValidation(form.watch, {
    employeeStatus: (currentUser?.employee_status as EmployeeWorkStatus) || EmployeeWorkStatus.REGULAR,
    projectAssignments: [], // TODO: Get from ProjectContext
    trainingPeriod: currentUser?.training_period,
    approvedLeave: currentUser?.approved_leave_days || [],
    allowTraining: true,
    allowLeave: true
  });

  // Use enhanced validation if applicable, otherwise use existing validation
  const shouldUseEnhanced = enhancedValidation.shouldUseEnhancedValidation;
  
  // Your existing component logic...

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="bg-gray-50">
        <div className="flex justify-between items-center">
          {/* Your existing header content */}
          
          {/* REPLACE the existing weekly total section with this: */}
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">Weekly Total</p>
            <p className={`text-2xl font-bold ${
              weeklyTotal > 56 ? 'text-red-600' :
              weeklyTotal >= 40 ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {formatDuration(weeklyTotal)}
            </p>
            
            {/* ADD THIS: Dynamic hour range display */}
            {shouldUseEnhanced && (
              <DynamicHourRange 
                hourRange={enhancedValidation.dynamicHourRange}
                validationSummary={enhancedValidation.validationSummary}
                showDetails={true}
              />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Your existing alerts and validation */}
        
        {/* ADD THIS: Enhanced validation messages */}
        {shouldUseEnhanced && (
          <ValidationMessages
            blockingErrors={enhancedValidation.blockingErrors}
            warnings={enhancedValidation.warnings}
            recommendations={enhancedValidation.recommendations}
            showRecommendations={true}
          />
        )}

        {/* Your existing form content continues... */}
      </CardContent>
    </Card>
  );
}

// 3. TEMPORARY USER TYPE EXTENSION (add this to your types/index.ts or create a separate file)
export interface EnhancedUser extends User {
  employee_status?: 'regular' | 'training' | 'partial' | 'between';
  training_period?: {
    start_date: Date;
    end_date: Date;
    allow_flexible_hours: boolean;
    training_category?: string;
  };
  approved_leave_days?: Date[];
  assignment_percentage?: number;
}

// 4. EXAMPLE: How to test the integration
// Create a test user with training status:
const testTrainingUser: EnhancedUser = {
  ...currentUser,
  employee_status: 'training',
  training_period: {
    start_date: new Date('2025-10-21'), // Monday of current week
    end_date: new Date('2025-11-01'),   // Two weeks of training
    allow_flexible_hours: true,
    training_category: 'technical_training'
  }
};

// To test, temporarily replace currentUser with testTrainingUser in the enhanced validation hook