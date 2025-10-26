/**
 * Dashboard Service using unified backendApi
 * Provides role-specific dashboard data with charts
 * Now delegates to backendApi for all HTTP calls
 */

import { backendApi } from '../lib/backendApi';

interface SuperAdminDashboardData {
  system_overview: {
    total_users: number;
    active_users: number;
    pending_approvals: number;
    total_projects: number;
    active_projects: number;
  };
  timesheet_metrics: {
    total_timesheets: number;
    pending_approval: number;
    frozen_timesheets: number;
    average_hours_per_week: number;
  };
  financial_overview: {
    total_revenue: number;
    monthly_revenue: number;
    billable_hours: number;
    average_hourly_rate: number;
  };
  user_activity: Array<{
    user_id: string;
    user_name: string;
    role: string;
    last_timesheet: string;
    status: string;
  }>;
  // Charts data
  user_growth?: Array<{ name: string; users: number }>;
  revenue_trend?: Array<{ name: string; revenue: number; billable_hours: number }>;
  project_status_distribution?: Array<{ name: string; value: number }>;
}

interface ManagementDashboardData {
  organization_overview: {
    total_projects: number;
    active_projects: number;
    total_employees: number;
    total_managers: number;
  };
  project_health: Array<{
    project_id: string;
    project_name: string;
    status: string;
    budget_utilization: number;
    team_size: number;
    completion_percentage: number;
  }>;
  billing_metrics: {
    monthly_revenue: number;
    pending_billing: number;
    total_billable_hours: number;
    revenue_growth: number;
  };
  team_performance: Array<{
    manager_id: string;
    manager_name: string;
    team_size: number;
    team_billable_hours: number;
    team_revenue: number;
  }>;
  approval_status: {
    pending_lead: number;
    pending_manager: number;
    pending_management: number;
    frozen: number;
  };
  // Charts data
  monthly_revenue_trend?: Array<{ name: string; revenue: number }>;
  project_budget_utilization?: Array<{ name: string; value: number }>;
  approval_pipeline?: Array<{ name: string; value: number }>;
}

interface ManagerDashboardData {
  team_overview: {
    total_members: number;
    active_projects: number;
    pending_approvals: number;
    this_week_hours: number;
  };
  projects: Array<{
    project_id: string;
    project_name: string;
    client_name: string;
    status: string;
    team_size: number;
    hours_logged_this_week: number;
    budget_remaining: number;
  }>;
  team_timesheets: Array<{
    user_id: string;
    user_name: string;
    status: string;
    total_hours: number;
    week_start_date: string;
    requires_action: boolean;
  }>;
  performance_metrics: {
    team_utilization: number;
    budget_utilization: number;
    on_time_delivery: number;
  };
  // Charts data
  team_hours_trend?: Array<{ name: string; hours: number; billable: number }>;
  project_distribution?: Array<{ name: string; value: number }>;
  approval_status?: Array<{ name: string; value: number }>;
}

interface LeadDashboardData {
  team_summary: {
    team_members: number;
    pending_reviews: number;
    hours_this_week: number;
    projects: number;
  };
  my_projects: Array<{
    project_id: string;
    project_name: string;
    client_name?: string;
    team_size: number;
    pending_approvals: number;
    hours_this_week: number;
  }>;
  pending_reviews: Array<{
    timesheet_id: string;
    user_name: string;
    user_email: string;
    week_start_date: string;
    total_hours: number;
    project_name?: string;
    submitted_at: string;
  }>;
  // Charts data
  weekly_hours_trend?: Array<{ name: string; hours: number; billable: number }>;
  project_time_distribution?: Array<{ name: string; value: number }>;
}

interface EmployeeDashboardData {
  personal_summary: {
    current_week_hours: number;
    month_hours: number;
    pending_timesheets: number;
    completed_tasks: number;
  };
  current_timesheet: {
    id: string;
    week_start_date: string;
    status: string;
    total_hours: number;
    is_frozen: boolean;
    can_edit: boolean;
  } | null;
  my_projects: Array<{
    project_id: string;
    project_name: string;
    client_name?: string;
    role: string;
    hours_this_week: number;
    total_tasks: number;
    completed_tasks: number;
  }>;
  recent_activity: Array<{
    id: string;
    type: 'timesheet' | 'task' | 'project';
    description: string;
    date: string;
    project_name?: string;
  }>;
  // Charts data
  weekly_hours_trend?: Array<{ name: string; hours: number; billable: number }>;
  project_time_distribution?: Array<{ name: string; value: number }>;
  task_status?: Array<{ name: string; value: number }>;
}

/**
 * Dashboard Service using Axios
 * Provides role-specific dashboard data with charts
 */
export class DashboardService {
  /**
   * Get role-specific dashboard data
   */
  static async getRoleSpecificDashboard(): Promise<{
    dashboard?: SuperAdminDashboardData | ManagementDashboardData | ManagerDashboardData | LeadDashboardData | EmployeeDashboardData;
    role?: string;
    error?: string;
  }> {
    try {
      const response = await backendApi.getRoleSpecificDashboard();

      if (!response.success) {
        return { error: response.message || 'Failed to fetch dashboard data' };
      }

      return { dashboard: response.data, role: response.role };
    } catch (error) {
      console.error('Error in getRoleSpecificDashboard:', error);
      return { error: error instanceof Error ? error.message : 'Failed to fetch dashboard data' };
    }
  }

  /**
   * Get Super Admin dashboard
   */
  static async getSuperAdminDashboard(): Promise<{ dashboard?: SuperAdminDashboardData; error?: string }> {
    try {
      const response = await backendApi.getSuperAdminDashboard();

      if (!response.success) {
        return { error: response.message || 'Failed to fetch super admin dashboard' };
      }

      return { dashboard: response.data };
    } catch (error) {
      console.error('Error in getSuperAdminDashboard:', error);
      return { error: error instanceof Error ? error.message : 'Failed to fetch super admin dashboard' };
    }
  }

  /**
   * Get Management dashboard
   */
  static async getManagementDashboard(): Promise<{ dashboard?: ManagementDashboardData; error?: string }> {
    try {
      const response = await backendApi.getManagementDashboard();

      if (!response.success) {
        return { error: response.message || 'Failed to fetch management dashboard' };
      }

      return { dashboard: response.data };
    } catch (error) {
      console.error('Error in getManagementDashboard:', error);
      return { error: error instanceof Error ? error.message : 'Failed to fetch management dashboard' };
    }
  }

  /**
   * Get Manager dashboard
   */
  static async getManagerDashboard(): Promise<{ dashboard?: ManagerDashboardData; error?: string }> {
    try {
      const response = await backendApi.getManagerDashboard();

      if (!response.success) {
        return { error: response.message || 'Failed to fetch manager dashboard' };
      }

      return { dashboard: response.data };
    } catch (error) {
      console.error('Error in getManagerDashboard:', error);
      return { error: error instanceof Error ? error.message : 'Failed to fetch manager dashboard' };
    }
  }

  /**
   * Get Lead dashboard
   */
  static async getLeadDashboard(): Promise<{ dashboard?: LeadDashboardData; error?: string }> {
    try {
      const response = await backendApi.getLeadDashboard();

      if (!response.success) {
        return { error: response.message || 'Failed to fetch lead dashboard' };
      }

      return { dashboard: response.data };
    } catch (error) {
      console.error('Error in getLeadDashboard:', error);
      return { error: error instanceof Error ? error.message : 'Failed to fetch lead dashboard' };
    }
  }

  /**
   * Get Employee dashboard
   */
  static async getEmployeeDashboard(): Promise<{ dashboard?: EmployeeDashboardData; error?: string }> {
    try {
      const response = await backendApi.getEmployeeDashboard();

      if (!response.data.success) {
        return { error: response.message || 'Failed to fetch employee dashboard' };
      }

      return { dashboard: response.data };
    } catch (error) {
      console.error('Error in getEmployeeDashboard:', error);
      return { error: error instanceof Error ? error.message : 'Failed to fetch employee dashboard' };
    }
  }
}

export default DashboardService;

// Export types for use in components
export type {
  SuperAdminDashboardData,
  ManagementDashboardData,
  ManagerDashboardData,
  LeadDashboardData,
  EmployeeDashboardData
};
