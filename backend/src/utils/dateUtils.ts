/**
 * Date utility functions for timezone-safe date handling
 * These functions create UTC dates to ensure consistent storage in MongoDB
 */

/**
 * Parse a date string (YYYY-MM-DD) and create a UTC Date object
 * This ensures the calendar date is preserved when storing in MongoDB
 * 
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object in UTC representing the calendar date
 * 
 * @example
 * parseLocalDate("2025-10-06") → Date object for 2025-10-06T00:00:00.000Z
 * When stored in MongoDB, it remains 2025-10-06T00:00:00.000Z (Monday)
 */
export function parseLocalDate(dateString: string | Date): Date {
  if (dateString instanceof Date) {
    return new Date(dateString);
  }

  // Parse YYYY-MM-DD format and create UTC date
  const parts = dateString.split('T')[0].split('-');
  if (parts.length !== 3) {
    throw new TypeError('Invalid date format. Expected YYYY-MM-DD');
  }

  const year = Number.parseInt(parts[0], 10);
  const month = Number.parseInt(parts[1], 10) - 1; // Month is 0-indexed
  const day = Number.parseInt(parts[2], 10);

  // Create UTC date to preserve calendar date
  const date = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));

  if (Number.isNaN(date.getTime())) {
    throw new TypeError('Invalid date');
  }

  return date;
}

/**
 * Get the Monday of the week for a given date
 * Works with UTC dates to maintain calendar date consistency
 * 
 * @param date - Date object or date string
 * @returns Date object set to Monday of that week (UTC)
 * 
 * @example
 * getMondayOfWeek("2025-10-06") → 2025-10-06T00:00:00.000Z (already Monday)
 * getMondayOfWeek("2025-10-08") → 2025-10-06T00:00:00.000Z (Monday of that week)
 */
export function getMondayOfWeek(date: string | Date): Date {
  const d = parseLocalDate(date);
  
  // Work with UTC to maintain calendar dates
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  
  // Create new UTC date for Monday
  const monday = new Date(Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    diff,
    0, 0, 0, 0
  ));
  
  return monday;
}

/**
 * Get the Sunday (end of week) for a given Monday
 * Works with UTC dates to maintain calendar date consistency
 * 
 * @param monday - Date object or date string (should be a Monday)
 * @returns Date object set to Sunday of that week (UTC)
 * 
 * @example
 * getSundayOfWeek("2025-10-06") → 2025-10-12T23:59:59.999Z (Sunday)
 */
export function getSundayOfWeek(monday: string | Date): Date {
  const d = parseLocalDate(monday);
  
  // Create new UTC date for Sunday (6 days later)
  const sunday = new Date(Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() + 6,
    23, 59, 59, 999
  ));
  
  return sunday;
}

/**
 * Format date to YYYY-MM-DD string using UTC components
 * This ensures the calendar date is preserved
 * 
 * @param date - Date object
 * @returns Date string in YYYY-MM-DD format
 * 
 * @example
 * toISODateString(new Date("2025-10-06T00:00:00.000Z")) → "2025-10-06"
 */
export function toISODateString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 * Uses UTC day to maintain calendar date consistency
 * 
 * @param date - Date object or date string
 * @returns true if weekend, false otherwise
 */
export function isWeekend(date: string | Date): boolean {
  const d = parseLocalDate(date);
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}

/**
 * Check if a date is a Monday
 * Uses UTC day to maintain calendar date consistency
 *
 * @param date - Date object or date string
 * @returns true if Monday, false otherwise
 */
export function isMonday(date: string | Date): boolean {
  const d = parseLocalDate(date);
  return d.getUTCDay() === 1;
}

// ============================================================================
// EXTENDED WEEK LOGIC (Phase 6) - Month-End Mid-Week Handling
// ============================================================================

export interface ExtendedWeekInfo {
  isExtended: boolean;
  extendToDate?: Date;
  extendedDaysCount?: number;
  monthEndDate?: Date;
}

export interface PartialWeekInfo {
  weekStartDate: Date;
  weekEndDate: Date;
  daysCount: number;
}

/**
 * Check if month ends Mon-Wed of the following week
 * If so, the current week should be extended to include those days
 *
 * @param weekStartDate - Monday of the current week
 * @returns Extended week information
 *
 * @example
 * // If month ends on Tuesday, Dec 31, 2024
 * isMonthEndMidWeek("2024-12-23") → { isExtended: true, extendToDate: Date(2024-12-31), extendedDaysCount: 9 }
 */
export function isMonthEndMidWeek(weekStartDate: string | Date): ExtendedWeekInfo {
  const weekStart = parseLocalDate(weekStartDate);
  const weekEnd = getSundayOfWeek(weekStart);

  // Get the end of the month for this week
  const monthEnd = new Date(Date.UTC(
    weekStart.getUTCFullYear(),
    weekStart.getUTCMonth() + 1,
    0, // Last day of current month
    23, 59, 59, 999
  ));

  // Check if month ends after the normal week end (Sunday)
  if (monthEnd <= weekEnd) {
    // Month ends within the normal week, no extension needed
    return { isExtended: false };
  }

  // Check if month ends on Mon, Tue, or Wed of the following week
  const nextMonday = new Date(Date.UTC(
    weekEnd.getUTCFullYear(),
    weekEnd.getUTCMonth(),
    weekEnd.getUTCDate() + 1, // Day after Sunday
    0, 0, 0, 0
  ));

  const nextWednesday = new Date(Date.UTC(
    nextMonday.getUTCFullYear(),
    nextMonday.getUTCMonth(),
    nextMonday.getUTCDate() + 2, // Wednesday
    23, 59, 59, 999
  ));

  // If month ends between next Monday and Wednesday (inclusive)
  if (monthEnd >= nextMonday && monthEnd <= nextWednesday) {
    // Calculate extended days count
    const timeDiff = monthEnd.getTime() - weekStart.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end

    return {
      isExtended: true,
      extendToDate: monthEnd,
      extendedDaysCount: daysDiff,
      monthEndDate: monthEnd
    };
  }

  return { isExtended: false };
}

/**
 * Calculate partial week details (Thu-Sun after an extended week)
 *
 * @param previousExtendedWeekEnd - End date of the previous extended week
 * @returns Partial week information
 *
 * @example
 * // If previous week ended on Wed, Jan 1
 * getPartialWeekDetails(Date("2025-01-01")) → { weekStartDate: Date("2025-01-02"), weekEndDate: Date("2025-01-05"), daysCount: 4 }
 */
export function getPartialWeekDetails(previousExtendedWeekEnd: Date): PartialWeekInfo {
  // Start on the day after the extended week ended
  const partialStart = new Date(Date.UTC(
    previousExtendedWeekEnd.getUTCFullYear(),
    previousExtendedWeekEnd.getUTCMonth(),
    previousExtendedWeekEnd.getUTCDate() + 1,
    0, 0, 0, 0
  ));

  // Find the next Sunday
  const dayOfWeek = partialStart.getUTCDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : (7 - dayOfWeek);

  const partialEnd = new Date(Date.UTC(
    partialStart.getUTCFullYear(),
    partialStart.getUTCMonth(),
    partialStart.getUTCDate() + daysUntilSunday,
    23, 59, 59, 999
  ));

  const timeDiff = partialEnd.getTime() - partialStart.getTime();
  const daysCount = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;

  return {
    weekStartDate: partialStart,
    weekEndDate: partialEnd,
    daysCount
  };
}

/**
 * Predict upcoming month-end weeks (within next N days)
 * Returns list of week start dates that will be extended
 *
 * @param daysAhead - Number of days to look ahead (default: 7)
 * @returns Array of week start dates (Mondays) that will be extended
 *
 * @example
 * predictUpcomingMonthEndWeeks(7) → [Date("2025-01-27")] // If Jan 31 falls Mon-Wed
 */
export function predictUpcomingMonthEndWeeks(daysAhead: number = 7): Date[] {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const futureDate = new Date(today);
  futureDate.setUTCDate(futureDate.getUTCDate() + daysAhead);

  const extendedWeeks: Date[] = [];

  // Check each Monday within the range
  let currentMonday = getMondayOfWeek(today);

  for (let i = 0; i < 8; i++) {
    // Check up to 8 weeks ahead
    const checkDate = new Date(currentMonday);
    checkDate.setUTCDate(checkDate.getUTCDate() + (i * 7));

    if (checkDate > futureDate) {
      break;
    }

    const extendedInfo = isMonthEndMidWeek(checkDate);
    if (extendedInfo.isExtended) {
      extendedWeeks.push(checkDate);
    }
  }

  return extendedWeeks;
}

/**
 * Get number of days between two dates (inclusive)
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of days including both start and end
 */
export function getDaysBetween(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);

  const timeDiff = Math.abs(end.getTime() - start.getTime());
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  return daysDiff + 1; // +1 to include both start and end dates
}

/**
 * Add days to a date
 *
 * @param date - Base date
 * @param days - Number of days to add
 * @returns New date with days added
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * Get end of month for a given date
 *
 * @param date - Date within the month
 * @returns Last day of that month
 */
export function endOfMonth(date: Date): Date {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    0,
    23, 59, 59, 999
  ));
}
