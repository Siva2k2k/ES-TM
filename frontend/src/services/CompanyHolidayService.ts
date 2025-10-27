import { backendApi } from '../lib/backendApi';

export type HolidayType = 'public' | 'company' | 'optional';

export interface CompanyHoliday {
  _id: string;
  calendar_id?: string;
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
  calendar_id?: string;
}

export interface UpdateHolidayData {
  name?: string;
  date?: string;
  holiday_type?: HolidayType;
  description?: string;
  is_active?: boolean;
}

/**
 * Company Holiday Management Service
 * Handles all holiday-related operations
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
      const response = await backendApi.get(`/holidays${queryString ? `?${queryString}` : ''}`);

      if (response.success && response.holidays) {
        return { holidays: response.holidays as CompanyHoliday[] };
      } else {
        return { holidays: [], error: response.error || 'Failed to fetch holidays' };
      }
    } catch (error: any) {
      console.error('Error fetching holidays:', error);
      return { holidays: [], error: error.message || 'Failed to fetch holidays' };
    }
  }

  /**
   * Get upcoming holidays (next N days)
   */
  static async getUpcomingHolidays(days: number = 30): Promise<{ holidays: CompanyHoliday[]; count: number; error?: string }> {
    try {
      const response = await backendApi.get(`/holidays/upcoming?days=${days}`);

      if (response.success && response.holidays) {
        return {
          holidays: response.holidays as CompanyHoliday[],
          count: response.count || 0
        };
      } else {
        return { holidays: [], count: 0, error: response.error || 'Failed to fetch upcoming holidays' };
      }
    } catch (error: any) {
      console.error('Error fetching upcoming holidays:', error);
      return { holidays: [], count: 0, error: error.message || 'Failed to fetch upcoming holidays' };
    }
  }

  /**
   * Get holiday by ID
   */
  static async getHolidayById(id: string): Promise<{ holiday?: CompanyHoliday; error?: string }> {
    try {
      const response = await backendApi.get(`/holidays/${id}`);

      if (response.success && response.holiday) {
        return { holiday: response.holiday as CompanyHoliday };
      } else {
        return { error: response.error || 'Holiday not found' };
      }
    } catch (error: any) {
      console.error('Error fetching holiday:', error);
      return { error: error.message || 'Failed to fetch holiday' };
    }
  }

  /**
   * Create a new holiday (Admin only)
   */
  static async createHoliday(data: CreateHolidayData): Promise<{ holiday?: CompanyHoliday; error?: string }> {
    try {
      const response = await backendApi.post('/holidays', data);

      if (response.success && response.holiday) {
        return { holiday: response.holiday as CompanyHoliday };
      } else {
        return { error: response.error || 'Failed to create holiday' };
      }
    } catch (error: any) {
      console.error('Error creating holiday:', error);
      return { error: error.message || 'Failed to create holiday' };
    }
  }

  /**
   * Update a holiday (Admin only)
   */
  static async updateHoliday(id: string, data: UpdateHolidayData): Promise<{ holiday?: CompanyHoliday; error?: string }> {
    try {
      const response = await backendApi.put(`/holidays/${id}`, data);

      if (response.success && response.holiday) {
        return { holiday: response.holiday as CompanyHoliday };
      } else {
        return { error: response.error || 'Failed to update holiday' };
      }
    } catch (error: any) {
      console.error('Error updating holiday:', error);
      return { error: error.message || 'Failed to update holiday' };
    }
  }

  /**
   * Delete a holiday (Admin only)
   */
  static async deleteHoliday(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await backendApi.delete(`/holidays/${id}`);

      if (response.success) {
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Failed to delete holiday' };
      }
    } catch (error: any) {
      console.error('Error deleting holiday:', error);
      return { success: false, error: error.message || 'Failed to delete holiday' };
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
      const response = await backendApi.get(`/holidays/check/${date}`);

      if (response.success) {
        return {
          is_holiday: response.is_holiday || false,
          holiday: response.holiday as CompanyHoliday | undefined
        };
      } else {
        return { is_holiday: false, error: response.error || 'Failed to check holiday' };
      }
    } catch (error: any) {
      console.error('Error checking holiday:', error);
      return { is_holiday: false, error: error.message || 'Failed to check holiday' };
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
