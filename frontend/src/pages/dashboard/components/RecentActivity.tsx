import React from 'react';
import { Clock, CheckCircle, AlertCircle, FileText, Users } from 'lucide-react';

interface Activity {
  id?: string;
  date: string;
  activity_type: string;
  description: string;
  project_name?: string;
  user_name?: string;
}

interface RecentActivityProps {
  activities: Activity[];
  maxItems?: number;
}

/**
 * RecentActivity Component
 * Displays a timeline of recent activities
 */
export const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
  maxItems = 10,
}) => {
  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'task_completed':
        return <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />;
      case 'timesheet_submitted':
        return <Clock className="h-4 w-4 text-blue-500 dark:text-blue-400" />;
      case 'timesheet_approved':
        return <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />;
      case 'project_created':
        return <FileText className="h-4 w-4 text-purple-500 dark:text-purple-400" />;
      case 'user_assigned':
        return <Users className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const displayActivities = activities.slice(0, maxItems);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 border border-transparent dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Recent Activity
        </h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {displayActivities.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No recent activity
            </p>
          ) : (
            displayActivities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.activity_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {activity.description}
                  </p>
                  <div className="flex items-center mt-1 space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatDate(activity.date)}</span>
                    {activity.project_name && (
                      <>
                        <span>•</span>
                        <span>{activity.project_name}</span>
                      </>
                    )}
                    {activity.user_name && (
                      <>
                        <span>•</span>
                        <span>{activity.user_name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;
