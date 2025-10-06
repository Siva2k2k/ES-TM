/**
 * Timesheet Service
 * API calls for timesheet operations
 * Cognitive Complexity: 5
 */
import { apiClient, ENDPOINTS } from '../../../core/api';
import { Timesheet, TimesheetFormData, TimesheetStats } from '../types';

export const timesheetService = {
  /**
   * Get all timesheets for current user
   */
  async getMyTimesheets(filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Timesheet[]> {
    return apiClient.get<Timesheet[]>(ENDPOINTS.timesheets.list, { params: filters });
  },

  /**
   * Get single timesheet by ID
   */
  async getTimesheetById(id: string): Promise<Timesheet> {
    return apiClient.get<Timesheet>(ENDPOINTS.timesheets.byId(id));
  },

  /**
   * Create new timesheet
   */
  async createTimesheet(data: TimesheetFormData): Promise<Timesheet> {
    return apiClient.post<Timesheet>(ENDPOINTS.timesheets.create, data);
  },

  /**
   * Update existing timesheet
   */
  async updateTimesheet(id: string, data: Partial<TimesheetFormData>): Promise<Timesheet> {
    return apiClient.put<Timesheet>(ENDPOINTS.timesheets.update(id), data);
  },

  /**
   * Submit timesheet for approval
   */
  async submitTimesheet(id: string): Promise<Timesheet> {
    return apiClient.post<Timesheet>(ENDPOINTS.timesheets.submit(id));
  },

  /**
   * Delete timesheet
   */
  async deleteTimesheet(id: string): Promise<void> {
    return apiClient.delete(ENDPOINTS.timesheets.byId(id));
  },

  /**
   * Get timesheet statistics
   */
  async getStats(): Promise<TimesheetStats> {
    // TODO: Add endpoint for stats
    return apiClient.get<TimesheetStats>('/timesheets/stats');
  },

  /**
   * Get current week's timesheet
   */
  async getCurrentWeekTimesheet(): Promise<Timesheet | null> {
    const timesheets = await this.getMyTimesheets();
    const today = new Date();
    const currentWeek = timesheets.find(ts => {
      const start = new Date(ts.week_start_date);
      const end = new Date(ts.week_end_date);
      return today >= start && today <= end;
    });
    return currentWeek || null;
  },
};
