/**
 * useTimesheetForm Hook
 * Manages timesheet form state and validation
 * Cognitive Complexity: 8
 */
import { useState, useCallback } from 'react';
import { timesheetService } from '../services';
import { TimeEntry, TimesheetFormData } from '../types';

interface UseTimesheetFormProps {
  timesheetId?: string;
  weekStartDate: string;
  onSuccess?: () => void;
}

interface UseTimesheetFormReturn {
  entries: TimeEntry[];
  addEntry: (entry: Omit<TimeEntry, 'id' | 'timesheet_id' | 'created_at' | 'updated_at'>) => void;
  updateEntry: (id: string, data: Partial<TimeEntry>) => void;
  removeEntry: (id: string) => void;
  totalHours: number;
  billableHours: number;
  isSubmitting: boolean;
  error: string | null;
  saveAsDraft: () => Promise<void>;
  submitForApproval: () => Promise<void>;
  validateForm: () => boolean;
}

export const useTimesheetForm = ({
  timesheetId,
  weekStartDate,
  onSuccess,
}: UseTimesheetFormProps): UseTimesheetFormReturn => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addEntry = useCallback((entry: Omit<TimeEntry, 'id' | 'timesheet_id' | 'created_at' | 'updated_at'>) => {
    const newEntry: TimeEntry = {
      ...entry,
      id: `temp-${Date.now()}`,
      timesheet_id: timesheetId || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setEntries(prev => [...prev, newEntry]);
  }, [timesheetId]);

  const updateEntry = useCallback((id: string, data: Partial<TimeEntry>) => {
    setEntries(prev =>
      prev.map(entry =>
        entry.id === id ? { ...entry, ...data, updated_at: new Date().toISOString() } : entry
      )
    );
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  }, []);

  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
  const billableHours = entries.filter(e => e.is_billable).reduce((sum, e) => sum + e.hours, 0);

  const validateForm = useCallback(() => {
    if (entries.length === 0) {
      setError('Please add at least one time entry');
      return false;
    }

    const invalidEntries = entries.filter(e => e.hours <= 0 || e.hours > 24);
    if (invalidEntries.length > 0) {
      setError('Hours must be between 0 and 24');
      return false;
    }

    setError(null);
    return true;
  }, [entries]);

  const saveAsDraft = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const formData: TimesheetFormData = {
        week_start_date: weekStartDate,
        entries: entries.map(({ id, timesheet_id, created_at, updated_at, ...rest }) => rest),
      };

      if (timesheetId) {
        await timesheetService.updateTimesheet(timesheetId, formData);
      } else {
        await timesheetService.createTimesheet(formData);
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save timesheet');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitForApproval = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // First save as draft if new
      if (!timesheetId) {
        const formData: TimesheetFormData = {
          week_start_date: weekStartDate,
          entries: entries.map(({ id, timesheet_id, created_at, updated_at, ...rest }) => rest),
        };
        const created = await timesheetService.createTimesheet(formData);
        await timesheetService.submitTimesheet(created.id);
      } else {
        await timesheetService.submitTimesheet(timesheetId);
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit timesheet');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
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
  };
};
