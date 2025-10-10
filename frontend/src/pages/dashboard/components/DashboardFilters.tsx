import React, { useState } from 'react';
import { Calendar, Filter, X } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface DateRange {
  start: string;
  end: string;
}

export interface DashboardFiltersState {
  dateRange: DateRange;
  projectIds?: string[];
  departmentId?: string;
  teamMemberId?: string;
}

interface DashboardFiltersProps {
  onFiltersChange: (filters: DashboardFiltersState) => void;
  showProjects?: boolean;
  showDepartments?: boolean;
  showTeamMembers?: boolean;
  projects?: Array<{ id: string; name: string }>;
  departments?: Array<{ id: string; name: string }>;
  teamMembers?: Array<{ id: string; name: string }>;
}

// ============================================================================
// QUICK PRESET DATES
// ============================================================================

const getPresetDates = (preset: string): DateRange => {
  const today = new Date();
  const start = new Date();

  switch (preset) {
    case 'today':
      return {
        start: today.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0],
      };
    case 'week':
      start.setDate(today.getDate() - 7);
      return {
        start: start.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0],
      };
    case 'month':
      start.setMonth(today.getMonth() - 1);
      return {
        start: start.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0],
      };
    case 'quarter':
      start.setMonth(today.getMonth() - 3);
      return {
        start: start.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0],
      };
    case 'year':
      start.setFullYear(today.getFullYear() - 1);
      return {
        start: start.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0],
      };
    default:
      return {
        start: start.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0],
      };
  }
};

// ============================================================================
// DASHBOARD FILTERS COMPONENT
// ============================================================================

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  onFiltersChange,
  showProjects = false,
  showDepartments = false,
  showTeamMembers = false,
  projects = [],
  departments = [],
  teamMembers = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<DashboardFiltersState>({
    dateRange: getPresetDates('month'),
    projectIds: [],
    departmentId: undefined,
    teamMemberId: undefined,
  });

  const handlePresetClick = (preset: string) => {
    const newDateRange = getPresetDates(preset);
    const newFilters = { ...filters, dateRange: newDateRange };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    const newDateRange = { ...filters.dateRange, [field]: value };
    const newFilters = { ...filters, dateRange: newDateRange };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleProjectToggle = (projectId: string) => {
    const currentProjects = filters.projectIds || [];
    const newProjects = currentProjects.includes(projectId)
      ? currentProjects.filter((id) => id !== projectId)
      : [...currentProjects, projectId];
    const newFilters = { ...filters, projectIds: newProjects };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    const defaultFilters: DashboardFiltersState = {
      dateRange: getPresetDates('month'),
      projectIds: [],
      departmentId: undefined,
      teamMemberId: undefined,
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const activeFiltersCount =
    (filters.projectIds?.length || 0) +
    (filters.departmentId ? 1 : 0) +
    (filters.teamMemberId ? 1 : 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-4 border border-transparent dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Date Presets */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <div className="flex space-x-1">
              {['today', 'week', 'month', 'quarter', 'year'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetClick(preset)}
                  className="px-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300
                    hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors capitalize"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="flex items-center space-x-2 border-l border-gray-300 dark:border-gray-600 pl-4">
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => handleDateChange('start', e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md
                bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500 dark:text-gray-400">to</span>
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => handleDateChange('end', e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md
                bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filter Toggle & Reset */}
        <div className="flex items-center space-x-2">
          {(showProjects || showDepartments || showTeamMembers) && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md
                bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300
                hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          )}

          {activeFiltersCount > 0 && (
            <button
              onClick={handleReset}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Reset Filters"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Projects Filter */}
          {showProjects && projects.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Projects
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {projects.map((project) => (
                  <label key={project.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.projectIds?.includes(project.id)}
                      onChange={() => handleProjectToggle(project.id)}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600
                        focus:ring-blue-500 dark:bg-gray-700"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{project.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Department Filter */}
          {showDepartments && departments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Department
              </label>
              <select
                value={filters.departmentId || ''}
                onChange={(e) => {
                  const newFilters = { ...filters, departmentId: e.target.value || undefined };
                  setFilters(newFilters);
                  onFiltersChange(newFilters);
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Team Member Filter */}
          {showTeamMembers && teamMembers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Team Member
              </label>
              <select
                value={filters.teamMemberId || ''}
                onChange={(e) => {
                  const newFilters = { ...filters, teamMemberId: e.target.value || undefined };
                  setFilters(newFilters);
                  onFiltersChange(newFilters);
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Team Members</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardFilters;
