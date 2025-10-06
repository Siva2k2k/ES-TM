/**
 * Timesheet Filters Component
 * Filter controls for timesheet list
 * Cognitive Complexity: 2
 */
import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Input, Badge } from '../../../../shared/components/ui';
import { TimesheetFilters as Filters, TimesheetStatus } from '../../types';

interface TimesheetFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  stats?: {
    total: number;
    draft: number;
    submitted: number;
    approved: number;
    rejected: number;
  };
}

const statusOptions: { value: TimesheetStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'frozen', label: 'Frozen' },
];

export const TimesheetFilters: React.FC<TimesheetFiltersProps> = ({
  filters,
  onFiltersChange,
  stats,
}) => {
  return (
    <div className="space-y-4">
      {/* Status Badges */}
      {stats && (
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={filters.status === 'all' ? 'primary' : 'gray'}
            className="cursor-pointer"
            onClick={() => onFiltersChange({ ...filters, status: 'all' })}
          >
            All ({stats.total})
          </Badge>
          <Badge
            variant={filters.status === 'draft' ? 'primary' : 'gray'}
            className="cursor-pointer"
            onClick={() => onFiltersChange({ ...filters, status: 'draft' })}
          >
            Draft ({stats.draft})
          </Badge>
          <Badge
            variant={filters.status === 'submitted' ? 'warning' : 'gray'}
            className="cursor-pointer"
            onClick={() => onFiltersChange({ ...filters, status: 'submitted' })}
          >
            Submitted ({stats.submitted})
          </Badge>
          <Badge
            variant={filters.status === 'approved' ? 'success' : 'gray'}
            className="cursor-pointer"
            onClick={() => onFiltersChange({ ...filters, status: 'approved' })}
          >
            Approved ({stats.approved})
          </Badge>
          <Badge
            variant={filters.status === 'rejected' ? 'error' : 'gray'}
            className="cursor-pointer"
            onClick={() => onFiltersChange({ ...filters, status: 'rejected' })}
          >
            Rejected ({stats.rejected})
          </Badge>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Input
            placeholder="Search timesheets..."
            value={filters.searchQuery || ''}
            onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>

        <select
          value={filters.status || 'all'}
          onChange={(e) =>
            onFiltersChange({ ...filters, status: e.target.value as TimesheetStatus | 'all' })
          }
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
