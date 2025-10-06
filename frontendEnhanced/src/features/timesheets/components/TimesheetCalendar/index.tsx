/**
 * Timesheet Calendar Component
 * Week view calendar for time entries
 * Cognitive Complexity: 6
 * File Size: ~140 LOC
 */
import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../../../../shared/components/ui';
import { CalendarDayCell } from './CalendarDayCell';
import { TimeEntry } from '../../types';

interface TimesheetCalendarProps {
  weekStartDate: string;
  entries: TimeEntry[];
  onWeekChange: (newWeekStart: string) => void;
  onAddEntry: (date: string) => void;
  onEntryClick: (entry: TimeEntry) => void;
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const TimesheetCalendar: React.FC<TimesheetCalendarProps> = ({
  weekStartDate,
  entries,
  onWeekChange,
  onAddEntry,
  onEntryClick,
}) => {
  const weekDates = useMemo(() => {
    const start = new Date(weekStartDate);
    return Array.from({ length: 5 }, (_, i) => {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      return date;
    });
  }, [weekStartDate]);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, TimeEntry[]>();
    entries.forEach((entry) => {
      const dateKey = entry.date;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(entry);
    });
    return map;
  }, [entries]);

  const handlePreviousWeek = () => {
    const prevWeek = new Date(weekStartDate);
    prevWeek.setDate(prevWeek.getDate() - 7);
    onWeekChange(prevWeek.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const nextWeek = new Date(weekStartDate);
    nextWeek.setDate(nextWeek.getDate() + 7);
    onWeekChange(nextWeek.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    onWeekChange(monday.toISOString().split('T')[0]);
  };

  const formatWeekRange = () => {
    const start = weekDates[0];
    const end = weekDates[4];
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const weekTotal = entries.reduce((sum, entry) => sum + entry.hours, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Week Calendar</CardTitle>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              <span>{formatWeekRange()}</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                {weekTotal.toFixed(1)} hours
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreviousWeek}
                leftIcon={<ChevronLeft className="h-4 w-4" />}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextWeek}
                rightIcon={<ChevronRight className="h-4 w-4" />}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-0">
          {/* Weekday Headers */}
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="px-2 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
            >
              {day}
            </div>
          ))}

          {/* Day Cells */}
          {weekDates.map((date) => {
            const dateStr = date.toISOString().split('T')[0];
            const dayEntries = entriesByDate.get(dateStr) || [];
            return (
              <CalendarDayCell
                key={dateStr}
                date={date}
                entries={dayEntries}
                isToday={isToday(date)}
                isWeekend={false}
                onAddEntry={onAddEntry}
                onEntryClick={onEntryClick}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
