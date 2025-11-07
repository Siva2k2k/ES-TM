import { useMemo } from 'react';
import { useAuth } from '../store/contexts/AuthContext';
import {
  hasRole,
  hasAnyRole,
  canManageUsers,
  canManageProjects,
  canManageClients,
  canApproveTimesheets,
  canViewTeamData,
  canManageBilling,
  canViewReport,
  canCreateCustomReports,
  canViewAuditLogs,
  canModifySystemSettings,
  canDeleteRecord,
  canEditUser,
  getAccessibleNavItems,
} from '../utils/permissions';
import type { UserRole } from '../types';

export interface UsePermissionsReturn {
  userRole: UserRole | string;
  userId: string;
  hasRole: (requiredRole: UserRole | string) => boolean;
  hasAnyRole: (requiredRoles: (UserRole | string)[]) => boolean;
  canManageUsers: boolean;
  canManageProjects: boolean;
  canManageClients: boolean;
  canApproveTimesheets: boolean;
  canViewTeamData: boolean;
  canManageBilling: boolean;
  canViewReport: (reportType: string) => boolean;
  canCreateCustomReports: boolean;
  canViewAuditLogs: boolean;
  canModifySystemSettings: boolean;
  canDeleteRecord: (recordType: string) => boolean;
  canEditUser: (targetUserId: string, targetUserRole?: UserRole | string) => boolean;
  accessibleNavItems: string[];
}

/**
 * usePermissions Hook
 * Centralized permission checking for role-based access control
 *
 * @returns Permission checking functions and flags
 *
 * @example
 * const permissions = usePermissions();
 *
 * if (permissions.canManageUsers) {
 *   // Show user management UI
 * }
 *
 * if (permissions.hasRole('manager')) {
 *   // Show manager-specific features
 * }
 */
export function usePermissions(): UsePermissionsReturn {
  const { currentUser, currentUserRole } = useAuth();

  const permissions = useMemo(() => {
    const role = currentUserRole || 'employee';
    const id = currentUser?.id || '';

    return {
      userRole: role,
      userId: id,
      hasRole: (requiredRole: UserRole | string) => hasRole(role, requiredRole),
      hasAnyRole: (requiredRoles: (UserRole | string)[]) => hasAnyRole(role, requiredRoles),
      canManageUsers: canManageUsers(role),
      canManageProjects: canManageProjects(role),
      canManageClients: canManageClients(role),
      canApproveTimesheets: canApproveTimesheets(role),
      canViewTeamData: canViewTeamData(role),
      canManageBilling: canManageBilling(role),
      canViewReport: (reportType: string) => canViewReport(role, reportType),
      canCreateCustomReports: canCreateCustomReports(role),
      canViewAuditLogs: canViewAuditLogs(role),
      canModifySystemSettings: canModifySystemSettings(role),
      canDeleteRecord: (recordType: string) => canDeleteRecord(role, recordType),
      canEditUser: (targetUserId: string, targetUserRole?: UserRole | string) =>
        canEditUser(role, id, targetUserId, targetUserRole),
      accessibleNavItems: getAccessibleNavItems(role),
    };
  }, [currentUser, currentUserRole]);

  return permissions;
}
