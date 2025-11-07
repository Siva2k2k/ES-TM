import React from 'react';
import { Settings } from 'lucide-react';
import { useAuth } from '../../store/contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { ProfileSettings } from '../../components/settings/ProfileSettings';
import { SecuritySettings } from '../../components/settings/SecuritySettings';
import { PreferencesSettings } from '../../components/settings/PreferencesSettings';
import { NotificationSettings } from '../../components/settings/NotificationSettings';
import { ReportTemplateSettings } from '../../components/settings/ReportTemplateSettings';
import { AdminSettings } from '../../components/settings/AdminSettings';

type SettingsTab = 'profile' | 'security' | 'preferences' | 'notifications' | 'templates' | 'admin';

const SettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const permissions = usePermissions();
  const [activeTab, setActiveTab] = React.useState<SettingsTab>('profile');
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'User', available: true },
    { id: 'security', label: 'Security', icon: 'Shield', available: true },
    { id: 'preferences', label: 'Preferences', icon: 'Palette', available: true },
    { id: 'notifications', label: 'Notifications', icon: 'Bell', available: true },
    { 
      id: 'templates', 
      label: 'Report Templates', 
      icon: 'FileText', 
      available: permissions.canCreateCustomReports 
    },
    { 
      id: 'admin', 
      label: 'Administration', 
      icon: 'Settings', 
      available: permissions.canModifySystemSettings 
    },
  ] as const;

  const availableTabs = tabs.filter(tab => tab.available);

  const handleTabChange = (tab: SettingsTab) => {
    if (hasUnsavedChanges) {
      if (globalThis.confirm('You have unsaved changes. Are you sure you want to switch tabs?')) {
        setHasUnsavedChanges(false);
        setActiveTab(tab);
      }
    } else {
      setActiveTab(tab);
    }
  };

  const handleSettingsChange = () => {
    setHasUnsavedChanges(true);
  };

  const handleSettingsSaved = () => {
    setHasUnsavedChanges(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex flex-col lg:flex-row">
            {/* Sidebar */}
            <div className="lg:w-64 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <nav className="p-4 space-y-2">
                {availableTabs.map((tab) => {
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id as SettingsTab)}
                      className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="mr-3">{tab.label}</span>
                      {hasUnsavedChanges && isActive && (
                        <div className="ml-auto w-2 h-2 bg-orange-400 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* User Info */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {currentUser?.full_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {currentUser?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {permissions.userRole}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {activeTab === 'profile' && (
                <ProfileSettings
                  onSettingsChange={handleSettingsChange}
                  onSettingsSaved={handleSettingsSaved}
                />
              )}
              {activeTab === 'security' && (
                <SecuritySettings
                  onSettingsChange={handleSettingsChange}
                  onSettingsSaved={handleSettingsSaved}
                />
              )}
              {activeTab === 'preferences' && (
                <PreferencesSettings
                  onSettingsChange={handleSettingsChange}
                  onSettingsSaved={handleSettingsSaved}
                />
              )}
              {activeTab === 'notifications' && (
                <NotificationSettings
                  onSettingsChange={handleSettingsChange}
                  onSettingsSaved={handleSettingsSaved}
                />
              )}
              {activeTab === 'templates' && permissions.canCreateCustomReports && (
                <ReportTemplateSettings
                  onSettingsChange={handleSettingsChange}
                  onSettingsSaved={handleSettingsSaved}
                />
              )}
              {activeTab === 'admin' && permissions.canModifySystemSettings && (
                <AdminSettings
                  onSettingsChange={handleSettingsChange}
                  onSettingsSaved={handleSettingsSaved}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
