/**
 * Time Entry Row Component
 * Individual row in timesheet form for entering time
 * Cognitive Complexity: 3
 */
import React from 'react';
import { Trash2 } from 'lucide-react';
import { Input, Button } from '../../../../shared/components/ui';
import { TimeEntry } from '../../types';

interface TimeEntryRowProps {
  entry: TimeEntry;
  projects: Array<{ id: string; name: string }>;
  onUpdate: (id: string, data: Partial<TimeEntry>) => void;
  onRemove: (id: string) => void;
}

export const TimeEntryRow: React.FC<TimeEntryRowProps> = ({
  entry,
  projects,
  onUpdate,
  onRemove,
}) => {
  return (
    <div className="grid grid-cols-12 gap-3 items-start">
      {/* Date */}
      <div className="col-span-2">
        <Input
          type="date"
          value={entry.date}
          onChange={(e) => onUpdate(entry.id, { date: e.target.value })}
        />
      </div>

      {/* Project */}
      <div className="col-span-3">
        <select
          value={entry.project_id}
          onChange={(e) => onUpdate(entry.id, { project_id: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          <option value="">Select Project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* Hours */}
      <div className="col-span-2">
        <Input
          type="number"
          min="0"
          max="24"
          step="0.5"
          value={entry.hours}
          onChange={(e) => onUpdate(entry.id, { hours: parseFloat(e.target.value) || 0 })}
          placeholder="0.0"
        />
      </div>

      {/* Description */}
      <div className="col-span-3">
        <Input
          type="text"
          value={entry.description || ''}
          onChange={(e) => onUpdate(entry.id, { description: e.target.value })}
          placeholder="What did you work on?"
        />
      </div>

      {/* Billable */}
      <div className="col-span-1 flex items-center justify-center pt-2">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={entry.is_billable}
            onChange={(e) => onUpdate(entry.id, { is_billable: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Bill</span>
        </label>
      </div>

      {/* Remove */}
      <div className="col-span-1 flex items-center justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(entry.id)}
          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
