import { backendApi } from '../lib/backendApi';

export interface Defaulter {
  user_id: string;
  user_name: string;
  user_email?: string;
  role: string;
  days_overdue: number;
  last_submission_date?: Date | string;
  project_id?: string;
  project_name?: string;
}

export interface DefaultersByProject {
  project_id: string;
  project_name: string;
  defaulters: Defaulter[];
}

export interface DefaulterStats {
  total_defaulters: number;
  by_project: Record<string, number>;
  critical_defaulters: number; // Overdue by 5+ days
}

/**
 * Defaulter Management Service
 * Handles defaulter tracking and notifications
 */
export class DefaulterService {
  /**
   * Get defaulters for a specific project and week
   */
  static async getProjectDefaulters(
    projectId: string,
    weekStart: string
  ): Promise<{
    defaulters: Defaulter[];
    count: number;
    error?: string
  }> {
    try {
      const response = await backendApi.get(`/defaulters/${projectId}/${weekStart}`);

      if (response.success) {
        return {
          defaulters: response.defaulters as Defaulter[] || [],
          count: response.count || 0
        };
      } else {
        return {
          defaulters: [],
          count: 0,
          error: response.error || 'Failed to fetch project defaulters'
        };
      }
    } catch (error: any) {
      console.error('Error fetching project defaulters:', error);
      return {
        defaulters: [],
        count: 0,
        error: error.message || 'Failed to fetch project defaulters'
      };
    }
  }

  /**
   * Get all defaulters for a manager across all their projects
   */
  static async getManagerDefaulters(
    managerId: string,
    weekStart: string
  ): Promise<{
    projects: DefaultersByProject[];
    total_defaulters: number;
    error?: string
  }> {
    try {
      const response = await backendApi.get(`/defaulters/manager/${managerId}/${weekStart}`);

      if (response.success) {
        return {
          projects: response.projects as DefaultersByProject[] || [],
          total_defaulters: response.total_defaulters || 0
        };
      } else {
        return {
          projects: [],
          total_defaulters: 0,
          error: response.error || 'Failed to fetch manager defaulters'
        };
      }
    } catch (error: any) {
      console.error('Error fetching manager defaulters:', error);
      return {
        projects: [],
        total_defaulters: 0,
        error: error.message || 'Failed to fetch manager defaulters'
      };
    }
  }

  /**
   * Get defaulter statistics for dashboard
   */
  static async getDefaulterStats(
    managerId?: string,
    weekStartDate?: string
  ): Promise<{
    stats?: DefaulterStats;
    error?: string
  }> {
    try {
      const params = new URLSearchParams();
      if (managerId) params.append('managerId', managerId);
      if (weekStartDate) params.append('weekStartDate', weekStartDate);

      const queryString = params.toString();
      const response = await backendApi.get(`/defaulters/stats${queryString ? `?${queryString}` : ''}`);

      if (response.success && response.stats) {
        return { stats: response.stats as DefaulterStats };
      } else {
        return { error: response.error || 'Failed to fetch defaulter stats' };
      }
    } catch (error: any) {
      console.error('Error fetching defaulter stats:', error);
      return { error: error.message || 'Failed to fetch defaulter stats' };
    }
  }

  /**
   * Send reminder notifications to defaulters
   */
  static async notifyDefaulters(
    projectId: string,
    weekStartDate: string
  ): Promise<{
    success: boolean;
    notification_count?: number;
    error?: string
  }> {
    try {
      const response = await backendApi.post('/defaulters/notify', {
        projectId,
        weekStartDate
      });

      if (response.success) {
        return {
          success: true,
          notification_count: response.notification_count
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to send notifications'
        };
      }
    } catch (error: any) {
      console.error('Error sending defaulter notifications:', error);
      return {
        success: false,
        error: error.message || 'Failed to send notifications'
      };
    }
  }

  /**
   * Validate that there are no defaulters for a project-week
   * Used to enable/disable approval buttons
   */
  static async validateNoDefaulters(
    projectId: string,
    weekStart: string
  ): Promise<{
    has_defaulters: boolean;
    can_proceed: boolean;
    defaulters: Defaulter[];
    defaulter_count: number;
    error?: string
  }> {
    try {
      const response = await backendApi.get(`/defaulters/validate/${projectId}/${weekStart}`);

      if (response.success) {
        return {
          has_defaulters: response.has_defaulters || false,
          can_proceed: response.can_proceed || false,
          defaulters: response.defaulters as Defaulter[] || [],
          defaulter_count: response.defaulter_count || 0
        };
      } else {
        return {
          has_defaulters: true,
          can_proceed: false,
          defaulters: [],
          defaulter_count: 0,
          error: response.error || 'Failed to validate defaulters'
        };
      }
    } catch (error: any) {
      console.error('Error validating defaulters:', error);
      return {
        has_defaulters: true,
        can_proceed: false,
        defaulters: [],
        defaulter_count: 0,
        error: error.message || 'Failed to validate defaulters'
      };
    }
  }
}

export default DefaulterService;
