import React, { useState } from 'react';
import { TimesheetService } from '../../services/TimesheetService';

interface MiscellaneousEntryFormProps {
  timesheetId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const COMMON_ACTIVITIES = [
  'Annual Company Meet',
  'Team Building Event',
  'Training Session',
  'Workshop',
  'Conference',
  'Company Event',
  'Other'
];

export const MiscellaneousEntryForm: React.FC<MiscellaneousEntryFormProps> = ({
  timesheetId,
  onSuccess,
  onCancel
}) => {
  const [date, setDate] = useState('');
  const [activity, setActivity] = useState('');
  const [customActivity, setCustomActivity] = useState('');
  const [hours, setHours] = useState<number>(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCustomActivity = activity === 'Other';
  const finalActivity = isCustomActivity ? customActivity : activity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!finalActivity.trim()) {
      setError('Please specify the activity');
      setLoading(false);
      return;
    }

    if (hours <= 0 || hours > 10) {
      setError('Hours must be between 0 and 10');
      setLoading(false);
      return;
    }

    try {
      const result = await TimesheetService.addMiscellaneousEntry(
        timesheetId,
        date,
        finalActivity,
        hours
      );

      if (result.error) {
        setError(result.error);
      } else {
        // Reset form
        setDate('');
        setActivity('');
        setCustomActivity('');
        setHours(8);

        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add miscellaneous entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Add Miscellaneous Entry</h3>
      <p className="text-sm text-gray-600 mb-4">
        For company events, training sessions, and other non-project activities
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="misc-date" className="block text-sm font-medium text-gray-700 mb-1">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            id="misc-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="misc-activity" className="block text-sm font-medium text-gray-700 mb-1">
            Activity <span className="text-red-500">*</span>
          </label>
          <select
            id="misc-activity"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select an activity...</option>
            {COMMON_ACTIVITIES.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>

        {isCustomActivity && (
          <div>
            <label htmlFor="custom-activity" className="block text-sm font-medium text-gray-700 mb-1">
              Specify Activity <span className="text-red-500">*</span>
            </label>
            <input
              id="custom-activity"
              type="text"
              value={customActivity}
              onChange={(e) => setCustomActivity(e.target.value)}
              required
              maxLength={200}
              placeholder="Enter activity name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div>
          <label htmlFor="misc-hours" className="block text-sm font-medium text-gray-700 mb-1">
            Hours <span className="text-red-500">*</span>
          </label>
          <input
            id="misc-hours"
            type="number"
            value={hours}
            onChange={(e) => setHours(parseFloat(e.target.value))}
            required
            min="0.5"
            max="10"
            step="0.5"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            Maximum 10 hours per day
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Miscellaneous entries are non-billable and skip Lead approval.
            They will be reviewed directly by your Manager.
          </p>
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
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Miscellaneous Entry'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MiscellaneousEntryForm;
