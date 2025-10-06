# Settings System - Developer Reference Card

Quick reference for maintaining and extending the settings system.

---

## 📁 File Structure

```
frontend/src/
├── components/
│   └── settings/
│       ├── SettingsModal.tsx          # Main modal container
│       ├── ProfileSettings.tsx         # ✅ User profile (WORKING)
│       ├── SecuritySettings.tsx        # ✅ Password change (WORKING)
│       ├── PreferencesSettings.tsx     # ✅ Theme/formats (WORKING)
│       ├── NotificationSettings.tsx    # ✅ Email/notifications (WORKING)
│       ├── AdminSettings.tsx           # ⏳ System settings (IN PROGRESS)
│       └── ReportTemplateSettings.tsx  # ⏳ Templates (NEEDS ENHANCEMENT)
├── services/
│   ├── SettingsService.ts    # Settings API client
│   └── BackendAPI.ts          # Generic API client
└── hooks/
    └── usePermissions.ts      # Role-based access control
```

---

## 🔌 API Endpoints Reference

### User Settings
```typescript
GET    /api/v1/settings/profile          // Get user settings
PUT    /api/v1/settings/profile          // Update user settings
PUT    /api/v1/settings/theme            // Quick theme update
PUT    /api/v1/settings/notifications    // Update notifications
POST   /api/v1/settings/profile/reset    // Reset to defaults
```

### System Settings (Admin Only)
```typescript
GET    /api/v1/settings/system           // Get system settings
PUT    /api/v1/settings/system/:key      // Update one setting
```

### Report Templates
```typescript
GET    /api/v1/settings/templates        // List templates
POST   /api/v1/settings/templates        // Create template
PUT    /api/v1/settings/templates/:id    // Update template
DELETE /api/v1/settings/templates/:id    // Delete template
```

### Authentication
```typescript
POST   /api/v1/auth/change-password      // Change password
POST   /api/v1/auth/forgot-password      // Request reset
POST   /api/v1/auth/reset-password       // Reset with token
```

### User Profile
```typescript
GET    /api/v1/users/profile             // Get profile
PUT    /api/v1/users/profile             // Update profile
```

---

## 🎨 Component Pattern

### Standard Settings Component Template

```typescript
import React, { useState, useEffect } from 'react';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import { SettingsService } from '../../services/SettingsService';

interface YourSettingsProps {
  onSettingsChange: () => void;
  onSettingsSaved: () => void;
}

export const YourSettings: React.FC<YourSettingsProps> = ({
  onSettingsChange,
  onSettingsSaved
}) => {
  // State management (STANDARD PATTERN)
  const [formData, setFormData] = useState({});
  const [initialData, setInitialData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Load function
  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await SettingsService.getUserSettings();
      if (result.settings) {
        setFormData(result.settings);
        setInitialData(result.settings);
      } else {
        setError(result.error || 'Failed to load');
      }
    } catch (err) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  // Save function
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await SettingsService.updateUserSettings(formData);
      if (result.settings) {
        setSuccess('Saved successfully');
        setInitialData(formData);
        setHasChanges(false);
        onSettingsSaved();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // Change handler with detection
  const handleChange = (key: string, value: any) => {
    const newData = { ...formData, [key]: value };
    setFormData(newData);
    const changed = JSON.stringify(newData) !== JSON.stringify(initialData);
    setHasChanges(changed);
    if (changed) onSettingsChange();
  };

  // Reset function
  const handleReset = () => {
    setFormData(initialData);
    setHasChanges(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <AlertCircle className="h-5 w-5 text-red-600 inline mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Your form fields here */}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          onClick={handleReset}
          disabled={saving || !hasChanges}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="px-4 py-2 border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin inline" /> : <Save />}
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
};
```

---

## 🔐 Permission Checks

### Using usePermissions Hook

```typescript
import { usePermissions } from '../../hooks/usePermissions';

const permissions = usePermissions();

// Check single permission
if (permissions.canModifySystemSettings) {
  // Show admin features
}

// Check role
if (permissions.hasRole('super_admin')) {
  // Super admin only features
}

// Check any of multiple roles
if (permissions.hasAnyRole(['manager', 'management', 'super_admin'])) {
  // Manager+ features
}

// Available permission checks:
permissions.canManageUsers
permissions.canManageProjects
permissions.canApproveTimesheets
permissions.canCreateCustomReports
permissions.canModifySystemSettings
permissions.canViewAuditLogs
// ... and more
```

---

## 🎯 Common Patterns

### Change Detection

```typescript
// Compare JSON strings for deep equality
const changed = JSON.stringify(newData) !== JSON.stringify(initialData);
setHasChanges(changed);
```

### Success Message Auto-Dismiss

```typescript
setSuccess('Operation successful');
setTimeout(() => setSuccess(null), 3000);
```

### Error Handling

```typescript
try {
  const response = await api.call();
  if (!response.success) {
    throw new Error(response.error || 'Operation failed');
  }
} catch (err) {
  setError(err instanceof Error ? err.message : 'Unexpected error');
}
```

### Loading States

```typescript
// Separate states for different operations
const [loading, setLoading] = useState(false);  // Initial load
const [saving, setSaving] = useState(false);    // Save operation
const [deleting, setDeleting] = useState(false);  // Delete operation
```

---

## 📝 TypeScript Interfaces

### UserSettings

```typescript
interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  date_format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  time_format: '12h' | '24h';
  notifications: {
    email_enabled: boolean;
    push_enabled: boolean;
    timesheet_reminders: boolean;
    approval_notifications: boolean;
    team_updates: boolean;
    system_announcements: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  display_preferences: {
    sidebar_collapsed: boolean;
    table_page_size: number;
    dashboard_widgets: string[];
  };
}
```

### SystemSetting

```typescript
interface SystemSetting {
  setting_key: string;
  setting_value: string | number | boolean | Record<string, unknown>;
  description?: string;
  category: 'general' | 'security' | 'notifications' | 'reports' | 'integration' | 'appearance';
  is_public: boolean;
  updated_by: string;
  updated_at: string;
}
```

---

## 🧪 Testing Checklist

### Per Component

- [ ] Loads data on mount
- [ ] Shows loading spinner
- [ ] Handles load errors
- [ ] Detects changes (hasChanges)
- [ ] Enables save button when changed
- [ ] Saves to backend
- [ ] Shows success message
- [ ] Handles save errors
- [ ] Resets to original values
- [ ] Clears form after save (if applicable)

### Per Role

- [ ] Super Admin sees all tabs
- [ ] Management sees appropriate tabs
- [ ] Manager sees team features
- [ ] Lead sees templates (future)
- [ ] Employee sees personal only

---

## 🐛 Common Issues & Solutions

### Issue: "Error Loading user settings"
**Cause:** Backend not running or API endpoint wrong
**Solution:** Check backend is on port 3001, verify endpoint path

### Issue: Changes don't persist
**Cause:** Not calling onSettingsSaved() callback
**Solution:** Call `onSettingsSaved()` in handleSave after success

### Issue: Save button always disabled
**Cause:** hasChanges not being set
**Solution:** Check change detection logic in handleChange

### Issue: Stale data after save
**Cause:** Not updating initialData after save
**Solution:** `setInitialData(formData)` after successful save

---

## 🚀 Adding a New Setting

### 1. Add to Interface (if new field)

```typescript
// In SettingsService.ts
interface UserSettings {
  // ... existing fields
  new_field: string;  // Add your field
}
```

### 2. Add to Component

```typescript
// In your component
const [formData, setFormData] = useState({
  new_field: 'default_value'
});

// Add UI field
<input
  value={formData.new_field}
  onChange={(e) => handleChange('new_field', e.target.value)}
/>
```

### 3. Update Backend (if needed)

```typescript
// In backend model
new_field: { type: String, default: 'default_value' }
```

---

## 📊 Performance Tips

1. **Debounce rapid changes** (for search/filter)
2. **Memoize expensive calculations** (useMemo)
3. **Batch API calls** (save all at once, not one-by-one)
4. **Cache frequently accessed settings** (in memory)
5. **Only load visible tab data** (lazy load)

---

## 🔗 Related Files

- `backend/src/routes/settings.ts` - Backend routes
- `backend/src/controllers/SettingsController.ts` - API handlers
- `backend/src/services/SettingsService.ts` - Business logic
- `backend/src/models/UserSettings.ts` - Database model
- `backend/src/seeds/systemSettings.ts` - Default settings

---

**Last Updated:** January 2025
**Maintained By:** Development Team
