import { backendApi } from '../lib/backendApi';
import { BackendAuthService } from './BackendAuthService';
import { UserSettings, ReportTemplate, SystemSetting } from '../types/settings';
/**
 * Settings Service - Handles all settings-related API calls
 */
export class SettingsService {
  
  // ============================================================================
  // USER SETTINGS
  // ============================================================================
  
  /**
   * Get current user's settings
   */
  static async getUserSettings(): Promise<{ settings?: UserSettings; error?: string }> {
    try {
      const response = await backendApi.get<{ success: boolean; settings?: UserSettings; error?: string }>('/settings/profile');
      
      if (response.success && response.settings) {
        return { settings: response.settings };
      } else {
        return { error: response.error || 'Failed to load settings' };
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
      return { error: 'Failed to load settings' };
    }
  }

  /**
   * Update user settings
   */
  static async updateUserSettings(settings: Partial<UserSettings>): Promise<{ settings?: UserSettings; error?: string }> {
    try {
      const response = await backendApi.put<{ success: boolean; settings?: UserSettings; error?: string }>('/settings/profile', settings);
      
      if (response.success && response.settings) {
        return { settings: response.settings };
      } else {
        return { error: response.error || 'Failed to update settings' };
      }
    } catch (error) {
      console.error('Error updating user settings:', error);
      return { error: 'Failed to update settings' };
    }
  }

  /**
   * Update theme preference only
   */
  static async updateTheme(theme: 'light' | 'dark' | 'system'): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await backendApi.put<{ success: boolean; error?: string }>('/settings/theme', { theme });
      return { success: response.success, error: response.error };
    } catch (error) {
      console.error('Error updating theme:', error);
      return { success: false, error: 'Failed to update theme' };
    }
  }

  // ============================================================================
  // REPORT TEMPLATES
  // ============================================================================

  /**
   * Get available report templates
   */
  static async getReportTemplates(): Promise<{ templates?: ReportTemplate[]; error?: string }> {
    try {
      const response = await backendApi.get<{ success: boolean; templates?: ReportTemplate[]; error?: string }>('/settings/templates');
      
      if (response.success && response.templates) {
        return { templates: response.templates };
      } else {
        return { error: response.error || 'Failed to load report templates' };
      }
    } catch (error) {
      console.error('Error loading report templates:', error);
      return { error: 'Failed to load report templates' };
    }
  }

  /**
   * Create new report template
   */
  static async createReportTemplate(template: Partial<ReportTemplate>): Promise<{ template?: ReportTemplate; error?: string }> {
    try {
      const response = await backendApi.post<{ success: boolean; template?: ReportTemplate; error?: string }>('/settings/templates', template);
      
      if (response.success && response.template) {
        return { template: response.template };
      } else {
        return { error: response.error || 'Failed to create report template' };
      }
    } catch (error) {
      console.error('Error creating report template:', error);
      return { error: 'Failed to create report template' };
    }
  }

  /**
   * Update report template
   */
  static async updateReportTemplate(templateId: string, template: Partial<ReportTemplate>): Promise<{ template?: ReportTemplate; error?: string }> {
    try {
      const response = await backendApi.put<{ success: boolean; template?: ReportTemplate; error?: string }>(`/settings/templates/${templateId}`, template);
      
      if (response.success && response.template) {
        return { template: response.template };
      } else {
        return { error: response.error || 'Failed to update report template' };
      }
    } catch (error) {
      console.error('Error updating report template:', error);
      return { error: 'Failed to update report template' };
    }
  }

  /**
   * Delete report template
   */
  static async deleteReportTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await backendApi.delete<{ success: boolean; error?: string }>(`/settings/templates/${templateId}`);
      return { success: response.success, error: response.error };
    } catch (error) {
      console.error('Error deleting report template:', error);
      return { success: false, error: 'Failed to delete report template' };
    }
  }

  // ============================================================================
  // SYSTEM SETTINGS (Admin Only)
  // ============================================================================

  /**
   * Get system settings
   */
  static async getSystemSettings(): Promise<{ settings?: SystemSetting[]; error?: string }> {
    try {
      const response = await backendApi.get<{ 
        success: boolean; 
        settings?: Record<string, unknown>[]; // Backend returns array with single object containing all settings
        error?: string 
      }>('/settings/system');
      
      if (response.success && response.settings && response.settings.length > 0) {
        // Transform the backend response to match frontend expectations
        const backendSettings = response.settings[0]; // Get the first (and only) settings object
        const transformedSettings: SystemSetting[] = [];
        
        // Define setting categories and descriptions
        const settingMeta: Record<string, { category: SystemSetting['category'], description: string }> = {
          email_enabled: { category: 'notifications', description: 'Enable email notifications' },
          smtp_configured: { category: 'notifications', description: 'SMTP server configured' },
          max_timesheet_hours_per_week: { category: 'general', description: 'Maximum hours per week' },
          max_timesheet_hours_per_day: { category: 'general', description: 'Maximum hours per day' },
          require_task_comments: { category: 'general', description: 'Require task comments' },
          auto_submit_timesheets: { category: 'general', description: 'Auto-submit timesheets' },
          timesheet_submission_deadline: { category: 'general', description: 'Timesheet submission deadline' },
          allow_retroactive_entries: { category: 'general', description: 'Allow retroactive entries' },
          retroactive_entry_days_limit: { category: 'general', description: 'Retroactive entry days limit' },
          features: { category: 'general', description: 'System features configuration' }
        };
        
        // Transform each setting property to SystemSetting format
        Object.entries(backendSettings).forEach(([key, value]) => {
          // Skip MongoDB-specific fields
          if (['_id', '__v', 'created_at', 'updated_at'].includes(key)) {
            return;
          }
          
          const meta = settingMeta[key] || { category: 'general' as const, description: key.replace(/_/g, ' ') };
          
          // Type guard for setting value
          const settingValue = (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || 
                               (typeof value === 'object' && value !== null)) 
                               ? value as string | number | boolean | Record<string, unknown>
                               : String(value);
          
          transformedSettings.push({
            setting_key: key,
            setting_value: settingValue,
            description: meta.description,
            category: meta.category,
            is_public: false,
            updated_by: 'system',
            updated_at: (backendSettings.updated_at as string) || new Date().toISOString()
          });
        });
        
        return { settings: transformedSettings };
      } else {
        return { error: response.error || 'Failed to load system settings' };
      }
    } catch (error) {
      console.error('Error loading system settings:', error);
      return { error: 'Failed to load system settings' };
    }
  }

  /**
   * Update system setting
   */
  static async updateSystemSetting(settingKey: string, value: string | number | boolean | Record<string, unknown>): Promise<{ setting?: SystemSetting; error?: string }> {
    try {
      const response = await backendApi.put<{ success: boolean; setting?: SystemSetting; error?: string }>(`/settings/system/${settingKey}`, { value });
      
      if (response.success && response.setting) {
        return { setting: response.setting };
      } else {
        return { error: response.error || 'Failed to update system setting' };
      }
    } catch (error) {
      console.error('Error updating system setting:', error);
      return { error: 'Failed to update system setting' };
    }
  }

  // ============================================================================
  // PASSWORD MANAGEMENT
  // ============================================================================

  /**
   * Change password
   */
  static async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await BackendAuthService.changePassword({
        currentPassword,
        newPassword
      });
      
      return result;
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to change password' };
    }
  }
}