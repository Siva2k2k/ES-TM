import React from 'react';
import type { Project, User } from '../../../types';

type BillingPeriod = 'weekly' | 'monthly';
type BillingFilterType = 'project' | 'employee';

interface BillingFiltersProps {
  period: BillingPeriod;
  filterType: BillingFilterType;
  onPeriodChange: (period: BillingPeriod) => void;
  onFilterTypeChange: (type: BillingFilterType) => void;
  projects: Project[];
  users: User[];
  selectedProjectId?: string;
  selectedUserId?: string;
  onProjectChange: (projectId?: string) => void;
  onUserChange: (userId?: string) => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
  loading?: boolean;
}

export function BillingFilters({
  period,
  filterType,
  onPeriodChange,
  onFilterTypeChange,
  projects,
  users,
  selectedProjectId,
  selectedUserId,
  onProjectChange,
  onUserChange,
  dateRange,
  onDateRangeChange,
  loading = false
}: BillingFiltersProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Period
          </label>
          <select
            value={period}
            onChange={(event) => onPeriodChange(event.target.value as BillingPeriod)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            disabled={loading}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Filter Type
          </label>
          <select
            value={filterType}
            onChange={(event) => onFilterTypeChange(event.target.value as BillingFilterType)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            disabled={loading}
          >
            <option value="project">Project</option>
            <option value="employee">Employee</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Start Date
          </label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(event) => onDateRangeChange({ start: event.target.value, end: dateRange.end })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            End Date
          </label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(event) => onDateRangeChange({ start: dateRange.start, end: event.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            disabled={loading}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {filterType === 'project' ? (
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              Project
            </label>
            <select
              value={selectedProjectId ?? ''}
              onChange={(event) => onProjectChange(event.target.value || undefined)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              disabled={loading}
            >
              <option value="">All projects</option>
              {projects.map((project) => (
                <option key={project._id ?? project.id} value={project._id ?? project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              Employee
            </label>
            <select
              value={selectedUserId ?? ''}
              onChange={(event) => onUserChange(event.target.value || undefined)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              disabled={loading}
            >
              <option value="">All employees</option>
              {users.map((user) => (
                <option key={user._id ?? user.id} value={user._id ?? user.id}>
                  {'full_name' in user && user.full_name
                    ? user.full_name
                    : `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </section>
  );
}
