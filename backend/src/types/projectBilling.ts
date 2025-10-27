/**
 * Project Billing Types
 * Types for project billing operations, aggregation, and reporting
 */

import mongoose from 'mongoose';
import type { VerificationInfo } from './billingVerification';

/**
 * Timesheet statuses eligible for billing calculations
 */
export const BILLING_ELIGIBLE_STATUSES: string[] = [
  'lead_approved',
  'manager_approved',
  'management_pending',
  'management_approved',
  'frozen',
  'billed'
];

/**
 * Project-level billing data with aggregated resource information
 */
export interface ProjectBillingData {
  project_id: string;
  project_name: string;
  client_name?: string;
  total_hours: number;
  billable_hours: number;
  non_billable_hours: number;
  total_amount: number;
  resources: ResourceBillingData[];
  verification_info?: VerificationInfo;
}

/**
 * Resource (user) billing data within a project
 * Contains hierarchical adjustment tracking: Manager → Management
 */
export interface ResourceBillingData {
  user_id: string;
  user_name: string;
  role: string;

  // Aggregated from TimesheetProjectApproval (management_status='approved')
  worked_hours: number;                 // Total actual hours worked
  manager_adjustment: number;           // Manager's adjustment during Team Review (+ or -)
  base_billable_hours: number;          // worked_hours + manager_adjustment

  // Management's final adjustment (from BillingAdjustment)
  management_adjustment: number;        // Management's delta in Billing (+ or -)
  final_billable_hours: number;         // base_billable_hours + management_adjustment

  // Calculated fields
  non_billable_hours: number;           // worked_hours - final_billable_hours
  hourly_rate: number;
  total_amount: number;                 // final_billable_hours * hourly_rate

  // Legacy fields for backward compatibility (deprecated)
  total_hours: number;                  // Same as worked_hours
  billable_hours: number;               // Same as final_billable_hours

  // Verification metadata
  verified_at?: string;                 // Last management_approved_at
  last_adjusted_at?: string;            // Last BillingAdjustment.adjusted_at

  weekly_breakdown?: WeeklyBreakdown[];
  monthly_breakdown?: MonthlyBreakdown[];
  tasks?: ResourceTaskData[];
}

/**
 * Weekly breakdown of hours and billing
 */
export interface WeeklyBreakdown {
  week_start: string;
  total_hours: number;
  billable_hours: number;
  amount: number;
}

/**
 * Monthly breakdown of hours and billing
 */
export interface MonthlyBreakdown {
  month_start: string;
  total_hours: number;
  billable_hours: number;
  amount: number;
}

/**
 * Task-level billing data for a specific resource
 */
export interface ResourceTaskData {
  task_id: string;
  task_name: string;
  project_id: string;
  project_name: string;
  total_hours: number;
  billable_hours: number;
  non_billable_hours: number;
  amount: number;
}

/**
 * Task-level billing data with resource breakdown
 */
export interface TaskBillingData {
  task_id: string;
  task_name: string;
  project_id: string;
  project_name: string;
  total_hours: number;
  billable_hours: number;
  resources: TaskResourceData[];
}

/**
 * Resource information within task billing
 */
export interface TaskResourceData {
  user_id: string;
  user_name: string;
  hours: number;
  billable_hours: number;
  rate: number;
  amount: number;
}

/**
 * User-centric view of project billing
 */
export interface UserBillingProjectData {
  project_id: string;
  project_name: string;
  client_name?: string;
  total_hours: number;
  billable_hours: number;
  non_billable_hours: number;
  amount: number;
}

/**
 * Options for building project billing data
 */
export interface BuildProjectBillingOptions {
  startDate: string;
  endDate: string;
  projectIds?: string[];
  clientIds?: string[];
  view: 'weekly' | 'monthly' | 'custom';
}

/**
 * Parameters for applying billing adjustments
 */
export interface ApplyAdjustmentParams {
  userId: string;
  projectId: string;
  startDate: string;
  endDate: string;
  billableHours: number;
  totalHours?: number;
  reason?: string;
  adjustedBy?: mongoose.Types.ObjectId;
}

/**
 * Target hours for project-level adjustment distribution
 */
export interface ProjectAdjustmentTarget {
  userId: string;
  currentHours: number;
  totalHours: number;
  targetHours: number;
}
