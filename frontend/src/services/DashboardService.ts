import axiosInstance, { handleApiError } from '../config/axios.config';
import type { AxiosResponse } from 'axios';

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
    active_timesheets: number;
    pending_approvals: number;
  }>;
  // Charts data
  monthly_revenue_trend?: Array<{ name: string; revenue: number; expenses: number }>;
  project_completion_trend?: Array<{ name: string; completed: number; ongoing: number }>;
  team_utilization?: Array<{ name: string; utilization: number }>;
}

interface ManagerDashboardData {
  team_overview: {
    team_size: number;
    active_projects: number;
    pending_timesheets: number;
    team_utilization: number;
  };
  project_status: Array<{
    project_id: string;
    project_name: string;
    status: string;
    team_members: number;
    completion_percentage: number;
    budget_status: 'under' | 'on_track' | 'over';
  }>;
  team_members: Array<{
    user_id: string;
    user_name: string;
    current_projects: number;
    pending_timesheets: number;
    weekly_hours: number;
    status: 'active' | 'inactive' | 'overdue';
  }>;
  timesheet_approvals: Array<{
    timesheet_id: string;
    user_name: string;
    week_start: string;
    total_hours: number;
    status: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  // Charts data
  team_hours_trend?: Array<{ name: string; hours: number; billable: number }>;
  project_progress?: Array<{ name: string; progress: number }>;
  approval_status?: Array<{ name: string; value: number }>;
}

interface LeadDashboardData {
  task_overview: {
    assigned_tasks: number;
    completed_tasks: number;
    overdue_tasks: number;
    team_tasks: number;
  };
  project_coordination: Array<{
    project_id: string;
    project_name: string;
    my_role: string;
    team_size: number;
    active_tasks: number;
    completion_percentage: number;
  }>;
  team_collaboration: Array<{
    user_id: string;
    user_name: string;
    shared_projects: number;
    pending_tasks: number;
    collaboration_score: number;
  }>;
  // Charts data
  task_completion_trend?: Array<{ name: string; completed: number; pending: number }>;
  team_workload?: Array<{ name: string; tasks: number }>;
}

interface EmployeeDashboardData {
  personal_overview: {
    current_projects: number;
    assigned_tasks: number;
    completed_tasks: number;
    weekly_hours: number;
  };
  timesheet_status: {
    current_week: string;
    status: string;
    total_hours: number;
    billable_hours: number;
    can_submit: boolean;
  };
  project_assignments: Array<{
    project_id: string;
    project_name: string;
    role: string;
    active_tasks: number;
    hours_logged: number;
    is_billable: boolean;
  }>;
  recent_activity: Array<{
    date: string;
    activity_type: string;
    description: string;
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
  private static readonly API_PREFIX = '/dashboard';

  /**
   * Get role-specific dashboard data
   */
  static async getRoleSpecificDashboard(): Promise<{
    dashboard?: SuperAdminDashboardData | ManagementDashboardData | ManagerDashboardData | LeadDashboardData | EmployeeDashboardData;
    role?: string;
    error?: string;
  }> {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: any;
        role: string;
        message?: string;
      }> = await axiosInstance.get(this.API_PREFIX);

      if (!response.data.success) {
        return { error: response.data.message || 'Failed to fetch dashboard data' };
      }

      return { dashboard: response.data.data, role: response.data.role };
    } catch (error) {
      console.error('Error in getRoleSpecificDashboard:', error);
      const { error: errorMessage } = handleApiError(error);
      return { error: errorMessage };
    }
  }

  /**
   * Get Super Admin dashboard
   */
  static async getSuperAdminDashboard(): Promise<{ dashboard?: SuperAdminDashboardData; error?: string }> {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: SuperAdminDashboardData;
        message?: string;
      }> = await axiosInstance.get(`${this.API_PREFIX}/super-admin`);

      if (!response.data.success) {
        return { error: response.data.message || 'Failed to fetch super admin dashboard' };
      }

      return { dashboard: response.data.data };
    } catch (error) {
      console.error('Error in getSuperAdminDashboard:', error);
      const { error: errorMessage } = handleApiError(error);
      return { error: errorMessage };
    }
  }

  /**
   * Get Management dashboard
   */
  static async getManagementDashboard(): Promise<{ dashboard?: ManagementDashboardData; error?: string }> {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: ManagementDashboardData;
        message?: string;
      }> = await axiosInstance.get(`${this.API_PREFIX}/management`);

      if (!response.data.success) {
        return { error: response.data.message || 'Failed to fetch management dashboard' };
      }

      return { dashboard: response.data.data };
    } catch (error) {
      console.error('Error in getManagementDashboard:', error);
      const { error: errorMessage } = handleApiError(error);
      return { error: errorMessage };
    }
  }

  /**
   * Get Manager dashboard
   */
  static async getManagerDashboard(): Promise<{ dashboard?: ManagerDashboardData; error?: string }> {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: ManagerDashboardData;
        message?: string;
      }> = await axiosInstance.get(`${this.API_PREFIX}/manager`);

      if (!response.data.success) {
        return { error: response.data.message || 'Failed to fetch manager dashboard' };
      }

      return { dashboard: response.data.data };
    } catch (error) {
      console.error('Error in getManagerDashboard:', error);
      const { error: errorMessage } = handleApiError(error);
      return { error: errorMessage };
    }
  }

  /**
   * Get Lead dashboard
   */
  static async getLeadDashboard(): Promise<{ dashboard?: LeadDashboardData; error?: string }> {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: LeadDashboardData;
        message?: string;
      }> = await axiosInstance.get(`${this.API_PREFIX}/lead`);

      if (!response.data.success) {
        return { error: response.data.message || 'Failed to fetch lead dashboard' };
      }

      return { dashboard: response.data.data };
    } catch (error) {
      console.error('Error in getLeadDashboard:', error);
      const { error: errorMessage } = handleApiError(error);
      return { error: errorMessage };
    }
  }

  /**
   * Get Employee dashboard
   */
  static async getEmployeeDashboard(): Promise<{ dashboard?: EmployeeDashboardData; error?: string }> {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: EmployeeDashboardData;
        message?: string;
      }> = await axiosInstance.get(`${this.API_PREFIX}/employee`);

      if (!response.data.success) {
        return { error: response.data.message || 'Failed to fetch employee dashboard' };
      }

      return { dashboard: response.data.data };
    } catch (error) {
      console.error('Error in getEmployeeDashboard:', error);
      const { error: errorMessage } = handleApiError(error);
      return { error: errorMessage };
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
