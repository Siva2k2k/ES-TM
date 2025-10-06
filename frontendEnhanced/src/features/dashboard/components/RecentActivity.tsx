/**
 * Recent Activity Component
 * Shows recent user activities and updates
 * Cognitive Complexity: 3
 */
import React from 'react';
import { Clock, Check, AlertCircle, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '../../../shared/components/ui';
import { cn } from '../../../shared/utils/cn';

interface Activity {
  id: string;
  type: 'timesheet' | 'task' | 'project' | 'approval';
  title: string;
  description: string;
  timestamp: string;
  status?: 'completed' | 'pending' | 'rejected';
}

export const RecentActivity: React.FC = () => {
  // TODO: Fetch from API
  const activities: Activity[] = [
    {
      id: '1',
      type: 'timesheet',
      title: 'Timesheet Approved',
      description: 'Your timesheet for Week 40 has been approved',
      timestamp: '2 hours ago',
      status: 'completed',
    },
    {
      id: '2',
      type: 'task',
      title: 'Task Completed',
      description: 'Completed "Design Dashboard Layout" in Website Redesign',
      timestamp: '5 hours ago',
      status: 'completed',
    },
    {
      id: '3',
      type: 'project',
      title: 'New Project Assignment',
      description: 'You have been assigned to Mobile App Development',
      timestamp: '1 day ago',
      status: 'pending',
    },
    {
      id: '4',
      type: 'approval',
      title: 'Approval Required',
      description: 'Your leave request is pending manager approval',
      timestamp: '2 days ago',
      status: 'pending',
    },
  ];

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'timesheet':
        return Clock;
      case 'task':
        return Check;
      case 'project':
        return FileText;
      case 'approval':
        return AlertCircle;
      default:
        return FileText;
    }
  };

  const getStatusBadge = (status?: Activity['status']) => {
    if (!status) return null;

    const variants = {
      completed: 'success' as const,
      pending: 'warning' as const,
      rejected: 'error' as const,
    };

    const labels = {
      completed: 'Completed',
      pending: 'Pending',
      rejected: 'Rejected',
    };

    return <Badge variant={variants[status]} size="sm">{labels[status]}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.type);

            return (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
              >
                <div className={cn(
                  'p-2 rounded-lg flex-shrink-0',
                  activity.status === 'completed' && 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
                  activity.status === 'pending' && 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400',
                  activity.status === 'rejected' && 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400',
                  !activity.status && 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                )}>
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {activity.title}
                    </h4>
                    {getStatusBadge(activity.status)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
