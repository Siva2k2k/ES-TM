import { backendApi } from './backendApi';

export interface Calendar {
  id: string;
  name: string;
  description?: string;
  timezone: string;
  is_active: boolean;

  // Holiday-related settings
  auto_create_holiday_entries: boolean;
  default_holiday_hours: number;

  // Timesheet-related settings
  working_days: number[];
  business_hours_start?: string;
  business_hours_end?: string;
  working_hours_per_day: number;

  created_by: {
    id: string;
    full_name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CalendarWithHolidays extends Calendar {
  holidays: Array<{
    id: string;
    name: string;
    date: string;
    holiday_type: 'public' | 'company' | 'optional';
    description?: string;
    is_active: boolean;
  }>;
}

export interface CreateCalendarData {
  name: string;
  description?: string;
  timezone?: string;
  auto_create_holiday_entries?: boolean;
  default_holiday_hours?: number;
  working_days?: number[];
  business_hours_start?: string;
  business_hours_end?: string;
  working_hours_per_day?: number;
}

export interface UpdateCalendarData extends Partial<CreateCalendarData> {
  is_active?: boolean;
}

/**
 * Simplified Calendar Service for Single Company Calendar System
 * This service manages the single active company calendar
 */
export class CalendarService {
  /**
   * Get all calendars (typically returns only the active company calendar)
   */
  static async getCalendars(): Promise<{ calendars: Calendar[]; error?: string }> {
    try {
      const response = await backendApi.get('/calendars');

      if (response.data.success) {
        return { calendars: response.data.calendars };
      } else {
        return { calendars: [], error: response.data.error || 'Failed to fetch calendars' };
      }
    } catch (error: unknown) {
      console.error('❌ Error fetching calendars:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch calendars';
      return {
        calendars: [],
        error: errorMessage
      };
    }
  }

  /**
   * Get the active company calendar
   */
  static async getCompanyCalendar(): Promise<{ calendar?: Calendar; error?: string }> {
    try {
      const response = await this.getCalendars();
      
      if (response.error) {
        return { error: response.error };
      }

      // In simplified system, there's only one active calendar
      const activeCalendar = response.calendars.find(cal => cal.is_active);
      
      if (activeCalendar) {
        return { calendar: activeCalendar };
      } else {
        return { error: 'No active company calendar found' };
      }
    } catch (error: unknown) {
      console.error('❌ Error fetching company calendar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch company calendar';
      return {
        error: errorMessage
      };
    }
  }

  /**
   * Get calendar by ID
   */
  static async getCalendar(id: string): Promise<{ calendar?: Calendar; error?: string }> {
    try {
      const response = await backendApi.get(`/calendars/${id}`);

      if (response.data.success) {
        return { calendar: response.data.calendar };
      } else {
        return { error: response.data.error || 'Failed to fetch calendar' };
      }
    } catch (error: unknown) {
      console.error('❌ Error fetching calendar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch calendar';
      return {
        error: errorMessage
      };
    }
  }

  /**
   * Get calendar with associated holidays
   */
  static async getCalendarWithHolidays(id: string): Promise<{
    calendar?: CalendarWithHolidays;
    holidays?: Array<{
      id: string;
      name: string;
      date: string;
      holiday_type: 'public' | 'company' | 'optional';
      description?: string;
      is_active: boolean;
    }>;
    error?: string;
  }> {
    try {
      const response = await backendApi.get(`/calendars/${id}/with-holidays`);

      if (response.data.success) {
        return { 
          calendar: response.data.calendar,
          holidays: response.data.holidays
        };
      } else {
        return { error: response.data.error || 'Failed to fetch calendar with holidays' };
      }
    } catch (error: unknown) {
      console.error('❌ Error fetching calendar with holidays:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch calendar with holidays';
      return {
        error: errorMessage
      };
    }
  }

  /**
   * Create a new calendar (replaces any existing active calendar)
   */
  static async createCalendar(data: CreateCalendarData): Promise<{
    calendar?: Calendar;
    error?: string;
  }> {
    try {
      const response = await backendApi.post('/calendars', data);

      if (response.data.success) {
        return { calendar: response.data.calendar };
      } else {
        return { error: response.data.error || 'Failed to create calendar' };
      }
    } catch (error: unknown) {
      console.error('❌ Error creating calendar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create calendar';
      return {
        error: errorMessage
      };
    }
  }

  /**
   * Update calendar
   */
  static async updateCalendar(id: string, data: UpdateCalendarData): Promise<{
    calendar?: Calendar;
    error?: string;
  }> {
    try {
      const response = await backendApi.put(`/calendars/${id}`, data);

      if (response.data.success) {
        return { calendar: response.data.calendar };
      } else {
        return { error: response.data.error || 'Failed to update calendar' };
      }
    } catch (error: unknown) {
      console.error('❌ Error updating calendar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update calendar';
      return {
        error: errorMessage
      };
    }
  }

  /**
   * Delete calendar (soft delete)
   */
  static async deleteCalendar(id: string): Promise<{ error?: string }> {
    try {
      const response = await backendApi.delete(`/calendars/${id}`);

      if (response.data.success) {
        return {};
      } else {
        return { error: response.data.error || 'Failed to delete calendar' };
      }
    } catch (error: unknown) {
      console.error('❌ Error deleting calendar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete calendar';
      return {
        error: errorMessage
      };
    }
  }

  /**
   * Check if a date is a working day according to calendar
   */
  static isWorkingDay(calendar: Calendar, date: Date): boolean {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    return calendar.working_days.includes(dayOfWeek);
  }

  /**
   * Check if a date is a holiday (simplified - checks global company holidays)
   */
  static async isHoliday(date: Date): Promise<boolean> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await backendApi.get(`/holidays/check/${dateStr}`);

      return response.data.success && response.data.is_holiday;
    } catch (error) {
      console.error('❌ Error checking holiday:', error);
      return false;
    }
  }

  /**
   * Get working days count between two dates for the company calendar
   */
  static async getWorkingDaysCount(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      const calendarResult = await this.getCompanyCalendar();
      
      if (calendarResult.error || !calendarResult.calendar) {
        throw new Error('Could not fetch company calendar');
      }

      let workingDays = 0;
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        if (this.isWorkingDay(calendarResult.calendar, currentDate)) {
          // Check if it's not a holiday
          const isHoliday = await this.isHoliday(currentDate);
          if (!isHoliday) {
            workingDays++;
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return workingDays;
    } catch (error) {
      console.error('❌ Error calculating working days:', error);
      return 0;
    }
  }
}