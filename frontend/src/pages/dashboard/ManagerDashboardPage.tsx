import React, { useState, useEffect } from 'react';
import { ManagerDashboard } from './role-dashboards/ManagerDashboard';
import { DashboardService, type ManagerDashboardData } from '../../services/DashboardService';
import { toast } from 'react-toastify';

/**
 * Manager Dashboard Page
 * Fetches data and renders the ManagerDashboard component
 * Only accessible to users with manager role
 */
export const ManagerDashboardPage: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const { dashboard, error } = await DashboardService.getManagerDashboard();

        if (error) {
          toast.error(`Failed to load dashboard: ${error}`);
          return;
        }

        if (dashboard) {
          setDashboardData(dashboard);
        }
      } catch (error) {
        console.error('Error fetching manager dashboard:', error);
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
            Unable to load manager dashboard data.
          </p>
        </div>
      </div>
    );
  }

  return <ManagerDashboard data={dashboardData} />;
};

export default ManagerDashboardPage;
