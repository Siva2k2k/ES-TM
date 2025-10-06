/**
 * Employee Dashboard
 * Main dashboard view for employees
 * Cognitive Complexity: 5
 * File Size: ~200 LOC
 */
import React from 'react';
import { Clock, FolderKanban, CheckSquare, TrendingUp } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { QuickActions } from './QuickActions';
import { RecentActivity } from './RecentActivity';

export const EmployeeDashboard: React.FC = () => {
  // TODO: Fetch from API
  const metrics = {
    hoursThisWeek: 32,
    activeProjects: 3,
    pendingTasks: 7,
    completionRate: 85,
  };

  const handleNewTimesheet = () => {
    console.log('Navigate to new timesheet');
  };

  const handleNewProject = () => {
    console.log('Navigate to projects');
  };

  const handleNewReport = () => {
    console.log('Navigate to reports');
  };

  const handleViewTeam = () => {
    console.log('Navigate to team');
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, John! 👋</h1>
        <p className="text-blue-100 dark:text-blue-50">
          Here's what's happening with your work today
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Hours This Week"
          value={metrics.hoursThisWeek}
          suffix="hrs"
          icon={Clock}
          iconColor="blue"
          trend={{ value: 12, label: 'from last week' }}
        />
        <MetricCard
          title="Active Projects"
          value={metrics.activeProjects}
          icon={FolderKanban}
          iconColor="purple"
        />
        <MetricCard
          title="Pending Tasks"
          value={metrics.pendingTasks}
          icon={CheckSquare}
          iconColor="yellow"
          trend={{ value: -15, label: 'from yesterday' }}
        />
        <MetricCard
          title="Completion Rate"
          value={metrics.completionRate}
          suffix="%"
          icon={TrendingUp}
          iconColor="green"
          trend={{ value: 5, label: 'this month' }}
        />
      </div>

      {/* Quick Actions */}
      <QuickActions
        onNewTimesheet={handleNewTimesheet}
        onNewProject={handleNewProject}
        onNewReport={handleNewReport}
        onViewTeam={handleViewTeam}
      />

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
};
