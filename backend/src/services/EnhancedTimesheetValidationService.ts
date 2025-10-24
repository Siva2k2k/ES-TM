/**
 * Enhanced Timesheet Validation Service (Backend)
 * Supports training periods, mid-week joins, and leave handling
 */

import { ValidationError } from '@/utils/errors';

// Enhanced entry types
export enum EnhancedEntryType {
  PROJECT_TASK = 'project_task',
  CUSTOM_TASK = 'custom_task',
  NON_PROJECT = 'non_project',
  LEAVE = 'leave',
  HOLIDAY = 'holiday',
  TRAINING = 'training'
}

// Leave types
export enum LeaveType {
  SICK_LEAVE = 'sick_leave',
  VACATION = 'vacation',
  PERSONAL_LEAVE = 'personal_leave',
  EMERGENCY_LEAVE = 'emergency_leave',
  MATERNITY_PATERNITY = 'maternity_paternity',
  BEREAVEMENT = 'bereavement',
  JURY_DUTY = 'jury_duty',
  TRAINING_LEAVE = 'training_leave'
}

// Employee work status
export enum EmployeeWorkStatus {
  REGULAR = 'regular',
  TRAINING = 'training',
  PARTIAL_ASSIGNMENT = 'partial',
  BETWEEN_PROJECTS = 'between'
}

// Enhanced time entry interface
export interface EnhancedTimeEntry {
  project_id?: string;
  task_id?: string;
  date: Date;
  hours: number;
  description?: string;
  is_billable: boolean;
  entry_type: EnhancedEntryType;
  custom_task_description?: string;
  leave_type?: LeaveType;
  training_category?: string;
  is_approved_leave?: boolean;
  supervisor_notes?: string;
}

// Validation configuration
export interface BackendValidationConfig {
  employee_status: EmployeeWorkStatus;
  project_assignments: Array<{
    project_id: string;
    assigned_date: Date;
    assignment_percentage: number;
    is_active: boolean;
  }>;
  training_start_date?: Date;
  training_end_date?: Date;
  approved_leave_days: Date[];
  working_days_per_week: number;
  standard_hours_per_day: number;
  max_hours_per_day: number;
  week_start_date: Date;
  allow_flexible_hours: boolean;
}

// Dynamic hour limits
export interface DynamicHourLimits {
  available_days: number;
  min_weekly_hours: number;
  max_weekly_hours: number;
  training_days: number;
  leave_days: number;
  project_days: number;
  daily_hour_requirement: number;
  has_flexible_schedule: boolean;
  validation_notes: string[];
}

// Enhanced validation result
export interface EnhancedValidationResult {
  is_valid: boolean;
  blocking_errors: string[];
  warnings: string[];
  dynamic_limits: DynamicHourLimits;
  recommended_actions: string[];
}

/**
 * Enhanced Timesheet Validation Service
 */
export class EnhancedTimesheetValidationService {
  /**
   * Calculate dynamic hour limits based on employee status and circumstances
   */
  static calculateDynamicHourLimits(config: BackendValidationConfig): DynamicHourLimits {
    const {
      employee_status,
      project_assignments,
      training_start_date,
      training_end_date,
      approved_leave_days,
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
      case EmployeeWorkStatus.TRAINING: {
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
      }

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

      case EmployeeWorkStatus.BETWEEN_PROJECTS: {
        // Minimal requirements for employees between projects
        minWeeklyHours = availableDays * 4; // 4 hours minimum per day
        maxWeeklyHours = availableDays * max_hours_per_day;
        hasFlexibleSchedule = true;
        validationNotes.push('Between projects - reduced minimum hours requirement');
        break;
      }

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
   * Validate enhanced timesheet entries
   */
  static validateEnhancedTimesheet(
    entries: EnhancedTimeEntry[],
    config: BackendValidationConfig
  ): EnhancedValidationResult {
    // Calculate dynamic hour limits
    const dynamicLimits = this.calculateDynamicHourLimits(config);
    
    // Calculate actual totals from entries
    const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
    const dailyTotals: Record<string, number> = {};
    
    for (const entry of entries) {
      const dateKey = entry.date.toISOString().split('T')[0];
      dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + entry.hours;
    }

    // Validation results
    const blockingErrors: string[] = [];
    const warnings: string[] = [];
    const recommendedActions: string[] = [];

    // Validate weekly totals against dynamic limits
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

    // Validate daily totals (unless flexible schedule)
    if (!dynamicLimits.has_flexible_schedule && dynamicLimits.daily_hour_requirement > 0) {
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

    // Validate entry types
    for (const entry of entries) {
      const entryValidation = this.validateSingleEntry(entry, config);
      blockingErrors.push(...entryValidation.errors);
      warnings.push(...entryValidation.warnings);
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
   * Validate a single entry
   */
  static validateSingleEntry(
    entry: EnhancedTimeEntry,
    config: BackendValidationConfig
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate entry type specific requirements
    switch (entry.entry_type) {
      case EnhancedEntryType.PROJECT_TASK:
        if (!entry.project_id || !entry.task_id) {
          errors.push('Project tasks require both project and task selection');
        }
        break;

      case EnhancedEntryType.CUSTOM_TASK:
        if (!entry.custom_task_description?.trim()) {
          errors.push('Custom tasks require a description');
        }
        break;

      case EnhancedEntryType.LEAVE:
        if (!entry.leave_type) {
          errors.push('Leave entries must specify a leave type');
        }
        if (entry.is_billable) {
          warnings.push('Leave entries are typically non-billable');
        }
        // Check if date is on approved leave
        const isApprovedLeave = config.approved_leave_days.some(leaveDate =>
          leaveDate.toDateString() === entry.date.toDateString()
        );
        if (!isApprovedLeave) {
          warnings.push(`Leave entry on ${entry.date.toLocaleDateString()} may not be pre-approved`);
        }
        break;

      case EnhancedEntryType.TRAINING:
        if (!entry.training_category?.trim()) {
          errors.push('Training entries require a training category');
        }
        if (config.employee_status !== EmployeeWorkStatus.TRAINING && !config.allow_flexible_hours) {
          warnings.push('Training entries may not be appropriate for regular employees');
        }
        break;

      case EnhancedEntryType.HOLIDAY:
        if (entry.is_billable) {
          warnings.push('Holiday entries should be non-billable');
        }
        break;
    }

    // Validate hours
    if (entry.hours < 0.25) {
      errors.push('Minimum 0.25 hours (15 minutes) required');
    }
    if (entry.hours > 24) {
      errors.push('Maximum 24 hours per day allowed');
    }

    // Validate future dates
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    if (entry.date > today) {
      errors.push('Future dates are not allowed');
    }

    return { errors, warnings };
  }

  /**
   * Determine if enhanced validation should be used
   */
  static shouldUseEnhancedValidation(config: BackendValidationConfig): boolean {
    return (
      config.employee_status !== EmployeeWorkStatus.REGULAR ||
      config.allow_flexible_hours ||
      config.approved_leave_days.length > 0 ||
      config.project_assignments.some(assignment => {
        const assignDate = new Date(assignment.assigned_date);
        const weekStart = config.week_start_date;
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return assignDate >= weekStart && assignDate <= weekEnd;
      })
    );
  }

  /**
   * Create validation config from user and timesheet data
   */
  static createValidationConfig(
    user: any, // IUser type
    weekStartDate: Date,
    projectAssignments: any[] = [],
    approvedLeave: Date[] = []
  ): BackendValidationConfig {
    // Determine employee status based on user data
    let employeeStatus = EmployeeWorkStatus.REGULAR;
    let allowFlexibleHours = false;
    let trainingStartDate: Date | undefined;
    let trainingEndDate: Date | undefined;

    // Check if user is in training (this would come from user profile or HR system)
    if (user.training_period) {
      employeeStatus = EmployeeWorkStatus.TRAINING;
      trainingStartDate = user.training_period.start_date;
      trainingEndDate = user.training_period.end_date;
      allowFlexibleHours = user.training_period.allow_flexible_hours || false;
    }

    // Check for partial assignments
    const activeAssignments = projectAssignments.filter(a => a.is_active);
    const totalAssignmentPercentage = activeAssignments
      .reduce((sum, assignment) => sum + (assignment.assignment_percentage || 100), 0);
    
    if (totalAssignmentPercentage < 100 && totalAssignmentPercentage > 0) {
      employeeStatus = EmployeeWorkStatus.PARTIAL_ASSIGNMENT;
      allowFlexibleHours = true;
    } else if (activeAssignments.length === 0) {
      employeeStatus = EmployeeWorkStatus.BETWEEN_PROJECTS;
      allowFlexibleHours = true;
    }

    return {
      employee_status: employeeStatus,
      project_assignments: projectAssignments,
      training_start_date: trainingStartDate,
      training_end_date: trainingEndDate,
      approved_leave_days: approvedLeave,
      working_days_per_week: 5,
      standard_hours_per_day: 8,
      max_hours_per_day: 10,
      week_start_date: weekStartDate,
      allow_flexible_hours: allowFlexibleHours
    };
  }
}