/**
 * ValidationConfigService
 *
 * Provides dynamic validation configuration for timesheets based on:
 * - Working days in the week
 * - Holidays
 * - Leave entries
 * - Extended weeks (month-end handling)
 *
 * This replaces hardcoded validation constants with context-aware calculations.
 */

import { TimeEntry, ITimeEntry } from '@/models/TimeEntry';
import { Timesheet } from '@/models/Timesheet';
import CompanyHolidayService from './CompanyHolidayService';
import mongoose from 'mongoose';

export interface ExpectedHoursResult {
  minHours: number;
  maxHours: number;
  breakdown: string;
  workingDays: number;
  totalDays: number;
  holidayDays: number;
  leaveDays: number;
}

export interface DailyExpectedHoursResult {
  minHours: number;
  maxHours: number;
  reason: string;
}

export interface ValidationConfigOptions {
  weekStartDate: Date;
  weekEndDate: Date;
  userId: string;
}

export class ValidationConfigService {

  /**
   * Calculate expected weekly hours (DYNAMIC)
   *
   * Formula:
   * - workingDays = (Mon-Fri count) - holidays - leaveDays
   * - minHours = max(0, workingDays × 8)
   * - maxHours = totalDays × 10 (for extended weeks) OR 52 (for normal weeks)
   *
   * @param options Configuration options including week dates and user ID
   * @returns Expected min/max hours and breakdown explanation
   */
  async getExpectedWeeklyHours(options: ValidationConfigOptions): Promise<ExpectedHoursResult> {
    const { weekStartDate, weekEndDate, userId } = options;

    // 1. Calculate total calendar days
    const totalDays = this.getDaysBetween(weekStartDate, weekEndDate);
    const isExtendedWeek = totalDays > 7;

    // 2. Count working days (Mon-Fri) in the range
    let workingDays = this.countWorkingDays(weekStartDate, weekEndDate);

    // 3. Get holidays in the range
    const holidays = await CompanyHolidayService.getHolidaysInRange(weekStartDate, weekEndDate);

    // Count only holidays that fall on working days (Mon-Fri)
    const holidaysOnWorkingDays = holidays.filter(holiday => {
      const day = holiday.date.getDay();
      return day >= 1 && day <= 5; // Mon-Fri
    });

    workingDays -= holidaysOnWorkingDays.length;

    // 4. Get leave entries for this user in this week
    const leaveEntries = await this.getLeaveEntries(userId, weekStartDate, weekEndDate);

    // Count leave days that fall on working days (excluding weekends and holidays)
    const holidayDates = new Set(
      holidays.map(h => h.date.toISOString().split('T')[0])
    );

    const leaveOnWorkingDays = leaveEntries.filter(entry => {
      const day = entry.date.getDay();
      const dateStr = entry.date.toISOString().split('T')[0];
      // Only count if Mon-Fri and not a holiday
      return day >= 1 && day <= 5 && !holidayDates.has(dateStr);
    });

    const leaveDays = this.calculateLeaveDays(leaveOnWorkingDays);
    workingDays -= leaveDays;

    // Ensure working days doesn't go negative
    workingDays = Math.max(0, workingDays);

    // 5. Calculate min/max hours
    const minHours = Math.max(0, workingDays * 8);

    // Max hours: 52h for normal weeks, proportional for extended weeks
    const maxHours = isExtendedWeek ? (totalDays * 10) : 52;

    // 6. Build breakdown message
    const breakdownParts = [];
    breakdownParts.push(`${totalDays} days total`);
    breakdownParts.push(`${workingDays} working days`);

    if (holidaysOnWorkingDays.length > 0) {
      breakdownParts.push(`${holidaysOnWorkingDays.length} holiday${holidaysOnWorkingDays.length > 1 ? 's' : ''} excluded`);
    }

    if (leaveDays > 0) {
      breakdownParts.push(`${leaveDays} leave day${leaveDays > 1 ? 's' : ''} excluded`);
    }

    const breakdown = breakdownParts.join(', ');

    return {
      minHours,
      maxHours,
      breakdown,
      workingDays,
      totalDays,
      holidayDays: holidaysOnWorkingDays.length,
      leaveDays
    };
  }

  /**
   * Calculate expected daily hours
   *
   * @param date The date to check
   * @returns Expected min/max hours for that specific date
   */
  async getDailyExpectedHours(date: Date): Promise<DailyExpectedHoursResult> {
    // Check if holiday
    const isHoliday = await CompanyHolidayService.isHoliday(date);
    if (isHoliday) {
      const holiday = await CompanyHolidayService.getHolidayByDate(date);
      return {
        minHours: 0,
        maxHours: 0,
        reason: `Public holiday: ${holiday?.name || 'Holiday'}`
      };
    }

    // Check if weekend
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        minHours: 0,
        maxHours: 10,
        reason: 'Weekend (optional work)'
      };
    }

    // Normal working day (Mon-Fri)
    return {
      minHours: 8,
      maxHours: 10,
      reason: 'Working day'
    };
  }

  /**
   * Calculate number of days between two dates (inclusive)
   *
   * @param startDate Start date
   * @param endDate End date
   * @returns Number of days including both start and end date
   */
  private getDaysBetween(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays + 1; // +1 to include both start and end dates
  }

  /**
   * Count working days (Mon-Fri) in a date range
   *
   * @param startDate Start date
   * @param endDate End date
   * @returns Number of working days
   */
  private countWorkingDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Mon-Fri
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * Get leave entries for a user in a specific date range
   *
   * @param userId User ID
   * @param startDate Range start date
   * @param endDate Range end date
   * @returns Array of leave entries
   */
  private async getLeaveEntries(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ITimeEntry[]> {
    try {
      // Find timesheets for this user that overlap with the date range
      const timesheets = await (Timesheet.find as any)({
        user_id: new mongoose.Types.ObjectId(userId),
        week_start_date: { $lte: endDate },
        week_end_date: { $gte: startDate },
        deleted_at: null
      });

      if (timesheets.length === 0) {
        return [];
      }

      const timesheetIds = timesheets.map((t: any) => t._id);

      // Find leave entries within the date range
      const entries = await (TimeEntry.find as any)({
        timesheet_id: { $in: timesheetIds },
        entry_category: 'leave',
        date: { $gte: startDate, $lte: endDate },
        deleted_at: null
      }).lean();

      return entries as ITimeEntry[];
    } catch (error) {
      return [];
    }
  }

  /**
   * Calculate total leave days from leave entries
   *
   * @param leaveEntries Array of leave time entries
   * @returns Total leave days (0.5 for half day, 1 for full day)
   */
  private calculateLeaveDays(leaveEntries: ITimeEntry[]): number {
    let totalDays = 0;

    for (const entry of leaveEntries) {
      if (entry.leave_session === 'full_day') {
        totalDays += 1;
      } else if (entry.leave_session === 'morning' || entry.leave_session === 'afternoon') {
        totalDays += 0.5;
      }
    }

    return totalDays;
  }
}

// Export singleton instance
export default new ValidationConfigService();
