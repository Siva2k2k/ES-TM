import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle,
  AlertCircle,
  Building2,
  Activity,
  DollarSign,
  Clock,
  TrendingUp,
  Server,
  Shield,
} from 'lucide-react';
import type { SuperAdminDashboardData } from '../../../services/DashboardService';
import {
  StatsCard,
  KPIWidget,
  LineChartCard,
  AreaChartCard,
  ComboChartCard,
  PieChartCard,
  GaugeChart,
  HeatmapChart,
  QuickActions,
  LeaderboardWidget,
  type LeaderboardEntry,
} from '../components';

interface SuperAdminDashboardProps {
  data: SuperAdminDashboardData;
}

/**
 * SuperAdminDashboard Component
 * HIERARCHY: Has ALL Management features + System Administration features
 * Most comprehensive dashboard with full system oversight
 */
export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ data }) => {
  const navigate = useNavigate();

  // ========== DATA PREPARATION ==========
  const userGrowthData = data.user_growth || [
    { name: 'Jan', users: 15 },{ name: 'Feb', users: 18 },{ name: 'Mar', users: 20 },
    { name: 'Apr', users: 23 },{ name: 'May', users: 25 },{ name: 'Jun', users: 28 },
  ];

  const revenueTrendData = data.revenue_trend || [
    { name: 'Jan', revenue: 95000, billable_hours: 1650 },
    { name: 'Feb', revenue: 108000, billable_hours: 1720 },
    { name: 'Mar', revenue: 112000, billable_hours: 1780 },
    { name: 'Apr', revenue: 118000, billable_hours: 1810 },
    { name: 'May', revenue: 125000, billable_hours: 1850 },
  ];

  const projectStatusDistribution = data.project_status_distribution || [
    { name: 'Active', value: data.system_overview.active_projects },
    { name: 'On Hold', value: 1 },
    { name: 'Completed', value: data.system_overview.total_projects - data.system_overview.active_projects - 1 },
  ];

  // Activity Heatmap Data (Hours x Days)
  const activityHeatmap = [
    { x: 'Mon', y: '9AM', value: 12 },{ x: 'Tue', y: '9AM', value: 15 },{ x: 'Wed', y: '9AM', value: 18 },
    { x: 'Thu', y: '9AM', value: 14 },{ x: 'Fri', y: '9AM', value: 10 },
    { x: 'Mon', y: '1PM', value: 20 },{ x: 'Tue', y: '1PM', value: 22 },{ x: 'Wed', y: '1PM', value: 25 },
    { x: 'Thu', y: '1PM', value: 21 },{ x: 'Fri', y: '1PM', value: 18 },
    { x: 'Mon', y: '5PM', value: 8 },{ x: 'Tue', y: '5PM', value: 6 },{ x: 'Wed', y: '5PM', value: 10 },
    { x: 'Thu', y: '5PM', value: 7 },{ x: 'Fri', y: '5PM', value: 5 },
  ];

  // Top Performers
  const topPerformers: LeaderboardEntry[] = [
    { rank: 1, id: '1', name: 'Sarah Chen', value: 125000, badge: 'gold', subtitle: 'Senior Developer', trend: [95, 100, 110, 115, 125] },
    { rank: 2, id: '2', name: 'Mike Johnson', value: 118000, badge: 'silver', subtitle: 'Project Manager', trend: [90, 95, 105, 112, 118] },
    { rank: 3, id: '3', name: 'Emily Davis', value: 95000, badge: 'bronze', subtitle: 'Lead Designer', trend: [80, 85, 88, 92, 95] },
  ];

  // Quick actions
  const quickActions = [
    { title: 'User Management', description: 'Manage users and roles', icon: Users, onClick: () => navigate('/dashboard/users'), color: 'blue' as const },
    { title: 'Audit Logs', description: 'View system audit logs', icon: Shield, onClick: () => navigate('/dashboard/admin/audit-logs'), color: 'purple' as const },
    { title: 'System Reports', description: 'Generate system reports', icon: TrendingUp, onClick: () => navigate('/dashboard/reports'), color: 'orange' as const },
    { title: 'Billing Overview', description: 'Financial management', icon: DollarSign, onClick: () => navigate('/dashboard/billing'), color: 'green' as const },
  ];

  return (
    <div className="space-y-6">
      {/* HIERARCHY LEVEL 1: System Health KPIs (SuperAdmin Exclusive) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPIWidget
          title="System Uptime"
          value={99.8}
          format="percentage"
          icon={Server}
          color="green"
          target={99.5}
          comparison={{
            period: 'MoM',
            previousValue: 99.5,
            change: 0.3,
            changePercentage: 0.3,
          }}
          sparklineData={[99.2, 99.4, 99.6, 99.7, 99.8]}
        />

        <GaugeChart
          title="System Load"
          value={72}
          max={100}
          unit="%"
          thresholds={{ low: 33, medium: 66, high: 100 }}
          colors={{ low: '#10B981', medium: '#F59E0B', high: '#EF4444' }}
          height={180}
        />

        <KPIWidget
          title="Active Sessions"
          value={data.system_overview.active_users}
          format="number"
          icon={Activity}
          color="blue"
          comparison={{
            period: 'WoW',
            previousValue: data.system_overview.active_users - 3,
            change: 3,
            changePercentage: 15,
          }}
        />
      </div>

      {/* HIERARCHY LEVEL 2: Business Overview (From Management + SuperAdmin data) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <StatsCard title="Total Users" value={data.system_overview.total_users} icon={Users} color="blue"
          trend={{ direction: 'up', value: '+8.5%' }} subtitle="vs last month" />
        <StatsCard title="Active Projects" value={data.system_overview.active_projects} icon={Building2} color="purple" />
        <StatsCard title="Monthly Revenue" value={`$${data.financial_overview.monthly_revenue.toLocaleString()}`} icon={DollarSign} color="green"
          trend={{ direction: 'up', value: '+12%' }} />
        <StatsCard title="Pending Approvals" value={data.system_overview.pending_approvals} icon={AlertCircle} color="yellow" />
        <StatsCard title="Billable Hours" value={data.financial_overview.billable_hours} icon={Clock} color="indigo" />
      </div>

      {/* Quick Actions */}
      <QuickActions actions={quickActions} />

      {/* HIERARCHY LEVEL 3: Financial & Growth Analysis (Management features) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ComboChartCard
          title="Revenue & Growth Trend"
          data={revenueTrendData}
          lineKeys={[{ key: 'revenue', color: '#10B981', name: 'Revenue ($)' }]}
          barKeys={[{ key: 'billable_hours', color: '#3B82F6', name: 'Billable Hours' }]}
          height={300}
        />

        <AreaChartCard
          title="User Growth & Retention"
          data={userGrowthData}
          dataKeys={[{ key: 'users', color: '#8B5CF6', name: 'Total Users' }]}
          height={300}
        />
      </div>

      {/* HIERARCHY LEVEL 4: Activity Monitoring (SuperAdmin Exclusive) */}
      <HeatmapChart
        title="User Activity Heatmap (Peak Usage Times)"
        data={activityHeatmap}
        xLabels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri']}
        yLabels={['9AM', '1PM', '5PM']}
        height={250}
      />

      {/* HIERARCHY LEVEL 5: Operational Metrics (Management + SuperAdmin) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timesheet Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6 border border-transparent dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Timesheet Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400">Total Timesheets</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{data.timesheet_metrics.total_timesheets}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400">Pending Approval</span>
              <span className="font-semibold text-yellow-600 dark:text-yellow-400">{data.timesheet_metrics.pending_approval}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400">Frozen Timesheets</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">{data.timesheet_metrics.frozen_timesheets}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400">Avg. Hours/Week</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{data.timesheet_metrics.average_hours_per_week.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6 border border-transparent dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Financial Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400">Total Revenue</span>
              <span className="font-semibold text-green-600 dark:text-green-400">${data.financial_overview.total_revenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400">Monthly Revenue</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">${data.financial_overview.monthly_revenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400">Billable Hours</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{data.financial_overview.billable_hours.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400">Avg. Hourly Rate</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">${data.financial_overview.average_hourly_rate.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* HIERARCHY LEVEL 6: Project & Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChartCard
          title="Project Status Distribution"
          data={projectStatusDistribution}
          dataKey="value"
          nameKey="name"
          height={300}
        />

        <LeaderboardWidget
          title="Top Performers (Revenue)"
          entries={topPerformers}
          valueLabel="Revenue"
          valueFormat="currency"
          maxEntries={5}
          showSparklines={true}
        />
      </div>

      {/* HIERARCHY LEVEL 7: User Activity Table (Detailed Monitoring) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 border border-transparent dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent User Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Timesheet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data.user_activity.map((user, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{user.user_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.last_timesheet}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'active' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>{user.status}</span>
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

export default SuperAdminDashboard;
