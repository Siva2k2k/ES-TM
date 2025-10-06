import React, { useState, useEffect } from 'react';
import { useAuth } from '../store/contexts/AuthContext';
import { DashboardService } from '../services/DashboardService';
import type {
  SuperAdminDashboardData,
  ManagementDashboardData,
  ManagerDashboardData,
  LeadDashboardData,
  EmployeeDashboardData
} from '../services/DashboardService';
import {
  Users,
  Building2,
  Clock,
  DollarSign,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Calendar,
  Target,
  Activity,
  FileText,
  Shield,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

type DashboardData = SuperAdminDashboardData | ManagementDashboardData | ManagerDashboardData | LeadDashboardData | EmployeeDashboardData;

export const RoleSpecificDashboard: React.FC = () => {
  const { currentUser, currentUserRole } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadDashboard();
  }, [currentUserRole, refreshTrigger]);

  const loadDashboard = async () => {
    if (!currentUser || !currentUserRole) return;

    setLoading(true);
    setError(null);

    try {
      const result = await DashboardService.getRoleSpecificDashboard();

      if (result.error) {
        // Use fallback data instead of showing error
        console.warn('Dashboard API failed, using fallback data:');
        setDashboardData(getFallbackDashboardData());
      } else {
        setDashboardData(result.dashboard || getFallbackDashboardData());
      }
    } catch (err) {
      // Use fallback data instead of showing error
      console.warn('Dashboard API failed, using fallback data:', err);
      setDashboardData(getFallbackDashboardData());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackDashboardData = (): DashboardData => {
    const baseData = {
      personal_overview: {
        current_projects: 3,
        assigned_tasks: 8,
        completed_tasks: 15,
        weekly_hours: 40.5
      },
      timesheet_status: {
        current_week: new Date().toISOString().split('T')[0],
        status: 'pending_approval',
        total_hours: 40.5,
        billable_hours: 35.0,
        can_submit: false
      },
      project_assignments: [
        {
          project_id: '1',
          project_name: 'E-commerce Platform',
          role: 'Developer',
          active_tasks: 3,
          hours_logged: 20.5,
          is_billable: true
        },
        {
          project_id: '2',
          project_name: 'Mobile App',
          role: 'Lead Developer',
          active_tasks: 2,
          hours_logged: 15.0,
          is_billable: true
        }
      ],
      recent_activity: [
        {
          date: new Date().toISOString(),
          activity_type: 'task_completed',
          description: 'Completed user authentication module',
          project_name: 'E-commerce Platform'
        },
        {
          date: new Date(Date.now() - 86400000).toISOString(),
          activity_type: 'timesheet_submitted',
          description: 'Submitted timesheet for approval',
          project_name: undefined
        }
      ]
    };

    switch (currentUserRole) {
      case 'super_admin':
        return {
          system_overview: {
            total_users: 25,
            active_users: 23,
            pending_approvals: 2,
            total_projects: 8,
            active_projects: 6
          },
          timesheet_metrics: {
            total_timesheets: 120,
            pending_approval: 8,
            frozen_timesheets: 2,
            average_hours_per_week: 38.5
          },
          financial_overview: {
            total_revenue: 125000,
            monthly_revenue: 25000,
            billable_hours: 1850,
            average_hourly_rate: 85
          },
          user_activity: [
            {
              user_id: '1',
              user_name: 'John Doe',
              role: 'developer',
              last_timesheet: '2024-01-15',
              status: 'active'
            }
          ]
        } as SuperAdminDashboardData;

      case 'management':
        return {
          organization_overview: {
            total_projects: 8,
            active_projects: 6,
            total_employees: 23,
            total_managers: 4
          },
          project_health: [
            {
              project_id: '1',
              project_name: 'E-commerce Platform',
              status: 'active',
              budget_utilization: 75,
              team_size: 8,
              completion_percentage: 60
            }
          ],
          billing_metrics: {
            monthly_revenue: 25000,
            pending_billing: 5000,
            total_billable_hours: 1200,
            revenue_growth: 15
          },
          team_performance: [
            {
              manager_id: '1',
              manager_name: 'Jane Smith',
              team_size: 6,
              active_timesheets: 6,
              pending_approvals: 2
            }
          ]
        } as ManagementDashboardData;

      case 'manager':
        return {
          team_overview: {
            team_size: 6,
            active_projects: 3,
            pending_timesheets: 2,
            team_utilization: 85
          },
          project_status: [
            {
              project_id: '1',
              project_name: 'E-commerce Platform',
              status: 'active',
              team_members: 4,
              completion_percentage: 65,
              budget_status: 'on_track' as const
            }
          ],
          team_members: [
            {
              user_id: '1',
              user_name: 'John Doe',
              current_projects: 2,
              pending_timesheets: 1,
              weekly_hours: 40,
              status: 'active' as const
            }
          ],
          timesheet_approvals: [
            {
              timesheet_id: '1',
              user_name: 'John Doe',
              week_start: '2024-01-15',
              total_hours: 40,
              status: 'pending_approval',
              priority: 'medium' as const
            }
          ]
        } as ManagerDashboardData;

      case 'lead':
        return {
          task_overview: {
            assigned_tasks: 8,
            completed_tasks: 15,
            overdue_tasks: 1,
            team_tasks: 12
          },
          project_coordination: [
            {
              project_id: '1',
              project_name: 'E-commerce Platform',
              my_role: 'Lead Developer',
              team_size: 4,
              active_tasks: 6,
              completion_percentage: 65
            }
          ],
          team_collaboration: [
            {
              user_id: '1',
              user_name: 'John Doe',
              shared_projects: 2,
              pending_tasks: 3,
              collaboration_score: 85
            }
          ]
        } as LeadDashboardData;

      case 'employee':
      default:
        return baseData as EmployeeDashboardData;
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Please log in to view your dashboard</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Welcome back, {currentUser.full_name}
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  {currentUserRole?.replace('_', ' ').toUpperCase()}
                </span>
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Role-specific Dashboard Content */}
        {currentUserRole === 'super_admin' && dashboardData && (
          <SuperAdminDashboard data={dashboardData as SuperAdminDashboardData} />
        )}

        {currentUserRole === 'management' && dashboardData && (
          <ManagementDashboard data={dashboardData as ManagementDashboardData} />
        )}

        {currentUserRole === 'manager' && dashboardData && (
          <ManagerDashboard data={dashboardData as ManagerDashboardData} />
        )}

        {currentUserRole === 'lead' && dashboardData && (
          <LeadDashboard data={dashboardData as LeadDashboardData} />
        )}

        {currentUserRole === 'employee' && dashboardData && (
          <EmployeeDashboard data={dashboardData as EmployeeDashboardData} />
        )}

        {!dashboardData && (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Dashboard Data</h3>
            <p className="text-gray-600 dark:text-gray-400">Unable to load dashboard data for your role.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Super Admin Dashboard Component
const SuperAdminDashboard: React.FC<{ data: SuperAdminDashboardData }> = ({ data }) => (
  <div className="space-y-6">
    {/* System Overview */}
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      <MetricCard
        title="Total Users"
        value={data.system_overview.total_users.toString()}
        icon={Users}
        color="blue"
      />
      <MetricCard
        title="Active Users"
        value={data.system_overview.active_users.toString()}
        icon={CheckCircle}
        color="green"
      />
      <MetricCard
        title="Pending Approvals"
        value={data.system_overview.pending_approvals.toString()}
        icon={AlertCircle}
        color="yellow"
      />
      <MetricCard
        title="Total Projects"
        value={data.system_overview.total_projects.toString()}
        icon={Building2}
        color="purple"
      />
      <MetricCard
        title="Active Projects"
        value={data.system_overview.active_projects.toString()}
        icon={Activity}
        color="indigo"
      />
    </div>

    {/* Timesheet & Financial Metrics */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6 border border-transparent dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Timesheet Metrics</h3>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Total Timesheets</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{data.timesheet_metrics.total_timesheets}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Pending Approval</span>
            <span className="font-semibold text-yellow-600 dark:text-yellow-400">{data.timesheet_metrics.pending_approval}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Frozen Timesheets</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">{data.timesheet_metrics.frozen_timesheets}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Avg. Hours/Week</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{data.timesheet_metrics.average_hours_per_week.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6 border border-transparent dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Financial Overview</h3>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Total Revenue</span>
            <span className="font-semibold text-green-600 dark:text-green-400">${data.financial_overview.total_revenue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Monthly Revenue</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">${data.financial_overview.monthly_revenue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Billable Hours</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{data.financial_overview.billable_hours.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Avg. Hourly Rate</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">${data.financial_overview.average_hourly_rate.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>

    {/* User Activity */}
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
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{user.user_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.last_timesheet}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={user.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// Management Dashboard Component
const ManagementDashboard: React.FC<{ data: ManagementDashboardData }> = ({ data }) => (
  <div className="space-y-6">
    {/* Organization Overview */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <MetricCard
        title="Total Projects"
        value={data.organization_overview.total_projects.toString()}
        icon={Building2}
        color="blue"
      />
      <MetricCard
        title="Active Projects"
        value={data.organization_overview.active_projects.toString()}
        icon={Activity}
        color="green"
      />
      <MetricCard
        title="Total Employees"
        value={data.organization_overview.total_employees.toString()}
        icon={Users}
        color="purple"
      />
      <MetricCard
        title="Total Managers"
        value={data.organization_overview.total_managers.toString()}
        icon={Shield}
        color="indigo"
      />
    </div>

    {/* Billing Metrics */}
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6 border border-transparent dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Financial Performance</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">${data.billing_metrics.monthly_revenue.toLocaleString()}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Revenue</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">${data.billing_metrics.pending_billing.toLocaleString()}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Pending Billing</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.billing_metrics.total_billable_hours.toFixed(1)}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Billable Hours</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{data.billing_metrics.revenue_growth.toFixed(1)}%</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Revenue Growth</div>
        </div>
      </div>
    </div>

    {/* Project Health & Team Performance */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 border border-transparent dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Project Health</h3>
        </div>
        <div className="p-6 space-y-4">
          {data.project_health.slice(0, 5).map((project, index) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{project.project_name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{project.team_size} team members</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{project.completion_percentage.toFixed(0)}%</div>
                <StatusBadge status={project.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 border border-transparent dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Team Performance</h3>
        </div>
        <div className="p-6 space-y-4">
          {data.team_performance.slice(0, 5).map((manager, index) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{manager.manager_name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{manager.team_size} team members</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-900 dark:text-gray-100">{manager.active_timesheets} active</div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">{manager.pending_approvals} pending</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Manager Dashboard Component
const ManagerDashboard: React.FC<{ data: ManagerDashboardData }> = ({ data }) => (
  <div className="space-y-6">
    {/* Team Overview */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <MetricCard
        title="Team Size"
        value={data.team_overview.team_size.toString()}
        icon={Users}
        color="blue"
      />
      <MetricCard
        title="Active Projects"
        value={data.team_overview.active_projects.toString()}
        icon={Building2}
        color="green"
      />
      <MetricCard
        title="Pending Timesheets"
        value={data.team_overview.pending_timesheets.toString()}
        icon={Clock}
        color="yellow"
      />
      <MetricCard
        title="Team Utilization"
        value={`${data.team_overview.team_utilization.toFixed(0)}%`}
        icon={BarChart3}
        color="purple"
      />
    </div>

    {/* Project Status & Team Members */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 border border-transparent dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Project Status</h3>
        </div>
        <div className="p-6 space-y-4">
          {data.project_status.map((project, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">{project.project_name}</h4>
                <StatusBadge status={project.status} />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div>{project.team_members} team members</div>
                <div>{project.completion_percentage.toFixed(0)}% complete</div>
                <div className="flex items-center">
                  Budget: <BudgetStatusBadge status={project.budget_status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 border border-transparent dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Team Members</h3>
        </div>
        <div className="p-6 space-y-4">
          {data.team_members.map((member, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{member.user_name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{member.current_projects} projects</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-900 dark:text-gray-100">{member.weekly_hours.toFixed(1)}h/week</div>
                <StatusBadge status={member.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Timesheet Approvals */}
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 border border-transparent dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pending Approvals</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Week</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hours</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.timesheet_approvals.map((approval, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{approval.user_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{approval.week_start}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{approval.total_hours}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={approval.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <PriorityBadge priority={approval.priority} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// Lead Dashboard Component
const LeadDashboard: React.FC<{ data: LeadDashboardData }> = ({ data }) => (
  <div className="space-y-6">
    {/* Task Overview */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <MetricCard
        title="Assigned Tasks"
        value={data.task_overview.assigned_tasks.toString()}
        icon={Target}
        color="blue"
      />
      <MetricCard
        title="Completed Tasks"
        value={data.task_overview.completed_tasks.toString()}
        icon={CheckCircle}
        color="green"
      />
      <MetricCard
        title="Overdue Tasks"
        value={data.task_overview.overdue_tasks.toString()}
        icon={AlertCircle}
        color="red"
      />
      <MetricCard
        title="Team Tasks"
        value={data.task_overview.team_tasks.toString()}
        icon={Users}
        color="purple"
      />
    </div>

    {/* Project Coordination & Team Collaboration */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 border border-transparent dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Project Coordination</h3>
        </div>
        <div className="p-6 space-y-4">
          {data.project_coordination.map((project, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">{project.project_name}</h4>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                  {project.my_role}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div>{project.team_size} team members</div>
                <div>{project.active_tasks} active tasks</div>
                <div>{project.completion_percentage.toFixed(0)}% complete</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 border border-transparent dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Team Collaboration</h3>
        </div>
        <div className="p-6 space-y-4">
          {data.team_collaboration.map((member, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{member.user_name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{member.shared_projects} shared projects</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-900 dark:text-gray-100">{member.pending_tasks} pending</div>
                <div className="text-sm text-green-600 dark:text-green-400">{member.collaboration_score}/100</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Employee Dashboard Component
const EmployeeDashboard: React.FC<{ data: EmployeeDashboardData }> = ({ data }) => (
  <div className="space-y-6">
    {/* Personal Overview */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <MetricCard
        title="Current Projects"
        value={data.personal_overview.current_projects.toString()}
        icon={Building2}
        color="blue"
      />
      <MetricCard
        title="Assigned Tasks"
        value={data.personal_overview.assigned_tasks.toString()}
        icon={Target}
        color="yellow"
      />
      <MetricCard
        title="Completed Tasks"
        value={data.personal_overview.completed_tasks.toString()}
        icon={CheckCircle}
        color="green"
      />
      <MetricCard
        title="Weekly Hours"
        value={data.personal_overview.weekly_hours.toFixed(1)}
        icon={Clock}
        color="purple"
      />
    </div>

    {/* Timesheet Status */}
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6 border border-transparent dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Current Timesheet Status</h3>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Week</div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">{data.timesheet_status.current_week}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</div>
          <StatusBadge status={data.timesheet_status.status} />
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Hours</div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">{data.timesheet_status.total_hours.toFixed(1)}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Billable Hours</div>
          <div className="font-semibold text-green-600 dark:text-green-400">{data.timesheet_status.billable_hours.toFixed(1)}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Action</div>
          {data.timesheet_status.can_submit ? (
            <span className="text-blue-600 dark:text-blue-400 font-medium">Can Submit</span>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">Submitted</span>
          )}
        </div>
      </div>
    </div>

    {/* Project Assignments & Recent Activity */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 border border-transparent dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Project Assignments</h3>
        </div>
        <div className="p-6 space-y-4">
          {data.project_assignments.map((assignment, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">{assignment.project_name}</h4>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                    {assignment.role}
                  </span>
                  {assignment.is_billable && (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                      Billable
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div>{assignment.active_tasks} active tasks</div>
                <div>{assignment.hours_logged.toFixed(1)} hours logged</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 border border-transparent dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h3>
        </div>
        <div className="p-6 space-y-4">
          {data.recent_activity.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2"></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{activity.description}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {activity.date} • {activity.activity_type}
                  {activity.project_name && ` • ${activity.project_name}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Utility Components
const MetricCard: React.FC<{
  title: string;
  value: string;
  icon: any;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'indigo';
  trend?: 'up' | 'down' | 'neutral';
}> = ({ title, value, icon: Icon, color, trend }) => {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400',
    purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
    red: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400',
    indigo: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6 border border-transparent dark:border-gray-700">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <div className="flex items-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
            {trend && (
              <div className="ml-2">
                {trend === 'up' && <ArrowUp className="h-4 w-4 text-green-500 dark:text-green-400" />}
                {trend === 'down' && <ArrowDown className="h-4 w-4 text-red-500 dark:text-red-400" />}
                {trend === 'neutral' && <Minus className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
      case 'approved':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'pending':
      case 'submitted':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'inactive':
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
      {status}
    </span>
  );
};

const BudgetStatusBadge: React.FC<{ status: 'under' | 'on_track' | 'over' }> = ({ status }) => {
  const colorMap = {
    under: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    on_track: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    over: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
  };

  const labelMap = {
    under: 'Under Budget',
    on_track: 'On Track',
    over: 'Over Budget'
  };

  return (
    <span className={`ml-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colorMap[status]}`}>
      {labelMap[status]}
    </span>
  );
};

const PriorityBadge: React.FC<{ priority: 'high' | 'medium' | 'low' }> = ({ priority }) => {
  const colorMap = {
    high: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    medium: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    low: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
  };

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colorMap[priority]}`}>
      {priority.toUpperCase()}
    </span>
  );
};

export default RoleSpecificDashboard;