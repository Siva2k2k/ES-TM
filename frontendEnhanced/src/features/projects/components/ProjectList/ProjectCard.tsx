/**
 * Project Card Component
 * Individual project card in list view
 * Cognitive Complexity: 4
 */
import React from 'react';
import {
  Building2,
  Calendar,
  DollarSign,
  User,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  Archive,
} from 'lucide-react';
import { Card, CardContent, Badge, Button } from '../../../../shared/components/ui';
import { cn } from '../../../../shared/utils/cn';
import type { Project } from '../../types/project.types';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onView: (project: Project) => void;
}

const statusConfig = {
  active: {
    variant: 'success' as const,
    icon: CheckCircle,
    label: 'Active',
  },
  completed: {
    variant: 'info' as const,
    icon: Clock,
    label: 'Completed',
  },
  archived: {
    variant: 'gray' as const,
    icon: Archive,
    label: 'Archived',
  },
};

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onDelete,
  onView,
}) => {
  const config = statusConfig[project.status];
  const StatusIcon = config.icon;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const budgetUsedPercent = project.spent_amount
    ? (project.spent_amount / project.budget) * 100
    : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {project.name}
                </h3>
              </div>
              {project.client_name && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {project.client_name}
                </p>
              )}
            </div>
            <Badge variant={config.variant} size="sm">
              <StatusIcon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          </div>

          {/* Description */}
          {project.description && (
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
              {project.description}
            </p>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {/* Dates */}
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(project.start_date)} - {formatDate(project.end_date)}
              </span>
            </div>

            {/* Manager */}
            {project.primary_manager_name && (
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <User className="h-4 w-4" />
                <span className="truncate">{project.primary_manager_name}</span>
              </div>
            )}
          </div>

          {/* Budget */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <DollarSign className="h-4 w-4" />
                <span>Budget</span>
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatCurrency(project.spent_amount || 0)} / {formatCurrency(project.budget)}
              </div>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all',
                  budgetUsedPercent > 90
                    ? 'bg-red-500 dark:bg-red-400'
                    : budgetUsedPercent > 70
                    ? 'bg-yellow-500 dark:bg-yellow-400'
                    : 'bg-green-500 dark:bg-green-400'
                )}
                style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {budgetUsedPercent.toFixed(0)}% used
            </p>
          </div>

          {/* Billable Badge */}
          {project.is_billable && (
            <Badge variant="success" size="sm">
              Billable
            </Badge>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" size="sm" onClick={() => onView(project)} fullWidth>
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onEdit(project)} fullWidth>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(project.id)}
              className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
