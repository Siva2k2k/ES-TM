import { z } from 'zod';

/**
 * Enhanced Timesheet Validation Schemas
 * Supporting training periods, mid-week joins, and leave handling
 * Maintains backward compatibility with existing schemas
 */

// Enhanced entry type schema including new types
export const enhancedEntryTypeSchema = z.enum([
  'project_task',
  'custom_task', 
  'non_project',
  'leave',
  'holiday',
  'training'
]);

// Leave type schema
export const leaveTypeSchema = z.enum([
  'sick_leave',
  'vacation',
  'personal_leave',
  'emergency_leave',
  'maternity_paternity',
  'bereavement',
  'jury_duty',
  'training_leave'
]);

// Employee work status schema
export const employeeWorkStatusSchema = z.enum([
  'regular',
  'training',
  'partial',
  'between'
]);

// Enhanced time entry schema
export const enhancedTimeEntrySchema = z.object({
  project_id: z.string().optional(),
  task_id: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  hours: z.number()
    .min(0.25, 'Minimum 0.25 hours (15 minutes) required')
    .max(24, 'Maximum 24 hours per day'),
  description: z.string().max(500, 'Description too long').optional(),
  is_billable: z.boolean().default(true),
  entry_type: enhancedEntryTypeSchema.default('project_task'),
  custom_task_description: z.string().optional(),
  is_editable: z.boolean().optional(),
  
  // Enhanced fields
  leave_type: leaveTypeSchema.optional(),
  training_category: z.string().max(100, 'Training category too long').optional(),
  is_approved_leave: z.boolean().optional(),
  supervisor_notes: z.string().max(1000, 'Notes too long').optional(),
}).refine(
  (data) => {
    // Project tasks require project_id and task_id
    if (data.entry_type === 'project_task') {
      return !!data.project_id && !!data.task_id;
    }
    return true;
  },
  {
    message: 'Project tasks require both project and task selection',
    path: ['project_id'],
  }
).refine(
  (data) => {
    // Custom tasks require description
    if (data.entry_type === 'custom_task') {
      return !!data.custom_task_description?.trim();
    }
    return true;
  },
  {
    message: 'Custom tasks require a description',
    path: ['custom_task_description'],
  }
).refine(
  (data) => {
    // Leave entries require leave type
    if (data.entry_type === 'leave') {
      return !!data.leave_type;
    }
    return true;
  },
  {
    message: 'Leave entries require a leave type',
    path: ['leave_type'],
  }
).refine(
  (data) => {
    // Training entries require training category
    if (data.entry_type === 'training') {
      return !!data.training_category?.trim();
    }
    return true;
  },
  {
    message: 'Training entries require a training category',
    path: ['training_category'],
  }
).refine(
  (data) => {
    // Don't allow future dates
    const entryDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate <= today;
  },
  {
    message: 'Future dates are not allowed',
    path: ['date'],
  }
);

// Project assignment schema
export const projectAssignmentSchema = z.object({
  project_id: z.string().min(1, 'Project ID is required'),
  assigned_date: z.date(),
  assignment_percentage: z.number().min(0).max(100),
  is_active: z.boolean().default(true)
});

// Validation configuration schema
export const validationConfigSchema = z.object({
  employee_status: employeeWorkStatusSchema.default('regular'),
  project_assignments: z.array(projectAssignmentSchema).default([]),
  training_start_date: z.date().optional(),
  training_end_date: z.date().optional(),
  approved_leave_days: z.array(z.date()).default([]),
  working_days_per_week: z.number().min(1).max(7).default(5),
  standard_hours_per_day: z.number().min(1).max(24).default(8),
  max_hours_per_day: z.number().min(1).max(24).default(10),
  week_start_date: z.date(),
  allow_flexible_hours: z.boolean().default(false)
});

// Enhanced timesheet form schema with dynamic validation
export const enhancedTimesheetFormSchema = z.object({
  week_start_date: z.string().min(1, 'Week start date is required'),
  entries: z.array(enhancedTimeEntrySchema).min(1, 'At least one entry is required'),
  validation_config: validationConfigSchema.optional(),
}).refine(
  (data) => {
    // Basic validation - ensure no duplicate entries
    const seen = new Set<string>();

    for (const entry of data.entries) {
      const identifier = entry.entry_type === 'custom_task'
        ? entry.custom_task_description || entry.date
        : `${entry.project_id}-${entry.task_id}`;
      const key = `${entry.entry_type}-${identifier}-${entry.date}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
    }
    return true;
  },
  {
    message: 'Duplicate entries are not allowed',
    path: ['entries'],
  }
).refine(
  (data) => {
    // Validate that all entries are within the week
    const weekStart = new Date(data.week_start_date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return data.entries.every(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= weekStart && entryDate <= weekEnd;
    });
  },
  {
    message: 'All entries must be within the selected week',
    path: ['entries'],
  }
);

// Backward compatible schema (uses original validation logic)
export const timesheetFormSchema = z.object({
  week_start_date: z.string().min(1, 'Week start date is required'),
  entries: z.array(enhancedTimeEntrySchema).min(1, 'At least one entry is required'),
}).refine(
  (data) => {
    // Legacy validation: Daily totals (8-10 hours per weekday)
    const dailyTotals: Record<string, number> = {};

    // Only enforce daily 8-10 hour rule for weekdays (Mon-Fri)
    for (const entry of data.entries) {
      const d = new Date(entry.date);
      const day = d.getDay(); // Sunday=0, Saturday=6
      // Skip weekends when computing required daily totals
      if (day === 0 || day === 6) continue;
      dailyTotals[entry.date] = (dailyTotals[entry.date] || 0) + entry.hours;
    }

    // For legacy validation, only check standard project work
    const projectWorkDays = Object.entries(dailyTotals).filter(([, hours]) => hours > 0);
    const invalidDays = projectWorkDays.filter(([, total]) => total < 8 || total > 10);

    return invalidDays.length === 0;
  },
  {
    message: 'Each weekday must have between 8-10 hours for standard employees',
    path: ['entries'],
  }
).refine(
  (data) => {
    // Legacy validation: Weekly total (max 56 hours)
    const weekTotal = data.entries.reduce((sum, entry) => sum + entry.hours, 0);
    return weekTotal <= 56;
  },
  {
    message: 'Weekly total cannot exceed 56 hours',
    path: ['entries'],
  }
);

// Type exports for enhanced validation
export type EnhancedTimeEntry = z.infer<typeof enhancedTimeEntrySchema>;
export type EnhancedTimesheetFormData = z.infer<typeof enhancedTimesheetFormSchema>;
export type ValidationConfig = z.infer<typeof validationConfigSchema>;
export type ProjectAssignment = z.infer<typeof projectAssignmentSchema>;

// Backward compatibility type exports
export type TimesheetFormData = z.infer<typeof timesheetFormSchema>;
export type TimeEntry = z.infer<typeof enhancedTimeEntrySchema>; // Enhanced but compatible

// Validation helper functions
export function validateDailyHours(hours: number): boolean {
  return hours >= 8 && hours <= 10;
}

export function validateWeeklyHours(hours: number): boolean {
  return hours <= 56;
}

export function getDailyTotals(entries: EnhancedTimeEntry[]): Record<string, number> {
  return entries.reduce((acc, entry) => {
    acc[entry.date] = (acc[entry.date] || 0) + entry.hours;
    return acc;
  }, {} as Record<string, number>);
}

export function getWeeklyTotal(entries: EnhancedTimeEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.hours, 0);
}

export function hasDuplicateEntries(entries: EnhancedTimeEntry[]): boolean {
  const seen = new Set<string>();

  for (const entry of entries) {
    const identifier = entry.entry_type === 'custom_task'
      ? entry.custom_task_description || entry.date
      : `${entry.project_id}-${entry.task_id}`;
    const key = `${entry.entry_type}-${identifier}-${entry.date}`;
    if (seen.has(key)) {
      return true;
    }
    seen.add(key);
  }

  return false;
}

// Helper to determine if enhanced validation should be used
export function shouldUseEnhancedValidation(
  employeeStatus?: string,
  hasFlexibleSchedule?: boolean
): boolean {
  return (
    employeeStatus === 'training' ||
    employeeStatus === 'partial' ||
    employeeStatus === 'between' ||
    hasFlexibleSchedule === true
  );
}