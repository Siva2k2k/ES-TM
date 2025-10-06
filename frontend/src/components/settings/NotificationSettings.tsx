import React, { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, Save, Loader2, RefreshCw } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { SettingsService } from '../../services/SettingsService';
import { useToast } from '../../hooks/useToast';

interface NotificationSettingsProps {
  onSettingsChange: () => void;
  onSettingsSaved: () => void;
}

interface NotificationPreferences {
  email_enabled: boolean;
  push_enabled: boolean;
  timesheet_reminders: boolean;
  approval_notifications: boolean;
  team_updates: boolean;
  system_announcements: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  onSettingsChange,
  onSettingsSaved
}) => {
  const permissions = usePermissions();
  const toast = useToast();
  const [settings, setSettings] = useState<NotificationPreferences>({
    email_enabled: true,
    push_enabled: false,
    timesheet_reminders: true,
    approval_notifications: false,
    team_updates: false,
    system_announcements: true,
    frequency: 'daily'
  });
  const [initialSettings, setInitialSettings] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);

    try {
      const result = await SettingsService.getUserSettings();
      if (result.settings?.notifications) {
        const notifSettings = result.settings.notifications;
        setSettings(notifSettings);
        setInitialSettings(notifSettings);
        setHasChanges(false);
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const loadingToast = toast.loading('Saving notification settings...');

    try {
      const result = await SettingsService.updateUserSettings({
        notifications: settings
      });

      if (result.settings) {
        toast.update(loadingToast, {
          render: 'Notification settings saved successfully!',
          type: 'success',
          isLoading: false,
          autoClose: 3000
        });
        setInitialSettings(settings);
        setHasChanges(false);
        onSettingsSaved();
      } else {
        throw new Error(result.error || 'Failed to save settings');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save notification settings';
      toast.update(loadingToast, {
        render: errorMessage,
        type: 'error',
        isLoading: false,
        autoClose: 5000
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences, value: boolean | string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Check if there are changes
    if (initialSettings) {
      const changed = JSON.stringify(newSettings) !== JSON.stringify(initialSettings);
      setHasChanges(changed);

      if (changed) {
        onSettingsChange();
      }
    }
  };

  const canManageTeam = permissions.hasAnyRole(['manager', 'management', 'super_admin']);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading notification settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          Notification Settings
        </h3>
        <p className="text-sm text-gray-500">Manage how and when you receive notifications.</p>
      </div>


      <div className="space-y-6">
        {/* Email Notifications */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
            <Mail className="h-4 w-4 mr-2" />
            Email Notifications
          </h4>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Enable Email Notifications</div>
                <div className="text-sm text-gray-500">Receive notifications via email</div>
              </div>
              <input
                type="checkbox"
                checked={settings.email_enabled}
                onChange={(e) => handleToggle('email_enabled', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Timesheet Reminders</div>
                <div className="text-sm text-gray-500">Daily reminders to submit timesheets</div>
              </div>
              <input
                type="checkbox"
                checked={settings.timesheet_reminders}
                onChange={(e) => handleToggle('timesheet_reminders', e.target.checked)}
                disabled={!settings.email_enabled}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
            </label>

            {canManageTeam && (
              <>
                <label className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Approval Notifications</div>
                    <div className="text-sm text-gray-500">When timesheets need approval</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.approval_notifications}
                    onChange={(e) => handleToggle('approval_notifications', e.target.checked)}
                    disabled={!settings.email_enabled}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Team Updates</div>
                    <div className="text-sm text-gray-500">Updates from your team members</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.team_updates}
                    onChange={(e) => handleToggle('team_updates', e.target.checked)}
                    disabled={!settings.email_enabled}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                  />
                </label>
              </>
            )}

            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">System Announcements</div>
                <div className="text-sm text-gray-500">Important system updates and maintenance</div>
              </div>
              <input
                type="checkbox"
                checked={settings.system_announcements}
                onChange={(e) => handleToggle('system_announcements', e.target.checked)}
                disabled={!settings.email_enabled}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
            </label>
          </div>

          {settings.email_enabled && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Frequency
              </label>
              <select
                value={settings.frequency}
                onChange={(e) => handleToggle('frequency', e.target.value)}
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="immediate">Immediate</option>
                <option value="daily">Daily Digest</option>
                <option value="weekly">Weekly Summary</option>
              </select>
            </div>
          )}
        </div>

        {/* Push Notifications - Coming Soon */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
            <Smartphone className="h-4 w-4 mr-2" />
            Push Notifications
          </h4>
          <p className="text-sm text-gray-500">
            Browser push notifications will be available in a future update.
          </p>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => {
            if (initialSettings) {
              setSettings(initialSettings);
              setHasChanges(false);
              setError(null);
              setSuccess(null);
            }
          }}
          disabled={saving || !hasChanges}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
};