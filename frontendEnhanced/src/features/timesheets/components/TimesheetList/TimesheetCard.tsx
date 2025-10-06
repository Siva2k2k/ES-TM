/**
 * Timesheet Card Component
 * Individual timesheet item in list view
 * Cognitive Complexity: 4
 */
import React from 'react';
import { Clock, Calendar, CheckCircle, XCircle, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { Card, Badge, Button } from '../../../../shared/components/ui';
import { Timesheet } from '../../types';
import { cn } from '../../../../shared/utils/cn';

interface TimesheetCardProps {
  timesheet: Timesheet;
  onEdit?: (timesheet: Timesheet) => void;
  onDelete?: (timesheet: Timesheet) => void;
  onView?: (timesheet: Timesheet) => void;
}

const statusConfig = {
  draft: { variant: 'gray' as const, icon: Edit, label: 'Draft' },
  submitted: { variant: 'warning' as const, icon: Clock, label: 'Submitted' },
  approved: { variant: 'success' as const, icon: CheckCircle, label: 'Approved' },
  rejected: { variant: 'error' as const, icon: XCircle, label: 'Rejected' },
  frozen: { variant: 'info' as const, icon: AlertCircle, label: 'Frozen' },
};

export const TimesheetCard: React.FC<TimesheetCardProps> = ({
  timesheet,
  onEdit,
  onDelete,
  onView,
}) => {
  const config = statusConfig[timesheet.status];
  const Icon = config.icon;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const canEdit = timesheet.status === 'draft' || timesheet.status === 'rejected';

  return (
    <Card
      padding="md"
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onView?.(timesheet)}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left Side - Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Week of {formatDate(timesheet.week_start_date)}
            </h3>
            <Badge variant={config.variant} size="sm">
              <Icon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {timesheet.total_hours}h total
            </span>
            <span className={cn(
              'font-medium',
              timesheet.billable_hours > 0 && 'text-green-600 dark:text-green-400'
            )}>
              {timesheet.billable_hours}h billable
            </span>
            <span>{timesheet.entries.length} entries</span>
          </div>

          {timesheet.submitted_at && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Submitted {formatDate(timesheet.submitted_at)}
            </p>
          )}

          {timesheet.rejection_reason && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-800 dark:text-red-200">
              <p className="font-medium">Rejection Reason:</p>
              <p>{timesheet.rejection_reason}</p>
            </div>
          )}
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {canEdit && onEdit && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Edit className="h-4 w-4" />}
              onClick={() => onEdit(timesheet)}
            >
              Edit
            </Button>
          )}
          {timesheet.status === 'draft' && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(timesheet)}
            >
              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
