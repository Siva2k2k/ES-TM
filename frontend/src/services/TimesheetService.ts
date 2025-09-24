import { supabase } from '../lib/supabase';
import { BackendTimesheetService } from './BackendTimesheetService';
import type { Timesheet, TimeEntry, TimesheetStatus, TimesheetWithDetails } from '../types';

/**
 * Timesheet Management Service - Hybrid Backend/Supabase Integration
 * Core timesheet operations use Backend API, auth and dashboard use Supabase
 */
export class TimesheetService {
  /**
   * Get all timesheets (Super Admin and Management) - Using Backend API
   */
  static async getAllTimesheets(): Promise<{ timesheets: Timesheet[]; error?: string }> {
    return BackendTimesheetService.getAllTimesheets();
  }

  /**
   * Get timesheets by status
   */
  static async getTimesheetsByStatus(status: TimesheetStatus): Promise<{ timesheets: Timesheet[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('timesheets')
        .select(`
          *,
          users!inner(full_name, email, role)
        `)
        .eq('status', status)
        .is('deleted_at', null)
        .order('week_start_date', { ascending: false });

      if (error) {
        console.error('Error fetching timesheets by status:', error);
        return { timesheets: [], error: error.message };
      }

      return { timesheets: data as Timesheet[] };
    } catch (error) {
      console.error('Error in getTimesheetsByStatus:', error);
      return { timesheets: [], error: 'Failed to fetch timesheets by status' };
    }
  }

  /**
   * Get user's timesheets - Using Backend API
   */
  static async getUserTimesheets(
    userId?: string,
    statusFilter?: TimesheetStatus[],
    weekStartFilter?: string,
    limit = 50,
    offset = 0
  ): Promise<{ timesheets: TimesheetWithDetails[]; total: number; error?: string }> {
    return BackendTimesheetService.getUserTimesheets(userId, statusFilter, weekStartFilter, limit, offset);
  }

  /**
   * Create new timesheet - Using Backend API with auth check
   */
  static async createTimesheet(userId: string, weekStartDate: string): Promise<{ timesheet?: Timesheet; error?: string }> {
    try {
      // Verify auth with Supabase first
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        return { error: 'Authentication error: ' + authError.message };
      }

      if (!user) {
        return { error: 'User not authenticated' };
      }

      if (user.id !== userId) {
        return { error: 'User ID mismatch - cannot create timesheet for different user' };
      }

      // Use backend service for the actual creation
      return BackendTimesheetService.createTimesheet(userId, weekStartDate);
    } catch (error) {
      console.error('Error in createTimesheet:', error);
      return { error: 'Failed to create timesheet' };
    }
  }

  /**
   * Get timesheet for specific user and week - Using Backend API
   */
  static async getTimesheetByUserAndWeek(userId: string, weekStartDate: string): Promise<{ timesheet?: TimesheetWithDetails; error?: string }> {
    return BackendTimesheetService.getTimesheetByUserAndWeek(userId, weekStartDate);
  }

  /**
   * Submit timesheet for approval using database function
   */
  /**
   * Submit timesheet for approval - Using Backend API
   */
  static async submitTimesheet(timesheetId: string): Promise<{ success: boolean; error?: string }> {
    return BackendTimesheetService.submitTimesheet(timesheetId);
  }

  /**
   * Manager approve/reject timesheet - Using Backend API
   */
  static async managerApproveRejectTimesheet(
    timesheetId: string,
    action: 'approve' | 'reject',
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    return BackendTimesheetService.managerApproveRejectTimesheet(timesheetId, action, reason);
  }

  /**
   * Management approve/reject timesheet - Using Backend API
   */
  static async managementApproveRejectTimesheet(
    timesheetId: string,
    action: 'approve' | 'reject',
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    return BackendTimesheetService.managementApproveRejectTimesheet(timesheetId, action, reason);
  }

  /**
   * Escalate timesheet to management
   */
  static async escalateToManagement(timesheetId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('escalate_to_management', {
        timesheet_uuid: timesheetId
      });

      if (error) {
        console.error('Error escalating timesheet:', error);
        return { success: false, error: error.message };
      }

      console.log(`Timesheet escalated to management: ${timesheetId}`);
      return { success: true };
    } catch (error) {
      console.error('Error in escalateToManagement:', error);
      return { success: false, error: 'Failed to escalate timesheet' };
    }
  }

  /**
   * Mark timesheet as billed
   */
  static async markTimesheetBilled(timesheetId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('mark_timesheet_billed', {
        timesheet_uuid: timesheetId
      });

      if (error) {
        console.error('Error marking timesheet as billed:', error);
        return { success: false, error: error.message };
      }

      console.log(`Timesheet marked as billed: ${timesheetId}`);
      return { success: true };
    } catch (error) {
      console.error('Error in markTimesheetBilled:', error);
      return { success: false, error: 'Failed to mark timesheet as billed' };
    }
  }

  /**
   * Get timesheet dashboard data - Using Backend/Supabase (keeping Supabase for now)
   */
  static async getTimesheetDashboard(): Promise<{
    totalTimesheets: number;
    pendingApproval: number;
    pendingManagement: number;
    pendingBilling: number;
    verified: number;
    billed: number;
    totalHours: number;
    averageHoursPerWeek: number;
    completionRate: number;
    error?: string;
  }> {
    return BackendTimesheetService.getTimesheetDashboard();
  }

  /**
   * Get time entries for a timesheet
   */
  static async getTimeEntries(timesheetId: string): Promise<{ entries: TimeEntry[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          *,
          projects(name),
          tasks(name)
        `)
        .eq('timesheet_id', timesheetId)
        .is('deleted_at', null)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching time entries:', error);
        return { entries: [], error: error.message };
      }

      return { entries: data as TimeEntry[] };
    } catch (error) {
      console.error('Error in getTimeEntries:', error);
      return { entries: [], error: 'Failed to fetch time entries' };
    }
  }

  /**
   * Validate time entry for overlaps and business rules
   */
  private static async validateTimeEntry(
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
    },
    excludeEntryId?: string
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      // 1. Check for overlapping entries on the same date
      const { data: existingEntries, error: fetchError } = await supabase
        .from('time_entries')
        .select('id, project_id, task_id, hours, entry_type, custom_task_description')
        .eq('timesheet_id', timesheetId)
        .eq('date', entryData.date)
        .is('deleted_at', null);

      if (fetchError) {
        return { valid: false, error: `Failed to check existing entries: ${fetchError.message}` };
      }

      // Filter out the entry being updated if this is an update operation
      type ExistingEntry = {
        id: string;
        project_id?: string;
        task_id?: string;
        hours: number;
        entry_type: string;
        custom_task_description?: string;
      };

      const entries = excludeEntryId
        ? (existingEntries as ExistingEntry[]).filter(e => e.id !== excludeEntryId)
        : (existingEntries as ExistingEntry[]);

      // 2. Check for duplicate project/task combinations
      if (entryData.entry_type === 'project_task' && entryData.project_id && entryData.task_id) {
        const duplicateProjectTask = entries.find(e =>
          e.entry_type === 'project_task' &&
          e.project_id === entryData.project_id &&
          e.task_id === entryData.task_id
        );

        if (duplicateProjectTask) {
          return {
            valid: false,
            error: 'A time entry for this project and task already exists on this date. Please update the existing entry instead.'
          };
        }
      }

      // 3. Check for duplicate custom tasks with same description
      if (entryData.entry_type === 'custom_task' && entryData.custom_task_description) {
        const duplicateCustomTask = entries.find(e =>
          e.entry_type === 'custom_task' &&
          e.custom_task_description === entryData.custom_task_description
        );

        if (duplicateCustomTask) {
          return {
            valid: false,
            error: 'A custom task with this description already exists on this date. Please update the existing entry instead.'
          };
        }
      }

      // 4. Check daily hours limit (8-10 hours as per business rule)
      const currentDayHours = entries.reduce((sum: number, entry: ExistingEntry) => sum + entry.hours, 0);
      const totalHoursWithNewEntry = currentDayHours + entryData.hours;

      if (totalHoursWithNewEntry > 10) {
        return {
          valid: false,
          error: `Total hours for this date would exceed the maximum limit of 10 hours (current: ${currentDayHours}, adding: ${entryData.hours}, total: ${totalHoursWithNewEntry})`
        };
      }

      if (totalHoursWithNewEntry < 0) {
        return {
          valid: false,
          error: 'Hours cannot be negative'
        };
      }

      return { valid: true };
    } catch (error) {
      console.error('Error in validateTimeEntry:', error);
      return { valid: false, error: 'Failed to validate time entry' };
    }
  }

  /**
   * Add time entry to timesheet - Using Backend API
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
    return BackendTimesheetService.addTimeEntry(timesheetId, entryData);
  }

  /**
   * Update timesheet total hours (called automatically after entry changes)
   */
  private static async updateTimesheetTotalHours(timesheetId: string): Promise<void> {
    try {
      console.log('🔄 Updating total hours for timesheet:', timesheetId);

      // Calculate total hours from time entries
      const { data: entries, error: entriesError } = await supabase
        .from('time_entries')
        .select('hours')
        .eq('timesheet_id', timesheetId)
        .is('deleted_at', null);

      if (entriesError) {
        console.error('Error calculating total hours:', entriesError);
        return;
      }

      const totalHours = (entries as TimeEntry[]).reduce((sum: number, entry: TimeEntry) => sum + entry.hours, 0);
      console.log('📊 Calculated total hours:', totalHours);

      // Update timesheet
      const { error: updateError } = await supabase
        .from('timesheets')
        .update({
          total_hours: totalHours,
          updated_at: new Date().toISOString()
        })
        .eq('id', timesheetId);

      if (updateError) {
        console.error('Error updating timesheet total hours:', updateError);
      } else {
        console.log('✅ Timesheet total hours updated successfully');
      }
    } catch (error) {
      console.error('Error in updateTimesheetTotalHours:', error);
    }
  }

  /**
   * Delete all time entries for a timesheet
   */
  static async deleteTimesheetEntries(timesheetId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('timesheet_id', timesheetId);

      if (error) {
        console.error('Error deleting timesheet entries:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteTimesheetEntries:', error);
      return { success: false, error: 'Failed to delete timesheet entries' };
    }
  }

  /**
   * Update timesheet with new entries using transaction to prevent data integrity issues
   */
  static async updateTimesheetEntries(
    timesheetId: string,
    entries: {
      project_id?: string;
      task_id?: string;
      date: string;
      hours: number;
      description?: string;
      is_billable: boolean;
      custom_task_description?: string;
      entry_type: 'project_task' | 'custom_task';
    }[]
  ): Promise<{ success: boolean; error?: string; updatedEntries?: TimeEntry[] }> {
    try {
      // Validate all entries before proceeding
      for (const entry of entries) {
        const validation = await this.validateTimeEntry(timesheetId, entry);
        if (!validation.valid) {
          return { success: false, error: `Validation failed for entry on ${entry.date}: ${validation.error}` };
        }
      }

      // Use RPC function for atomic update if available, otherwise fallback to manual transaction
      try {
        // Prepare entries for RPC call
        const entriesForRpc = entries.map(e => ({
          timesheet_id: timesheetId,
          project_id: e.project_id || null,
          task_id: e.task_id || null,
          date: e.date,
          hours: e.hours,
          description: e.description || null,
          is_billable: e.is_billable,
          custom_task_description: e.custom_task_description || null,
          entry_type: e.entry_type
        }));

        // Try to use RPC for atomic operation
        const { data: rpcResult, error: rpcError } = await supabase.rpc('update_timesheet_entries_atomic', {
          timesheet_uuid: timesheetId,
          new_entries: entriesForRpc
        });

        if (!rpcError && rpcResult) {
          console.log('✅ Atomic update completed via RPC');
          return { success: true, updatedEntries: rpcResult as TimeEntry[] };
        }

        console.log('⚠️ RPC not available or failed, falling back to manual transaction:', rpcError?.message);
      } catch (rpcError) {
        console.log('⚠️ RPC error, falling back to manual transaction:', rpcError);
      }

      // Fallback: Manual approach with better error handling
      console.log('🔄 Starting manual transaction for timesheet entries update');

      // Step 1: Soft delete existing entries (mark as deleted instead of hard delete)
      const { error: softDeleteError } = await supabase
        .from('time_entries')
        .update({ deleted_at: new Date().toISOString() })
        .eq('timesheet_id', timesheetId)
        .is('deleted_at', null);

      if (softDeleteError) {
        return { success: false, error: `Failed to mark entries as deleted: ${softDeleteError.message}` };
      }

      let insertedEntries: TimeEntry[] = [];

      // Step 2: Insert new entries if any
      if (entries && entries.length > 0) {
        const insertData = entries.map(e => ({
          timesheet_id: timesheetId,
          project_id: e.project_id || null,
          task_id: e.task_id || null,
          date: e.date,
          hours: e.hours,
          description: e.description,
          is_billable: e.is_billable,
          custom_task_description: e.custom_task_description,
          entry_type: e.entry_type
        }));

        const { data: inserted, error: insertError } = await supabase
          .from('time_entries')
          .insert(insertData)
          .select();

        if (insertError) {
          // Rollback: Restore soft-deleted entries
          console.error('❌ Insert failed, rolling back soft deletes');
          await supabase
            .from('time_entries')
            .update({ deleted_at: null })
            .eq('timesheet_id', timesheetId)
            .not('deleted_at', 'is', null);

          return { success: false, error: `Failed to insert new entries: ${insertError.message}` };
        }

        insertedEntries = (inserted || []) as TimeEntry[];
      }

      // Step 3: Update timesheet total hours
      await this.updateTimesheetTotalHours(timesheetId);

      console.log('✅ Manual transaction completed successfully');
      return { success: true, updatedEntries: insertedEntries };
    } catch (error) {
      console.error('Error in updateTimesheetEntries:', error);
      return { success: false, error: 'Failed to update timesheet entries' };
    }
  }

  /**
   * Get timesheet by ID with details
   */
  static async getTimesheetById(timesheetId: string): Promise<{ timesheet?: TimesheetWithDetails; error?: string }> {
    try {
      console.log('🔍 TimesheetService.getTimesheetById called with ID:', timesheetId);

      // Skip the session check for now and go directly to the query
      console.log('🔎 Attempting basic timesheet query directly...');

      let basicTimesheet, basicError;

      try {
        // Set a timeout for the query
        const queryStart = Date.now();
        console.log('⏳ Starting query at:', new Date().toISOString());

        const { data, error } = await supabase
          .from('timesheets')
          .select('*')
          .eq('id', timesheetId)
          .is('deleted_at', null)
          .single();

        const queryTime = Date.now() - queryStart;
        console.log(`⏱️ Query completed in ${queryTime}ms`);

        basicTimesheet = data;
        basicError = error;
      } catch (queryError) {
        console.error('💥 Query exception:', queryError);
        return { error: 'Database query failed' };
      }

      console.log('📄 Basic timesheet query result:', { basicTimesheet, error: basicError });

      if (basicError) {
        console.error('❌ Error in basic timesheet query:', basicError);
        return { error: basicError.message };
      }

      if (!basicTimesheet) {
        console.error('❌ No timesheet found with ID:', timesheetId);
        return { error: 'Timesheet not found' };
      }

      // Now get user details separately
      console.log('👤 Fetching user details for user_id:', basicTimesheet.user_id);
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name, email, role')
        .eq('id', basicTimesheet.user_id)
        .single();

      console.log('👤 User query result:', { userData, error: userError });

      if (userError) {
        console.error('❌ Error fetching user:', userError);
        return { error: userError.message };
      }

      // Combine the timesheet with user data
      const timesheet = {
        ...basicTimesheet,
        users: userData
      };

      console.log('📋 Fetching time entries for timesheet...');

      // Get time entries
      const { data: entries, error: entriesError } = await supabase
        .from('time_entries')
        .select(`
          *,
          projects(name),
          tasks(name)
        `)
        .eq('timesheet_id', timesheetId)
        .is('deleted_at', null)
        .order('date', { ascending: true });

      console.log('⏰ Time entries query result:', { entries, error: entriesError });

      if (entriesError) {
        console.error('❌ Error fetching time entries:', entriesError);
        return { error: entriesError.message };
      }

      // Calculate billable/non-billable hours
      const billableHours = entries?.filter((e: TimeEntry) => e.is_billable).reduce((sum: number, e: TimeEntry) => sum + e.hours, 0) || 0;
      const nonBillableHours = entries?.filter((e: TimeEntry) => !e.is_billable).reduce((sum: number, e: TimeEntry) => sum + e.hours, 0) || 0;

      console.log('💰 Calculated hours:', { billableHours, nonBillableHours, totalEntries: entries?.length || 0 });

      const enhancedTimesheet: TimesheetWithDetails = {
        ...timesheet,
        time_entries: entries as TimeEntry[] || [],
        entries: entries as TimeEntry[] || [],
        user_name: timesheet.users.full_name,
        user_email: timesheet.users.email,
        billableHours,
        nonBillableHours,
        can_edit: ['draft', 'manager_rejected', 'management_rejected'].includes(timesheet.status),
        can_submit: timesheet.status === 'draft' && timesheet.total_hours > 0,
        can_approve: false, // Will be determined by role in component
        can_reject: false, // Will be determined by role in component
        next_action: this.getNextAction(timesheet.status)
      };

      console.log('✅ Enhanced timesheet created:', {
        id: enhancedTimesheet.id,
        status: enhancedTimesheet.status,
        total_hours: enhancedTimesheet.total_hours,
        can_submit: enhancedTimesheet.can_submit,
        entries_count: enhancedTimesheet.time_entries?.length || 0
      });

      return { timesheet: enhancedTimesheet };
    } catch (error) {
      console.error('💥 Error in getTimesheetById:', error);
      return { error: 'Failed to fetch timesheet details' };
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
   * Get calendar data for a user and month with improved boundary handling
   */
  static async getCalendarData(userId: string, year: number, month: number): Promise<{
    calendarData: { [date: string]: { hours: number; status: string; entries: TimeEntry[] } };
    error?: string;
  }> {
    try {
      console.log(`📅 Loading calendar data for user ${userId}, year ${year}, month ${month}`);

      // Validate input parameters
      if (month < 1 || month > 12) {
        return { calendarData: {}, error: 'Invalid month parameter. Month must be between 1 and 12.' };
      }

      if (year < 2000 || year > 2100) {
        return { calendarData: {}, error: 'Invalid year parameter. Year must be between 2000 and 2100.' };
      }

      // Month parameter is 1-indexed (1=January, 12=December)
      // Calculate proper month boundaries 
      const monthStart = new Date(year, month - 1, 1); // First day of month
      const monthEnd = new Date(year, month, 0); // Last day of month

      // Fix timezone issues by using local date strings
      const monthStartLocal = `${year}-${String(month).padStart(2, '0')}-01`;
      const monthEndLocal = `${year}-${String(month).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}`;

      // Extend range to include partial weeks that span month boundaries
      const rangeStart = new Date(monthStart);
      rangeStart.setDate(rangeStart.getDate() - 7); // Include previous week

      const rangeEnd = new Date(monthEnd);
      rangeEnd.setDate(rangeEnd.getDate() + 7); // Include next week

      console.log(`📅 Date range: ${rangeStart.toISOString().split('T')[0]} to ${rangeEnd.toISOString().split('T')[0]}`);
      console.log(`📅 Target month boundaries: ${monthStartLocal} to ${monthEndLocal}`);
      console.log(`📅 Month start date object: ${monthStart.toISOString()}`);
      console.log(`📅 Month end date object: ${monthEnd.toISOString()}`);

      // Prevent future date entries beyond current date + 3 days grace period
      const now = new Date();
      const maxAllowedDate = new Date(now);
      maxAllowedDate.setDate(maxAllowedDate.getDate() + 3);

      const { data: timesheets, error: timesheetsError } = await supabase
        .from('timesheets')
        .select(`
          id,
          user_id,
          week_start_date,
          week_end_date,
          status,
          total_hours,
          created_at,
          updated_at,
          time_entries (
            id,
            project_id,
            task_id,
            date,
            hours,
            description,
            is_billable,
            custom_task_description,
            entry_type,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId)
        .gte('week_start_date', rangeStart.toISOString().split('T')[0])
        .lte('week_end_date', rangeEnd.toISOString().split('T')[0])
        .is('deleted_at', null)
        .order('week_start_date', { ascending: true });

      if (timesheetsError) {
        console.error('❌ Error fetching calendar data:', timesheetsError);
        return { calendarData: {}, error: timesheetsError.message };
      }

      console.log(`📅 Found ${timesheets?.length || 0} timesheets`);

      const calendarData: { [date: string]: { hours: number; status: string; entries: TimeEntry[] } } = {};

      if (timesheets) {
        timesheets.forEach((timesheet: unknown) => {
          const typedTimesheet = timesheet as {
            id: string;
            status: string;
            updated_at: string;
            time_entries?: unknown[];
          };
          console.log(`📅 Processing timesheet ${typedTimesheet.id} with status ${typedTimesheet.status}`);

          if (typedTimesheet.time_entries && Array.isArray(typedTimesheet.time_entries)) {
            console.log(`📅 Timesheet has ${typedTimesheet.time_entries.length} time entries`);
            typedTimesheet.time_entries.forEach((entry: unknown, index: number) => {
              const typedEntry = entry as {
                id: string;
                project_id: string;
                task_id: string;
                date: string;
                hours: number;
                description: string;
                is_billable: boolean;
                custom_task_description?: string;
                entry_type: string;
                created_at: string;
                updated_at: string;
              };

              const entryDate = new Date(typedEntry.date);
              const entryDateStr = typedEntry.date;

              console.log(`📅 Entry ${index + 1}: ${entryDateStr} (${typedEntry.hours}h)`);
              console.log(`📅   entryDateStr: ${entryDateStr}`);
              console.log(`📅   monthStartLocal: ${monthStartLocal}`);
              console.log(`📅   monthEndLocal: ${monthEndLocal}`);
              console.log(`📅   entryDateStr >= monthStartLocal: ${entryDateStr >= monthStartLocal}`);
              console.log(`📅   entryDateStr <= monthEndLocal: ${entryDateStr <= monthEndLocal}`);
              console.log(`📅   Within month: ${entryDateStr >= monthStartLocal && entryDateStr <= monthEndLocal}`);

              // Only include entries within the target month (using string comparison to avoid timezone issues)
              if (entryDateStr >= monthStartLocal && entryDateStr <= monthEndLocal) {
                // Check for future date validation
                if (entryDate > maxAllowedDate) {
                  console.warn(`⚠️ Skipping future entry beyond grace period: ${entryDateStr}`);
                  return;
                }

                console.log(`📅   ✅ Adding entry to calendar data`);

                if (!calendarData[entryDateStr]) {
                  calendarData[entryDateStr] = {
                    hours: 0,
                    status: typedTimesheet.status,
                    entries: []
                  };
                }

                calendarData[entryDateStr].hours += typedEntry.hours;
                calendarData[entryDateStr].entries.push({
                  id: typedEntry.id,
                  project_id: typedEntry.project_id,
                  task_id: typedEntry.task_id,
                  date: typedEntry.date,
                  hours: typedEntry.hours,
                  description: typedEntry.description,
                  is_billable: typedEntry.is_billable,
                  custom_task_description: typedEntry.custom_task_description,
                  entry_type: typedEntry.entry_type,
                  created_at: typedEntry.created_at,
                  updated_at: typedEntry.updated_at
                } as TimeEntry);

                // Update status to most recent timesheet status for this date
                if (new Date(typedTimesheet.updated_at) > new Date(calendarData[entryDateStr].entries[0]?.updated_at || '1970-01-01')) {
                  calendarData[entryDateStr].status = typedTimesheet.status;
                }
              } else {
                console.log(`📅   ❌ Entry ${entryDateStr} is outside target month range`);
              }
            });
          }
        });
      }

      console.log(`📅 Calendar data keys: ${Object.keys(calendarData).length} days with data`);
      console.log(`📅 Sample calendar data:`, Object.keys(calendarData).slice(0, 3).map(date => ({
        date,
        hours: calendarData[date].hours,
        status: calendarData[date].status,
        entriesCount: calendarData[date].entries.length
      })));

      return { calendarData };
    } catch (error) {
      console.error('❌ Error in getCalendarData:', error);
      return { calendarData: {}, error: 'Failed to fetch calendar data' };
    }
  }

  /**
   * Get timesheets for approval (Manager/Management view) - Using Backend API
   */
  static async getTimesheetsForApproval(
    approverRole: 'manager' | 'management' | 'lead'
  ): Promise<{ timesheets: TimesheetWithDetails[]; error?: string }> {
    return BackendTimesheetService.getTimesheetsForApproval(approverRole);
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

export default TimesheetService;