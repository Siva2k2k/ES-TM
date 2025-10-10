import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

interface QuickActionsProps {
  actions: QuickAction[];
}

/**
 * QuickActions Component
 * Displays a grid of quick action cards for common tasks
 */
export const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6 border border-transparent dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          const color = action.color || 'blue';

          return (
            <button
              key={index}
              onClick={action.onClick}
              className={`p-4 rounded-lg transition-colors duration-200 text-left ${colorClasses[color]}`}
            >
              <Icon className="h-6 w-6 mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                {action.title}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {action.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
