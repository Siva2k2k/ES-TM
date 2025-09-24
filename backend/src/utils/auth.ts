import { UserRole } from '@/models/User';
import { AuthorizationError } from './errors';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
}

/**
 * Check if current user role can manage target user role
 */
export function canManageRoleHierarchy(currentRole: UserRole, targetRole: UserRole): boolean {
  const roleHierarchy = {
    super_admin: ['super_admin', 'management', 'manager', 'lead', 'employee'],
    management: ['manager', 'lead', 'employee'],
    manager: ['lead', 'employee'],
    lead: ['employee'],
    employee: []
  };

  return roleHierarchy[currentRole]?.includes(targetRole) || false;
}

/**
 * Validate user permissions for timesheet operations
 */
export function validateTimesheetAccess(
  currentUser: AuthUser,
  targetUserId: string,
  operation: 'view' | 'edit' | 'approve' | 'create' = 'view'
): void {
  // Users can always access their own data
  if (currentUser.id === targetUserId) {
    return;
  }

  // Role-based permissions
  switch (operation) {
    case 'view':
      if (!canManageRoleHierarchy(currentUser.role, 'employee')) {
        throw new AuthorizationError('You can only view your own timesheets');
      }
      break;

    case 'edit':
      if (currentUser.role === 'management') {
        throw new AuthorizationError('Management cannot edit timesheets directly');
      }
      if (!canManageRoleHierarchy(currentUser.role, 'employee')) {
        throw new AuthorizationError('Insufficient permissions to edit timesheets');
      }
      break;

    case 'approve':
      if (!['manager', 'management', 'super_admin'].includes(currentUser.role)) {
        throw new AuthorizationError('Only managers and above can approve timesheets');
      }
      break;

    case 'create':
      if (currentUser.role === 'management') {
        throw new AuthorizationError('Management cannot create timesheets directly');
      }
      break;

    default:
      throw new AuthorizationError('Invalid operation');
  }
}

/**
 * Check if user can perform management-level operations
 */
export function requireManagementRole(currentUser: AuthUser): void {
  if (!['management', 'super_admin'].includes(currentUser.role)) {
    throw new AuthorizationError('Management level permissions required');
  }
}

/**
 * Check if user can perform manager-level operations
 */
export function requireManagerRole(currentUser: AuthUser): void {
  if (!['manager', 'management', 'super_admin'].includes(currentUser.role)) {
    throw new AuthorizationError('Manager level permissions required');
  }
}