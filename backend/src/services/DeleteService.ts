/**
 * Enhanced Delete Service - Centralized delete operations with role-based access
 */
import { AuthUser } from '@/utils/auth';
import { UserService } from './UserService';
import { TimesheetService } from './TimesheetService'; 
import { ProjectService } from './ProjectService';
import { AuditLogService } from './AuditLogService';
import mongoose from 'mongoose';

export interface DeletePermission {
  canSoftDelete: boolean;
  canHardDelete: boolean;
  canDeleteOwn: boolean;
  canDeleteAny: boolean;
  requiredRole?: string[];
}

export interface DeleteResult {
  success: boolean;
  error?: string;
  dependencies?: string[];
  deletedCount?: number;
}

export class DeleteService {
  /**
   * Get delete permissions for user based on role and entity type
   */
  static getDeletePermissions(currentUser: AuthUser, entityType: string, ownerId?: string): DeletePermission {
    const isSuperAdmin = currentUser.role === 'super_admin';
    const isManagement = currentUser.role === 'management';
    const isManager = currentUser.role === 'manager';
    const isOwner = ownerId === currentUser.id;

    switch (entityType) {
      case 'user':
        return {
          canSoftDelete: isSuperAdmin,
          canHardDelete: isSuperAdmin,
          canDeleteOwn: false, // Users cannot delete themselves
          canDeleteAny: isSuperAdmin
        };

      case 'project':
        return {
          canSoftDelete: isSuperAdmin || isManagement,
          canHardDelete: isSuperAdmin,
          canDeleteOwn: false, // Projects are company-wide
          canDeleteAny: isSuperAdmin || isManagement
        };

      case 'task':
        return {
          canSoftDelete: isSuperAdmin || isManagement || isManager || isOwner,
          canHardDelete: isSuperAdmin,
          canDeleteOwn: true,
          canDeleteAny: isSuperAdmin || isManagement || isManager
        };

      case 'timesheet':
        return {
          canSoftDelete: isSuperAdmin || isManagement || isOwner,
          canHardDelete: isSuperAdmin,
          canDeleteOwn: true,
          canDeleteAny: isSuperAdmin || isManagement
        };

      case 'time_entry':
        return {
          canSoftDelete: isSuperAdmin || isManagement || isOwner,
          canHardDelete: isSuperAdmin,
          canDeleteOwn: true,
          canDeleteAny: isSuperAdmin || isManagement
        };

      case 'client':
        return {
          canSoftDelete: isSuperAdmin || isManagement,
          canHardDelete: isSuperAdmin,
          canDeleteOwn: false,
          canDeleteAny: isSuperAdmin || isManagement
        };

      default:
        return {
          canSoftDelete: false,
          canHardDelete: false,
          canDeleteOwn: false,
          canDeleteAny: false
        };
    }
  }

  /**
   * Check if user can perform delete operation
   */
  static async canDelete(
    entityType: string,
    entityId: string,
    deleteType: 'soft' | 'hard',
    currentUser: AuthUser,
    ownerId?: string
  ): Promise<{ canDelete: boolean; reason?: string; dependencies?: string[] }> {
    const permissions = this.getDeletePermissions(currentUser, entityType, ownerId);

    if (deleteType === 'soft' && !permissions.canSoftDelete) {
      return { canDelete: false, reason: 'Insufficient permissions for soft delete' };
    }

    if (deleteType === 'hard' && !permissions.canHardDelete) {
      return { canDelete: false, reason: 'Insufficient permissions for hard delete' };
    }

    // Check dependencies for certain entity types
    if (entityType === 'user') {
      const dependencies = await UserService.canDeleteUser(entityId);
      if (dependencies.length > 0 && deleteType === 'hard') {
        return { 
          canDelete: false, 
          reason: 'Cannot hard delete user with dependencies',
          dependencies 
        };
      }
    }

    return { canDelete: true };
  }

  /**
   * Perform bulk delete operations with role-based filtering
   */
  static async bulkDelete(
    entityType: string,
    entityIds: string[],
    deleteType: 'soft' | 'hard',
    reason: string,
    currentUser: AuthUser
  ): Promise<DeleteResult> {
    const results = [];
    const errors = [];

    for (const entityId of entityIds) {
      try {
        const result = await this.deleteEntity(entityType, entityId, deleteType, reason, currentUser);
        if (result.success) {
          results.push(result);
        } else {
          errors.push(`${entityId}: ${result.error}`);
        }
      } catch (error) {
        errors.push(`${entityId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: errors.length === 0,
      error: errors.length > 0 ? errors.join('; ') : undefined,
      deletedCount: results.length
    };
  }

  /**
   * Delete single entity with proper service delegation
   */
  private static async deleteEntity(
    entityType: string,
    entityId: string,
    deleteType: 'soft' | 'hard',
    reason: string,
    currentUser: AuthUser
  ): Promise<DeleteResult> {
    switch (entityType) {
      case 'user':
        if (deleteType === 'soft') {
          return await UserService.softDeleteUser(entityId, reason, currentUser);
        } else {
          return await UserService.hardDeleteUser(entityId, currentUser);
        }

      case 'timesheet':
        if (deleteType === 'soft') {
          return await TimesheetService.softDeleteTimesheet(entityId, reason, currentUser);
        } else {
          return await TimesheetService.hardDeleteTimesheet(entityId, currentUser);
        }

      case 'project':
        // Enhanced project delete (to be implemented)
        return await ProjectService.deleteProject(entityId, currentUser);

      default:
        return { success: false, error: `Delete not implemented for ${entityType}` };
    }
  }

  /**
   * Get deleted entities (soft deleted) for recovery
   */
  static async getDeletedEntities(
    entityType: string,
    currentUser: AuthUser
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    const permissions = this.getDeletePermissions(currentUser, entityType);
    
    if (!permissions.canSoftDelete && !permissions.canHardDelete) {
      return { success: false, error: 'Insufficient permissions to view deleted entities' };
    }

    switch (entityType) {
      case 'user':
        {
          const result = await UserService.getDeletedUsers(currentUser);
          if (result.error) {
            return { success: false, error: result.error };
          }
          return { success: true, data: result.users };
        }

      default:
        return { success: false, error: `Get deleted not implemented for ${entityType}` };
    }
  }

  /**
   * Restore soft deleted entity
   */
  static async restoreEntity(
    entityType: string,
    entityId: string,
    currentUser: AuthUser
  ): Promise<DeleteResult> {
    switch (entityType) {
      case 'user':
        return await UserService.restoreUser(entityId, currentUser);

      default:
        return { success: false, error: `Restore not implemented for ${entityType}` };
    }
  }
}