/**
 * ApprovalStatusBadges Component
 * Displays tier-based approval status badges (Lead, Manager, Management)
 * Shows different badges based on viewer role and approval path
 */

import React from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import type { ProjectWeekUser } from '../../../types/timesheetApprovals';

interface ApprovalStatusBadgesProps {
  user: ProjectWeekUser;
  approvalRole: 'lead' | 'manager' | 'management';
  showApprovalPath?: boolean;
}

export const ApprovalStatusBadges: React.FC<ApprovalStatusBadgesProps> = ({
  user,
  approvalRole,
  showApprovalPath = false
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-3 h-3" />;
      case 'rejected':
        return <XCircle className="w-3 h-3" />;
      case 'pending':
        return <Clock className="w-3 h-3" />;
      case 'not_required':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'not_required':
        return 'bg-gray-100 text-gray-600 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_required':
        return 'Bypassed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Determine which statuses to show based on viewer role and timesheet status
  const renderBadges = () => {
    const badges: JSX.Element[] = [];

    // TIER 1: LEAD (only show for Manager and Management viewers)
    if (approvalRole === 'manager' || approvalRole === 'management') {
      // Check if lead approval was required
      const leadStatus = user.approval_status; // This will be lead_status for managers
      const isLeadBypassed = user.timesheet_status === 'submitted' && user.user_role === 'employee';

      if (!isLeadBypassed) {
        badges.push(
          <div
            key="lead"
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${getStatusClasses(leadStatus)}`}
          >
            {getStatusIcon(leadStatus)}
            <span>Lead: {getStatusLabel(leadStatus)}</span>
          </div>
        );
      } else {
        badges.push(
          <div
            key="lead"
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${getStatusClasses('not_required')}`}
          >
            {getStatusIcon('not_required')}
            <span>Lead: Bypassed</span>
          </div>
        );
      }
    }

    // Arrow separator (if showing path and has lead badge)
    if (showApprovalPath && badges.length > 0) {
      badges.push(
        <ArrowRight key="arrow1" className="w-3 h-3 text-gray-400" />
      );
    }

    // TIER 2: MANAGER (only show for Management viewers)
    if (approvalRole === 'management') {
      const managerStatus = user.approval_status; // This will be manager_status for management
      badges.push(
        <div
          key="manager"
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${getStatusClasses(managerStatus)}`}
        >
          {getStatusIcon(managerStatus)}
          <span>Manager: {getStatusLabel(managerStatus)}</span>
        </div>
      );

      if (showApprovalPath) {
        badges.push(
          <ArrowRight key="arrow2" className="w-3 h-3 text-gray-400" />
        );
      }
    }

    // Current tier status (always show the viewer's tier)
    let currentTierLabel = '';
    let currentStatus = user.approval_status;

    if (approvalRole === 'lead') {
      currentTierLabel = 'Lead Review';
    } else if (approvalRole === 'manager') {
      currentTierLabel = 'Manager Review';
    } else if (approvalRole === 'management') {
      currentTierLabel = 'Management Review';
    }

    // Only show current tier badge if we haven't already shown it
    if (approvalRole === 'lead' || approvalRole === 'manager') {
      badges.push(
        <div
          key="current"
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${getStatusClasses(currentStatus)}`}
        >
          {getStatusIcon(currentStatus)}
          <span>{currentTierLabel}: {getStatusLabel(currentStatus)}</span>
        </div>
      );
    }

    return badges;
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {renderBadges()}
    </div>
  );
};
