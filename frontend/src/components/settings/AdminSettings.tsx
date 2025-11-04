import React, { useState, useEffect } from 'react';
import { Settings, Shield, Save, Loader2, RefreshCw, Calendar } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { SettingsService, SystemSetting } from '../../services/SettingsService';
import { useToast } from '../../hooks/useToast';
import { HolidayManagement } from './HolidayManagement';

interface AdminSettingsProps {
  onSettingsChange: () => void;
  onSettingsSaved: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  onSettingsChange,
  onSettingsSaved
}) => {
  const permissions = usePermissions();
  const toast = useToast();
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);
  const [initialSettings, setInitialSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'holidays'>('settings');

  useEffect(() => {
    loadSystemSettings();
  }, []);

  const loadSystemSettings = async () => {
    setLoading(true);

    try {
      const result = await SettingsService.getSystemSettings();
      if (result.settings) {
        setSystemSettings(result.settings);
        setInitialSettings(JSON.parse(JSON.stringify(result.settings)));
        setHasChanges(false);
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (settingKey: string, value: any) => {
    const updatedSettings = systemSettings.map(setting =>
      setting.setting_key === settingKey
        ? { ...setting, setting_value: value }
        : setting
    );
    setSystemSettings(updatedSettings);

    const changed = JSON.stringify(updatedSettings) !== JSON.stringify(initialSettings);
    setHasChanges(changed);

    if (changed) {
      onSettingsChange();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const loadingToast = toast.loading('Saving system settings...');

    try {
      const changedSettings = systemSettings.filter((setting, index) => {
        const initial = initialSettings[index];
        return JSON.stringify(setting.setting_value) !== JSON.stringify(initial?.setting_value);
      });

      const updatePromises = changedSettings.map(setting =>
        SettingsService.updateSystemSetting(setting.setting_key, setting.setting_value)
      );

      const results = await Promise.all(updatePromises);
      const errors = results.filter(r => r.error);

      if (errors.length > 0) {
        toast.update(loadingToast, {
          render: `Failed to update ${errors.length} setting(s)`,
          type: 'error',
          isLoading: false,
          autoClose: 5000
        });
      } else {
        toast.update(loadingToast, {
          render: 'System settings saved successfully!',
          type: 'success',
          isLoading: false,
          autoClose: 3000
        });
        setInitialSettings(JSON.parse(JSON.stringify(systemSettings)));
        setHasChanges(false);
        onSettingsSaved();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save system settings';
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

  const handleReset = () => {
    setSystemSettings(JSON.parse(JSON.stringify(initialSettings)));
    setHasChanges(false);
  };

  if (!permissions.canModifySystemSettings) {
    return (
      <div className="text-center py-8">
        <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">
          You don't have permission to access system settings.
        </p>
      </div>
    );
  }

  const renderSettingField = (setting: SystemSetting) => {
    const value = setting.setting_value;
    const key = setting.setting_key;

    // Add safety check for undefined setting key
    if (!key) {
      console.warn('Setting with undefined key:', setting);
      return null;
    }

    const getDisplayName = () => {
      return setting.description || key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    };

    if (typeof value === 'boolean') {
      return (
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => handleSettingChange(key, e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">
            {getDisplayName()}
          </span>
        </label>
      );
    }

    if (typeof value === 'number') {
      return (
        <div>
          <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-2">
            {getDisplayName()}
          </label>
          <input
            id={key}
            type="number"
            value={value}
            onChange={(e) => handleSettingChange(key, parseFloat(e.target.value) || 0)}
            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      );
    }

    return (
      <div>
        <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-2">
          {getDisplayName()}
        </label>
        <input
          id={key}
          type="text"
          value={String(value)}
          onChange={(e) => handleSettingChange(key, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    );
  };

  const settingsByCategory = systemSettings
    .filter(setting => setting?.setting_key) // Filter out invalid settings
    .reduce<Record<string, SystemSetting[]>>((acc, setting) => {
      const category = setting.category || 'general';
      if (!acc[category]) acc[category] = [];
      acc[category].push(setting);
      return acc;
    }, {});

  const categoryLabels: Record<string, string> = {
    general: 'General Settings',
    security: 'Security Settings',
    notifications: 'Notification Settings',
    reports: 'Report Settings',
    integration: 'Integration Settings',
    appearance: 'Appearance Settings'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading system settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('settings')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="h-4 w-4 mr-2 inline" />
            System Settings
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'holidays'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Calendar className="h-4 w-4 mr-2 inline" />
            Holiday Management
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'settings' && (
        <>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              System Administration
            </h3>
            <p className="text-sm text-gray-500">Manage global system settings and configurations.</p>
          </div>

          {systemSettings.length === 0 && (
            <div className="text-center py-8">
              <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Settings Found</h3>
              <p className="text-gray-600">System settings have not been initialized yet.</p>
            </div>
          )}

          <div className="space-y-6">
            {Object.entries(settingsByCategory).map(([category, settings]) => (
              <div key={category} className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  {categoryLabels[category] || category.charAt(0).toUpperCase() + category.slice(1)}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {settings
                    .filter(setting => setting?.setting_key) // Additional safety check
                    .map(setting => (
                      <div key={setting.setting_key}>
                        {renderSettingField(setting)}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {systemSettings.length > 0 && (
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleReset}
                disabled={saving || !hasChanges}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
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
          )}
        </>
      )}

      {activeTab === 'holidays' && (
        <HolidayManagement />
      )}
    </div>
  );
};