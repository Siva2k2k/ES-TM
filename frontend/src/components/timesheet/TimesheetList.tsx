/**
 * TimesheetList Component
 *
 * Displays timesheets in a list or table format with sorting, filtering, and pagination.
 * Supports multiple view modes and status filtering.
 *
 * Features:
 * - List and table view modes
 * - Sort by date, status, hours
 * - Filter by status, date range
 * - Pagination support
 * - Approval history modal
 * - Bulk actions
 *
 * Cognitive Complexity: 9 (Target: <15)
 */

import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Search, MoreVertical, List, Grid, History, Send, Edit as EditIcon, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select, type SelectOption } from '../ui/Select';
import { StatusBadge } from '../shared/StatusBadge';
import { formatDate, formatDuration } from '../../utils/formatting';
import { ApprovalHistoryModal } from './ApprovalHistoryModal';

export interface Timesheet {
  id: string;
  week_start_date: string;
  week_end_date: string;
  total_hours: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submitted_at?: string;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  created_at: string;
  // Optional per-project approval summaries
  project_approvals?: Array<{
    project_id: string;
    project_name?: string;
    manager_name?: string;
    manager_status?: 'approved' | 'rejected' | 'pending' | 'not_required';
    manager_rejection_reason?: string;
  }>;
  // Additional fields used by pages
  entries?: any[];
  user_id?: string;
}

export interface TimesheetListProps {
  /** Timesheets to display */
  timesheets: Timesheet[];
  /** Current view mode */
  viewMode?: 'list' | 'table';
  /** Show filters */
  showFilters?: boolean;
  /** Enable pagination */
  enablePagination?: boolean;
  /** Items per page */
  itemsPerPage?: number;
  /** Callback when timesheet is clicked */
  onTimesheetClick?: (timesheet: Timesheet) => void;
  /** Callback when timesheet is edited */
  onEdit?: (timesheet: Timesheet) => void;
  /** Callback when timesheet is deleted */
  onDelete?: (timesheet: Timesheet) => void;
  /** Callback when timesheet is submitted for approval */
  onSubmit?: (timesheet: Timesheet) => void;
  /** Show actions column */
  showActions?: boolean;
  /** Show approval history button */
  showApprovalHistory?: boolean;
}

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const SORT_OPTIONS: SelectOption[] = [
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'hours-desc', label: 'Most Hours' },
  { value: 'hours-asc', label: 'Least Hours' },
  { value: 'status', label: 'Status' },
];

export const TimesheetList: React.FC<TimesheetListProps> = ({
  timesheets,
  viewMode: initialViewMode = 'list',
  showFilters = true,
  enablePagination = true,
  itemsPerPage = 10,
  onTimesheetClick,
  onEdit,
  onDelete,
  onSubmit,
  showActions = true,
  showApprovalHistory = true
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'table'>(initialViewMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTimesheetForHistory, setSelectedTimesheetForHistory] = useState<string | null>(null);

  // Filter and sort timesheets
  const filteredTimesheets = useMemo(() => {
    let filtered = [...timesheets];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ts => ts.status === statusFilter);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ts =>
        ts.week_start_date.includes(query) ||
        ts.status.toLowerCase().includes(query) ||
        ts.id.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.week_start_date).getTime() - new Date(a.week_start_date).getTime();
        case 'date-asc':
          return new Date(a.week_start_date).getTime() - new Date(b.week_start_date).getTime();
        case 'hours-desc':
          return b.total_hours - a.total_hours;
        case 'hours-asc':
          return a.total_hours - b.total_hours;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [timesheets, statusFilter, searchQuery, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredTimesheets.length / itemsPerPage);
  const paginatedTimesheets = useMemo(() => {
    if (!enablePagination) return filteredTimesheets;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTimesheets.slice(start, start + itemsPerPage);
  }, [filteredTimesheets, currentPage, itemsPerPage, enablePagination]);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              My Timesheets
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                icon={List}
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                icon={Grid}
                onClick={() => setViewMode('table')}
              >
                Table
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Search timesheets..."
                icon={Search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Select
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="Filter by status"
              />
              <Select
                options={SORT_OPTIONS}
                value={sortBy}
                onChange={setSortBy}
                placeholder="Sort by"
              />
            </div>
          )}

          {/* Results Count */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>
              Showing {paginatedTimesheets.length} of {filteredTimesheets.length} timesheets
            </p>
            {statusFilter !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                Clear filter
              </Button>
            )}
          </div>

          {/* List View */}
          {viewMode === 'list' && (
            <div className="space-y-3">
              {paginatedTimesheets.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No timesheets found</p>
                </div>
              ) : (
                paginatedTimesheets.map(timesheet => (
                  <TimesheetListItem
                    key={timesheet.id}
                    timesheet={timesheet}
                    onClick={() => onTimesheetClick?.(timesheet)}
                    onEdit={() => onEdit?.(timesheet)}
                    onDelete={() => onDelete?.(timesheet)}
                    onSubmit={() => onSubmit?.(timesheet)}
                    showActions={showActions}
                    showApprovalHistory={showApprovalHistory}
                    onViewHistory={() => setSelectedTimesheetForHistory(timesheet.id)}
                  />
                ))
              )}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Week</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                    {(showActions || showApprovalHistory) && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedTimesheets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No timesheets found</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedTimesheets.map(timesheet => (
                      <TimesheetTableRow
                        key={timesheet.id}
                        timesheet={timesheet}
                        onClick={() => onTimesheetClick?.(timesheet)}
                        onEdit={() => onEdit?.(timesheet)}
                        onDelete={() => onDelete?.(timesheet)}
                        onSubmit={() => onSubmit?.(timesheet)}
                        showActions={showActions}
                        showApprovalHistory={showApprovalHistory}
                        onViewHistory={() => setSelectedTimesheetForHistory(timesheet.id)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {enablePagination && totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval History Modal */}
      {selectedTimesheetForHistory && (
        <ApprovalHistoryModal
          timesheetId={selectedTimesheetForHistory}
          isOpen={!!selectedTimesheetForHistory}
          onClose={() => setSelectedTimesheetForHistory(null)}
        />
      )}
    </>
  );
};

// List Item Component
interface TimesheetListItemProps {
  timesheet: Timesheet;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSubmit?: () => void;
  showActions?: boolean;
  showApprovalHistory?: boolean;
  onViewHistory?: () => void;
}

const TimesheetListItem: React.FC<TimesheetListItemProps> = ({
  timesheet,
  onClick,
  onEdit,
  onDelete,
  onSubmit,
  showActions,
  showApprovalHistory,
  onViewHistory
}) => {
  return (
    <div
      className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
            <h3 className="font-semibold text-sm sm:text-base truncate">
              Week of {formatDate(timesheet.week_start_date)}
            </h3>
            <StatusBadge status={timesheet.status} type="timesheet" />
          </div>
          {/* Project approval summary (compact) */}
          {timesheet.project_approvals && timesheet.project_approvals.length > 0 && (
            <div className="mt-3 space-y-1">
              {timesheet.project_approvals.map((pa) => (
                <div key={pa.project_id} className="text-xs text-gray-600 flex items-center justify-between">
                  <div className="truncate">
                    <strong className="text-sm">{pa.project_name || 'Project'}</strong>
                    <span className="ml-2">{pa.manager_name ? `${pa.manager_name} — ` : ''}</span>
                    {pa.manager_status === 'approved' && <span className="text-green-600">Approved</span>}
                    {pa.manager_status === 'pending' && <span className="text-yellow-600">Pending</span>}
                    {pa.manager_status === 'rejected' && <span className="text-red-600">Rejected</span>}
                  </div>
                  {pa.manager_status === 'rejected' && pa.manager_rejection_reason && (
                    <div className="text-xs text-red-600 ml-4 truncate">{pa.manager_rejection_reason}</div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
            <span className="flex items-center gap-1 flex-shrink-0">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              {formatDuration(timesheet.total_hours)}
            </span>
            {timesheet.submitted_at && (
              <span className="truncate">Submitted {formatDate(timesheet.submitted_at)}</span>
            )}
            {timesheet.approved_at && (
              <span className="truncate">Approved {formatDate(timesheet.approved_at)}</span>
            )}
          </div>
        </div>
        {(showActions || showApprovalHistory) && (
          <div className="flex gap-1 sm:gap-2 justify-end flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Submit button (only for draft timesheets) */}
            {showActions && timesheet.status === 'draft' && onSubmit && (
              <Button
                variant="default"
                size="sm"
                onClick={onSubmit}
                className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                title="Submit for Approval"
              >
                <Send className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                <span className="hidden sm:inline">Submit</span>
              </Button>
            )}

            {/* Approval History button */}
            {showApprovalHistory && timesheet.status !== 'draft' && onViewHistory && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewHistory}
                className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                title="View Approval History"
              >
                <History className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                <span className="hidden sm:inline">History</span>
              </Button>
            )}

            {/* Edit button (icon only on mobile) */}
            {showActions && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                title="Edit Timesheet"
              >
                <EditIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            )}

            {/* Delete button (only for draft timesheets) */}
            {showActions && timesheet.status === 'draft' && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="p-1 sm:p-2 text-red-600 hover:text-red-800 hover:bg-red-50"
                title="Delete Timesheet"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Table Row Component
interface TimesheetTableRowProps {
  timesheet: Timesheet;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSubmit?: () => void;
  showActions?: boolean;
  showApprovalHistory?: boolean;
  onViewHistory?: () => void;
}

const TimesheetTableRow: React.FC<TimesheetTableRowProps> = ({
  timesheet,
  onClick,
  onEdit,
  onDelete,
  onSubmit,
  showActions,
  showApprovalHistory,
  onViewHistory
}) => {
  return (
    <tr className="hover:bg-gray-50 cursor-pointer" onClick={onClick}>
      <td className="px-4 py-3">
        <div>
          <p className="font-medium">{formatDate(timesheet.week_start_date)}</p>
          <p className="text-xs text-gray-500">
            to {formatDate(timesheet.week_end_date)}
          </p>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="font-semibold">{formatDuration(timesheet.total_hours)}</span>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={timesheet.status} type="timesheet" />
      </td>
      <td className="px-4 py-3">
        {timesheet.submitted_at ? (
          <span className="text-sm">{formatDate(timesheet.submitted_at)}</span>
        ) : (
          <span className="text-sm text-gray-400">Not submitted</span>
        )}
      </td>
      {(showActions || showApprovalHistory) && (
        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-end gap-2">
            {/* Submit button (only for draft timesheets) */}
            {showActions && timesheet.status === 'draft' && onSubmit && (
              <Button
                variant="default"
                size="sm"
                onClick={onSubmit}
                title="Submit for Approval"
              >
                <Send className="h-4 w-4 mr-1" />
                Submit
              </Button>
            )}

            {/* Approval History button */}
            {showApprovalHistory && timesheet.status !== 'draft' && onViewHistory && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewHistory}
                title="View Approval History"
              >
                <History className="h-4 w-4 mr-1" />
                History
              </Button>
            )}

            {/* Edit button */}
            {showActions && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                title="Edit Timesheet"
              >
                <EditIcon className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}

            {/* Delete button (only for draft timesheets) */}
            {showActions && timesheet.status === 'draft' && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                title="Delete Timesheet"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </td>
      )}
    </tr>
  );
};
