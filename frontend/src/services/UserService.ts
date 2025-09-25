import { backendApi } from '../lib/backendApi';
import type { User, UserRole } from '../types';

/**
 * User Management Service - MongoDB Backend Integration
 * Handles all user-related operations with backend API
 */
export class UserService {
  /**
   * Create a new user (Super Admin only) - Direct creation with immediate activation
   */
  static async createUser(userData: Partial<User>): Promise<{ user?: User; error?: string }> {
    try {
      const response = await backendApi.post<{ success: boolean; user?: User; error?: string }>('/api/v1/users', {
        email: userData.email!,
        full_name: userData.full_name!,
        role: userData.role || 'employee',
        hourly_rate: userData.hourly_rate || 50,
        manager_id: userData.manager_id || null
      });

      if (response.success) {
        console.log('Super Admin created user directly:', response.user);
        return { user: response.user };
      } else {
        console.error('Error creating user:', response.error);
        return { error: response.error };
      }
    } catch (error: unknown) {
      console.error('Error in createUser:', error);
      const errorMessage = (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error 
        || (error as { message?: string })?.message 
        || 'Failed to create user';
      return { error: errorMessage };
    }
  }

  /**
   * Create a new user (for Management role) - Returns user data to be submitted for Super Admin approval
   */
  static async createUserForApproval(userData: Partial<User>): Promise<{ user?: User; error?: string }> {
    try {
      const response = await backendApi.post<{ success: boolean; user?: User; error?: string }>('/api/v1/users/for-approval', {
        email: userData.email!,
        full_name: userData.full_name!,
        role: userData.role || 'employee',
        hourly_rate: userData.hourly_rate || 50,
        manager_id: userData.manager_id || null
      });

      if (response.success) {
        console.log('User created for approval:', response.user);
        return { user: response.user };
      } else {
        console.error('Error creating user for approval:', response.error);
        return { error: response.error };
      }
    } catch (error: unknown) {
      console.error('Error in createUserForApproval:', error);
      const errorMessage = (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error 
        || (error as { message?: string })?.message 
        || 'Failed to create user for approval';
      return { error: errorMessage };
    }
  }

  /**
   * Approve user (Super Admin only)
   */
  static async approveUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await backendApi.post<{ success: boolean; error?: string }>(`/api/v1/users/${userId}/approve`, {});

      if (response.success) {
        console.log(`Super Admin approved user: ${userId}`);
        return { success: true };
      } else {
        console.error('Error approving user:', response.error);
        return { success: false, error: response.error };
      }
    } catch (error: unknown) {
      console.error('Error in approveUser:', error);
      const errorMessage = (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error 
        || (error as { message?: string })?.message 
        || 'Failed to approve user';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Set user active/inactive status (Super Admin only)
   */
  static async setUserStatus(userId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await backendApi.put<{ success: boolean; error?: string }>(`/api/v1/users/${userId}/status`, { isActive });

      if (response.success) {
        console.log(`Setting user ${userId} status to: ${isActive ? 'active' : 'inactive'}`);
        return { success: true };
      } else {
        console.error('Error setting user status:', response.error);
        return { success: false, error: response.error };
      }
    } catch (error: unknown) {
      console.error('Error in setUserStatus:', error);
      const errorMessage = (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error 
        || (error as { message?: string })?.message 
        || 'Failed to update user status';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Update user billing rate (Super Admin only)
   */
  static async setUserBilling(userId: string, hourlyRate: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await backendApi.put<{ success: boolean; error?: string }>(`/api/v1/users/${userId}/billing`, { hourlyRate });

      if (response.success) {
        console.log(`Setting billing for user ${userId}: $${hourlyRate}/hr`);
        return { success: true };
      } else {
        console.error('Error setting user billing:', response.error);
        return { success: false, error: response.error };
      }
    } catch (error: unknown) {
      console.error('Error in setUserBilling:', error);
      const errorMessage = (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error 
        || (error as { message?: string })?.message 
        || 'Failed to update user billing';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get all users (Super Admin and Management)
   */
  static async getAllUsers(): Promise<{ users: User[]; error?: string }> {
    try {
      const response = await backendApi.get<{ success: boolean; users?: User[]; error?: string }>('/api/v1/users');

      if (response.success) {
        return { users: response.users || [] };
      } else {
        console.error('Error fetching users:', response.error);
        return { users: [], error: response.error };
      }
    } catch (error: unknown) {
      console.error('Error in getAllUsers:', error);
      const errorMessage = (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error 
        || (error as { message?: string })?.message 
        || 'Failed to fetch users';
      return { users: [], error: errorMessage };
    }
  }

  /**
   * Get users based on role permissions
   */
  static async getUsers(userRole: UserRole): Promise<{ users: User[]; error?: string }> {
    try {
      const response = await backendApi.get<{ success: boolean; users?: User[]; error?: string }>(`/api/v1/users/by-role?role=${userRole}`);

      if (response.success) {
        return { users: response.users || [] };
      } else {
        console.error('Error fetching users by role:', response.error);
        return { users: [], error: response.error };
      }
    } catch (error: unknown) {
      console.error('Error in getUsers:', error);
      const errorMessage = (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error 
        || (error as { message?: string })?.message 
        || 'Failed to fetch users';
      return { users: [], error: errorMessage };
    }
  }

  /**
   * Get pending approvals (Super Admin only)
   */
  static async getPendingApprovals(): Promise<{ users: User[]; error?: string }> {
    try {
      const response = await backendApi.get<{ success: boolean; users?: User[]; error?: string }>('/api/v1/users/pending-approvals');

      if (response.success) {
        return { users: response.users || [] };
      } else {
        console.error('Error fetching pending approvals:', response.error);
        return { users: [], error: response.error };
      }
    } catch (error: unknown) {
      console.error('Error in getPendingApprovals:', error);
      const errorMessage = (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error 
        || (error as { message?: string })?.message 
        || 'Failed to fetch pending approvals';
      return { users: [], error: errorMessage };
    }
  }

  /**
   * Update user details
   */
  static async updateUser(userId: string, updates: Partial<User>): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await backendApi.put<{ success: boolean; error?: string }>(`/api/v1/users/${userId}`, updates);

      if (response.success) {
        console.log(`Updated user ${userId}`);
        return { success: true };
      } else {
        console.error('Error updating user:', response.error);
        return { success: false, error: response.error };
      }
    } catch (error: unknown) {
      console.error('Error in updateUser:', error);
      const errorMessage = (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error 
        || (error as { message?: string })?.message 
        || 'Failed to update user';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Soft delete user
   */
  static async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await backendApi.delete<{ success: boolean; error?: string }>(`/api/v1/users/${userId}`);

      if (response.success) {
        console.log(`Soft deleted user: ${userId}`);
        return { success: true };
      } else {
        console.error('Error deleting user:', response.error);
        return { success: false, error: response.error };
      }
    } catch (error: unknown) {
      console.error('Error in deleteUser:', error);
      const errorMessage = (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error 
        || (error as { message?: string })?.message 
        || 'Failed to delete user';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<{ user?: User; error?: string }> {
    try {
      const response = await backendApi.get<{ success: boolean; user?: User; error?: string }>(`/api/v1/users/${userId}`);

      if (response.success) {
        return { user: response.user };
      } else {
        console.error('Error fetching user:', response.error);
        return { error: response.error };
      }
    } catch (error: unknown) {
      console.error('Error in getUserById:', error);
      const errorMessage = (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error 
        || (error as { message?: string })?.message 
        || 'Failed to fetch user';
      return { error: errorMessage };
    }
  }

  /**
   * Get team members for manager
   */
  static async getTeamMembers(managerId: string): Promise<{ users: User[]; error?: string }> {
    try {
      const response = await backendApi.get<{ success: boolean; users?: User[]; error?: string }>(`/api/v1/users?manager_id=${managerId}`);

      if (response.success) {
        return { users: response.users || [] };
      } else {
        console.error('Error fetching team members:', response.error);
        return { users: [], error: response.error };
      }
    } catch (error: unknown) {
      console.error('Error in getTeamMembers:', error);
      const errorMessage = (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error 
        || (error as { message?: string })?.message 
        || 'Failed to fetch team members';
      return { users: [], error: errorMessage };
    }
  }

  /**
   * Get users by role (for team review filtering)
   */
  static async getUsersByRole(roles: UserRole[]): Promise<{ users: User[]; error?: string }> {
    try {
      const rolesParam = roles.join(',');
      const response = await backendApi.get<{ success: boolean; users?: User[]; error?: string }>(`/api/v1/users/roles?roles=${rolesParam}`);

      if (response.success) {
        return { users: response.users || [] };
      } else {
        console.error('Error fetching users by roles:', response.error);
        return { users: [], error: response.error };
      }
    } catch (error: unknown) {
      console.error('Error in getUsersByRole:', error);
      const errorMessage = (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error 
        || (error as { message?: string })?.message 
        || 'Failed to fetch users by role';
      return { users: [], error: errorMessage };
    }
  }

  /**
   * Set user login credentials (Super Admin only)
   */
  static async setUserCredentials(userId: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await backendApi.put<{ success: boolean; error?: string }>(`/api/v1/users/${userId}/credentials`, { password });

      if (response.success) {
        console.log(`Set credentials for user ${userId}`);
        return { success: true };
      } else {
        console.error('Error setting user credentials:', response.error);
        return { success: false, error: response.error };
      }
    } catch (error: unknown) {
      console.error('Error in setUserCredentials:', error);
      const errorMessage = (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error 
        || (error as { message?: string })?.message 
        || 'Failed to set user credentials';
      return { success: false, error: errorMessage };
    }
  }
}