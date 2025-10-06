/**
 * useTimesheetList Hook
 * Manages timesheet list state and operations
 * Cognitive Complexity: 6
 */
import { useState, useEffect, useCallback } from 'react';
import { timesheetService } from '../services';
import { Timesheet, TimesheetFilters } from '../types';

interface UseTimesheetListReturn {
  timesheets: Timesheet[];
  filteredTimesheets: Timesheet[];
  isLoading: boolean;
  error: string | null;
  filters: TimesheetFilters;
  setFilters: (filters: TimesheetFilters) => void;
  refreshTimesheets: () => Promise<void>;
  deleteTimesheet: (id: string) => Promise<void>;
}

export const useTimesheetList = (): UseTimesheetListReturn => {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [filteredTimesheets, setFilteredTimesheets] = useState<Timesheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TimesheetFilters>({ status: 'all' });

  const loadTimesheets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await timesheetService.getMyTimesheets();
      setTimesheets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timesheets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...timesheets];

    // Status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(ts => ts.status === filters.status);
    }

    // Date range filter
    if (filters.startDate) {
      filtered = filtered.filter(ts => ts.week_start_date >= filters.startDate!);
    }
    if (filters.endDate) {
      filtered = filtered.filter(ts => ts.week_end_date <= filters.endDate!);
    }

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(ts =>
        ts.week_start_date.includes(query) ||
        ts.status.toLowerCase().includes(query)
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) =>
      new Date(b.week_start_date).getTime() - new Date(a.week_start_date).getTime()
    );

    setFilteredTimesheets(filtered);
  }, [timesheets, filters]);

  useEffect(() => {
    loadTimesheets();
  }, [loadTimesheets]);

  const deleteTimesheet = async (id: string) => {
    try {
      await timesheetService.deleteTimesheet(id);
      setTimesheets(prev => prev.filter(ts => ts.id !== id));
    } catch (err) {
      throw new Error('Failed to delete timesheet');
    }
  };

  return {
    timesheets,
    filteredTimesheets,
    isLoading,
    error,
    filters,
    setFilters,
    refreshTimesheets: loadTimesheets,
    deleteTimesheet,
  };
};
