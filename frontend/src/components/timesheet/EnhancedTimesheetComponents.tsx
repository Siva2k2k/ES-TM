/**
 * Enhanced Entry Type Selector Component
 * Supports training, leave, and other entry types
 */

import { Control, Controller } from 'react-hook-form';
import { Select, type SelectOption } from '../ui/Select';
import { EnhancedTimesheetFormData } from '../../types/enhanced-timesheet.schemas';

interface EntryTypeSelectorProps {
  control: Control<EnhancedTimesheetFormData>;
  index: number;
  employeeStatus?: string;
  allowTraining?: boolean;
  allowLeave?: boolean;
  onTypeChange?: (entryType: string) => void;
}

const BASE_ENTRY_TYPES: SelectOption[] = [
  { value: 'project_task', label: 'Project Work' },
  { value: 'custom_task', label: 'Custom Task' },
  { value: 'non_project', label: 'Non-Project Work' }
];

export function EntryTypeSelector({
  control,
  index,
  employeeStatus,
  allowTraining = false,
  allowLeave = false,
  onTypeChange
}: Readonly<EntryTypeSelectorProps>): JSX.Element {
  // Determine available entry types based on employee status and permissions
  const getAvailableEntryTypes = (): SelectOption[] => {
    const availableTypes = [...BASE_ENTRY_TYPES];
    
    // Add training option for employees in training or if explicitly allowed
    if (employeeStatus === 'training' || allowTraining) {
      availableTypes.push({ value: 'training', label: 'Training' });
    }
    
    // Add leave option if allowed (usually always available)
    if (allowLeave) {
      availableTypes.push(
        { value: 'leave', label: 'Leave' },
        { value: 'holiday', label: 'Holiday' }
      );
    }
    
    return availableTypes;
  };

  const entryTypes = getAvailableEntryTypes();

  return (
    <Controller
      name={`entries.${index}.entry_type`}
      control={control}
      render={({ field, fieldState }) => (
        <Select
          {...field}
          label="Entry Type"
          options={entryTypes}
          error={fieldState.error?.message}
          placeholder="Select entry type"
          onChange={(value) => {
            field.onChange(value);
            onTypeChange?.(value);
          }}
          className="min-w-32"
        />
      )}
    />
  );
}

/**
 * Training Category Selector
 */
interface TrainingCategorySelectorProps {
  control: Control<EnhancedTimesheetFormData>;
  index: number;
  show: boolean;
}

const TRAINING_CATEGORIES: SelectOption[] = [
  { value: 'orientation', label: 'Orientation' },
  { value: 'technical_training', label: 'Technical Training' },
  { value: 'safety_training', label: 'Safety Training' },
  { value: 'compliance_training', label: 'Compliance Training' },
  { value: 'skills_development', label: 'Skills Development' },
  { value: 'mentorship', label: 'Mentorship' },
  { value: 'certification', label: 'Certification' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'e_learning', label: 'E-Learning' },
  { value: 'on_job_training', label: 'On-Job Training' }
];

export function TrainingCategorySelector({
  control,
  index,
  show
}: Readonly<TrainingCategorySelectorProps>): JSX.Element | null {
  if (!show) return null;

  return (
    <Controller
      name={`entries.${index}.training_category`}
      control={control}
      rules={{ required: 'Training category is required' }}
      render={({ field, fieldState }) => (
        <Select
          {...field}
          label="Training Category"
          options={TRAINING_CATEGORIES}
          error={fieldState.error?.message}
          placeholder="Select training category"
          required
        />
      )}
    />
  );
}

/**
 * Leave Type Selector
 */
interface LeaveTypeSelectorProps {
  control: Control<EnhancedTimesheetFormData>;
  index: number;
  show: boolean;
}

const LEAVE_TYPES: SelectOption[] = [
  { value: 'sick_leave', label: 'Sick Leave' },
  { value: 'vacation', label: 'Vacation' },
  { value: 'personal_leave', label: 'Personal Leave' },
  { value: 'emergency_leave', label: 'Emergency Leave' },
  { value: 'maternity_paternity', label: 'Maternity/Paternity' },
  { value: 'bereavement', label: 'Bereavement' },
  { value: 'jury_duty', label: 'Jury Duty' },
  { value: 'training_leave', label: 'Training Leave' }
];

export function LeaveTypeSelector({
  control,
  index,
  show
}: Readonly<LeaveTypeSelectorProps>): JSX.Element | null {
  if (!show) return null;

  return (
    <Controller
      name={`entries.${index}.leave_type`}
      control={control}
      rules={{ required: 'Leave type is required' }}
      render={({ field, fieldState }) => (
        <Select
          {...field}
          label="Leave Type"
          options={LEAVE_TYPES}
          error={fieldState.error?.message}
          placeholder="Select leave type"
          required
        />
      )}
    />
  );
}

/**
 * Dynamic Hour Range Display
 */
interface DynamicHourRangeProps {
  hourRange: string;
  validationSummary: string;
  showDetails?: boolean;
}

export function DynamicHourRange({
  hourRange,
  validationSummary,
  showDetails = false
}: Readonly<DynamicHourRangeProps>): JSX.Element {
  return (
    <div className="text-sm text-gray-600">
      <div className="font-medium">
        Weekly Range: {hourRange}
      </div>
      {showDetails && (
        <div className="text-xs mt-1">
          {validationSummary}
        </div>
      )}
    </div>
  );
}

/**
 * Enhanced Validation Messages Component
 */
interface ValidationMessagesProps {
  blockingErrors: string[];
  warnings: string[];
  recommendations: string[];
  showRecommendations?: boolean;
}

export function ValidationMessages({
  blockingErrors,
  warnings,
  recommendations,
  showRecommendations = true
}: Readonly<ValidationMessagesProps>): JSX.Element | null {
  if (blockingErrors.length === 0 && warnings.length === 0 && recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Blocking Errors */}
      {blockingErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-red-800 mb-2">
            Validation Errors
          </h4>
          <ul className="text-sm text-red-700 space-y-1">
            {blockingErrors.map((error, index) => (
              <li key={`error-${index}-${error.slice(0, 10)}`} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">
            Warnings
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {warnings.map((warning, index) => (
              <li key={`warning-${index}-${warning.slice(0, 10)}`} className="flex items-start">
                <span className="mr-2">⚠</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {showRecommendations && recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            Recommendations
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            {recommendations.map((recommendation, index) => (
              <li key={`rec-${index}-${recommendation.slice(0, 10)}`} className="flex items-start">
                <span className="mr-2">💡</span>
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}