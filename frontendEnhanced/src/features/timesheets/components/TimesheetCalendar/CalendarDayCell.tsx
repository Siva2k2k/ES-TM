/**
 * Calendar Day Cell Component
 * Individual day cell in calendar view
 * Cognitive Complexity: 2
 */
import React from 'react';
import { Clock, Plus } from 'lucide-react';
import { TimeEntry } from '../../types';
import { cn } from '../../../../shared/utils/cn';

interface CalendarDayCellProps {
  date: Date;
  entries: TimeEntry[];
  isToday: boolean;
  isWeekend: boolean;
  onAddEntry: (date: string) => void;
  onEntryClick: (entry: TimeEntry) => void;
}

export const CalendarDayCell: React.FC<CalendarDayCellProps> = ({
  date,
  entries,
  isToday,
  isWeekend,
  onAddEntry,
  onEntryClick,
}) => {
  const dateStr = date.toISOString().split('T')[0];
  const dayTotal = entries.reduce((sum, entry) => sum + entry.hours, 0);

  return (
    <div
      className={cn(
        'min-h-[120px] border border-gray-200 dark:border-gray-700 p-2',
        'bg-white dark:bg-gray-800',
        isWeekend && 'bg-gray-50 dark:bg-gray-900',
        isToday && 'ring-2 ring-blue-500 dark:ring-blue-400'
      )}
    >
      {/* Date Header */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={cn(
            'text-sm font-medium',
            isToday
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-700 dark:text-gray-300'
          )}
        >
          {date.getDate()}
        </span>
        {dayTotal > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <Clock className="h-3 w-3" />
            <span>{dayTotal.toFixed(1)}h</span>
          </div>
        )}
      </div>

      {/* Entries */}
      <div className="space-y-1">
        {entries.map((entry) => (
          <button
            key={entry.id}
            onClick={() => onEntryClick(entry)}
            className={cn(
              'w-full text-left px-2 py-1 rounded text-xs',
              'bg-blue-100 dark:bg-blue-900/30',
              'hover:bg-blue-200 dark:hover:bg-blue-900/50',
              'border-l-2',
              entry.is_billable
                ? 'border-green-500 dark:border-green-400'
                : 'border-gray-400 dark:border-gray-600',
              'transition-colors'
            )}
          >
            <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {entry.hours}h
            </div>
            {entry.description && (
              <div className="text-gray-600 dark:text-gray-400 truncate">
                {entry.description}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Add Entry Button */}
      <button
        onClick={() => onAddEntry(dateStr)}
        className={cn(
          'mt-2 w-full flex items-center justify-center gap-1',
          'py-1 rounded text-xs',
          'text-gray-500 dark:text-gray-400',
          'hover:bg-gray-100 dark:hover:bg-gray-700',
          'transition-colors'
        )}
      >
        <Plus className="h-3 w-3" />
        <span>Add</span>
      </button>
    </div>
  );
};
