/**
 * Timesheet Type Definitions
 * All TypeScript types for timesheet feature
 */

export type TimesheetStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'frozen';

export interface TimeEntry {
  id: string;
  timesheet_id: string;
  project_id: string;
  task_id?: string;
  date: string;
  hours: number;
  description?: string;
  is_billable: boolean;
  created_at: string;
  updated_at: string;
}

export interface Timesheet {
  id: string;
  user_id: string;
  week_start_date: string;
  week_end_date: string;
  total_hours: number;
  billable_hours: number;
  status: TimesheetStatus;
  submitted_at?: string;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  entries: TimeEntry[];
  created_at: string;
  updated_at: string;
}

export interface TimesheetFormData {
  week_start_date: string;
  entries: Omit<TimeEntry, 'id' | 'timesheet_id' | 'created_at' | 'updated_at'>[];
}

export interface TimesheetFilters {
  status?: TimesheetStatus | 'all';
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
}

export interface TimesheetStats {
  total: number;
  draft: number;
  submitted: number;
  approved: number;
  rejected: number;
  totalHours: number;
  billableHours: number;
}
