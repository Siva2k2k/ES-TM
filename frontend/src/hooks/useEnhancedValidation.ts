/**
 * Enhanced Timesheet Validation Hook
 * Integrates all validation scenarios with existing functionality
 */

import { useMemo } from 'react';
import { UseFormWatch } from 'react-hook-form';
import {
  ValidationContext,
  EnhancedValidationResult,
  ValidationConfig,
  EmployeeWorkStatus,
  EnhancedTimeEntry
} from '../types/validation-enhancements';
import { EnhancedTimesheetFormData } from '../types/enhanced-timesheet.schemas';
import { validateEnhancedTimesheet, formatDynamicHourRange } from '../utils/enhanced-validation';
import { getTrainingValidationMessages } from '../utils/training-validation';
import { getMidWeekJoinMessages, getLeaveValidationMessages } from '../utils/partial-week-validation';

interface UseEnhancedValidationOptions {
  employeeStatus?: EmployeeWorkStatus;
  projectAssignments?: Array<{
    project_id: string;
    assigned_date: Date;
    assignment_percentage: number;
    is_active: boolean;
  }>;
  trainingPeriod?: {
    start_date?: Date;
    end_date?: Date;
    allow_flexible_hours?: boolean;
  };
  approvedLeave?: Date[];
  workingDaysPerWeek?: number;
  standardHoursPerDay?: number;
  maxHoursPerDay?: number;
}

interface UseEnhancedValidationReturn {
  validation: EnhancedValidationResult | null;
  isValid: boolean;
  blockingErrors: string[];
  warnings: string[];
  recommendations: string[];
  dynamicHourRange: string;
  validationSummary: string;
  shouldUseEnhancedValidation: boolean;
}

/**
 * Enhanced validation hook that supports all scenarios
 */
export function useEnhancedValidation(
  watch: UseFormWatch<EnhancedTimesheetFormData>,
  options: UseEnhancedValidationOptions = {}
): UseEnhancedValidationReturn {
  const weekStartDate = watch('week_start_date');
  
  // Memoize watched values to prevent dependency issues
  const watchedEntries = watch('entries');
  const entries = useMemo(() => watchedEntries || [], [watchedEntries]);

  // Build validation configuration
  const validationConfig: ValidationConfig = useMemo(() => ({
    employee_status: options.employeeStatus || EmployeeWorkStatus.REGULAR,
    project_assignments: options.projectAssignments || [],
    training_start_date: options.trainingPeriod?.start_date,
    training_end_date: options.trainingPeriod?.end_date,
    approved_leave_days: options.approvedLeave || [],
    working_days_per_week: options.workingDaysPerWeek || 5,
    standard_hours_per_day: options.standardHoursPerDay || 8,
    max_hours_per_day: options.maxHoursPerDay || 10,
    week_start_date: weekStartDate ? new Date(weekStartDate) : new Date(),
    allow_flexible_hours: options.trainingPeriod?.allow_flexible_hours || false
  }), [
    options.employeeStatus,
    options.projectAssignments,
    options.trainingPeriod,
    options.approvedLeave,
    options.workingDaysPerWeek,
    options.standardHoursPerDay,
    options.maxHoursPerDay,
    weekStartDate
  ]);

  // Determine if enhanced validation should be used
  const shouldUseEnhancedValidation = useMemo(() => {
    return (
      validationConfig.employee_status !== EmployeeWorkStatus.REGULAR ||
      validationConfig.allow_flexible_hours ||
      (validationConfig.approved_leave_days && validationConfig.approved_leave_days.length > 0) ||
      validationConfig.project_assignments.some(assignment => {
        const assignDate = new Date(assignment.assigned_date);
        const weekStart = validationConfig.week_start_date;
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return assignDate >= weekStart && assignDate <= weekEnd;
      })
    );
  }, [validationConfig]);

  // Run enhanced validation
  const validation = useMemo(() => {
    if (!shouldUseEnhancedValidation || !entries.length) {
      return null;
    }

    const context: ValidationContext = {
      employee_id: 'current-user', // Will be populated from auth context
      week_start_date: validationConfig.week_start_date,
      config: validationConfig,
      existing_entries: entries as EnhancedTimeEntry[]
    };

    return validateEnhancedTimesheet(context);
  }, [entries, validationConfig, shouldUseEnhancedValidation]);

  // Collect additional validation messages
  const additionalMessages = useMemo(() => {
    if (!validation) return { warnings: [], recommendations: [] };

    const allWarnings: string[] = [...validation.warnings];
    const allRecommendations: string[] = [...validation.recommended_actions];

    // Add training-specific messages
    if (validationConfig.employee_status === EmployeeWorkStatus.TRAINING) {
      const totalTrainingHours = entries
        .filter(entry => entry.entry_type === 'training')
        .reduce((sum, entry) => sum + entry.hours, 0);
      
      const totalProjectHours = entries
        .filter(entry => entry.entry_type === 'project_task')
        .reduce((sum, entry) => sum + entry.hours, 0);

      const trainingMessages = getTrainingValidationMessages(
        {
          is_training_period: true,
          training_hours_required: validation.dynamic_limits.training_days * validationConfig.standard_hours_per_day,
          allows_project_work: validationConfig.allow_flexible_hours,
          training_completion_percentage: 0 // Will be calculated in the function
        },
        totalTrainingHours,
        totalProjectHours
      );

      allWarnings.push(...trainingMessages.warnings);
      allRecommendations.push(...trainingMessages.recommendations);
    }

    // Add mid-week join messages
    const midWeekJoinMessages = getMidWeekJoinMessages(
      validation.dynamic_limits.available_days < 5 ? {
        join_date: validationConfig.week_start_date,
        available_days_in_week: validation.dynamic_limits.available_days,
        prorated_hours_required: validation.dynamic_limits.min_weekly_hours,
        adjustment_reason: 'Partial week assignment'
      } : null,
      entries.reduce((sum, entry) => sum + entry.hours, 0)
    );

    allWarnings.push(...midWeekJoinMessages.warnings);
    allRecommendations.push(...midWeekJoinMessages.recommendations);

    // Add leave messages
    if (validationConfig.approved_leave_days && validationConfig.approved_leave_days.length > 0) {
      const leaveMessages = getLeaveValidationMessages(
        {
          approved_leave_days: validationConfig.approved_leave_days || [],
          pending_leave_requests: [],
          emergency_leave_days: [],
          working_days_after_leave: validation.dynamic_limits.available_days,
          adjusted_weekly_requirement: validation.dynamic_limits.min_weekly_hours
        },
        entries.reduce((sum, entry) => sum + entry.hours, 0)
      );

      allWarnings.push(...leaveMessages.warnings);
      allRecommendations.push(...leaveMessages.recommendations);
    }

    return {
      warnings: allWarnings,
      recommendations: allRecommendations
    };
  }, [validation, validationConfig, entries]);

  // Generate validation summary
  const validationSummary = useMemo(() => {
    if (!validation) {
      return 'Standard validation (8-10 hours per weekday, max 56 hours per week)';
    }

    const parts: string[] = [];
    
    if (validationConfig.employee_status === EmployeeWorkStatus.TRAINING) {
      parts.push('Training period');
    }
    
    if (validation.dynamic_limits.leave_days > 0) {
      parts.push(`${validation.dynamic_limits.leave_days} leave day(s)`);
    }
    
    if (validation.dynamic_limits.available_days < 5) {
      parts.push('Partial week');
    }
    
    if (validation.dynamic_limits.has_flexible_schedule) {
      parts.push('Flexible hours');
    }

    const hourRange = formatDynamicHourRange(validation.dynamic_limits);
    
    return parts.length > 0 
      ? `${parts.join(', ')} - ${hourRange}`
      : `Standard validation - ${hourRange}`;
  }, [validation, validationConfig]);

  return {
    validation,
    isValid: validation ? validation.is_valid : true,
    blockingErrors: validation ? validation.blocking_errors : [],
    warnings: additionalMessages.warnings,
    recommendations: additionalMessages.recommendations,
    dynamicHourRange: validation ? formatDynamicHourRange(validation.dynamic_limits) : '40-56h',
    validationSummary,
    shouldUseEnhancedValidation
  };
}

/**
 * Simple hook for backward compatibility
 */
export function useTimesheetValidation(
  watch: UseFormWatch<EnhancedTimesheetFormData>,
  employeeStatus?: string
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  weeklyHourRange: string;
} {
  const enhanced = useEnhancedValidation(watch, {
    employeeStatus: employeeStatus as EmployeeWorkStatus || EmployeeWorkStatus.REGULAR
  });

  return {
    isValid: enhanced.isValid,
    errors: enhanced.blockingErrors,
    warnings: enhanced.warnings,
    weeklyHourRange: enhanced.dynamicHourRange
  };
}