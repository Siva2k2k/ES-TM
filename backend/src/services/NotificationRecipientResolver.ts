import mongoose from 'mongoose';
import { User } from '../models/User';
import { ProjectMember } from '../models/Project';
import { Timesheet } from '../models/Timesheet';

/**
 * Service to resolve notification recipients based on role hierarchy and project structure
 */
export class NotificationRecipientResolver {
  /**
   * Get timesheet owner ID
   */
  static async getTimesheetOwner(timesheetId: string): Promise<string | null> {
    try {
      const timesheet = await Timesheet.findById(timesheetId).select('user_id');
      return timesheet ? timesheet.user_id.toString() : null;
    } catch (error) {
      console.error('Error getting timesheet owner:', error);
      return null;
    }
  }

  /**
   * Get all leads in a project
   */
  static async getLeadsForProject(projectId: string): Promise<string[]> {
    try {
      const projectObjId = new mongoose.Types.ObjectId(projectId);
      const leads = await (ProjectMember as any).find({
        project_id: projectObjId,
        project_role: 'lead',
        deleted_at: null
      }).select('user_id').lean().exec();

      return leads.map((lead: any) => lead.user_id.toString());
    } catch (error) {
      console.error('Error getting leads for project:', error);
      return [];
    }
  }

  /**
   * Get all managers for a project (primary + secondary)
   */
  static async getManagersForProject(projectId: string): Promise<string[]> {
    try {
      const projectObjId = new mongoose.Types.ObjectId(projectId);
      const managers = await (ProjectMember as any).find({
        project_id: projectObjId,
        project_role: 'manager',
        deleted_at: null
      }).select('user_id').lean().exec();

      return managers.map((manager: any) => manager.user_id.toString());
    } catch (error) {
      console.error('Error getting managers for project:', error);
      return [];
    }
  }

  /**
   * Get primary manager for a project
   */
  static async getPrimaryManagerForProject(projectId: string): Promise<string | null> {
    try {
      const projectObjId = new mongoose.Types.ObjectId(projectId);
      const primaryManager = await (ProjectMember as any).findOne({
        project_id: projectObjId,
        is_primary_manager: true,
        deleted_at: null
      }).select('user_id').lean().exec();

      return primaryManager ? primaryManager.user_id.toString() : null;
    } catch (error) {
      console.error('Error getting primary manager for project:', error);
      return null;
    }
  }

  /**
   * Get all management users
   */
  static async getManagementUsers(): Promise<string[]> {
    try {
      const managementUsers = await (User as any).find({
        role: 'management',
        is_active: true,
        is_approved_by_super_admin: true,
        deleted_at: null
      }).select('_id').lean().exec();

      return managementUsers.map((user: any) => user._id.toString());
    } catch (error) {
      console.error('Error getting management users:', error);
      return [];
    }
  }

  /**
   * Get all super admins
   */
  static async getSuperAdmins(): Promise<string[]> {
    try {
      const admins = await (User as any).find({
        role: 'super_admin',
        is_active: true,
        is_approved_by_super_admin: true,
        deleted_at: null
      }).select('_id').lean().exec();

      return admins.map((admin: any) => admin._id.toString());
    } catch (error) {
      console.error('Error getting super admins:', error);
      return [];
    }
  }

  /**
   * Get all managers (role = manager)
   */
  static async getAllManagers(): Promise<string[]> {
    try {
      const managers = await (User as any).find({
        role: 'manager',
        is_active: true,
        is_approved_by_super_admin: true,
        deleted_at: null
      }).select('_id').lean().exec();

      return managers.map((manager: any) => manager._id.toString());
    } catch (error) {
      console.error('Error getting all managers:', error);
      return [];
    }
  }

  /**
   * Get project members by role
   */
  static async getProjectMembersByRole(
    projectId: string,
    role?: 'lead' | 'employee' | 'manager'
  ): Promise<string[]> {
    try {
      const query: Record<string, unknown> = {
        project_id: new mongoose.Types.ObjectId(projectId),
        deleted_at: null
      };

      if (role) {
        query.project_role = role;
      }

      const members = await (ProjectMember as any).find(query).select('user_id').lean().exec();
      return members.map((member: any) => member.user_id.toString());
    } catch (error) {
      console.error('Error getting project members by role:', error);
      return [];
    }
  }

  /**
   * Get all project members (excluding managers)
   */
  static async getAllProjectMembers(projectId: string): Promise<string[]> {
    try {
      const projectObjId = new mongoose.Types.ObjectId(projectId);
      const members = await (ProjectMember as any).find({
        project_id: projectObjId,
        project_role: { $in: ['lead', 'employee'] },
        deleted_at: null
      }).select('user_id').lean().exec();

      return members.map((member: any) => member.user_id.toString());
    } catch (error) {
      console.error('Error getting all project members:', error);
      return [];
    }
  }

  /**
   * Get recipients for timesheet approval notification (owner + approvers)
   */
  static async getTimesheetApprovalRecipients(
    timesheetId: string,
    projectId: string,
    approvalTier: 'lead' | 'manager' | 'management'
  ): Promise<string[]> {
    try {
      const recipients: string[] = [];
      
      // Always notify the timesheet owner
      const ownerId = await this.getTimesheetOwner(timesheetId);
      if (ownerId) {
        recipients.push(ownerId);
      }

      // Get next tier approvers based on current tier
      if (approvalTier === 'lead') {
        // Notify managers for next approval
        const managers = await this.getManagersForProject(projectId);
        recipients.push(...managers);
      } else if (approvalTier === 'manager') {
        // Notify management for final approval
        const management = await this.getManagementUsers();
        recipients.push(...management);
      }

      // Remove duplicates
      return [...new Set(recipients)];
    } catch (error) {
      console.error('Error getting timesheet approval recipients:', error);
      return [];
    }
  }

  /**
   * Get recipients who should be notified when Lead approves (feedback to Lead about Manager's action)
   */
  static async getLeadForFeedback(projectId: string, leadUserId: string): Promise<string[]> {
    try {
      // Return the specific lead who did the approval
      return [leadUserId];
    } catch (error) {
      console.error('Error getting lead for feedback:', error);
      return [];
    }
  }

  /**
   * Get recipients who should be notified when Manager approves (feedback to Manager about Management's action)
   */
  static async getManagerForFeedback(projectId: string, managerUserId: string): Promise<string[]> {
    try {
      // Return the specific manager who did the approval
      return [managerUserId];
    } catch (error) {
      console.error('Error getting manager for feedback:', error);
      return [];
    }
  }

  /**
   * Remove duplicate user IDs from recipient list
   */
  static deduplicateRecipients(recipients: string[]): string[] {
    return [...new Set(recipients)];
  }
}
