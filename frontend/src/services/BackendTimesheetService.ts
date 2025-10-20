import { backendApi } from '../lib/backendApi';
import type { Timesheet, TimeEntry, TimesheetStatus, TimesheetWithDetails } from '../types';

/**
 * Backend Timesheet Service - Node.js/MongoDB Integration
 * Handles timesheet operations through the backend API while keeping Supabase for auth
 */
export class BackendTimesheetService {
  /**
   * Get all timesheets (Super Admin and Management)
   */
  static async getAllTimesheets(): Promise<{ timesheets: Timesheet[]; error?: string }> {
    try {
      const response = await backendApi.getAllTimesheets();
      return { timesheets: response.data || [] };
    } catch (error: any) {
      console.error('Error fetching all timesheets:', error);
      return { timesheets: [], error: error.message };
    }
  }

  /**
   * Get user's timesheets using backend API
   */
  static async getUserTimesheets(
    userId?: string,
    statusFilter?: TimesheetStatus[],
    weekStartFilter?: string,
    limit = 50,
    offset = 0
  ): Promise<{ timesheets: TimesheetWithDetails[]; total: number; error?: string }> {
    try {
      const response = await backendApi.getUserTimesheets({
        userId,
        status: statusFilter,
        weekStartDate: weekStartFilter,
        limit,
        offset
      });

      return {
        timesheets: response.data || [],
        total: response.total || 0
      };
    } catch (error: any) {
      console.error('Error fetching user timesheets:', error);
      return { timesheets: [], total: 0, error: error.message };
    }
  }

  /**
   * Create new timesheet
   */
  static async createTimesheet(userId: string, weekStartDate: string): Promise<{ timesheet?: Timesheet; error?: string }> {
    try {

      const response = await backendApi.createTimesheet({
        userId,
        weekStartDate
      });

      if (response.success) {
        return { timesheet: response.data as Timesheet };
      } else {
        return { error: 'Failed to create timesheet' };
      }
    } catch (error: any) {
      console.error('Error in createTimesheet:', error);
      return { error: error.message };
    }
  }

  /**
   * Get timesheet for specific user and week
   */
  static async getTimesheetByUserAndWeek(userId: string, weekStartDate: string): Promise<{ timesheet?: TimesheetWithDetails; error?: string }> {
    try {
      const response = await backendApi.getTimesheetByUserAndWeek(userId, weekStartDate);

      if (response.success && response.data) {
        return { timesheet: response.data as TimesheetWithDetails };
      } else {
        return { timesheet: undefined };
      }
    } catch (error: any) {
      console.error('Error fetching timesheet by user and week:', error);
      return { error: error.message };
    }
  }

  /**
   * Submit timesheet for approval
   */
  static async submitTimesheet(timesheetId: string): Promise<{ success: boolean; error?: string }> {
    try {

      const response = await backendApi.submitTimesheet(timesheetId);

      if (response.success) {
        return { success: true };
      } else {
        return { success: false, error: 'Failed to submit timesheet' };
      }
    } catch (error: any) {
      console.error('Error in submitTimesheet:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Manager approve/reject timesheet
   */
  static async managerApproveRejectTimesheet(
    timesheetId: string,
    action: 'approve' | 'reject',
    options: {
      reason?: string;
      approverRole?: 'lead' | 'manager';
      finalize?: boolean;
      notify?: boolean;
    } = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await backendApi.managerApproveRejectTimesheet(timesheetId, action, options);

      if (response.success) {
        return { success: true };
      } else {
        return { success: false, error: `Failed to ${action} timesheet` };
      }
    } catch (error: any) {
      console.error('Error in managerApproveRejectTimesheet:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Management approve/reject timesheet
   */
  static async managementApproveRejectTimesheet(
    timesheetId: string,
    action: 'approve' | 'reject',
    options: {
      reason?: string;
      approverRole?: 'management' | 'manager';
      finalize?: boolean;
      notify?: boolean;
    } = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await backendApi.managementApproveRejectTimesheet(timesheetId, action, options);

      if (response.success) {
        return { success: true };
      } else {
        return { success: false, error: `Failed to ${action} timesheet` };
      }
    } catch (error: any) {
      console.error('Error in managementApproveRejectTimesheet:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add time entry to timesheet
   */
  static async addTimeEntry(
    timesheetId: string,
    entryData: {
      project_id?: string;
      task_id?: string;
      date: string;
      hours: number;
      description?: string;
      is_billable: boolean;
      custom_task_description?: string;
      entry_type: 'project_task' | 'custom_task';
    }
  ): Promise<{ entry?: TimeEntry; error?: string }> {
    try {

      const response = await backendApi.addTimeEntry(timesheetId, {
        date: entryData.date,
        hours: entryData.hours,
        entry_type: entryData.entry_type,
        is_billable: entryData.is_billable,
        project_id: entryData.project_id,
        task_id: entryData.task_id,
        description: entryData.description,
        custom_task_description: entryData.custom_task_description
      });

      if (response.success) {
        return { entry: response.data as TimeEntry };
      } else {
        return { error: 'Failed to add time entry' };
      }
    } catch (error: any) {
      console.error('Error in addTimeEntry:', error);
      return { error: error.message };
    }
  }

  /**
   * Get timesheets for approval (Manager/Management view)
   */
  static async getTimesheetsForApproval(
    approverRole: 'manager' | 'management' | 'lead'
  ): Promise<{ timesheets: TimesheetWithDetails[]; error?: string }> {
    try {
      let statusFilter: TimesheetStatus[];

      if (approverRole === 'lead') {
        statusFilter = ['draft', 'submitted', 'manager_approved', 'manager_rejected', 'frozen'];
      } else if (approverRole === 'manager') {
        statusFilter = ['submitted', 'management_rejected'];
      } else {
        statusFilter = ['management_pending'];
      }

      const result = await this.getUserTimesheets(undefined, statusFilter);

      if (result.error) {
        return { timesheets: [], error: result.error };
      }

      // Enhance with approval permissions
      const enhancedTimesheets = result.timesheets.map(timesheet => ({
        ...timesheet,
        can_edit: approverRole !== 'lead',
        can_submit: false,
        can_approve: approverRole !== 'lead',
        can_reject: approverRole !== 'lead',
      }));

      return { timesheets: enhancedTimesheets };
    } catch (error: any) {
      console.error('Error in getTimesheetsForApproval:', error);
      return { timesheets: [], error: error.message };
    }
  }

  /**
   * Get next action description for timesheet status
   */
  private static getNextAction(status: TimesheetStatus): string {
    switch (status) {
      case 'draft':
        return 'Ready to submit';
      case 'submitted':
        return 'Awaiting manager approval';
      case 'manager_approved':
        return 'Automatically forwarded to management';
      case 'management_pending':
        return 'Awaiting management approval';
      case 'manager_rejected':
        return 'Needs revision after manager rejection';
      case 'management_rejected':
        return 'Needs revision after management rejection';
      case 'frozen':
        return 'Approved & frozen - ready for billing';
      case 'billed':
        return 'Complete - timesheet has been billed';
      default:
        return 'Unknown status';
    }
  }

  /**
   * Check if timesheet can be modified
   */
  static canModifyTimesheet(timesheet: Timesheet): boolean {
    return ['draft', 'manager_rejected', 'management_rejected'].includes(timesheet.status) &&
      !timesheet.is_frozen;
  }

  /**
   * Check if timesheet is frozen
   */
  static isTimesheetFrozen(timesheet: Timesheet): boolean {
    return timesheet.is_frozen || timesheet.status === 'frozen' || timesheet.status === 'billed';
  }

  /**
   * Check if timesheet is billed
   */
  static isTimesheetBilled(timesheet: Timesheet): boolean {
    return timesheet.status === 'billed';
  }
}

export default BackendTimesheetService;
