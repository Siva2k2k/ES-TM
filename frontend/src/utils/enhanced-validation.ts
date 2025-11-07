/**
 * Enhanced Timesheet Validation Utilities
 * Supporting training periods, mid-week joins, and leave handling
 */

import {
  ExtendedEntryType,
  EmployeeWorkStatus,
  ValidationConfig,
  DynamicHourLimits,
  ValidationContext,
  EnhancedValidationResult,
  EnhancedTimeEntry,
  TrainingValidation,
  MidWeekJoinValidation,
  LeaveValidation
} from '../types/validation-enhancements';

/**
 * Calculate dynamic hour limits based on employee status and circumstances
 */
export function calculateDynamicHourLimits(
  config: ValidationConfig
): DynamicHourLimits {
  const {
    employee_status,
    project_assignments,
    training_start_date,
    training_end_date,
    approved_leave_days = [],
    standard_hours_per_day,
    max_hours_per_day,
    week_start_date,
    allow_flexible_hours
  } = config;

  // Calculate week dates
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(week_start_date);
    date.setDate(week_start_date.getDate() + i);
    return date;
  });

  // Filter to working days (Monday-Friday by default)
  const workingDates = weekDates.filter(date => {
    const dayOfWeek = date.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Mon=1, Fri=5
  });

  // Count leave days in this week
  const leaveDaysInWeek = approved_leave_days.filter(leaveDate => {
    return workingDates.some(workDate => 
      workDate.toDateString() === leaveDate.toDateString()
    );
  }).length;

  // Calculate training days
  let trainingDays = 0;
  let projectDays = 0;

  if (employee_status === EmployeeWorkStatus.TRAINING && training_start_date && training_end_date) {
    // Count days in training period that fall within this week
    trainingDays = workingDates.filter(date => 
      date >= training_start_date && date <= training_end_date
    ).length;
    
    // Remaining days could be project work (if any assignments)
    projectDays = workingDates.length - trainingDays - leaveDaysInWeek;
  } else if (employee_status === EmployeeWorkStatus.PARTIAL_ASSIGNMENT) {
    // Calculate based on project assignment percentages
    const totalAssignmentPercentage = project_assignments
      .filter(assignment => assignment.is_active)
      .reduce((sum, assignment) => sum + assignment.assignment_percentage, 0);
    
    projectDays = Math.floor((workingDates.length - leaveDaysInWeek) * (totalAssignmentPercentage / 100));
    trainingDays = (workingDates.length - leaveDaysInWeek) - projectDays;
  } else {
    // Regular employee - all non-leave days are project days
    projectDays = workingDates.length - leaveDaysInWeek;
    trainingDays = 0;
  }

  // Calculate available working days
  const availableDays = workingDates.length - leaveDaysInWeek;

  // Determine hour requirements based on employee status
  let minWeeklyHours: number;
  let maxWeeklyHours: number;
  let hasFlexibleSchedule = false;
  const validationNotes: string[] = [];

  switch (employee_status) {
    case EmployeeWorkStatus.TRAINING:
      if (allow_flexible_hours) {
        // Flexible training schedule
        minWeeklyHours = Math.max(8, availableDays * 6); // Minimum 6 hours per day
        maxWeeklyHours = availableDays * max_hours_per_day;
        hasFlexibleSchedule = true;
        validationNotes.push('Training period allows flexible hours (6-10 hours per day)');
      } else {
        // Full-time training requires standard hours
        minWeeklyHours = availableDays * standard_hours_per_day;
        maxWeeklyHours = availableDays * max_hours_per_day;
        validationNotes.push('Full-time training requires standard 8-10 hours per day');
      }
      break;

    case EmployeeWorkStatus.PARTIAL_ASSIGNMENT: {
      // Prorated based on assignment percentage
      const totalAssignmentPercentage = project_assignments
        .filter(assignment => assignment.is_active)
        .reduce((sum, assignment) => sum + assignment.assignment_percentage, 0);
      
      const proratedDays = availableDays * (totalAssignmentPercentage / 100);
      minWeeklyHours = Math.floor(proratedDays * standard_hours_per_day);
      maxWeeklyHours = Math.ceil(proratedDays * max_hours_per_day);
      hasFlexibleSchedule = true;
      validationNotes.push(`Partial assignment (${totalAssignmentPercentage}%) allows prorated hours`);
      break;
    }

    case EmployeeWorkStatus.BETWEEN_PROJECTS:
      // Minimal requirements for employees between projects
      minWeeklyHours = availableDays * 4; // 4 hours minimum per day
      maxWeeklyHours = availableDays * max_hours_per_day;
      hasFlexibleSchedule = true;
      validationNotes.push('Between projects - reduced minimum hours requirement');
      break;

    default: // REGULAR
      // Standard validation for regular employees
      minWeeklyHours = availableDays * standard_hours_per_day;
      maxWeeklyHours = availableDays * max_hours_per_day;
      validationNotes.push('Standard employee requires 8-10 hours per working day');
      break;
  }

  // Handle mid-week joins (check if any project assignments started mid-week)
  const midWeekAssignments = project_assignments.filter(assignment => {
    const assignDate = new Date(assignment.assigned_date);
    return workingDates.some(workDate => 
      workDate.toDateString() === assignDate.toDateString() && workDate.getDay() !== 1
    );
  });

  if (midWeekAssignments.length > 0) {
    // Calculate days from first assignment to end of week
    const firstAssignmentDate = midWeekAssignments
      .map(a => new Date(a.assigned_date))
      .sort((a, b) => a.getTime() - b.getTime())[0];
    
    const remainingDaysInWeek = workingDates.filter(date => 
      date >= firstAssignmentDate
    ).length - leaveDaysInWeek;

    minWeeklyHours = Math.max(0, remainingDaysInWeek * standard_hours_per_day);
    maxWeeklyHours = Math.max(0, remainingDaysInWeek * max_hours_per_day);
    hasFlexibleSchedule = true;
    validationNotes.push(`Mid-week project assignment from ${firstAssignmentDate.toLocaleDateString()}`);
  }

  return {
    available_days: availableDays,
    min_weekly_hours: Math.max(0, minWeeklyHours),
    max_weekly_hours: Math.max(0, maxWeeklyHours),
    training_days: trainingDays,
    leave_days: leaveDaysInWeek,
    project_days: projectDays,
    daily_hour_requirement: hasFlexibleSchedule ? 0 : standard_hours_per_day,
    has_flexible_schedule: hasFlexibleSchedule,
    validation_notes: validationNotes
  };
}

/**
 * Validate training period entries
 */
export function validateTrainingPeriod(
  entries: EnhancedTimeEntry[],
  config: ValidationConfig
): TrainingValidation {
  const trainingEntries = entries.filter(entry => 
    entry.entry_type === ExtendedEntryType.TRAINING
  );

  const totalTrainingHours = trainingEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const projectEntries = entries.filter(entry => 
    entry.entry_type === ExtendedEntryType.PROJECT_TASK
  );

  const isTrainingPeriod = config.employee_status === EmployeeWorkStatus.TRAINING;
  const trainingHoursRequired = isTrainingPeriod ? 32 : 0; // 4 days * 8 hours minimum
  const allowsProjectWork = config.allow_flexible_hours || projectEntries.length === 0;

  // Calculate training completion percentage based on required hours
  const trainingCompletionPercentage = trainingHoursRequired > 0 
    ? Math.min(100, (totalTrainingHours / trainingHoursRequired) * 100)
    : 100;

  return {
    is_training_period: isTrainingPeriod,
    training_hours_required: trainingHoursRequired,
    allows_project_work: allowsProjectWork,
    training_completion_percentage: trainingCompletionPercentage
  };
}

/**
 * Validate mid-week project assignment
 */
export function validateMidWeekJoin(
  config: ValidationConfig
): MidWeekJoinValidation | null {
  const activeAssignments = config.project_assignments.filter(a => a.is_active);
  
  if (activeAssignments.length === 0) return null;

  // Find the latest assignment date within the current week
  const weekStart = config.week_start_date;
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weekAssignments = activeAssignments.filter(assignment => {
    const assignDate = new Date(assignment.assigned_date);
    return assignDate >= weekStart && assignDate <= weekEnd;
  });

  if (weekAssignments.length === 0) return null;

  const latestAssignment = weekAssignments
    .sort((a, b) => new Date(b.assigned_date).getTime() - new Date(a.assigned_date).getTime())[0];

  const joinDate = new Date(latestAssignment.assigned_date);
  
  // Calculate remaining working days in the week
  const remainingDates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    
    if (date >= joinDate && date.getDay() >= 1 && date.getDay() <= 5) {
      remainingDates.push(date);
    }
  }

  const availableDaysInWeek = remainingDates.length;
  const proratedHoursRequired = availableDaysInWeek * config.standard_hours_per_day;

  return {
    join_date: joinDate,
    available_days_in_week: availableDaysInWeek,
    prorated_hours_required: proratedHoursRequired,
    adjustment_reason: `Joined project ${latestAssignment.project_id} on ${joinDate.toLocaleDateString()}`
  };
}

/**
 * Validate leave adjustments
 */
export function validateLeaveAdjustments(
  config: ValidationConfig
): LeaveValidation {
  const { approved_leave_days = [], week_start_date, working_days_per_week, standard_hours_per_day } = config;

  // Filter leave days that fall within the current week
  const weekEnd = new Date(week_start_date);
  weekEnd.setDate(week_start_date.getDate() + 6);

  const approvedLeaveInWeek = approved_leave_days.filter(leaveDate => 
    leaveDate >= week_start_date && leaveDate <= weekEnd
  );

  // Calculate working days after leave
  const totalWorkingDays = working_days_per_week; // Usually 5
  const leaveDaysCount = approvedLeaveInWeek.length;
  const workingDaysAfterLeave = Math.max(0, totalWorkingDays - leaveDaysCount);
  const adjustedWeeklyRequirement = workingDaysAfterLeave * standard_hours_per_day;

  return {
    approved_leave_days: approvedLeaveInWeek,
    pending_leave_requests: [], // Future enhancement: implement pending leave requests
    emergency_leave_days: [], // Future enhancement: implement emergency leave tracking
    working_days_after_leave: workingDaysAfterLeave,
    adjusted_weekly_requirement: adjustedWeeklyRequirement
  };
}

/**
 * Validate weekly totals against dynamic limits
 */
function validateWeeklyTotals(
  totalHours: number,
  dynamicLimits: DynamicHourLimits,
  blockingErrors: string[],
  warnings: string[],
  recommendedActions: string[]
): void {
  if (totalHours < dynamicLimits.min_weekly_hours) {
    if (dynamicLimits.has_flexible_schedule) {
      warnings.push(`Weekly total ${totalHours}h is below recommended minimum ${dynamicLimits.min_weekly_hours}h`);
      recommendedActions.push('Consider adding more hours to meet recommendations');
    } else {
      blockingErrors.push(`Weekly total ${totalHours}h is below required minimum ${dynamicLimits.min_weekly_hours}h`);
    }
  }

  if (totalHours > dynamicLimits.max_weekly_hours) {
    blockingErrors.push(`Weekly total ${totalHours}h exceeds maximum ${dynamicLimits.max_weekly_hours}h`);
  }
}

/**
 * Validate daily hour requirements
 */
function validateDailyTotals(
  dailyTotals: Record<string, number>,
  config: ValidationConfig,
  dynamicLimits: DynamicHourLimits,
  blockingErrors: string[]
): void {
  if (dynamicLimits.has_flexible_schedule || dynamicLimits.daily_hour_requirement === 0) {
    return; // Skip daily validation for flexible schedules
  }

  for (const [date, hours] of Object.entries(dailyTotals)) {
    const dateObj = new Date(date);
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
    
    if (!isWeekend) {
      if (hours < config.standard_hours_per_day) {
        blockingErrors.push(`${date}: ${hours}h is below required ${config.standard_hours_per_day}h per day`);
      }
      if (hours > config.max_hours_per_day) {
        blockingErrors.push(`${date}: ${hours}h exceeds maximum ${config.max_hours_per_day}h per day`);
      }
    }
  }
}

/**
 * Add training-specific validation messages
 */
function addTrainingValidationMessages(
  trainingValidation: TrainingValidation,
  existingEntries: EnhancedTimeEntry[],
  warnings: string[],
  recommendedActions: string[]
): void {
  if (!trainingValidation.is_training_period) return;

  const trainingHours = existingEntries
    .filter(entry => entry.entry_type === ExtendedEntryType.TRAINING)
    .reduce((sum, entry) => sum + entry.hours, 0);
  
  if (trainingHours < trainingValidation.training_hours_required) {
    warnings.push(`Training hours ${trainingHours}h below recommended ${trainingValidation.training_hours_required}h`);
    recommendedActions.push('Add more training hours to meet training requirements');
  }
}

/**
 * Enhanced validation function that handles all scenarios
 */
export function validateEnhancedTimesheet(
  context: ValidationContext
): EnhancedValidationResult {
  const { config, existing_entries } = context;
  
  // Calculate dynamic hour limits
  const dynamicLimits = calculateDynamicHourLimits(config);
  
  // Get validations for specific scenarios
  const trainingValidation = validateTrainingPeriod(existing_entries, config);
  const midWeekValidation = validateMidWeekJoin(config);
  const leaveValidation = validateLeaveAdjustments(config);
  
  // Calculate actual totals from entries
  const totalHours = existing_entries.reduce((sum, entry) => sum + entry.hours, 0);
  const dailyTotals: Record<string, number> = {};
  
  for (const entry of existing_entries) {
    dailyTotals[entry.date] = (dailyTotals[entry.date] || 0) + entry.hours;
  }

  // Validation results
  const blockingErrors: string[] = [];
  const warnings: string[] = [];
  const recommendedActions: string[] = [];

  // Validate weekly totals against dynamic limits
  validateWeeklyTotals(totalHours, dynamicLimits, blockingErrors, warnings, recommendedActions);

  // Validate daily totals (unless flexible schedule)
  validateDailyTotals(dailyTotals, config, dynamicLimits, blockingErrors);

  // Training period specific validations
  addTrainingValidationMessages(trainingValidation, existing_entries, warnings, recommendedActions);

  // Mid-week join specific validations
  if (midWeekValidation) {
    warnings.push(midWeekValidation.adjustment_reason);
    recommendedActions.push(`Hours adjusted for ${midWeekValidation.available_days_in_week} available days in week`);
  }

  // Leave adjustment notifications
  if (leaveValidation.approved_leave_days.length > 0) {
    const leaveDates = leaveValidation.approved_leave_days
      .map(date => date.toLocaleDateString())
      .join(', ');
    warnings.push(`Approved leave on: ${leaveDates}`);
    recommendedActions.push(`Hours requirement adjusted to ${leaveValidation.adjusted_weekly_requirement}h for ${leaveValidation.working_days_after_leave} working days`);
  }

  // Add dynamic limit notes to recommendations
  recommendedActions.push(...dynamicLimits.validation_notes);

  return {
    is_valid: blockingErrors.length === 0,
    blocking_errors: blockingErrors,
    warnings: warnings,
    dynamic_limits: dynamicLimits,
    recommended_actions: recommendedActions
  };
}

/**
 * Utility to format hour range for UI display
 */
export function formatDynamicHourRange(limits: DynamicHourLimits): string {
  if (limits.has_flexible_schedule) {
    if (limits.min_weekly_hours === 0) {
      return `0-${limits.max_weekly_hours}h (flexible)`;
    }
    return `${limits.min_weekly_hours}-${limits.max_weekly_hours}h (flexible)`;
  }
  
  if (limits.min_weekly_hours === limits.max_weekly_hours) {
    return `${limits.min_weekly_hours}h required`;
  }
  
  return `${limits.min_weekly_hours}-${limits.max_weekly_hours}h`;
}

/**
 * Get entry type display name
 */
export function getEntryTypeDisplayName(entryType: ExtendedEntryType): string {
  const displayNames = {
    [ExtendedEntryType.PROJECT_TASK]: 'Project Work',
    [ExtendedEntryType.CUSTOM_TASK]: 'Custom Task',
    [ExtendedEntryType.NON_PROJECT]: 'Non-Project Work',
    [ExtendedEntryType.LEAVE]: 'Leave',
    [ExtendedEntryType.HOLIDAY]: 'Holiday',
    [ExtendedEntryType.TRAINING]: 'Training'
  };
  
  return displayNames[entryType] || entryType;
}