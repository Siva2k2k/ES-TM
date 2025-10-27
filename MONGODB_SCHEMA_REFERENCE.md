# 📊 MongoDB Schema Reference

## Database: timesheet-management

### Quick Stats

- **Total Collections**: 21
- **Backend Models**: 21 TypeScript models
- **Schema Language**: Mongoose (MongoDB ODM)
- **Database Size**: ~varies based on data
- **Primary Use**: Enterprise Timesheet Management System

---

## 🗂️ Collections Overview

### **1. User Management**

#### `users`

Primary user authentication and profile management

```typescript
{
  _id: ObjectId,
  email: string (unique, indexed),
  full_name: string,
  role: 'super_admin' | 'management' | 'manager' | 'lead' | 'employee',
  hourly_rate: number,
  is_active: boolean,
  is_approved_by_super_admin: boolean,
  manager_id?: ObjectId (ref: User),
  password_hash: string,

  // Security fields
  temporary_password?: string,
  password_expires_at?: Date,
  is_temporary_password: boolean,
  password_reset_token?: string,
  password_reset_expires?: Date,
  failed_login_attempts: number,
  last_failed_login?: Date,
  account_locked_until?: Date,
  last_password_change?: Date,
  force_password_change: boolean,

  // Soft/hard delete
  deleted_at?: Date,
  deleted_by?: ObjectId,
  deleted_reason?: string,
  is_hard_deleted: boolean,
  hard_deleted_at?: Date,
  hard_deleted_by?: ObjectId,

  created_at: Date,
  updated_at: Date
}
```

**Indexes**: email (unique), role, is_active, manager_id, deleted_at, password_reset_token

---

### **2. Client & Project Management**

#### `clients`

Client company information

```typescript
{
  _id: ObjectId,
  name: string (indexed),
  contact_person?: string,
  contact_email?: string,
  is_active: boolean (indexed),
  deleted_at?: Date (indexed),
  deleted_by?: string,
  deleted_reason?: string,
  is_hard_deleted?: boolean,
  hard_deleted_at?: Date,
  hard_deleted_by?: string,
  created_at: Date,
  updated_at: Date
}
```

**Indexes**: name, is_active, deleted_at

#### `projects`

Project information with type classification

```typescript
{
  _id: ObjectId,
  name: string,
  client_id: ObjectId (ref: Client, indexed),
  primary_manager_id: ObjectId (ref: User, indexed),
  status: 'active' | 'completed' | 'archived' (indexed),
  project_type: 'regular' | 'internal' | 'training' (indexed),
  start_date: Date,
  end_date?: Date,
  budget?: number,
  description?: string,
  is_billable: boolean,
  approval_settings?: {
    lead_approval_auto_escalates: boolean
  },
  deleted_at?: Date (indexed),
  deleted_by?: string,
  deleted_reason?: string,
  is_hard_deleted?: boolean,
  hard_deleted_at?: Date,
  hard_deleted_by?: string,
  created_at: Date,
  updated_at: Date
}
```

**Indexes**: client_id, primary_manager_id, status, project_type, deleted_at
**Compound**: (project_type, status)

#### `projectmembers`

Project-user relationship with roles

```typescript
{
  _id: ObjectId,
  project_id: ObjectId (ref: Project, indexed),
  user_id: ObjectId (ref: User, indexed),
  project_role: 'super_admin' | 'management' | 'manager' | 'lead' | 'employee' (indexed),
  is_primary_manager: boolean,
  is_secondary_manager: boolean,
  assigned_at: Date,
  removed_at?: Date,
  deleted_at?: Date (indexed),
  created_at: Date,
  updated_at: Date
}
```

**Indexes**: project_id, user_id, project_role, deleted_at
**Unique**: (project_id, user_id)

#### `tasks`

Project task definitions

```typescript
{
  _id: ObjectId,
  project_id: ObjectId (ref: Project),
  name: string,
  description?: string,
  estimated_hours?: number,
  is_active: boolean,
  created_at: Date,
  updated_at: Date
}
```

---

### **3. Timesheet System**

#### `timesheets`

Weekly timesheet records with approval workflow

```typescript
{
  _id: ObjectId,
  user_id: ObjectId (ref: User, indexed),
  week_start_date: Date (indexed),
  week_end_date: Date,
  total_hours: number,
  status: 'draft' | 'submitted' | 'lead_approved' | 'lead_rejected' |
          'manager_approved' | 'manager_rejected' | 'management_pending' |
          'management_rejected' | 'frozen' | 'billed' (indexed),

  // Extended week handling
  is_extended_week: boolean,
  actual_days_count: number (1-14),

  // Lead approval
  approved_by_lead_id?: ObjectId (ref: User),
  approved_by_lead_at?: Date,
  lead_rejection_reason?: string,
  lead_rejected_at?: Date,

  // Manager approval
  approved_by_manager_id?: ObjectId (ref: User),
  approved_by_manager_at?: Date,
  manager_rejection_reason?: string,
  manager_rejected_at?: Date,

  // Management approval
  approved_by_management_id?: ObjectId (ref: User),
  approved_by_management_at?: Date,
  management_rejection_reason?: string,
  management_rejected_at?: Date,

  // Verification
  verified_by_id?: ObjectId (ref: User),
  verified_at?: Date,
  is_verified: boolean,
  is_frozen: boolean,

  // Billing
  billing_snapshot_id?: ObjectId,

  submitted_at?: Date (indexed),
  deleted_at?: Date (indexed),
  deleted_by?: ObjectId,
  deleted_reason?: string,
  is_hard_deleted: boolean,
  hard_deleted_at?: Date,
  hard_deleted_by?: ObjectId,

  created_at: Date,
  updated_at: Date
}
```

**Unique**: (user_id, week_start_date)
**Indexes**: status, week_start_date, submitted_at, deleted_at
**Compound**: (status, submitted_at) with filter

#### `timeentries`

Individual time entry records

```typescript
{
  _id: ObjectId,
  timesheet_id: ObjectId (ref: Timesheet, indexed),
  entry_category: 'project' | 'leave' | 'training' | 'miscellaneous' (indexed),

  // For project/training
  project_id?: ObjectId (ref: Project, indexed),
  task_type?: 'project_task' | 'custom_task',
  task_id?: ObjectId (ref: Task, indexed),
  custom_task_description?: string,

  // For leave
  leave_session?: 'morning' | 'afternoon' | 'full_day',

  // For miscellaneous
  miscellaneous_activity?: string,

  // Common
  date: Date (indexed),
  hours: number (0-24),
  description?: string,
  is_billable: boolean,
  billable_hours?: number (0-24),
  hourly_rate?: number,

  // Rejection
  is_rejected?: boolean,
  rejection_reason?: string,
  rejected_at?: Date,
  rejected_by?: ObjectId (ref: User),

  deleted_at?: Date (indexed),
  created_at: Date,
  updated_at: Date
}
```

**Indexes**: timesheet_id, project_id, task_id, date, deleted_at, entry_category
**Compound**: (timesheet_id, date), (timesheet_id, entry_category), (project_id, date), (entry_category, date)

#### `approvalhistories`

Complete approval workflow history

```typescript
{
  _id: ObjectId,
  timesheet_id: ObjectId (ref: Timesheet),
  approver_id: ObjectId (ref: User),
  approver_role: string,
  action: 'submitted' | 'approved' | 'rejected' | 'resubmitted',
  status_before: string,
  status_after: string,
  comments?: string,
  action_date: Date,
  created_at: Date,
  updated_at: Date
}
```

#### `timesheetprojectapprovals`

Project-level approval tracking

```typescript
{
  _id: ObjectId,
  timesheet_id: ObjectId (ref: Timesheet),
  project_id: ObjectId (ref: Project),
  user_id: ObjectId (ref: User),
  lead_id?: ObjectId (ref: User),
  manager_id?: ObjectId (ref: User),
  status: string,
  lead_status?: string,
  manager_status?: string,
  // ... approval fields
  created_at: Date,
  updated_at: Date
}
```

---

### **4. Billing System**

#### `billingrates`

Flexible rate management system

```typescript
{
  _id: ObjectId,
  entity_type: 'global' | 'client' | 'project' | 'user' | 'role' (indexed),
  entity_id?: ObjectId (indexed),
  rate_type: 'hourly' | 'fixed' | 'milestone',

  // Rates
  standard_rate: number,
  overtime_rate?: number,
  holiday_rate?: number,
  weekend_rate?: number,

  // Validity
  effective_from: Date (indexed),
  effective_to?: Date (indexed),

  // Billing rules
  minimum_increment: number (minutes),
  rounding_rule: 'up' | 'down' | 'nearest',

  description?: string,
  is_active: boolean (indexed),
  created_by: ObjectId (ref: User),
  deleted_at?: Date (indexed),
  created_at: Date,
  updated_at: Date
}
```

**Indexes**: entity_type, entity_id, effective_from, effective_to, is_active, created_by, deleted_at
**Compound**: (entity_type, entity_id, effective_from), (is_active, effective_from, effective_to)

#### `billingadjustments`

Manual billing modifications

```typescript
{
  _id: ObjectId,
  scope: 'user' | 'project' | 'timesheet',
  user_id?: ObjectId (ref: User),
  project_id?: ObjectId (ref: Project),
  timesheet_id?: ObjectId (ref: Timesheet),
  adjustment_type: 'rate_override' | 'hour_adjustment' | 'discount' | 'penalty',
  amount: number,
  reason: string,
  applied_by: ObjectId (ref: User),
  applied_at: Date,
  is_active: boolean,
  created_at: Date,
  updated_at: Date
}
```

#### `billingsnapshots`

Frozen billing records for invoicing

```typescript
{
  _id: ObjectId,
  snapshot_date: Date,
  timesheet_ids: ObjectId[],
  project_id: ObjectId (ref: Project),
  user_id: ObjectId (ref: User),
  total_hours: number,
  billable_hours: number,
  total_amount: number,
  rate_used: number,
  adjustments?: any[],
  frozen_by: ObjectId (ref: User),
  is_finalized: boolean,
  created_at: Date,
  updated_at: Date
}
```

#### `invoices`

Invoice generation and tracking

```typescript
{
  _id: ObjectId,
  invoice_number: string,
  client_id: ObjectId (ref: Client),
  project_id?: ObjectId (ref: Project),
  billing_snapshot_ids: ObjectId[],
  invoice_date: Date,
  due_date: Date,
  subtotal: number,
  tax_rate: number,
  tax_amount: number,
  total_amount: number,
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled',
  payment_date?: Date,
  notes?: string,
  created_by: ObjectId (ref: User),
  created_at: Date,
  updated_at: Date
}
```

---

### **5. Company Settings**

#### `companyholidays`

Holiday calendar management

```typescript
{
  _id: ObjectId,
  name: string,
  date: Date,
  is_recurring: boolean,
  holiday_type: 'national' | 'company' | 'optional',
  description?: string,
  created_at: Date,
  updated_at: Date
}
```

#### `systemsettings`

Global system configuration

```typescript
{
  _id: ObjectId,
  key: string (unique),
  value: any,
  category: string,
  description?: string,
  is_public: boolean,
  created_at: Date,
  updated_at: Date
}
```

#### `usersettings`

User-specific preferences

```typescript
{
  _id: ObjectId,
  user_id: ObjectId (ref: User, unique),
  theme: string,
  notifications_enabled: boolean,
  timezone?: string,
  date_format?: string,
  time_format?: string,
  created_at: Date,
  updated_at: Date
}
```

---

### **6. Notifications**

#### `notifications`

User notification system

```typescript
{
  _id: ObjectId,
  user_id: ObjectId (ref: User),
  type: string,
  title: string,
  message: string,
  related_entity?: {
    type: string,
    id: ObjectId
  },
  is_read: boolean,
  read_at?: Date,
  created_at: Date,
  updated_at: Date
}
```

#### `notificationsettings`

User notification preferences

```typescript
{
  _id: ObjectId,
  user_id: ObjectId (ref: User, unique),
  email_notifications: boolean,
  push_notifications: boolean,
  notification_types: {
    [key: string]: boolean
  },
  created_at: Date,
  updated_at: Date
}
```

---

### **7. Audit & Reports**

#### `auditlogs`

Complete audit trail

```typescript
{
  _id: ObjectId,
  user_id?: ObjectId (ref: User),
  action: string,
  entity_type: string,
  entity_id?: ObjectId,
  changes?: any,
  ip_address?: string,
  user_agent?: string,
  timestamp: Date,
  created_at: Date
}
```

#### `reporttemplates`

Saved report configurations

```typescript
{
  _id: ObjectId,
  name: string,
  type: string,
  filters: any,
  columns: string[],
  created_by: ObjectId (ref: User),
  is_public: boolean,
  created_at: Date,
  updated_at: Date
}
```

#### `searchindices`

Search optimization

```typescript
{
  _id: ObjectId,
  entity_type: string,
  entity_id: ObjectId,
  search_text: string (text index),
  metadata: any,
  updated_at: Date
}
```

---

## 🔍 Key Schema Features

### Relationships

- **One-to-Many**: User → Timesheets, Client → Projects, Project → Tasks
- **Many-to-Many**: Users ↔ Projects (via ProjectMembers)
- **Hierarchical**: User.manager_id (self-referencing)

### Indexing Strategy

- **Single Field**: Email, status, dates
- **Compound**: (user_id, week_start_date), (entity_type, entity_id)
- **Unique**: (user_id, week_start_date), (project_id, user_id)
- **Sparse**: deleted_at, password_reset_token
- **Text**: search_text in searchindices

### Data Integrity

- **Soft Delete**: deleted_at field in most collections
- **Hard Delete**: is_hard_deleted flag for permanent removal
- **Audit Trail**: created_at, updated_at, approvalhistories
- **Validation**: Pre-save hooks for business logic

### Security Features

- **Password Security**: password_hash, temporary_password, reset tokens
- **Account Locking**: failed_login_attempts, account_locked_until
- **Field Exclusion**: password fields never returned in queries
- **Role-Based**: 5-level hierarchy (super_admin → employee)

---

## 📝 Schema Best Practices Implemented

✅ **Mongoose ODM with TypeScript** - Type-safe models  
✅ **Indexes on frequently queried fields** - Performance optimization  
✅ **Soft delete pattern** - Data recovery capability  
✅ **Timestamp automation** - created_at/updated_at  
✅ **Reference integrity** - ObjectId refs with proper types  
✅ **Validation at schema level** - Pre-save hooks  
✅ **Virtual fields** - ID as string for JSON output  
✅ **Compound indexes** - Multi-field query optimization  
✅ **Sparse indexes** - Optional field indexing

---

## 🚀 Ready for Atlas Migration

This schema is **production-ready** and optimized for MongoDB Atlas with:

- Proper indexing for cloud performance
- Efficient document structure
- Scalable relationship patterns
- Security best practices
- Audit and compliance features

Follow the **MONGODB_ATLAS_MIGRATION_GUIDE.md** for migration steps.
