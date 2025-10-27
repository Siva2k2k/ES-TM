# Timesheet Entry Workflow - Updated Implementation

## Overview
All entry types (Project, Leave, Training, Miscellaneous) now follow a **consistent workflow**: Select category → Add default entry → Edit inline in entry row.

---

## 🎯 **Unified Entry Workflow**

### **Step 1: Select Entry Category**
User clicks one of 4 entry type buttons:
```
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│📋       │ │🏖️      │ │📚       │ │🎯       │
│ Project │ │ Leave   │ │Training │ │  Misc   │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

### **Step 2: Add Entry**
Based on selected category, appropriate panel shows with "Add Entry" button:

#### **Project** (Default behavior)
```
┌────────────────────────────────────────────┐
│ Select Project: [Dropdown ▼] [Add Entry]  │
└────────────────────────────────────────────┘
```

#### **Leave**
```
┌────────────────────────────────────────────┐
│ 🏖️ Leave Entry                            │
│ Add leave entry - select session in       │
│ entry details. Bypasses project approval.  │
│                         [Add Leave Entry]  │
└────────────────────────────────────────────┘
```

#### **Miscellaneous**
```
┌────────────────────────────────────────────┐
│ 🎯 Miscellaneous Entry                     │
│ For company events/activities.             │
│ Bypasses project approval.                 │
│                    [Add Misc Entry]        │
└────────────────────────────────────────────┘
```

#### **Training**
```
┌────────────────────────────────────────────┐
│ 📚 Training Entry                          │
│ Auto-assigned to Training Program.         │
│ Follows standard approval workflow.        │
│                    [Add Training Entry]    │
└────────────────────────────────────────────┘
```

### **Step 3: Entry Added to List**
Entry appears in timesheet entries list and **auto-expands** for editing.

### **Step 4: Edit Entry Inline**
User edits entry details directly in the expanded row:
- **Project**: Select project, task, hours, billable
- **Leave**: Select date, session (morning/afternoon/full_day), hours auto-calculate
- **Training**: Select task type, hours
- **Miscellaneous**: Enter activity, hours

---

## 💻 **Technical Implementation**

### **Modified Function: `handleAddEntry()`**

**Location**: `frontend/src/components/timesheet/TimesheetForm.tsx` (lines 213-284)

```typescript
const handleAddEntry = () => {
  let newEntry: TimeEntry;

  switch (selectedEntryCategory) {
    case 'leave':
      newEntry = {
        project_id: '',
        date: weekDates[0].toISOString().split('T')[0],
        hours: 8, // Full day default
        is_billable: false,
        entry_category: 'leave',
        leave_session: 'full_day', // Default session
        // ... other fields
      };
      break;

    case 'miscellaneous':
      newEntry = {
        project_id: '',
        date: weekDates[0].toISOString().split('T')[0],
        hours: 8,
        is_billable: false,
        entry_category: 'miscellaneous',
        miscellaneous_activity: '', // User fills in
        // ... other fields
      };
      break;

    case 'training':
      newEntry = {
        project_id: '', // Auto-assigned by backend
        date: weekDates[0].toISOString().split('T')[0],
        hours: 8,
        is_billable: false,
        entry_category: 'training',
        // ... other fields
      };
      break;

    case 'project':
    default:
      newEntry = {
        project_id: selectedProject,
        date: weekDates[0].toISOString().split('T')[0],
        hours: 8,
        is_billable: true,
        entry_category: 'project',
        // ... other fields
      };
      break;
  }

  const entryWithUid = { ...newEntry, _uid: generateUid() } as any;
  addEntry(entryWithUid);
  setExpandedEntry(entries.length); // Auto-expand for editing
};
```

---

## 🎨 **UI/UX Flow**

### **Before (Separate Forms)**
```
1. Click "Leave" → Shows LeaveEntryForm component
2. Fill form → Submit → Entry added
3. Form closes
```

### **After (Unified Workflow)**
```
1. Click "Leave" → Shows info panel with "Add Leave Entry" button
2. Click "Add Leave Entry" → Default entry added to list
3. Entry auto-expands → Edit inline in entry row
4. Entry saved to timesheet
```

---

## 📋 **Entry Type Details**

### **1. Project Entry**
**Default Values:**
```typescript
{
  entry_category: 'project',
  project_id: selectedProject,
  hours: 8,
  is_billable: true,
  entry_type: 'project_task'
}
```

**User Edits:**
- Project (pre-selected)
- Task type (project_task | custom_task)
- Task ID or custom description
- Date
- Hours
- Billable toggle
- Description

**Approval Flow:** Employee → Lead → Manager → Management

---

### **2. Leave Entry**
**Default Values:**
```typescript
{
  entry_category: 'leave',
  leave_session: 'full_day',
  hours: 8,
  is_billable: false
}
```

**User Edits:**
- Date
- Session:
  - Morning → 4 hours
  - Afternoon → 4 hours
  - Full Day → 8 hours
- Description (optional)

**Approval Flow:** None (direct to timesheet)

**Validation:**
- Blocked on company holidays
- Hours auto-calculated based on session

---

### **3. Training Entry**
**Default Values:**
```typescript
{
  entry_category: 'training',
  project_id: '', // Backend auto-assigns to Training Program
  hours: 8,
  is_billable: false
}
```

**User Edits:**
- Task type (project_task | custom_task)
- Task ID or custom description
- Date
- Hours
- Description

**Approval Flow:** Employee → Lead → Manager → Management

**Backend Behavior:**
- Automatically finds "Training Program" project (project_type='training')
- If user has regular project assignment, they "graduate" from training

---

### **4. Miscellaneous Entry**
**Default Values:**
```typescript
{
  entry_category: 'miscellaneous',
  miscellaneous_activity: '',
  hours: 8,
  is_billable: false
}
```

**User Edits:**
- Activity (e.g., "Annual Company Meet", "Workshop", custom)
- Date
- Hours (0.5 - 10 hours)
- Description (optional)

**Approval Flow:** None (direct to timesheet)

**Validation:**
- Counts toward weekly validation
- Non-billable always

---

## 🔄 **State Management**

### **New State Variable:**
```typescript
const [selectedEntryCategory, setSelectedEntryCategory] =
  useState<EntryCategory>('project');
```

### **Entry Category Type:**
```typescript
type EntryCategory = 'project' | 'leave' | 'training' | 'miscellaneous';
```

### **Button Click Handler:**
```typescript
onClick={() => setSelectedEntryCategory('leave')}
// Changes active panel and button styling
```

---

## 🎨 **Visual Design**

### **Category Buttons (Active State)**
```typescript
className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
  selectedEntryCategory === 'project'
    ? 'border-blue-500 bg-blue-50 text-blue-700'  // Active
    : 'border-gray-200 bg-white text-gray-700'     // Inactive
}`}
```

### **Info Panels (Color-coded)**
- **Project**: Blue theme
- **Leave**: Green theme (bg-green-50, border-green-200)
- **Miscellaneous**: Purple theme (bg-purple-50, border-purple-200)
- **Training**: Blue theme (bg-blue-50, border-blue-200)

---

## 📦 **Removed Components from TimesheetForm**

The following components are **no longer imported** into TimesheetForm.tsx:
- `LeaveEntryForm` (still exists for standalone use)
- `MiscellaneousEntryForm` (still exists for standalone use)

**Reason:** Unified workflow means all entries are added the same way (add → edit inline), rather than using separate forms.

---

## ✅ **Benefits of Unified Workflow**

1. **Consistency**: All entry types use same add-edit pattern
2. **Simplicity**: One workflow to learn, not four different flows
3. **Flexibility**: Easy to edit entries after adding
4. **Performance**: No separate form components to load
5. **Maintainability**: Less code duplication

---

## 🧪 **Testing the Workflow**

### **Test Case 1: Add Leave Entry**
1. Navigate to Timesheet page
2. Click "🏖️ Leave" button → Green panel appears
3. Click "Add Leave Entry" → Entry added to list
4. Entry auto-expands → Shows leave fields
5. Edit session to "Morning" → Hours auto-change to 4
6. Save timesheet → Leave entry saved

**Expected:**
- ✅ Entry added with `entry_category: 'leave'`
- ✅ Default session is 'full_day' (8 hours)
- ✅ Changing session updates hours automatically
- ✅ Entry bypasses project approval

### **Test Case 2: Add Miscellaneous Entry**
1. Click "🎯 Miscellaneous" button → Purple panel appears
2. Click "Add Miscellaneous Entry" → Entry added
3. Entry auto-expands → Shows misc fields
4. Enter activity: "Annual Company Meet"
5. Set hours: 8
6. Save timesheet

**Expected:**
- ✅ Entry added with `entry_category: 'miscellaneous'`
- ✅ Activity field is editable
- ✅ Entry bypasses project approval
- ✅ Marked as non-billable

### **Test Case 3: Add Training Entry**
1. Click "📚 Training" button → Blue panel appears
2. Click "Add Training Entry" → Entry added
3. Entry auto-expands → Shows training fields
4. Select task type and hours
5. Save timesheet

**Expected:**
- ✅ Entry added with `entry_category: 'training'`
- ✅ Backend auto-assigns to Training Program project
- ✅ Follows standard approval workflow

---

## 🔗 **Related Files**

### **Modified:**
- `frontend/src/components/timesheet/TimesheetForm.tsx`
  - Added `selectedEntryCategory` state
  - Updated `handleAddEntry()` with switch statement
  - Replaced separate forms with info panels
  - Removed LeaveEntryForm/MiscellaneousEntryForm imports

### **Unchanged (Still Available for Standalone Use):**
- `frontend/src/components/timesheet/LeaveEntryForm.tsx`
- `frontend/src/components/timesheet/MiscellaneousEntryForm.tsx`
- `frontend/src/services/TimesheetService.ts` (has all entry methods)

### **Updated:**
- `frontend/src/components/timesheet/TimesheetEntryRow.tsx`
  - ✅ Added conditional rendering for leave_session field
  - ✅ Added conditional rendering for miscellaneous_activity field
  - ✅ Added appropriate controls based on entry_category
  - ✅ Implemented auto-hour calculation for leave sessions

---

## ✅ **Implementation Complete**

### **TimesheetEntryRow Updates**

The TimesheetEntryRow component has been successfully updated with conditional rendering based on `entry_category`:

**Leave Entries (`entry.entry_category === 'leave'`):**
- Session selector with 3 options: Morning (4h), Afternoon (4h), Full Day (8h)
- Auto-hour calculation when session changes
- Date picker within week range
- Read-only hours display
- Optional description field

**Miscellaneous Entries (`entry.entry_category === 'miscellaneous'`):**
- Activity input field (required)
- Date picker within week range
- Hours input (0.5-10 hours)
- Optional description field

**Training Entries (`entry.entry_category === 'training'`):**
- Read-only "Training Program (Auto-assigned)" display
- Entry type selector (project_task/custom_task)
- Task selection or custom task description
- Date picker, hours input, description

**Project Entries (`entry.entry_category === 'project'`):**
- All standard project fields (unchanged)
- Entry type, task/custom task, date, hours, description, billable checkbox

---

**Implementation Date**: 2025-01-27
**Status**: ✅ Complete - All Components Implemented
**Build Status**: ✅ Passing (15.95s)

