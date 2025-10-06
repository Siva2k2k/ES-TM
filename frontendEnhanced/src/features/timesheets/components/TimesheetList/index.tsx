/**
 * Timesheet List Component
 * Main list view for timesheets
 * Cognitive Complexity: 5
 * File Size: ~150 LOC
 */
import React from 'react';
import { Plus, FileText, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../../../../shared/components/ui';
import { useTimesheetList } from '../../hooks';
import { TimesheetCard } from './TimesheetCard';
import { TimesheetFilters } from './TimesheetFilters';
import { Timesheet } from '../../types';

interface TimesheetListProps {
  onNewTimesheet?: () => void;
  onEditTimesheet?: (timesheet: Timesheet) => void;
  onViewTimesheet?: (timesheet: Timesheet) => void;
}

export const TimesheetList: React.FC<TimesheetListProps> = ({
  onNewTimesheet,
  onEditTimesheet,
  onViewTimesheet,
}) => {
  const {
    timesheets,
    filteredTimesheets,
    isLoading,
    error,
    filters,
    setFilters,
    refreshTimesheets,
    deleteTimesheet,
  } = useTimesheetList();

  const stats = {
    total: timesheets.length,
    draft: timesheets.filter((ts) => ts.status === 'draft').length,
    submitted: timesheets.filter((ts) => ts.status === 'submitted').length,
    approved: timesheets.filter((ts) => ts.status === 'approved').length,
    rejected: timesheets.filter((ts) => ts.status === 'rejected').length,
  };

  const handleDelete = async (timesheet: Timesheet) => {
    if (window.confirm('Are you sure you want to delete this timesheet?')) {
      try {
        await deleteTimesheet(timesheet.id);
      } catch (err) {
        alert('Failed to delete timesheet');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Card padding="lg" variant="elevated">
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button variant="primary" onClick={refreshTimesheets}>
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Timesheets</CardTitle>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={onNewTimesheet}
            >
              New Timesheet
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all your timesheet submissions and track approval status
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card padding="md">
        <TimesheetFilters filters={filters} onFiltersChange={setFilters} stats={stats} />
      </Card>

      {/* List */}
      <div className="space-y-4">
        {filteredTimesheets.length === 0 ? (
          <Card padding="lg" variant="elevated">
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No timesheets found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {filters.status !== 'all' || filters.searchQuery
                  ? 'Try adjusting your filters'
                  : 'Create your first timesheet to get started'}
              </p>
              <Button variant="primary" onClick={onNewTimesheet}>
                Create Timesheet
              </Button>
            </div>
          </Card>
        ) : (
          filteredTimesheets.map((timesheet) => (
            <TimesheetCard
              key={timesheet.id}
              timesheet={timesheet}
              onEdit={onEditTimesheet}
              onDelete={handleDelete}
              onView={onViewTimesheet}
            />
          ))
        )}
      </div>

      {/* Results Count */}
      {filteredTimesheets.length > 0 && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredTimesheets.length} of {timesheets.length} timesheets
        </div>
      )}
    </div>
  );
};
