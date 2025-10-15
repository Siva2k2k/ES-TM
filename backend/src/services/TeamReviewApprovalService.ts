/**
 * Phase 7: Team Review Approval Service
 * Handles approve/reject/verify/bill operations with multi-manager logic
 * SonarQube compliant - kept under 250 lines
 */

import mongoose from 'mongoose';
import { Timesheet } from '../models/Timesheet';
import { TimesheetProjectApproval } from '../models/TimesheetProjectApproval';
import { ApprovalHistory } from '../models/ApprovalHistory';
import { Project } from '../models/Project';
import { logger } from '../config/logger';
import type { BulkProjectWeekApprovalResponse } from '../types/teamReview';

// Allowed timesheet statuses (must match Timesheet model)
const ALLOWED_STATUSES = new Set([
  'draft',
  'submitted',
  'manager_approved',
  'manager_rejected',
  'management_pending',
  'management_rejected',
  'frozen',
  'billed'
]);

function normalizeTimesheetStatus(status: any): string {
  if (typeof status === 'string' && ALLOWED_STATUSES.has(status)) return status;
  // Map legacy or unexpected statuses to a safe default
  if (status === 'pending') return 'submitted';
  return 'draft';
}

export interface ApprovalResponse {
  success: boolean;
  message: string;
  all_approved: boolean;
  new_status: string;
}

export class TeamReviewApprovalService {
  /**
   * Approve timesheet for a specific project
   * Multi-manager logic: Status updates only when ALL managers approve
   */
  static async approveTimesheetForProject(
    timesheetId: string,
    projectId: string,
    approverId: string,
    approverRole: string
  ): Promise<ApprovalResponse> {
    const USE_TRANSACTIONS = process.env.USE_TRANSACTIONS === 'true';
    const session = USE_TRANSACTIONS ? await mongoose.startSession() : null;
    if (session) session.startTransaction();

    try {
      const queryOpts = session ? { session } : {};
      // Get timesheet
      const timesheet = await Timesheet.findById(timesheetId, null, queryOpts);
      if (!timesheet) {
        throw new Error('Timesheet not found');
      }

      // Get project approval record
      const projectApproval = await TimesheetProjectApproval.findOne({
        timesheet_id: new mongoose.Types.ObjectId(timesheetId),
        project_id: new mongoose.Types.ObjectId(projectId)
      }, null, queryOpts);

      if (!projectApproval) {
        throw new Error('Project approval record not found');
      }

      const statusBefore = timesheet.status;

      // Update approval based on role
      if (approverRole === 'lead') {
        projectApproval.lead_status = 'approved';
        projectApproval.lead_approved_at = new Date();
        projectApproval.lead_rejection_reason = undefined;
      } else if (approverRole === 'manager' || approverRole === 'management' || approverRole === 'super_admin') {
        projectApproval.manager_status = 'approved';
        projectApproval.manager_approved_at = new Date();
        projectApproval.manager_rejection_reason = undefined;
      }

      await projectApproval.save(queryOpts);

      // Check if ALL required approvals are complete
      const allApprovals = await this.checkAllApprovalsComplete(timesheetId, session || undefined);

      let newStatus = timesheet.status;
      if (allApprovals) {
        newStatus = 'manager_approved';
        timesheet.status = newStatus;
        timesheet.approved_by_manager_id = new mongoose.Types.ObjectId(approverId);
        timesheet.approved_by_manager_at = new Date();
        await timesheet.save(queryOpts);
      }

      // Record approval history
      await ApprovalHistory.create([{
        timesheet_id: timesheet._id,
        project_id: new mongoose.Types.ObjectId(projectId),
        user_id: timesheet.user_id,
        approver_id: new mongoose.Types.ObjectId(approverId),
        approver_role: approverRole,
        action: 'approved',
        status_before: normalizeTimesheetStatus(statusBefore),
        status_after: normalizeTimesheetStatus(newStatus)
      }], queryOpts);

      if (session) await session.commitTransaction();

      return {
        success: true,
        message: allApprovals
          ? 'Timesheet approved and status updated'
          : 'Project approved, waiting for other managers',
        all_approved: allApprovals,
        new_status: newStatus
      };
    } catch (error) {
      if (session) await session.abortTransaction();
      logger.error('Error approving timesheet:', error);
      throw error;
    } finally {
       if (session) session.endSession();
    }
  }

  /**
   * Reject timesheet for a specific project
   * Rejection resets ALL approvals
   */
  static async rejectTimesheetForProject(
    timesheetId: string,
    projectId: string,
    approverId: string,
    approverRole: string,
    reason: string
  ): Promise<ApprovalResponse> {
    const USE_TRANSACTIONS = process.env.USE_TRANSACTIONS === 'true';
    const session = USE_TRANSACTIONS ? await mongoose.startSession() : null;
    if (session) session.startTransaction();

    try {
      const queryOpts = session ? { session } : {};
      const timesheet = await Timesheet.findById(timesheetId, null, queryOpts);
      if (!timesheet) {
        throw new Error('Timesheet not found');
      }

      const projectApproval = await TimesheetProjectApproval.findOne({
        timesheet_id: new mongoose.Types.ObjectId(timesheetId),
        project_id: new mongoose.Types.ObjectId(projectId)
      }, null, queryOpts);

      if (!projectApproval) {
        throw new Error('Project approval record not found');
      }

      const statusBefore = timesheet.status;

      // Update rejection
      if (approverRole === 'lead') {
        projectApproval.lead_status = 'rejected';
        projectApproval.lead_rejection_reason = reason;
      } else {
        projectApproval.manager_status = 'rejected';
        projectApproval.manager_rejection_reason = reason;
      }

      await projectApproval.save(queryOpts);

  // Reset ALL approvals for this timesheet except the current project approval
  await this.resetAllApprovals(timesheetId, session || undefined, projectId);

      // Update timesheet status
      const newStatus = 'manager_rejected';
      timesheet.status = newStatus;
      timesheet.manager_rejection_reason = reason;
      timesheet.manager_rejected_at = new Date();
      await timesheet.save(queryOpts);

      // Record rejection history
      await ApprovalHistory.create([{
        timesheet_id: timesheet._id,
        project_id: new mongoose.Types.ObjectId(projectId),
        user_id: timesheet.user_id,
        approver_id: new mongoose.Types.ObjectId(approverId),
        approver_role: approverRole,
        action: 'rejected',
        status_before: normalizeTimesheetStatus(statusBefore),
        status_after: normalizeTimesheetStatus(newStatus),
        reason
      }], queryOpts);

      if(session) await session.commitTransaction();

      return {
        success: true,
        message: 'Timesheet rejected',
        all_approved: false,
        new_status: newStatus
      };
    } catch (error) {
      if(session) await session.abortTransaction();
      logger.error('Error rejecting timesheet:', error);
      throw error;
    } finally {
      if(session) session.endSession();
    }
  }

  /**
   * Check if all required approvals are complete
   */
  private static async checkAllApprovalsComplete(
    timesheetId: string,
    session: any
  ): Promise<boolean> {
    const approvals = await TimesheetProjectApproval.find({
      timesheet_id: new mongoose.Types.ObjectId(timesheetId)
    }).session(session);

    for (const approval of approvals) {
      // Check lead approval if required
      if (approval.lead_id && approval.lead_status !== 'approved') {
        return false;
      }

      // Check manager approval (always required)
      if (approval.manager_status !== 'approved') {
        return false;
      }
    }

    return true;
  }

  /**
   * Reset all approvals for a timesheet (used on rejection)
   */
  private static async resetAllApprovals(
    timesheetId: string,
    session: any,
    // optional project id to exclude from reset (so a rejected approval isn't overwritten)
    excludeProjectId?: string
  ): Promise<void> {
    const filter: any = { timesheet_id: new mongoose.Types.ObjectId(timesheetId) };
    if (excludeProjectId) {
      try {
        filter.project_id = { $ne: new mongoose.Types.ObjectId(excludeProjectId) };
      } catch (err) {
        // if the provided id isn't a valid ObjectId, ignore the exclude
        // (this preserves previous behavior rather than throwing)
        logger.warn('Invalid excludeProjectId passed to resetAllApprovals:', excludeProjectId);
      }
    }

    await TimesheetProjectApproval.updateMany(
      filter,
      {
        $set: {
          lead_status: 'pending',
          lead_approved_at: null,
          manager_status: 'pending',
          manager_approved_at: null
        },
        $unset: {
          // keep rejection reasons on the excluded approval; for others clear any previous reasons
          lead_rejection_reason: '',
          manager_rejection_reason: ''
        }
      },
      { session }
    );
  }

  /**
   * Bulk verify timesheets (Management only)
   */
  static async bulkVerifyTimesheets(
    timesheetIds: string[],
    verifierId: string
  ): Promise<{ processed_count: number; failed_count: number }> {
    let processedCount = 0;
    let failedCount = 0;

    for (const timesheetId of timesheetIds) {
      try {
        await Timesheet.findByIdAndUpdate(timesheetId, {
          status: 'frozen',
          is_frozen: true,
          verified_by_id: new mongoose.Types.ObjectId(verifierId),
          verified_at: new Date()
        });
        processedCount++;
      } catch (error) {
        logger.error(`Failed to verify timesheet ${timesheetId}:`, error);
        failedCount++;
      }
    }

    return { processed_count: processedCount, failed_count: failedCount };
  }

  /**
   * Bulk bill timesheets (Management only)
   */
  static async bulkBillTimesheets(
    timesheetIds: string[],
    billerId: string
  ): Promise<{ processed_count: number; failed_count: number }> {
    let processedCount = 0;
    let failedCount = 0;

    for (const timesheetId of timesheetIds) {
      try {
        await Timesheet.findByIdAndUpdate(timesheetId, {
          status: 'billed'
        });
        processedCount++;
      } catch (error) {
        logger.error(`Failed to bill timesheet ${timesheetId}:`, error);
        failedCount++;
      }
    }

    return { processed_count: processedCount, failed_count: failedCount };
  }

  /**
   * Bulk approve all timesheets for a project-week
   * Approves all users' timesheets for the specified project and week
   */
  static async approveProjectWeek(
    projectId: string,
    weekStart: string,
    weekEnd: string,
    approverId: string,
    approverRole: string
  ): Promise<BulkProjectWeekApprovalResponse> {
    const USE_TRANSACTIONS = process.env.USE_TRANSACTIONS === 'true';
    const session = USE_TRANSACTIONS ? await mongoose.startSession() : null;

    if(session) session.startTransaction();

    try {
      const queryOpts = session ? { session } : {};
      // Get project details
      const project = await (Project as any).findById(projectId, null, queryOpts);
      if (!project) {
        throw new Error('Project not found');
      }

      // Find all timesheets for this week
      const weekStartDate = new Date(weekStart);
      const weekEndDate = new Date(weekEnd);

      const timesheets = await Timesheet.find({
        week_start_date: { $gte: weekStartDate, $lte: weekEndDate },
        deleted_at: null
      }, null, queryOpts);

      if (timesheets.length === 0) {
        throw new Error('No timesheets found for this week');
      }

      const timesheetIds = timesheets.map(t => t._id);

      // Find all project approvals for these timesheets and this project
      const projectApprovals = await TimesheetProjectApproval.find({
        timesheet_id: { $in: timesheetIds },
        project_id: new mongoose.Types.ObjectId(projectId)
      }, null, queryOpts);

      if (projectApprovals.length === 0) {
        throw new Error('No approval records found for this project-week');
      }

      let affectedUsers = 0;
      const affectedTimesheetIds = new Set<string>();

      // Update all project approvals
      for (const approval of projectApprovals) {
        // Find the timesheet this approval belongs to and capture its previous status
        const timesheet = timesheets.find(t => t._id.toString() === approval.timesheet_id.toString());
        const statusBefore = timesheet ? timesheet.status : 'draft';

        if (approverRole === 'lead') {
          approval.lead_status = 'approved';
          approval.lead_approved_at = new Date();
          approval.lead_rejection_reason = undefined;
        } else {
          approval.manager_status = 'approved';
          approval.manager_approved_at = new Date();
          approval.manager_rejection_reason = undefined;
        }

        await approval.save(queryOpts);

        // Check if this timesheet is now fully approved
        if (timesheet) {
          const allApproved = await this.checkAllApprovalsComplete(
            approval.timesheet_id.toString(),
            session || undefined
          );

          if (allApproved && timesheet.status !== 'manager_approved') {
            timesheet.status = 'manager_approved';
            timesheet.approved_by_manager_id = new mongoose.Types.ObjectId(approverId);
            timesheet.approved_by_manager_at = new Date();
            await timesheet.save(queryOpts);
          }

          affectedTimesheetIds.add(timesheet._id.toString());
          affectedUsers++;

          // Record history - use the timesheet's status values so they match ApprovalHistory enum
          await ApprovalHistory.create([{
            timesheet_id: timesheet._id,
            project_id: new mongoose.Types.ObjectId(projectId),
            user_id: timesheet.user_id,
            approver_id: new mongoose.Types.ObjectId(approverId),
            approver_role: approverRole,
            action: 'approved',
            status_before: normalizeTimesheetStatus(statusBefore),
            status_after: normalizeTimesheetStatus(timesheet.status),
            notes: 'Bulk project-week approval'
          }], queryOpts);
        }
      }

      if(session) await session.commitTransaction();

      const weekLabel = this.formatWeekLabel(weekStartDate, weekEndDate);

      return {
        success: true,
        message: `Successfully approved ${affectedUsers} user(s) for ${project.name} - ${weekLabel}`,
        affected_users: affectedUsers,
        affected_timesheets: affectedTimesheetIds.size,
        project_week: {
          project_name: project.name,
          week_label: weekLabel
        }
      };

    } catch (error) {
      if(session) await session.abortTransaction();
      logger.error('Error bulk approving project-week:', error);
      throw error;
    } finally {
      if(session) session.endSession();
    }
  }

  /**
   * Bulk reject all timesheets for a project-week
   * Rejects all users' timesheets for the specified project and week
   */
  static async rejectProjectWeek(
    projectId: string,
    weekStart: string,
    weekEnd: string,
    approverId: string,
    approverRole: string,
    reason: string
  ): Promise<BulkProjectWeekApprovalResponse> {
    const USE_TRANSACTIONS = process.env.USE_TRANSACTIONS === 'true';
    const session = USE_TRANSACTIONS ? await mongoose.startSession() : null;

    if(session) session.startTransaction();

    try {
      const queryOpts = session ? { session } : {};
      // Get project details
      const project = await (Project as any).findById(projectId).session(session);
      if (!project) {
        throw new Error('Project not found');
      }

      // Find all timesheets for this week
      const weekStartDate = new Date(weekStart);
      const weekEndDate = new Date(weekEnd);

      const timesheets = await Timesheet.find({
        week_start_date: { $gte: weekStartDate, $lte: weekEndDate },
        deleted_at: null
      }, null, queryOpts);

      if (timesheets.length === 0) {
        throw new Error('No timesheets found for this week');
      }

      const timesheetIds = timesheets.map(t => t._id);

      // Find all project approvals for these timesheets and this project
      const projectApprovals = await TimesheetProjectApproval.find({
        timesheet_id: { $in: timesheetIds },
        project_id: new mongoose.Types.ObjectId(projectId)
      }, null, queryOpts);

      if (projectApprovals.length === 0) {
        throw new Error('No approval records found for this project-week');
      }

      let affectedUsers = 0;
      const affectedTimesheetIds = new Set<string>();

      // Update all project approvals
      for (const approval of projectApprovals) {
        // Find the timesheet this approval belongs to and capture its previous status
        const timesheet = timesheets.find(t => t._id.toString() === approval.timesheet_id.toString());
        const statusBefore = timesheet ? timesheet.status : 'draft';

        if (approverRole === 'lead') {
          approval.lead_status = 'rejected';
          approval.lead_rejection_reason = reason;
        } else {
          approval.manager_status = 'rejected';
          approval.manager_rejection_reason = reason;
        }

        await approval.save(queryOpts);

  // Reset ALL approvals for this timesheet except the current project approval
  await this.resetAllApprovals(approval.timesheet_id.toString(), session || undefined, projectId);

        // Update timesheet status
        if (timesheet) {
          timesheet.status = 'manager_rejected';
          timesheet.manager_rejection_reason = reason;
          timesheet.manager_rejected_at = new Date();
          await timesheet.save(queryOpts);

          affectedTimesheetIds.add(timesheet._id.toString());
          affectedUsers++;

          // Record history - use the timesheet's status values so they match ApprovalHistory enum
          await ApprovalHistory.create([{
            timesheet_id: timesheet._id,
            project_id: new mongoose.Types.ObjectId(projectId),
            user_id: timesheet.user_id,
            approver_id: new mongoose.Types.ObjectId(approverId),
            approver_role: approverRole,
            action: 'rejected',
            status_before: normalizeTimesheetStatus(statusBefore),
            status_after: normalizeTimesheetStatus('manager_rejected'),
            reason,
            notes: 'Bulk project-week rejection'
          }], queryOpts);
        }
      }

      if(session) await session.commitTransaction();

      const weekLabel = this.formatWeekLabel(weekStartDate, weekEndDate);

      return {
        success: true,
        message: `Successfully rejected ${affectedUsers} user(s) for ${project.name} - ${weekLabel}`,
        affected_users: affectedUsers,
        affected_timesheets: affectedTimesheetIds.size,
        project_week: {
          project_name: project.name,
          week_label: weekLabel
        }
      };

    } catch (error) {
      if(session) await session.abortTransaction();
      logger.error('Error bulk rejecting project-week:', error);
      throw error;
    } finally {
      if(session) session.endSession();
    }
  }

  /**
   * Format week label for display
   */
  private static formatWeekLabel(start: Date, end: Date): string {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const startMonth = monthNames[start.getMonth()];
    const endMonth = monthNames[end.getMonth()];
    const startDay = start.getDate();
    const endDay = end.getDate();
    const year = start.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}, ${year}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
  }
}

export default TeamReviewApprovalService;
