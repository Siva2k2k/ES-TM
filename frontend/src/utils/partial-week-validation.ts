/**
 * Mid-Week Join and Leave Validation Utilities
 * Handles dynamic hour calculations for partial week scenarios
 */

import {
  ValidationConfig,
  MidWeekJoinValidation,
  LeaveValidation,
  EnhancedTimeEntry
} from '../types/validation-enhancements';

/**
 * Validate mid-week project assignment
 */
export function validateMidWeekJoin(
  config: ValidationConfig
): MidWeekJoinValidation | null {
  const activeAssignments = config.project_assignments.filter(a => a.is_active);
  
  if (activeAssignments.length === 0) return null;

  // Find assignments that started within the current week
  const weekStart = config.week_start_date;
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weekAssignments = activeAssignments.filter(assignment => {
    const assignDate = new Date(assignment.assigned_date);
    return assignDate >= weekStart && assignDate <= weekEnd;
  });

  if (weekAssignments.length === 0) return null;

  // Get the most recent assignment within the week
  const latestAssignment = weekAssignments
    .sort((a, b) => new Date(b.assigned_date).getTime() - new Date(a.assigned_date).getTime())[0];

  const joinDate = new Date(latestAssignment.assigned_date);
  
  // Calculate remaining working days from join date to end of week
  const availableDaysInWeek = calculateWorkingDaysFromDate(joinDate, weekEnd);
  const proratedHoursRequired = availableDaysInWeek * config.standard_hours_per_day;

  return {
    join_date: joinDate,
    available_days_in_week: availableDaysInWeek,
    prorated_hours_required: proratedHoursRequired,
    adjustment_reason: `Joined project ${latestAssignment.project_id} on ${joinDate.toLocaleDateString()}`
  };
}

/**
 * Calculate working days between two dates (Monday-Friday only)
 */
export function calculateWorkingDaysFromDate(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
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
    pending_leave_requests: [], // Future enhancement
    emergency_leave_days: [], // Future enhancement
    working_days_after_leave: workingDaysAfterLeave,
    adjusted_weekly_requirement: adjustedWeeklyRequirement
  };
}

/**
 * Get mid-week join validation messages
 */
export function getMidWeekJoinMessages(
  midWeekValidation: MidWeekJoinValidation | null,
  actualHours: number
): {
  warnings: string[];
  recommendations: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (!midWeekValidation) {
    return { warnings, recommendations };
  }

  warnings.push(midWeekValidation.adjustment_reason);
  
  if (actualHours < midWeekValidation.prorated_hours_required) {
    const shortfall = midWeekValidation.prorated_hours_required - actualHours;
    recommendations.push(
      `Consider adding ${shortfall}h to meet prorated requirement for ${midWeekValidation.available_days_in_week} available days`
    );
  }
  
  recommendations.push(
    `Hours adjusted for partial week: ${midWeekValidation.available_days_in_week} days available`
  );

  return { warnings, recommendations };
}

/**
 * Get leave validation messages
 */
export function getLeaveValidationMessages(
  leaveValidation: LeaveValidation,
  actualHours: number
): {
  warnings: string[];
  recommendations: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (leaveValidation.approved_leave_days.length === 0) {
    return { warnings, recommendations };
  }

  const leaveDates = leaveValidation.approved_leave_days
    .map(date => date.toLocaleDateString())
    .join(', ');
    
  warnings.push(`Approved leave: ${leaveDates}`);
  
  recommendations.push(
    `Hours requirement adjusted to ${leaveValidation.adjusted_weekly_requirement}h for ${leaveValidation.working_days_after_leave} working days`
  );

  if (actualHours > leaveValidation.adjusted_weekly_requirement + 8) {
    warnings.push('Hours significantly exceed requirement for reduced work week');
  }

  return { warnings, recommendations };
}

/**
 * Calculate partial week percentage
 */
export function calculatePartialWeekPercentage(
  availableDays: number,
  standardWorkingDays: number = 5
): number {
  return Math.min(100, (availableDays / standardWorkingDays) * 100);
}

/**
 * Check if entry date falls on approved leave
 */
export function isDateOnApprovedLeave(
  date: string,
  approvedLeaveDays: Date[]
): boolean {
  const entryDate = new Date(date);
  return approvedLeaveDays.some(leaveDate => 
    leaveDate.toDateString() === entryDate.toDateString()
  );
}

/**
 * Validate leave entry requirements
 */
export function validateLeaveEntry(
  entry: EnhancedTimeEntry,
  approvedLeaveDays: Date[]
): {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (entry.entry_type !== 'leave') {
    return { is_valid: true, errors, warnings };
  }

  // Check if leave type is specified
  if (!entry.leave_type) {
    errors.push('Leave entries must specify a leave type');
  }

  // Check if date is on approved leave
  if (!isDateOnApprovedLeave(entry.date, approvedLeaveDays)) {
    warnings.push(`Leave entry on ${entry.date} may not be pre-approved`);
  }

  // Check if hours are reasonable for leave
  if (entry.hours > 8) {
    warnings.push(`Leave hours (${entry.hours}h) exceed standard work day`);
  }

  // Leave entries should not be billable
  if (entry.is_billable) {
    warnings.push('Leave entries are typically non-billable');
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Calculate effective working days for a week considering all factors
 */
export function calculateEffectiveWorkingDays(
  config: ValidationConfig
): {
  standard_days: number;
  leave_days: number;
  partial_days: number;
  effective_days: number;
  adjustment_factors: string[];
} {
  const adjustmentFactors: string[] = [];
  const standardDays = config.working_days_per_week;
  
  // Count leave days
  const leaveDays = config.approved_leave_days?.filter(leaveDate => {
    const weekEnd = new Date(config.week_start_date);
    weekEnd.setDate(config.week_start_date.getDate() + 6);
    return leaveDate >= config.week_start_date && leaveDate <= weekEnd;
  }).length || 0;
  
  if (leaveDays > 0) {
    adjustmentFactors.push(`${leaveDays} approved leave day(s)`);
  }

  // Calculate partial days from mid-week joins
  let partialDays = 0;
  const midWeekValidation = validateMidWeekJoin(config);
  if (midWeekValidation) {
    partialDays = standardDays - midWeekValidation.available_days_in_week;
    adjustmentFactors.push(`Started ${midWeekValidation.join_date.toLocaleDateString()}`);
  }

  const effectiveDays = Math.max(0, standardDays - leaveDays - partialDays);

  return {
    standard_days: standardDays,
    leave_days: leaveDays,
    partial_days: partialDays,
    effective_days: effectiveDays,
    adjustment_factors: adjustmentFactors
  };
}