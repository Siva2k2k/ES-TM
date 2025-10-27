/**
 * TraineeService
 *
 * Handles trainee lifecycle:
 * - Auto-assign new users to Training Program until first project assignment
 * - Graduate users from training when assigned to first regular/internal project
 */

import { ProjectMember } from '@/models/Project';
import { Project } from '@/models/Project';
import { ValidationError, NotFoundError } from '@/utils/errors';
import mongoose from 'mongoose';

export interface TraineeStats {
  total_trainees: number;
  active_trainees: number;
  graduated_this_month: number;
}

export class TraineeService {

  /**
   * Check if a user is currently in training
   * A user is in training if they have NO active project assignments (excluding training project)
   *
   * @param userId User ID
   * @returns true if user is trainee, false otherwise
   */
  async isUserInTraining(userId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ValidationError('Invalid user ID format');
    }

    // Check if user has any active project assignments (excluding training projects)
    const projectAssignments = await (ProjectMember.find as any)({
      user_id: new mongoose.Types.ObjectId(userId),
      removed_at: null,
      deleted_at: null
    }).populate({
      path: 'project_id',
      select: 'project_type status deleted_at'
    });

    // Filter out training projects and check if any regular/internal projects exist
    const regularProjects = projectAssignments.filter((assignment: any) => {
      const project = assignment.project_id;
      return project &&
        project.deleted_at === null &&
        project.status === 'active' &&
        project.project_type !== 'training';
    });

    // User is trainee if they have NO regular project assignments
    return regularProjects.length === 0;
  }

  /**
   * Auto-assign a new user to the Training Program project
   * Called automatically when a new user is created
   *
   * @param userId User ID
   * @returns Assignment result
   */
  async autoAssignToTrainingProgram(userId: string): Promise<{
    success: boolean;
    assignment?: any;
    message?: string;
  }> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ValidationError('Invalid user ID format');
      }

      // Check if user already has project assignments
      const isTrainee = await this.isUserInTraining(userId);

      if (!isTrainee) {
        return {
          success: false,
          message: 'User already has project assignments, not assigned to training'
        };
      }

      // Get the Training Program project
      const trainingProject = await (Project.findOne as any)({
        project_type: 'training',
        status: 'active',
        deleted_at: null
      });

      if (!trainingProject) {
        throw new NotFoundError('Training Program project not found. Please create one first.');
      }

      // Check if already assigned to training project
      const existingAssignment = await (ProjectMember.findOne as any)({
        project_id: trainingProject._id,
        user_id: new mongoose.Types.ObjectId(userId),
        deleted_at: null
      });

      if (existingAssignment && !existingAssignment.removed_at) {
        return {
          success: true,
          assignment: existingAssignment,
          message: 'User already assigned to Training Program'
        };
      }

      // Create new training assignment
      const assignment = await (ProjectMember.create as any)({
        project_id: trainingProject._id,
        user_id: new mongoose.Types.ObjectId(userId),
        project_role: 'employee', // Trainees start as employees
        is_primary_manager: false,
        is_secondary_manager: false,
        assigned_at: new Date()
      });

      return {
        success: true,
        assignment,
        message: 'User successfully assigned to Training Program'
      };
    } catch (error) {
      console.error('Error auto-assigning to training program:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to assign to training program'
      };
    }
  }

  /**
   * Graduate a user from the Training Program
   * Called automatically when user is assigned to their first regular/internal project
   *
   * @param userId User ID
   * @returns Graduation result
   */
  async graduateFromTraining(userId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ValidationError('Invalid user ID format');
      }

      // Get the Training Program project
      const trainingProject = await (Project.findOne as any)({
        project_type: 'training',
        status: 'active',
        deleted_at: null
      });

      if (!trainingProject) {
        // Training project doesn't exist, nothing to remove
        return {
          success: true,
          message: 'No training project found'
        };
      }

      // Find user's training assignment
      const trainingAssignment = await (ProjectMember.findOne as any)({
        project_id: trainingProject._id,
        user_id: new mongoose.Types.ObjectId(userId),
        removed_at: null,
        deleted_at: null
      });

      if (!trainingAssignment) {
        return {
          success: true,
          message: 'User not assigned to training program'
        };
      }

      // Mark as removed (graduation)
      trainingAssignment.removed_at = new Date();
      await trainingAssignment.save();

      return {
        success: true,
        message: 'User successfully graduated from Training Program'
      };
    } catch (error) {
      console.error('Error graduating from training:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to graduate from training'
      };
    }
  }

  /**
   * Get current trainees (users with only training project assignment)
   *
   * @returns List of trainee users
   */
  async getCurrentTrainees(): Promise<any[]> {
    try {
      // Get the Training Program project
      const trainingProject = await (Project.findOne as any)({
        project_type: 'training',
        status: 'active',
        deleted_at: null
      });

      if (!trainingProject) {
        return [];
      }

      // Get all active training assignments
      const trainingAssignments = await (ProjectMember.find as any)({
        project_id: trainingProject._id,
        removed_at: null,
        deleted_at: null
      }).populate('user_id', 'full_name email role created_at').lean();

      // Filter to only those who have NO other project assignments
      const trainees = [];

      for (const assignment of trainingAssignments) {
        const userId = (assignment.user_id as any)._id;

        // Check if user has other active projects
        const otherProjects = await (ProjectMember.countDocuments as any)({
          user_id: userId,
          project_id: { $ne: trainingProject._id },
          removed_at: null,
          deleted_at: null
        });

        if (otherProjects === 0) {
          trainees.push({
            user_id: userId.toString(),
            user_name: (assignment.user_id as any).full_name,
            user_email: (assignment.user_id as any).email,
            user_role: (assignment.user_id as any).role,
            assigned_to_training_at: assignment.assigned_at,
            days_in_training: Math.floor(
              (new Date().getTime() - new Date(assignment.assigned_at).getTime()) / (1000 * 60 * 60 * 24)
            )
          });
        }
      }

      return trainees;
    } catch (error) {
      console.error('Error getting current trainees:', error);
      return [];
    }
  }

  /**
   * Get trainee statistics for dashboard
   *
   * @returns Trainee statistics
   */
  async getTraineeStats(): Promise<TraineeStats> {
    try {
      const trainees = await this.getCurrentTrainees();

      // Get graduations this month
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const trainingProject = await (Project.findOne as any)({
        project_type: 'training',
        status: 'active',
        deleted_at: null
      });

      let graduatedThisMonth = 0;

      if (trainingProject) {
        graduatedThisMonth = await (ProjectMember.countDocuments as any)({
          project_id: trainingProject._id,
          removed_at: { $gte: monthStart },
          deleted_at: null
        });
      }

      return {
        total_trainees: trainees.length,
        active_trainees: trainees.length,
        graduated_this_month: graduatedThisMonth
      };
    } catch (error) {
      console.error('Error getting trainee stats:', error);
      return {
        total_trainees: 0,
        active_trainees: 0,
        graduated_this_month: 0
      };
    }
  }
}

// Export singleton instance
export default new TraineeService();
