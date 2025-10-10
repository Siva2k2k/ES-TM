import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Building2, Clock, BarChart3, UserCheck, FileCheck, TrendingUp } from 'lucide-react';
import type { ManagerDashboardData } from '../../../services/DashboardService';
import {
  StatsCard,
  KPIWidget,
  LineChartCard,
  BarChartCard,
  PieChartCard,
  GaugeChart,
  QuickActions,
  RadialProgressChart,
} from '../components';

interface ManagerDashboardProps {
  data: ManagerDashboardData;
}

/**
 * ManagerDashboard Component
 * HIERARCHY: Has ALL Lead features + Team Management & Approval workflows
 * Team oversight, timesheet approvals, resource allocation
 */
export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ data }) => {
  const navigate = useNavigate();

  // ========== DATA PREPARATION ==========
  const teamHoursTrend = data.team_hours_trend || [
    { name: 'Week 1', hours: 240, billable: 210 },
    { name: 'Week 2', hours: 252, billable: 220 },
    { name: 'Week 3', hours: 240, billable: 215 },
    { name: 'Week 4', hours: 246, billable: 218 },
    { name: 'Week 5', hours: 250, billable: 222 },
  ];

  const projectProgress = data.project_progress || data.project_status.map((p) => ({
    name: p.project_name.substring(0, 15),
    progress: p.completion_percentage,
  }));

  const approvalStatus = data.approval_status || [
    { name: 'Approved', value: data.team_overview.team_size - data.team_overview.pending_timesheets },
    { name: 'Pending', value: data.team_overview.pending_timesheets },
  ];

  // Team member performance for radial chart
  const teamPerformance = data.team_members.slice(0, 5).map((member, idx) => ({
    name: member.user_name.split(' ')[0],
    value: (member.weekly_hours / 40) * 100,
    fill: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'][idx],
  }));

  const quickActions = [
    {
      title: 'Review Timesheets',
      description: `${data.team_overview.pending_timesheets} pending`,
      icon: Clock,
      onClick: () => navigate('/dashboard/team'),
      color: 'yellow' as const,
    },
    {
      title: 'Team Members',
      description: 'Manage your team',
      icon: Users,
      onClick: () => navigate('/dashboard/users'),
      color: 'blue' as const,
    },
    {
      title: 'Projects',
      description: 'View team projects',
      icon: Building2,
      onClick: () => navigate('/dashboard/projects'),
      color: 'purple' as const,
    },
    {
      title: 'Reports',
      description: 'Team performance',
      icon: BarChart3,
      onClick: () => navigate('/dashboard/reports'),
      color: 'green' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* HIERARCHY LEVEL 1: Team Management KPIs (Manager Exclusive) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPIWidget
          title="Team Utilization"
          value={data.team_overview.team_utilization}
          format="percentage"
          icon={TrendingUp}
          color="purple"
          target={85}
          comparison={{ period: 'WoW', previousValue: data.team_overview.team_utilization - 5, change: 5, changePercentage: 6.5 }}
          sparklineData={teamHoursTrend.map((t) => (t.billable / t.hours) * 100)}
        />

        <GaugeChart
          title="Approval Rate"
          value={Math.round(((data.team_overview.team_size - data.team_overview.pending_timesheets) / data.team_overview.team_size) * 100)}
          max={100}
          unit="%"
          thresholds={{ low: 50, medium: 75, high: 90 }}
          height={180}
        />

        <KPIWidget
          title="Pending Approvals"
          value={data.team_overview.pending_timesheets}
          format="number"
          icon={FileCheck}
          color="yellow"
          alerts={data.team_overview.pending_timesheets > 5 ? [{ type: 'warning', message: 'High approval backlog' }] : []}
        />
      </div>

      {/* HIERARCHY LEVEL 2: Team Overview (From Lead + Manager data) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard title="Team Size" value={data.team_overview.team_size} icon={Users} color="blue" subtitle="Direct reports" />
        <StatsCard title="Active Projects" value={data.team_overview.active_projects} icon={Building2} color="green" />
        <StatsCard title="Pending Timesheets" value={data.team_overview.pending_timesheets} icon={Clock} color="yellow" />
        <StatsCard title="Utilization" value={`${data.team_overview.team_utilization}%`} icon={BarChart3} color="purple" />
      </div>

      {/* Quick Actions */}
      <QuickActions actions={quickActions} />

      {/* HIERARCHY LEVEL 3: Team Performance Analysis (Manager features) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChartCard
          title="Team Hours Trend"
          data={teamHoursTrend}
          dataKeys={[
            { key: 'hours', color: '#3B82F6', name: 'Total Hours' },
            { key: 'billable', color: '#10B981', name: 'Billable' },
          ]}
          height={300}
        />

        <BarChartCard
          title="Project Progress"
          data={projectProgress}
          dataKeys={[{ key: 'progress', color: '#8B5CF6', name: 'Completion %' }]}
          height={300}
        />
      </div>

      {/* HIERARCHY LEVEL 4: Workload & Approval Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RadialProgressChart title="Team Member Workload" data={teamPerformance} height={300} />

        <PieChartCard title="Approval Status" data={approvalStatus} dataKey="value" nameKey="name" height={300} />
      </div>

      {/* HIERARCHY LEVEL 5: Team Members Detail (Lead features inherited) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6 border border-transparent dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Team Members</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.team_members.slice(0, 6).map((member, i) => (
            <div key={i} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{member.user_name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {member.current_projects} projects • {member.pending_timesheets} pending
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.weekly_hours}h/wk</div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  member.status === 'active' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                  member.status === 'overdue' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                  'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}>
                  {member.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HIERARCHY LEVEL 6: Approval Queue (Manager Exclusive) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 border border-transparent dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pending Approvals</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Week</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Priority</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data.timesheet_approvals.map((approval, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{approval.user_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{approval.week_start}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{approval.total_hours}h</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      approval.status === 'pending_approval' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>{approval.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      approval.priority === 'high' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                      approval.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                      'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    }`}>{approval.priority}</span>
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

export default ManagerDashboard;
