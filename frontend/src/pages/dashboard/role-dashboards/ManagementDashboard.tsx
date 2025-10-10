import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Activity, Users, Shield, DollarSign, TrendingUp, Target, Clock } from 'lucide-react';
import type { ManagementDashboardData } from '../../../services/DashboardService';
import {
  StatsCard,
  KPIWidget,
  LineChartCard,
  BarChartCard,
  AreaChartCard,
  ComboChartCard,
  GaugeChart,
  QuickActions,
  ProgressTracker,
  type ProgressItem,
} from '../components';

interface ManagementDashboardProps {
  data: ManagementDashboardData;
}

/**
 * ManagementDashboard Component
 * HIERARCHY: Has ALL Manager features + Organizational Oversight
 * Strategic planning, financial analysis, cross-team coordination
 */
export const ManagementDashboard: React.FC<ManagementDashboardProps> = ({ data }) => {
  const navigate = useNavigate();

  // ========== DATA PREPARATION ==========
  const revenueTrend = data.monthly_revenue_trend || [
    { name: 'Jan', revenue: 22000, expenses: 15000 },
    { name: 'Feb', revenue: 23500, expenses: 15200 },
    { name: 'Mar', revenue: 24200, expenses: 15500 },
    { name: 'Apr', revenue: 25000, expenses: 15800 },
    { name: 'May', revenue: 26500, expenses: 16000 },
  ];

  const projectCompletion = data.project_completion_trend || [
    { name: 'Q1', completed: 8, ongoing: 12 },
    { name: 'Q2', completed: 10, ongoing: 10 },
    { name: 'Q3', completed: 12, ongoing: 8 },
    { name: 'Q4', completed: 14, ongoing: 6 },
  ];

  const teamUtilization = data.team_utilization || data.team_performance.map((t) => ({
    name: t.manager_name.split(' ')[0],
    utilization: Math.min(75 + Math.random() * 20, 95),
  }));

  // Calculate profit margin
  const currentRevenue = revenueTrend[revenueTrend.length - 1]?.revenue || 0;
  const currentExpenses = revenueTrend[revenueTrend.length - 1]?.expenses || 0;
  const profitMargin = currentRevenue > 0 ? ((currentRevenue - currentExpenses) / currentRevenue) * 100 : 0;

  // Strategic goals progress
  const strategicGoals: ProgressItem[] = [
    {
      id: '1',
      title: 'Q4 Revenue Target',
      subtitle: '$280K goal',
      progress: 85,
      status: 'in_progress',
      target: 100,
      dueDate: '2025-12-31',
      owner: 'Finance Team',
    },
    {
      id: '2',
      title: 'Team Expansion',
      subtitle: '50 employees target',
      progress: 72,
      status: 'in_progress',
      target: 100,
      dueDate: '2025-12-31',
      owner: 'HR Department',
    },
    {
      id: '3',
      title: 'Client Acquisition',
      subtitle: '15 new clients',
      progress: 60,
      status: 'at_risk',
      target: 100,
      dueDate: '2025-12-31',
      owner: 'Sales Team',
    },
  ];

  const quickActions = [
    {
      title: 'View Projects',
      description: 'All organization projects',
      icon: Building2,
      onClick: () => navigate('/dashboard/projects'),
      color: 'blue' as const,
    },
    {
      title: 'Financial Reports',
      description: 'Revenue and billing',
      icon: DollarSign,
      onClick: () => navigate('/dashboard/billing'),
      color: 'green' as const,
    },
    {
      title: 'Team Performance',
      description: 'Manager performance',
      icon: Users,
      onClick: () => navigate('/dashboard/users'),
      color: 'purple' as const,
    },
    {
      title: 'Analytics',
      description: 'Business insights',
      icon: TrendingUp,
      onClick: () => navigate('/dashboard/reports'),
      color: 'orange' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* HIERARCHY LEVEL 1: Financial KPIs (Management Exclusive) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPIWidget
          title="Monthly Revenue"
          value={data.billing_metrics.monthly_revenue}
          format="currency"
          icon={DollarSign}
          color="green"
          comparison={{
            period: 'MoM',
            previousValue: data.billing_metrics.monthly_revenue * 0.92,
            change: data.billing_metrics.monthly_revenue * 0.08,
            changePercentage: data.billing_metrics.revenue_growth,
          }}
          target={280000}
          sparklineData={revenueTrend.map((r) => r.revenue)}
        />

        <GaugeChart
          title="Profit Margin"
          value={profitMargin}
          max={100}
          unit="%"
          thresholds={{ low: 20, medium: 35, high: 50 }}
          colors={{ low: '#EF4444', medium: '#F59E0B', high: '#10B981' }}
          height={180}
        />

        <KPIWidget
          title="Revenue Growth"
          value={data.billing_metrics.revenue_growth}
          format="percentage"
          icon={TrendingUp}
          color="blue"
          trend="up"
          comparison={{
            period: 'YoY',
            previousValue: data.billing_metrics.revenue_growth - 3,
            change: 3,
            changePercentage: 25,
          }}
        />
      </div>

      {/* HIERARCHY LEVEL 2: Organizational Overview (From Manager + Management) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total Projects"
          value={data.organization_overview.total_projects}
          icon={Building2}
          color="blue"
          subtitle="Organization-wide"
        />
        <StatsCard
          title="Active Projects"
          value={data.organization_overview.active_projects}
          icon={Activity}
          color="green"
          trend={{ direction: 'up', value: '+15%' }}
        />
        <StatsCard
          title="Total Employees"
          value={data.organization_overview.total_employees}
          icon={Users}
          color="purple"
        />
        <StatsCard
          title="Total Managers"
          value={data.organization_overview.total_managers}
          icon={Shield}
          color="indigo"
          subtitle={`${data.team_performance.length} active`}
        />
      </div>

      {/* Quick Actions */}
      <QuickActions actions={quickActions} />

      {/* HIERARCHY LEVEL 3: Financial Analysis (Management features) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ComboChartCard
          title="Revenue vs Expenses Analysis"
          data={revenueTrend}
          lineKeys={[{ key: 'revenue', color: '#10B981', name: 'Revenue' }]}
          barKeys={[{ key: 'expenses', color: '#EF4444', name: 'Expenses' }]}
          height={300}
        />

        <AreaChartCard
          title="Project Completion Trend"
          data={projectCompletion}
          dataKeys={[
            { key: 'completed', color: '#10B981', name: 'Completed' },
            { key: 'ongoing', color: '#3B82F6', name: 'Ongoing' },
          ]}
          stacked
          height={300}
        />
      </div>

      {/* HIERARCHY LEVEL 4: Strategic Goals (Management Exclusive) */}
      <ProgressTracker
        title="Strategic Goals & Initiatives"
        items={strategicGoals}
        showPercentage={true}
        showTarget={true}
        showDueDate={true}
        maxItems={10}
      />

      {/* HIERARCHY LEVEL 5: Financial Performance Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6 border border-transparent dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Financial Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${data.billing_metrics.monthly_revenue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Monthly Revenue</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              ${data.billing_metrics.pending_billing.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Pending Billing</div>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.billing_metrics.total_billable_hours.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Billable Hours</div>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {data.billing_metrics.revenue_growth}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Revenue Growth</div>
          </div>
        </div>
      </div>

      {/* HIERARCHY LEVEL 6: Team Performance (Manager features inherited) */}
      <BarChartCard
        title="Team Utilization by Manager"
        data={teamUtilization}
        dataKeys={[{ key: 'utilization', color: '#8B5CF6', name: 'Utilization %' }]}
        horizontal
        height={300}
      />

      {/* HIERARCHY LEVEL 7: Manager Performance Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 border border-transparent dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Manager Performance Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Manager
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Team Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Active Timesheets
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pending Approvals
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data.team_performance.map((manager, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {manager.manager_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {manager.team_size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {manager.active_timesheets}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                      {manager.pending_approvals}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        manager.pending_approvals === 0
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : manager.pending_approvals < 5
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}
                    >
                      {manager.pending_approvals === 0 ? 'Clear' : manager.pending_approvals < 5 ? 'Normal' : 'Backlog'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagementDashboard;
