import React, { useState, useEffect } from 'react';
import { Palette, Monitor, Globe, Save, Sun, Moon, Laptop } from 'lucide-react';
import { SettingsService, UserSettings } from '../../services/SettingsService';
import { useTheme } from '../../contexts/theme';
import { useToast } from '../../hooks/useToast';

interface PreferencesSettingsProps {
  onSettingsChange: () => void;
  onSettingsSaved: () => void;
}

export const PreferencesSettings: React.FC<PreferencesSettingsProps> = ({
  onSettingsChange,
  onSettingsSaved
}) => {
  const { theme: currentTheme, setTheme } = useTheme();
  const [settings, setSettings] = useState<Partial<UserSettings>>({
    theme: 'system',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    date_format: 'MM/DD/YYYY',
    time_format: '12h'
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  // Sync with theme context
  useEffect(() => {
    setSettings(prev => ({ ...prev, theme: currentTheme }));
  }, [currentTheme]);

  const loadSettings = async () => {
    const result = await SettingsService.getUserSettings();
    if (result.settings) {
      setSettings(result.settings);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    onSettingsChange();

    const loadingToast = toast.loading('Saving preferences...');

    try {
      const result = await SettingsService.updateUserSettings(settings);
      if (result.settings) {
        toast.update(loadingToast, {
          render: 'Preferences saved successfully!',
          type: 'success',
          isLoading: false,
          autoClose: 3000
        });
        onSettingsSaved();
      } else {
        throw new Error(result.error || 'Failed to save preferences');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save preferences';
      toast.update(loadingToast, {
        render: errorMessage,
        type: 'error',
        isLoading: false,
        autoClose: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: keyof UserSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    onSettingsChange();
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    handleChange('theme', newTheme);
  };

  const getThemeIcon = (themeOption: 'light' | 'dark' | 'system') => {
    switch (themeOption) {
      case 'light':
        return <Sun className="h-6 w-6 mx-auto mb-2" />;
      case 'dark':
        return <Moon className="h-6 w-6 mx-auto mb-2" />;
      case 'system':
        return <Laptop className="h-6 w-6 mx-auto mb-2" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
          <Palette className="h-5 w-5 mr-2" />
          Preferences
        </h3>
        <p className="text-sm text-gray-500">Customize your application appearance and behavior.</p>
      </div>


      <div className="space-y-6">
        {/* Theme Settings */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
            <Monitor className="h-4 w-4 mr-2" />
            Theme
          </h4>
          <div className="grid grid-cols-3 gap-4">
            {(['light', 'dark', 'system'] as const).map((themeOption) => (
              <label key={themeOption} className="cursor-pointer">
                <input
                  type="radio"
                  name="theme"
                  value={themeOption}
                  checked={settings.theme === themeOption}
                  onChange={(e) => handleThemeChange(e.target.value as 'light' | 'dark' | 'system')}
                  className="sr-only"
                />
                <div className={`border-2 rounded-lg p-4 text-center transition-all ${
                  settings.theme === themeOption
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 dark:border-blue-400'
                    : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                }`}>
                  {getThemeIcon(themeOption)}
                  <div className="capitalize font-medium dark:text-gray-100">{themeOption}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {themeOption === 'light' && 'Always light'}
                    {themeOption === 'dark' && 'Always dark'}
                    {themeOption === 'system' && 'Follow system'}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Localization */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
            <Globe className="h-4 w-4 mr-2" />
            Localization
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date-format" className="block text-sm font-medium text-gray-700 mb-2">
                Date Format
              </label>
              <select
                id="date-format"
                value={settings.date_format}
                onChange={(e) => handleChange('date_format', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (UK)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
              </select>
            </div>

            <div>
              <label htmlFor="time-format" className="block text-sm font-medium text-gray-700 mb-2">
                Time Format
              </label>
              <select
                id="time-format"
                value={settings.time_format}
                onChange={(e) => handleChange('time_format', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="12h">12 Hour (AM/PM)</option>
                <option value="24h">24 Hour</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};