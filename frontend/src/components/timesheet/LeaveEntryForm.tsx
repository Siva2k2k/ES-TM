import React, { useState } from 'react';
import { TimesheetService } from '../../services/TimesheetService';
import { CompanyHolidayService } from '../../services/CompanyHolidayService';

interface LeaveEntryFormProps {
  timesheetId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

type LeaveSession = 'morning' | 'afternoon' | 'full_day';

export const LeaveEntryForm: React.FC<LeaveEntryFormProps> = ({
  timesheetId,
  onSuccess,
  onCancel
}) => {
  const [date, setDate] = useState('');
  const [leaveSession, setLeaveSession] = useState<LeaveSession>('full_day');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [holidayWarning, setHolidayWarning] = useState<string | null>(null);

  // Check if date is a holiday when date changes
  const handleDateChange = async (newDate: string) => {
    setDate(newDate);
    setHolidayWarning(null);

    if (newDate) {
      const { is_holiday, holiday } = await CompanyHolidayService.checkHoliday(newDate);
      if (is_holiday && holiday) {
        setHolidayWarning(`${newDate} is marked as "${holiday.name}". Leave cannot be logged on holidays.`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check if date is a holiday before submitting
      const { is_holiday } = await CompanyHolidayService.checkHoliday(date);
      if (is_holiday) {
        setError('Cannot log leave on a company holiday');
        setLoading(false);
        return;
      }

      const result = await TimesheetService.addLeaveEntry(
        timesheetId,
        date,
        leaveSession,
        description || undefined
      );

      if (result.error) {
        setError(result.error);
      } else {
        // Reset form
        setDate('');
        setLeaveSession('full_day');
        setDescription('');
        setHolidayWarning(null);

        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add leave entry');
    } finally {
      setLoading(false);
    }
  };

  const getCalculatedHours = (session: LeaveSession): number => {
    switch (session) {
      case 'morning':
      case 'afternoon':
        return 4;
      case 'full_day':
        return 8;
      default:
        return 0;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Add Leave Entry</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {holidayWarning && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
          <strong>Warning:</strong> {holidayWarning}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="leave-date" className="block text-sm font-medium text-gray-700 mb-1">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            id="leave-date"
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="leave-session" className="block text-sm font-medium text-gray-700 mb-1">
            Session <span className="text-red-500">*</span>
          </label>
          <select
            id="leave-session"
            value={leaveSession}
            onChange={(e) => setLeaveSession(e.target.value as LeaveSession)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="full_day">Full Day (8 hours)</option>
            <option value="morning">Morning (4 hours)</option>
            <option value="afternoon">Afternoon (4 hours)</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Hours will be automatically calculated: {getCalculatedHours(leaveSession)}h
          </p>
        </div>

        <div>
          <label htmlFor="leave-description" className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            id="leave-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Reason for leave..."
          />
        </div>

        <div className="flex gap-3 justify-end">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !!holidayWarning}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : 'Add Leave Entry'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaveEntryForm;
