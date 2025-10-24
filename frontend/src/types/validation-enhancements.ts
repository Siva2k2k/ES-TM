/**
 * Enhanced Validation Types for Timesheet System
 * Supporting training periods, mid-week joins, and leave handling
 */

// Entry type enum - extending existing types
export enum ExtendedEntryType {
  PROJECT_TASK = 'project_task',
  CUSTOM_TASK = 'custom_task',
  NON_PROJECT = 'non_project',
  LEAVE = 'leave',
  HOLIDAY = 'holiday',
  TRAINING = 'training'  // New type for training periods
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

// Employee status for validation purposes
export enum EmployeeWorkStatus {
  REGULAR = 'regular',              // Normal project-assigned employee
  TRAINING = 'training',            // Employee in training period
  PARTIAL_ASSIGNMENT = 'partial',   // Employee with partial project assignment
  BETWEEN_PROJECTS = 'between'      // Employee between project assignments
}

// Project assignment status
export interface ProjectAssignment {
  project_id: string;
  assigned_date: Date;
  assignment_percentage: number; // 0-100, for partial assignments
  is_active: boolean;
}

// Enhanced time entry interface
export interface EnhancedTimeEntry {
  project_id?: string;
  task_id?: string;
  date: string;
  hours: number;
  description?: string;
  is_billable: boolean;
  entry_type: ExtendedEntryType;
  custom_task_description?: string;
  is_editable?: boolean;
  
  // New fields for enhanced validation
  leave_type?: LeaveType;
  training_category?: string;
  is_approved_leave?: boolean;
  supervisor_notes?: string;
}

// Dynamic validation configuration
export interface ValidationConfig {
  employee_status: EmployeeWorkStatus;
  project_assignments: ProjectAssignment[];
  training_start_date?: Date;
  training_end_date?: Date;
  approved_leave_days?: Date[];
  working_days_per_week: number; // Usually 5, but configurable
  standard_hours_per_day: number; // Usually 8
  max_hours_per_day: number; // Usually 10
  week_start_date: Date;
  allow_flexible_hours: boolean; // For training periods
}

// Dynamic hour limits result
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

// Validation context for specific scenarios
export interface ValidationContext {
  employee_id: string;
  week_start_date: Date;
  config: ValidationConfig;
  existing_entries: EnhancedTimeEntry[];
}

// Enhanced validation result
export interface EnhancedValidationResult {
  is_valid: boolean;
  blocking_errors: string[];
  warnings: string[];
  dynamic_limits: DynamicHourLimits;
  recommended_actions: string[];
}

// Training validation specific types
export interface TrainingValidation {
  is_training_period: boolean;
  training_hours_required: number;
  allows_project_work: boolean;
  training_completion_percentage: number;
}

// Mid-week join validation
export interface MidWeekJoinValidation {
  join_date: Date;
  available_days_in_week: number;
  prorated_hours_required: number;
  adjustment_reason: string;
}

// Leave validation
export interface LeaveValidation {
  approved_leave_days: Date[];
  pending_leave_requests: Date[];
  emergency_leave_days: Date[];
  working_days_after_leave: number;
  adjusted_weekly_requirement: number;
}