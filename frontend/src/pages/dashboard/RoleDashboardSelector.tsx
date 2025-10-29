import React from 'react';
import { useAuth } from '../../store/contexts/AuthContext';
import { SuperAdminDashboardPage } from './SuperAdminDashboardPage';
import { ManagementDashboardPage } from './ManagementDashboardPage';
import { ManagerDashboardPage } from './ManagerDashboardPage';
import { LeadDashboardPage } from './LeadDashboardPage';
import { EmployeeDashboardPage } from './EmployeeDashboardPage';

/**
 * RoleDashboardSelector Component
 * Routes users to the appropriate dashboard based on their role
 *
 * Role Hierarchy:
 * - super_admin: SuperAdminDashboard (full system oversight)
 * - management: ManagementDashboard (organizational management)
 * - manager: ManagerDashboard (team management)
 * - lead: LeadDashboard (task coordination)
 * - employee: EmployeeDashboard (personal productivity)
 */
export const RoleDashboardSelector: React.FC = () => {
  const { currentUserRole } = useAuth();

  // Route to role-specific dashboard based on hierarchy
  switch (currentUserRole) {
    case 'super_admin':
      return <SuperAdminDashboardPage />;

    case 'management':
      return <ManagementDashboardPage />;

    case 'manager':
      return <ManagerDashboardPage />;

    case 'lead':
      return <LeadDashboardPage />;

    case 'employee':
    default:
      // Default to employee dashboard for all other cases
      return <EmployeeDashboardPage />;
  }
};

export default RoleDashboardSelector;
