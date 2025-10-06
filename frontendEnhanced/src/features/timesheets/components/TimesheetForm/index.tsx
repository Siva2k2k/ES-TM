/**
 * Timesheet Form Component
 * Form for creating/editing timesheets
 * Cognitive Complexity: 7
 * File Size: ~180 LOC
 */
import React, { useState, useEffect } from 'react';
import { Plus, Save, Send, Calendar, Clock, DollarSign } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../../../../shared/components/ui';
import { useTimesheetForm } from '../../hooks';
import { TimeEntryRow } from './TimeEntryRow';
import { cn } from '../../../../shared/utils/cn';

interface TimesheetFormProps {
  timesheetId?: string;
  weekStartDate: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Mock projects - TODO: Replace with actual API call
const mockProjects = [
  { id: '1', name: 'Website Redesign' },
  { id: '2', name: 'Mobile App Development' },
  { id: '3', name: 'API Integration' },
  { id: '4', name: 'Database Migration' },
];

export const TimesheetForm: React.FC<TimesheetFormProps> = ({
  timesheetId,
  weekStartDate,
  onSuccess,
  onCancel,
}) => {
  const {
    entries,
    addEntry,
    updateEntry,
    removeEntry,
    totalHours,
    billableHours,
    isSubmitting,
    error,
    saveAsDraft,
    submitForApproval,
    validateForm,
  } = useTimesheetForm({ timesheetId, weekStartDate, onSuccess });

  const [showValidation, setShowValidation] = useState(false);

  const handleAddEntry = () => {
    const today = new Date().toISOString().split('T')[0];
    addEntry({
      project_id: '',
      date: today,
      hours: 0,
      description: '',
      is_billable: false,
    });
  };

  const handleSaveDraft = async () => {
    setShowValidation(true);
    if (validateForm()) {
      try {
        await saveAsDraft();
      } catch (err) {
        // Error handled by hook
      }
    }
  };

  const handleSubmit = async () => {
    setShowValidation(true);
    if (validateForm()) {
      try {
        await submitForApproval();
      } catch (err) {
        // Error handled by hook
      }
    }
  };

  const getWeekEndDate = () => {
    const start = new Date(weekStartDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return end.toISOString().split('T')[0];
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const nonBillableHours = totalHours - billableHours;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {timesheetId ? 'Edit Timesheet' : 'New Timesheet'}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                <span>
                  Week of {formatDate(weekStartDate)} - {formatDate(getWeekEndDate())}
                </span>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Total Hours</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {totalHours.toFixed(1)}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Billable</span>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {billableHours.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error Message */}
      {showValidation && error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Time Entries */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Time Entries</CardTitle>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={handleAddEntry}
            >
              Add Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No time entries yet. Add your first entry to get started.
              </p>
              <Button variant="primary" onClick={handleAddEntry}>
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-3 px-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                <div className="col-span-2 text-xs font-medium text-gray-500 dark:text-gray-400">Date</div>
                <div className="col-span-3 text-xs font-medium text-gray-500 dark:text-gray-400">Project</div>
                <div className="col-span-2 text-xs font-medium text-gray-500 dark:text-gray-400">Hours</div>
                <div className="col-span-3 text-xs font-medium text-gray-500 dark:text-gray-400">Description</div>
                <div className="col-span-1 text-xs font-medium text-gray-500 dark:text-gray-400 text-center">Billable</div>
                <div className="col-span-1"></div>
              </div>

              {/* Entry Rows */}
              {entries.map((entry) => (
                <TimeEntryRow
                  key={entry.id}
                  entry={entry}
                  projects={mockProjects}
                  onUpdate={updateEntry}
                  onRemove={removeEntry}
                />
              ))}

              {/* Summary Row */}
              <div className="grid grid-cols-12 gap-3 px-3 pt-3 border-t border-gray-200 dark:border-gray-700 font-medium">
                <div className="col-span-2"></div>
                <div className="col-span-3 text-gray-900 dark:text-gray-100">Total</div>
                <div className="col-span-2 text-gray-900 dark:text-gray-100">
                  {totalHours.toFixed(1)}h
                </div>
                <div className="col-span-3 flex gap-2">
                  <Badge variant="success" size="sm">
                    {billableHours.toFixed(1)}h billable
                  </Badge>
                  {nonBillableHours > 0 && (
                    <Badge variant="gray" size="sm">
                      {nonBillableHours.toFixed(1)}h non-billable
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                leftIcon={<Save className="h-4 w-4" />}
                onClick={handleSaveDraft}
                disabled={isSubmitting || entries.length === 0}
              >
                Save Draft
              </Button>
              <Button
                variant="primary"
                leftIcon={<Send className="h-4 w-4" />}
                onClick={handleSubmit}
                loading={isSubmitting}
                disabled={entries.length === 0}
              >
                Submit for Approval
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
