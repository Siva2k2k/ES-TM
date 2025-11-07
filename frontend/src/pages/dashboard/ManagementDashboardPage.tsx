import React, { useState, useEffect } from 'react';
import { ManagementDashboard } from './role-dashboards/ManagementDashboard';
import { DashboardService, type ManagementDashboardData } from '../../services/DashboardService';
import { toast } from 'react-toastify';

/**
 * Management Dashboard Page
 * Fetches data and renders the ManagementDashboard component
 * Only accessible to users with management role
 */
export const ManagementDashboardPage: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<ManagementDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const { dashboard, error } = await DashboardService.getManagementDashboard();

        if (error) {
          toast.error(`Failed to load dashboard: ${error}`);
          return;
        }

        if (dashboard) {
          setDashboardData(dashboard);
        }
      } catch (error) {
        console.error('Error fetching management dashboard:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            No Dashboard Data Available
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Unable to load management dashboard data.
          </p>
        </div>
      </div>
    );
  }

  return <ManagementDashboard data={dashboardData} />;
};

export default ManagementDashboardPage;
