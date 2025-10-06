/**
 * Timesheet Status Component
 * Displays approval status and workflow
 * Cognitive Complexity: 5
 * File Size: ~155 LOC
 */
import React from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  AlertCircle,
  User,
  MessageSquare,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '../../../../shared/components/ui';
import { Timesheet, TimesheetStatus as Status } from '../../types';
import { cn } from '../../../../shared/utils/cn';

interface TimesheetStatusProps {
  timesheet: Timesheet;
  onApprove?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
  canApprove?: boolean;
}

const statusConfig = {
  draft: {
    icon: Edit,
    label: 'Draft',
    variant: 'gray' as const,
    description: 'This timesheet is still being edited',
  },
  submitted: {
    icon: Clock,
    label: 'Pending Approval',
    variant: 'warning' as const,
    description: 'Waiting for manager review',
  },
  approved: {
    icon: CheckCircle,
    label: 'Approved',
    variant: 'success' as const,
    description: 'This timesheet has been approved',
  },
  rejected: {
    icon: XCircle,
    label: 'Rejected',
    variant: 'error' as const,
    description: 'This timesheet needs revision',
  },
  frozen: {
    icon: AlertCircle,
    label: 'Frozen',
    variant: 'info' as const,
    description: 'This timesheet is locked for billing',
  },
};

export const TimesheetStatus: React.FC<TimesheetStatusProps> = ({
  timesheet,
  onApprove,
  onReject,
  onEdit,
  canApprove = false,
}) => {
  const config = statusConfig[timesheet.status];
  const StatusIcon = config.icon;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status & Approval</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'p-2 rounded-lg',
              timesheet.status === 'approved' && 'bg-green-100 dark:bg-green-900/20',
              timesheet.status === 'rejected' && 'bg-red-100 dark:bg-red-900/20',
              timesheet.status === 'submitted' && 'bg-yellow-100 dark:bg-yellow-900/20',
              timesheet.status === 'draft' && 'bg-gray-100 dark:bg-gray-800',
              timesheet.status === 'frozen' && 'bg-blue-100 dark:bg-blue-900/20'
            )}
          >
            <StatusIcon
              className={cn(
                'h-5 w-5',
                timesheet.status === 'approved' && 'text-green-600 dark:text-green-400',
                timesheet.status === 'rejected' && 'text-red-600 dark:text-red-400',
                timesheet.status === 'submitted' && 'text-yellow-600 dark:text-yellow-400',
                timesheet.status === 'draft' && 'text-gray-600 dark:text-gray-400',
                timesheet.status === 'frozen' && 'text-blue-600 dark:text-blue-400'
              )}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={config.variant}>{config.label}</Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{config.description}</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
          {/* Submitted */}
          {timesheet.submitted_at && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Submitted
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {formatDate(timesheet.submitted_at)}
                </p>
              </div>
            </div>
          )}

          {/* Approved/Rejected */}
          {timesheet.reviewed_at && (
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  timesheet.status === 'approved'
                    ? 'bg-green-100 dark:bg-green-900/20'
                    : 'bg-red-100 dark:bg-red-900/20'
                )}
              >
                {timesheet.status === 'approved' ? (
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {timesheet.status === 'approved' ? 'Approved' : 'Rejected'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {formatDate(timesheet.reviewed_at)}
                </p>
                {timesheet.reviewed_by_name && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-600 dark:text-gray-400">
                    <User className="h-3 w-3" />
                    <span>{timesheet.reviewed_by_name}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Rejection Reason / Comments */}
        {timesheet.rejection_reason && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-start gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-gray-600 dark:text-gray-400 mt-0.5" />
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Feedback
              </p>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              {timesheet.rejection_reason}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {canApprove && timesheet.status === 'submitted' && (
          <div className="flex items-center gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
            <Button variant="primary" onClick={onApprove} fullWidth>
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button variant="outline" onClick={onReject} fullWidth>
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        )}

        {timesheet.status === 'draft' && onEdit && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <Button variant="primary" onClick={onEdit} fullWidth>
              <Edit className="h-4 w-4 mr-2" />
              Continue Editing
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
