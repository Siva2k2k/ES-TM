import React, { useEffect, useState } from 'react';
import { DefaulterService, type Defaulter } from '../../services/DefaulterService';

interface DefaulterListProps {
  projectId: string;
  weekStart: string;
  onValidationChange?: (canProceed: boolean, count: number) => void;
}

export const DefaulterList: React.FC<DefaulterListProps> = ({
  projectId,
  weekStart,
  onValidationChange
}) => {
  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingNotifications, setSendingNotifications] = useState(false);

  const loadDefaulters = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await DefaulterService.validateNoDefaulters(projectId, weekStart);

      if (result.error) {
        setError(result.error);
      } else {
        setDefaulters(result.defaulters);

        if (onValidationChange) {
          onValidationChange(result.can_proceed, result.defaulter_count);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load defaulters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDefaulters();
  }, [projectId, weekStart]);

  const handleSendReminders = async () => {
    setSendingNotifications(true);

    try {
      const result = await DefaulterService.notifyDefaulters(projectId, weekStart);

      if (result.success) {
        alert(`Reminder notifications sent to ${result.notification_count} team member${result.notification_count !== 1 ? 's' : ''}`);
      } else {
        alert(result.error || 'Failed to send notifications');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send notifications');
    } finally {
      setSendingNotifications(false);
    }
  };

  const getDaysOverdueColor = (days: number): string => {
    if (days === 0) return 'text-gray-600';
    if (days < 3) return 'text-yellow-600';
    if (days < 5) return 'text-orange-600';
    return 'text-red-600';
  };

  const getDaysOverdueLabel = (days: number): string => {
    if (days === 0) return 'Not overdue yet';
    if (days === 1) return '1 day overdue';
    return `${days} days overdue`;
  };

  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (defaulters.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-green-800 font-medium">All team members have submitted their timesheets</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="p-4 border-b border-yellow-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h4 className="text-yellow-900 font-semibold">
              {defaulters.length} Team Member{defaulters.length !== 1 ? 's' : ''} Pending Submission
            </h4>
          </div>
          <button
            onClick={handleSendReminders}
            disabled={sendingNotifications}
            className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 disabled:opacity-50"
          >
            {sendingNotifications ? 'Sending...' : 'Send Reminders'}
          </button>
        </div>
        <p className="text-yellow-700 text-sm mt-1">
          Approval/rejection is blocked until all members submit
        </p>
      </div>

      <div className="divide-y divide-yellow-200">
        {defaulters.map((defaulter) => (
          <div key={defaulter.user_id} className="p-4 hover:bg-yellow-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900">{defaulter.user_name}</p>
                {defaulter.user_email && (
                  <p className="text-sm text-gray-600">{defaulter.user_email}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Role: {defaulter.role}</p>
                {defaulter.last_submission_date && (
                  <p className="text-xs text-gray-500">
                    Last submission: {new Date(defaulter.last_submission_date).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${getDaysOverdueColor(defaulter.days_overdue)}`}>
                  {getDaysOverdueLabel(defaulter.days_overdue)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DefaulterList;
