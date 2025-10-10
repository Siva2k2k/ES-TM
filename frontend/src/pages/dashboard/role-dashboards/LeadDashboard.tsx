import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, CheckCircle, AlertCircle, Users, Plus, ListTodo } from 'lucide-react';
import type { LeadDashboardData } from '../../../services/DashboardService';
import { StatsCard, LineChartCard, BarChartCard, QuickActions } from '../components';

interface LeadDashboardProps {
  data: LeadDashboardData;
}

export const LeadDashboard: React.FC<LeadDashboardProps> = ({ data }) => {
  const navigate = useNavigate();

  const taskTrend = data.task_completion_trend || [
    { name: 'Week 1', completed: 12, pending: 8 },
    { name: 'Week 2', completed: 14, pending: 7 },
    { name: 'Week 3', completed: 15, pending: 8 },
    { name: 'Week 4', completed: 15, pending: 8 },
  ];

  const teamWorkload = data.team_workload || data.team_collaboration.map(m => ({
    name: m.user_name.split(' ')[0],
    tasks: m.pending_tasks
  }));

  const quickActions = [
    { title: 'Create Task', description: 'Add new task', icon: Plus, onClick: () => navigate('/dashboard/projects/tasks'), color: 'blue' as const },
    { title: 'View Tasks', description: 'All team tasks', icon: ListTodo, onClick: () => navigate('/dashboard/projects/tasks'), color: 'purple' as const },
    { title: 'Projects', description: 'Coordinate projects', icon: Target, onClick: () => navigate('/dashboard/projects'), color: 'green' as const },
    { title: 'Team', description: 'Team collaboration', icon: Users, onClick: () => navigate('/dashboard/team'), color: 'orange' as const },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard title="Assigned Tasks" value={data.task_overview.assigned_tasks} icon={Target} color="blue" />
        <StatsCard title="Completed Tasks" value={data.task_overview.completed_tasks} icon={CheckCircle} color="green" />
        <StatsCard title="Overdue Tasks" value={data.task_overview.overdue_tasks} icon={AlertCircle} color="red" />
        <StatsCard title="Team Tasks" value={data.task_overview.team_tasks} icon={Users} color="purple" />
      </div>

      <QuickActions actions={quickActions} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChartCard title="Task Completion Trend" data={taskTrend} dataKeys={[
          { key: 'completed', color: '#10B981', name: 'Completed' },
          { key: 'pending', color: '#F59E0B', name: 'Pending' }
        ]} />
        <BarChartCard title="Team Workload" data={teamWorkload} dataKeys={[{ key: 'tasks', color: '#3B82F6', name: 'Tasks' }]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-transparent dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Project Coordination</h3>
          <div className="space-y-4">
            {data.project_coordination.map((project, i) => (
              <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{project.project_name}</h4>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">{project.my_role}</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div>{project.team_size} team members • {project.active_tasks} active tasks</div>
                  <div>{project.completion_percentage}% complete</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-transparent dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Team Collaboration</h3>
          <div className="space-y-3">
            {data.team_collaboration.map((member, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{member.user_name}</div>
                  <div className="text-sm text-gray-500">{member.shared_projects} shared projects</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-900">{member.pending_tasks} pending</div>
                  <div className="text-sm text-green-600">{member.collaboration_score}/100</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDashboard;
