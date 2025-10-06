/**
 * TimesheetCalendar Component
 *
 * Weekly calendar view for visualizing timesheet entries.
 * Displays entries in a grid format with daily totals and color coding.
 *
 * Features:
 * - Week-based calendar view
 * - Color-coded entries by project
 * - Daily and weekly totals
 * - Click to view/edit entries
 * - Responsive design
 *
 * Cognitive Complexity: 7 (Target: <15)
 */

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatDate, formatDuration } from '../../utils/formatting';
import type { TimeEntry } from '../../types/timesheet.schemas';

export interface TimesheetCalendarProps {
  /** Week start date (Monday) */
  weekStartDate: string;
  /** Time entries for the week */
  entries: TimeEntry[];
  /** Available projects for color mapping */
  projects?: Array<{ id: string; name: string; color?: string }>;
  /** Callback when week is changed */
  onWeekChange?: (newWeekStart: string) => void;
  /** Callback when an entry is clicked */
  onEntryClick?: (entry: TimeEntry) => void;
  /** Callback when a day cell is clicked */
  onDayClick?: (date: string) => void;
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const DEFAULT_COLORS = [
  'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700',
  'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700',
  'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700',
  'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700',
  'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 border-pink-300 dark:border-pink-700',
  'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700',
];

export const TimesheetCalendar: React.FC<TimesheetCalendarProps> = ({
  weekStartDate,
  entries,
  projects = [],
  onWeekChange,
  onEntryClick,
  onDayClick
}) => {
  // Generate week dates
  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    const startDate = new Date(weekStartDate);
    for (let i = 0; i < 5; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [weekStartDate]);

  // Map projects to colors
  const projectColors = useMemo(() => {
    const colorMap: Record<string, string> = {};
    projects.forEach((project, idx) => {
      colorMap[project.id] = project.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
    });
    return colorMap;
  }, [projects]);

  // Group entries by date
  const entriesByDate = useMemo(() => {
    const grouped: Record<string, TimeEntry[]> = {};
    entries.forEach(entry => {
      if (!grouped[entry.date]) grouped[entry.date] = [];
      grouped[entry.date].push(entry);
    });
    return grouped;
  }, [entries]);

  // Calculate daily totals
  const dailyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    entries.forEach(entry => {
      totals[entry.date] = (totals[entry.date] || 0) + entry.hours;
    });
    return totals;
  }, [entries]);

  // Calculate weekly total
  const weeklyTotal = useMemo(() => {
    return entries.reduce((sum, entry) => sum + entry.hours, 0);
  }, [entries]);

  const handlePreviousWeek = () => {
    const newDate = new Date(weekStartDate);
    newDate.setDate(newDate.getDate() - 7);
    onWeekChange?.(newDate.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const newDate = new Date(weekStartDate);
    newDate.setDate(newDate.getDate() + 7);
    onWeekChange?.(newDate.toISOString().split('T')[0]);
  };

  const getProjectName = (projectId?: string): string => {
    if (!projectId) return 'No Project';
    return projects.find(p => p.id === projectId)?.name || 'Unknown';
  };

  const getDayTotalColor = (hours: number): string => {
    if (hours === 0) return 'text-gray-400 dark:text-gray-500';
    if (hours < 8) return 'text-yellow-600 dark:text-yellow-400';
    if (hours > 10) return 'text-red-600 dark:text-red-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <Card className="w-full bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700">
      <CardHeader className="border-b dark:border-gray-700">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-gray-100">
            <CalendarIcon className="h-5 w-5" />
            Weekly Calendar
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Week Total</p>
              <p className={`text-xl font-bold ${
                weeklyTotal > 56 ? 'text-red-600 dark:text-red-400' :
                weeklyTotal >= 40 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
              }`}>
                {formatDuration(weeklyTotal)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousWeek}
                icon={ChevronLeft}
                aria-label="Previous week"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-600"
              />
              <span className="text-sm font-medium min-w-[200px] text-center text-slate-900 dark:text-gray-100">
                {formatDate(weekStartDate, 'MMM DD')} - {formatDate(weekDates[4], 'MMM DD, YYYY')}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextWeek}
                icon={ChevronRight}
                aria-label="Next week"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-600"
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-5 gap-4">
          {weekDates.map((date, dayIndex) => {
            const dateStr = date.toISOString().split('T')[0];
            const dayEntries = entriesByDate[dateStr] || [];
            const dayTotal = dailyTotals[dateStr] || 0;
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <div
                key={dateStr}
                className={`border border-slate-200 dark:border-gray-700 rounded-lg overflow-hidden ${
                  isToday ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
                }`}
              >
                {/* Day Header */}
                <div className={`p-3 ${isToday ? 'bg-blue-50 dark:bg-blue-900' : 'bg-gray-50 dark:bg-gray-900'} border-b border-slate-200 dark:border-gray-700`}>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{WEEKDAYS[dayIndex]}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(date, 'MMM DD')}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                    <p className={`text-sm font-bold ${getDayTotalColor(dayTotal)}`}>
                      {dayTotal}h
                    </p>
                  </div>
                </div>

                {/* Day Entries */}
                <div
                  className="p-2 min-h-[200px] space-y-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => onDayClick?.(dateStr)}
                >
                  {dayEntries.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-xs text-gray-400 dark:text-gray-500">No entries</p>
                    </div>
                  ) : (
                    dayEntries.map((entry, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded border cursor-pointer hover:shadow-md transition-shadow ${
                          entry.project_id
                            ? projectColors[entry.project_id]
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEntryClick?.(entry);
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold truncate">
                            {getProjectName(entry.project_id)}
                          </p>
                          <span className="text-xs font-bold">{entry.hours}h</span>
                        </div>
                        {entry.description && (
                          <p className="text-xs opacity-75 truncate">{entry.description}</p>
                        )}
                        {entry.is_billable && (
                          <Badge variant="success" size="sm" className="mt-1">
                            Billable
                          </Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Week Summary */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="grid grid-cols-5 gap-4 text-center">
            {weekDates.map((date, idx) => {
              const dateStr = date.toISOString().split('T')[0];
              const total = dailyTotals[dateStr] || 0;
              return (
                <div key={dateStr}>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{WEEKDAYS[idx]}</p>
                  <p className={`text-lg font-bold ${getDayTotalColor(total)}`}>
                    {total}h
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        {projects.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Projects:</p>
            <div className="flex flex-wrap gap-2">
              {projects.map(project => (
                <div
                  key={project.id}
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    projectColors[project.id]
                  }`}
                >
                  {project.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
