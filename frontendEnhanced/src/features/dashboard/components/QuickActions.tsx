/**
 * Quick Actions Component
 * Common action buttons for dashboard
 * Cognitive Complexity: 1
 */
import React from 'react';
import { Plus, FileText, Clock, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../shared/components/ui';
import { Button } from '../../../shared/components/ui';

export interface QuickActionsProps {
  onNewTimesheet?: () => void;
  onNewProject?: () => void;
  onNewReport?: () => void;
  onViewTeam?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onNewTimesheet,
  onNewProject,
  onNewReport,
  onViewTeam,
}) => {
  const actions = [
    {
      label: 'New Timesheet',
      icon: Clock,
      onClick: onNewTimesheet,
      variant: 'primary' as const,
    },
    {
      label: 'New Project',
      icon: Plus,
      onClick: onNewProject,
      variant: 'secondary' as const,
    },
    {
      label: 'Generate Report',
      icon: FileText,
      onClick: onNewReport,
      variant: 'outline' as const,
    },
    {
      label: 'View Team',
      icon: Users,
      onClick: onViewTeam,
      variant: 'outline' as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              size="md"
              leftIcon={<action.icon className="h-4 w-4" />}
              onClick={action.onClick}
              className="w-full"
            >
              <span className="hidden lg:inline">{action.label}</span>
              <span className="lg:hidden">{action.label.split(' ')[0]}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
