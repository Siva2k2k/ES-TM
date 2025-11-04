import { backendApi } from '../lib/backendApi';

export type HolidayType = 'public' | 'company' | 'optional';

export interface CompanyHoliday {
  _id: string;
  name: string;
  date: Date | string;
  holiday_type: HolidayType;
  description?: string;
  is_active: boolean;
  created_by: string;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at?: Date | string;
}

export interface HolidayFilters {
  startDate?: string;
  endDate?: string;
  holiday_type?: HolidayType;
  is_active?: boolean;
  year?: number;
}

export interface CreateHolidayData {
  name: string;
  date: string;
  holiday_type?: HolidayType;
  description?: string;
}

export interface UpdateHolidayData {
  name?: string;
  date?: string;
  holiday_type?: HolidayType;
  description?: string;
  is_active?: boolean;
}

// API Response types - matching actual backend responses
interface HolidaysApiResponse {
  success: boolean;
  holidays: CompanyHoliday[];
  error?: string;
  message?: string;
}

interface HolidayApiResponse {
  success: boolean;
  holiday: CompanyHoliday;
  error?: string;
  message?: string;
}

interface UpcomingHolidaysApiResponse {
  success: boolean;
  holidays: CompanyHoliday[];
  count: number;
  error?: string;
  message?: string;
}

interface CheckHolidayApiResponse {
  success: boolean;
  is_holiday: boolean;
  holiday?: CompanyHoliday;
  error?: string;
  message?: string;
}

/**
 * Company Holiday Management Service - Simplified for Single Company Calendar
 * Handles all holiday-related operations for the unified company calendar
 */
export class CompanyHolidayService {
  /**
   * Get all holidays with optional filters
   */
  static async getHolidays(filters?: HolidayFilters): Promise<{ holidays: CompanyHoliday[]; error?: string }> {
    try {
      const params = new URLSearchParams();

      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.holiday_type) params.append('holiday_type', filters.holiday_type);
      if (filters?.is_active !== undefined) params.append('is_active', String(filters.is_active));
      if (filters?.year) params.append('year', String(filters.year));

      const queryString = params.toString();
      const endpoint = queryString ? `/holidays?${queryString}` : '/holidays';
      const response = await backendApi.get<HolidaysApiResponse>(endpoint);

      if (response.success && response.holidays) {
        return { holidays: response.holidays };
      } else {
        return { holidays: [], error: response.error || 'Failed to fetch holidays' };
      }
    } catch (error: unknown) {
      console.error('❌ Error fetching holidays:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch holidays';
      return { holidays: [], error: errorMessage };
    }
  }

  /**
   * Get upcoming holidays (next N days)
   */
  static async getUpcomingHolidays(days: number = 30): Promise<{ holidays: CompanyHoliday[]; count: number; error?: string }> {
    try {
      const response = await backendApi.get<UpcomingHolidaysApiResponse>(
        `/holidays/upcoming?days=${days}`
      );

      if (response.success && response.holidays) {
        return {
          holidays: response.holidays,
          count: response.count || 0
        };
      } else {
        return { holidays: [], count: 0, error: response.error || 'Failed to fetch upcoming holidays' };
      }
    } catch (error: unknown) {
      console.error('❌ Error fetching upcoming holidays:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch upcoming holidays';
      return { holidays: [], count: 0, error: errorMessage };
    }
  }

  /**
   * Get holiday by ID
   */
  static async getHolidayById(id: string): Promise<{ holiday?: CompanyHoliday; error?: string }> {
    try {
      const response = await backendApi.get<HolidayApiResponse>(`/holidays/${id}`);

      if (response.success && response.holiday) {
        return { holiday: response.holiday };
      } else {
        return { error: response.error || 'Holiday not found' };
      }
    } catch (error: unknown) {
      console.error('❌ Error fetching holiday:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch holiday';
      return { error: errorMessage };
    }
  }

  /**
   * Create a new holiday (Admin only)
   */
  static async createHoliday(data: CreateHolidayData): Promise<{ holiday?: CompanyHoliday; error?: string }> {
    try {
      const response = await backendApi.post<HolidayApiResponse>('/holidays', data);

      if (response.success && response.holiday) {
        return { holiday: response.holiday };
      } else {
        return { error: response.error || 'Failed to create holiday' };
      }
    } catch (error: unknown) {
      console.error('❌ Error creating holiday:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create holiday';
      return { error: errorMessage };
    }
  }

  /**
   * Update a holiday (Admin only)
   */
  static async updateHoliday(id: string, data: UpdateHolidayData): Promise<{ holiday?: CompanyHoliday; error?: string }> {
    try {
      const response = await backendApi.put<HolidayApiResponse>(`/holidays/${id}`, data);

      if (response.success && response.holiday) {
        return { holiday: response.holiday };
      } else {
        return { error: response.error || 'Failed to update holiday' };
      }
    } catch (error: unknown) {
      console.error('❌ Error updating holiday:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update holiday';
      return { error: errorMessage };
    }
  }

  /**
   * Delete a holiday (Admin only)
   */
  static async deleteHoliday(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await backendApi.delete<{ success: boolean; error?: string; message?: string }>(`/holidays/${id}`);

      if (response.success) {
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Failed to delete holiday' };
      }
    } catch (error: unknown) {
      console.error('❌ Error deleting holiday:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete holiday';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Check if a specific date is a holiday
   */
  static async checkHoliday(date: string): Promise<{
    is_holiday: boolean;
    holiday?: CompanyHoliday;
    error?: string
  }> {
    try {
      const response = await backendApi.get<CheckHolidayApiResponse>(`/holidays/check/${date}`);

      if (response.success) {
        return {
          is_holiday: response.is_holiday || false,
          holiday: response.holiday
        };
      } else {
        return { is_holiday: false, error: response.error || 'Failed to check holiday' };
      }
    } catch (error: unknown) {
      console.error('❌ Error checking holiday:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to check holiday';
      return { is_holiday: false, error: errorMessage };
    }
  }

  /**
   * Get holidays by year (helper method)
   */
  static async getHolidaysByYear(year: number): Promise<{ holidays: CompanyHoliday[]; error?: string }> {
    return this.getHolidays({ year });
  }

  /**
   * Get active holidays only
   */
  static async getActiveHolidays(): Promise<{ holidays: CompanyHoliday[]; error?: string }> {
    return this.getHolidays({ is_active: true });
  }

  /**
   * Get holidays in a date range
   */
  static async getHolidaysInRange(startDate: string, endDate: string): Promise<{ holidays: CompanyHoliday[]; error?: string }> {
    return this.getHolidays({ startDate, endDate });
  }
}

export default CompanyHolidayService;
