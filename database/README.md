# Timesheet Approval System - Database Schema Documentation

## Overview

This database schema provides a comprehensive timesheet approval system built on **Supabase PostgreSQL** with role-based access control, multi-level approval workflow, audit logging, and billing integration. The system features recursion-free Row Level Security (RLS) policies and JWT-based authentication.

### User Roles

- **Super Admin**: Complete system administration and oversight
- **Management**: Executive level access, final approvals and billing
- **Manager**: Team and project management, first-level approvals
- **Lead**: Team leadership with read-only timesheet access
- **Employee**: Individual timesheet creation and management

## Architecture

### Single Migration File

All database components are consolidated into one comprehensive migration file:

- **`migration.sql`**: Complete database schema with tables, functions, policies, and sample data

### Core Features

- ✅ **Recursion-Free RLS**: JWT-based role checking prevents infinite loops
- ✅ **Comprehensive Audit Trail**: Complete activity logging with user attribution
- ✅ **Soft Delete Support**: Data preservation with deleted_at timestamps
- ✅ **Email Notifications**: Built-in email queue system
- ✅ **Billing Integration**: Snapshot generation and billing workflow
- ✅ **Performance Optimized**: Strategic indexing for role-based queries

### Approval Workflow

```
draft → submitted → manager_approved → management_pending → frozen → billed
         ↓              ↓                    ↓
    manager_rejected  management_rejected   (Final State)
```

**Status Definitions:**

- `draft`: Editable by owner
- `submitted`: Pending manager review
- `manager_approved`: Can be escalated to management
- `management_pending`: Awaiting management approval
- `frozen`: Management approved, verified and locked
- `billed`: Final billing complete
- `*_rejected`: Returned to draft for revision

## Installation

### 1. Supabase Setup

1. **Create Supabase Project**

   - Sign up at [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Run Migration**

   ```sql
   -- In Supabase SQL Editor, execute the complete migration
   -- Copy and paste the entire contents of migration.sql
   ```

3. **Verify Installation**

   ```sql
   -- Check tables are created
   SELECT tablename FROM pg_tables WHERE schemaname = 'public';

   -- Verify sample users
   SELECT email, full_name, role FROM users WHERE deleted_at IS NULL;
   ```

### 2. Environment Configuration

```env
# Frontend (.env)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Test Users (Pre-created)

The migration includes test users for immediate development:

| Role        | Email                | Password | User ID                                |
| ----------- | -------------------- | -------- | -------------------------------------- |
| Super Admin | admin@company.com    | 12345678 | `11111111-1111-1111-1111-111111111111` |
| Management  | ceo@company.com      | 12345678 | `576a5cbf-0a48-42cb-8ba8-8fee00805dbf` |
| Manager     | manager@company.com  | 12345678 | `a001465b-d049-42a4-a0f7-24ade37113ec` |
| Lead        | lead@company.com     | 12345678 | `f4854104-f9ac-44df-b1a5-872a82184754` |
| Employee    | employee@company.com | 12345678 | `21b62b61-59e2-4db1-ba3a-f162c90e4995` |

## Core Database Schema

### Data Types (Enums)

```sql
-- User roles (matches frontend UserRole type)
CREATE TYPE user_role AS ENUM (
  'super_admin', 'management', 'manager', 'lead', 'employee'
);

-- Timesheet status (matches frontend TimesheetStatus type)
CREATE TYPE timesheet_status AS ENUM (
  'draft', 'submitted', 'manager_approved', 'manager_rejected',
  'management_pending', 'management_rejected', 'frozen', 'billed'
);

-- Project status (matches frontend ProjectStatus type)
CREATE TYPE project_status AS ENUM ('active', 'completed', 'archived');

-- Entry types
CREATE TYPE entry_type AS ENUM ('project_task', 'custom_task');

-- Audit actions (matches frontend AuditAction type)
CREATE TYPE audit_action AS ENUM (
  'INSERT', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'VERIFY',
  'FREEZE', 'SUBMIT', 'ESCALATE', 'USER_LOGIN', 'USER_LOGOUT',
  'USER_CREATED', 'USER_APPROVED', 'TIMESHEET_SUBMITTED',
  'TIMESHEET_APPROVED', 'PROJECT_CREATED', 'BILLING_APPROVED',
  'ROLE_SWITCHED', 'PERMISSION_DENIED', 'DATA_EXPORT'
);
```

### Core Tables

#### Users Table

```sql
users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_approved_by_super_admin BOOLEAN NOT NULL DEFAULT false,
  manager_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
)
```

#### Timesheets Table

```sql
timesheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  total_hours DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  status timesheet_status NOT NULL DEFAULT 'draft',

  -- Manager approval fields
  approved_by_manager_id UUID REFERENCES users(id),
  approved_by_manager_at TIMESTAMPTZ,
  manager_rejection_reason TEXT,

  -- Management approval fields
  approved_by_management_id UUID REFERENCES users(id),
  approved_by_management_at TIMESTAMPTZ,
  management_rejection_reason TEXT,

  -- Verification/billing fields
  verified_by_id UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_frozen BOOLEAN NOT NULL DEFAULT false,
  billing_snapshot_id UUID,

  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  UNIQUE(user_id, week_start_date)
)
```

#### Time Entries Table

```sql
time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timesheet_id UUID NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  task_id UUID REFERENCES tasks(id),
  date DATE NOT NULL,
  hours DECIMAL(6,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
  description TEXT,
  is_billable BOOLEAN NOT NULL DEFAULT true,
  custom_task_description TEXT,
  entry_type entry_type NOT NULL DEFAULT 'project_task',
  hourly_rate DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
)
```

#### Supporting Tables

- **clients**: Client information and contacts
- **projects**: Project details with client and manager references
- **project_members**: Team assignments with role definitions
- **tasks**: Project tasks and assignments
- **billing_snapshots**: Historical billing data
- **audit_logs**: Comprehensive system activity tracking
- **timesheet_approval_history**: Detailed approval workflow history
- **email_notifications**: Email queue management

## Usage Examples

### 1. Timesheet Management

```sql
-- Submit timesheet for approval
SELECT submit_timesheet('timesheet-uuid');

-- Calculate timesheet totals
SELECT calculate_timesheet_totals('timesheet-uuid');

-- Get user timesheets with filtering
SELECT api_get_user_timesheets(
  'user-uuid',                    -- target user (NULL for current user)
  ARRAY['submitted', 'frozen'],   -- status filter
  '2024-08-01',                   -- week start filter
  50,                             -- limit
  0                               -- offset
);
```

### 2. Approval Workflow

```sql
-- Manager approval/rejection
SELECT manager_approve_reject_timesheet(
  'timesheet-uuid',
  'approve',                      -- 'approve' or 'reject'
  NULL                           -- reason (required for rejection)
);

-- Management approval/rejection
SELECT management_approve_reject_timesheet(
  'timesheet-uuid',
  'approve',                      -- 'approve' or 'reject'
  'Approved for billing'         -- reason (optional)
);

-- Escalate to management
SELECT escalate_to_management('timesheet-uuid');

-- Mark as billed
SELECT mark_timesheet_billed('timesheet-uuid');
```

### 3. User Management

```sql
-- Create user with email notification
SELECT create_user_with_notification(
  'newuser@company.com',          -- email
  'John Doe',                     -- full name
  'employee',                     -- role
  60.00,                          -- hourly rate
  'manager-uuid',                 -- manager (optional)
  'temp123'                       -- temporary password
);

-- Approve user (super admin only)
SELECT approve_user('user-uuid', 'welcome123');

-- Get unapproved users
SELECT api_get_unapproved_users();
```

### 4. Data Management

```sql
-- Soft delete with audit trail
SELECT soft_delete_with_audit(
  'projects',                     -- table name
  'project-uuid',                 -- record ID
  'No longer needed'              -- reason
);

-- Hard delete (super admin only)
SELECT hard_delete_record(
  'users',                        -- table name
  'user-uuid',                    -- record ID
  'GDPR compliance deletion'      -- required reason
);

-- Safe client deletion (checks dependencies)
SELECT safe_delete_client('client-uuid');

-- Archive project instead of deletion
SELECT archive_project('project-uuid');
```

## Supabase Integration

### Authentication with JWT

The system uses Supabase's built-in JWT authentication with custom role claims:

```javascript
// Frontend: Supabase client automatically handles JWT
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  }
);

// JWT claims automatically include user role for RLS
```

### Row Level Security (RLS)

All tables have comprehensive RLS policies that use JWT-based role checking:

```sql
-- Example: Users can only see their own data or data they can manage
CREATE POLICY users_select_policy ON users FOR SELECT TO authenticated
USING (
  deleted_at IS NULL AND (
    id = auth.uid() OR -- Own record
    can_manage_role_hierarchy(get_current_user_role(), get_user_role_safe(id))
  )
);
```

### Key Functions for RLS

```sql
-- Get current user role from JWT (no database queries)
SELECT get_current_user_role();

-- Get user role safely (bypasses RLS to prevent recursion)
SELECT get_user_role_safe('user-uuid');

-- Check role management hierarchy
SELECT can_manage_role_hierarchy('manager', 'employee'); -- returns true
```

## Security Features

### Recursion-Free RLS Policies

The system implements a sophisticated security model that prevents RLS recursion:

- **JWT-Based Role Checking**: Uses `get_current_user_role()` to read from JWT claims
- **Safe User Queries**: Uses `get_user_role_safe()` with SECURITY DEFINER to bypass RLS
- **Hierarchical Permissions**: Role hierarchy checking without table queries

### Permission Matrix

| Role        | Own Data | Team Data | All Users | Projects      | Billing     | Admin |
| ----------- | -------- | --------- | --------- | ------------- | ----------- | ----- |
| Super Admin | ✅       | ✅        | ✅        | ✅            | ✅          | ✅    |
| Management  | ✅       | ✅        | View Only | Create/Edit   | Full Access | No    |
| Manager     | ✅       | ✅        | View Team | Assigned Only | View Only   | No    |
| Lead        | ✅       | View Only | View Team | View Only     | No Access   | No    |
| Employee    | ✅       | No        | No        | View Assigned | No Access   | No    |

### Audit Logging

Comprehensive audit trail with automatic logging:

```sql
-- All critical operations are automatically logged
INSERT INTO audit_logs (
  table_name, record_id, action, actor_id, actor_name,
  timestamp, details, old_data, new_data
) VALUES (...);

-- Timesheet approval history tracks every status change
INSERT INTO timesheet_approval_history (
  timesheet_id, action, performed_by, performer_name,
  from_status, to_status, reason, performed_at
) VALUES (...);
```

### Data Integrity

- **Triggers**: Automatic timestamp updates and validation
- **Constraints**: Business rule enforcement (hours <= 24, valid date ranges)
- **Referential Integrity**: Proper foreign key relationships with CASCADE rules
- **Soft Delete**: Data preservation with `deleted_at` timestamps

## Performance Considerations

### Strategic Indexing

The migration includes optimized indexes for common query patterns:

```sql
-- Role-based queries
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_timesheets_status ON timesheets(status) WHERE deleted_at IS NULL;

-- Approval queue optimization
CREATE INDEX idx_timesheets_approval_queue ON timesheets(status)
WHERE status IN ('submitted', 'manager_approved', 'management_pending')
AND deleted_at IS NULL;

-- Date-based queries
CREATE INDEX idx_timesheets_user_date ON timesheets(user_id, week_start_date)
WHERE deleted_at IS NULL;

-- Project member queries
CREATE INDEX idx_project_members_project ON project_members(project_id)
WHERE deleted_at IS NULL;
```

### Query Optimization

- **Function-Based APIs**: Use provided functions instead of direct table access
- **Prepared Statements**: Automatic query plan caching in Supabase
- **Pagination Support**: Built-in limit/offset parameters in API functions
- **Filtered Indexes**: Partial indexes exclude soft-deleted records

### Supabase Performance Features

- **Connection Pooling**: Automatic connection management
- **Query Caching**: Built-in query result caching
- **CDN Integration**: Static asset optimization
- **Real-time Subscriptions**: Efficient live updates

## Maintenance & Monitoring

### Built-in Monitoring

```sql
-- Check system health
SELECT
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_active THEN 1 END) as active_users,
  COUNT(CASE WHEN role = 'employee' THEN 1 END) as employees,
  COUNT(CASE WHEN is_approved_by_super_admin = false THEN 1 END) as pending_approval
FROM users
WHERE deleted_at IS NULL;

-- Monitor approval queue
SELECT
  status,
  COUNT(*) as count,
  AVG(EXTRACT(days FROM NOW() - submitted_at)) as avg_days_pending
FROM timesheets
WHERE status IN ('submitted', 'manager_approved', 'management_pending')
AND deleted_at IS NULL
GROUP BY status;

-- Audit activity summary
SELECT
  DATE(timestamp) as date,
  action,
  COUNT(*) as count
FROM audit_logs
WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(timestamp), action
ORDER BY date DESC, count DESC;
```

### Regular Maintenance Tasks

1. **Email Queue Processing**: Monitor `email_notifications` table for failed sends
2. **Audit Log Archival**: Archive old audit logs to prevent table bloat
3. **Performance Monitoring**: Review slow query logs in Supabase dashboard
4. **Backup Verification**: Ensure automated backups are functioning

### Data Cleanup Queries

```sql
-- Archive old audit logs (keep last 6 months)
UPDATE audit_logs
SET deleted_at = NOW()
WHERE timestamp < CURRENT_DATE - INTERVAL '6 months'
AND deleted_at IS NULL;

-- Clean up old email notifications (keep last 30 days)
DELETE FROM email_notifications
WHERE created_at < CURRENT_DATE - INTERVAL '30 days'
AND status = 'sent';

-- Find orphaned time entries
SELECT te.id, te.timesheet_id
FROM time_entries te
LEFT JOIN timesheets t ON te.timesheet_id = t.id
WHERE t.id IS NULL OR t.deleted_at IS NOT NULL;
```

````

## Advanced Features

### Email Notification System

Built-in email queue with retry logic:

```sql
-- Queue email notification
SELECT queue_email_notification(
  'user@company.com',             -- recipient email
  'User Account Created',         -- subject
  'Your account has been...',     -- body text
  '<html>...</html>',             -- body HTML (optional)
  'user_creation',                -- email type
  'user-uuid'                     -- related record ID
);

-- Generate user creation email
SELECT generate_user_creation_email(
  'newuser@company.com',          -- user email
  'John Doe',                     -- user name
  'temp123',                      -- temporary password
  'Manager Smith'                 -- creator name
);
````

### Client and Project Management

```sql
-- Get clients with statistics
SELECT api_get_clients_with_stats(
  false,                          -- include inactive
  50,                             -- limit
  0                               -- offset
);

-- Safe client deletion with dependency checking
SELECT safe_delete_client('client-uuid');

-- Archive project instead of deletion
SELECT archive_project('project-uuid');
```

### Billing Integration

```sql
-- Create billing snapshot when timesheet is frozen
INSERT INTO billing_snapshots (
  timesheet_id, user_id, week_start_date, week_end_date,
  total_hours, billable_hours, hourly_rate,
  total_amount, billable_amount, snapshot_data
) VALUES (...);

-- Query billing data
SELECT
  bs.*,
  u.full_name,
  t.status
FROM billing_snapshots bs
JOIN users u ON bs.user_id = u.id
JOIN timesheets t ON bs.timesheet_id = t.id
WHERE bs.week_start_date >= '2024-08-01'
AND bs.deleted_at IS NULL;
```

## Troubleshooting

### Common Issues

1. **RLS Permission Denied**

   ```sql
   -- Check if user is authenticated
   SELECT auth.uid(); -- Should return user UUID

   -- Verify user role
   SELECT get_current_user_role();

   -- Check user exists and is active
   SELECT id, role, is_active FROM users WHERE id = auth.uid();
   ```

2. **Invalid Status Transitions**

   ```sql
   -- Check current timesheet status
   SELECT id, status, user_id FROM timesheets WHERE id = 'timesheet-uuid';

   -- View approval history
   SELECT * FROM timesheet_approval_history
   WHERE timesheet_id = 'timesheet-uuid'
   ORDER BY performed_at DESC;
   ```

3. **Function Permission Errors**
   ```sql
   -- Verify function grants
   SELECT routine_name, grantee, privilege_type
   FROM information_schema.routine_privileges
   WHERE routine_name LIKE '%timesheet%';
   ```

### Debug Queries

```sql
-- Check RLS policies on a table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'timesheets';

-- Verify user role hierarchy
SELECT
  u1.email as user_email,
  u1.role as user_role,
  u2.email as manager_email,
  u2.role as manager_role
FROM users u1
LEFT JOIN users u2 ON u1.manager_id = u2.id
WHERE u1.deleted_at IS NULL;

-- Check timesheet permissions for specific user
SELECT
  t.id,
  t.user_id,
  t.status,
  u.full_name,
  u.role,
  can_manage_role_hierarchy(get_current_user_role(), u.role) as can_manage
FROM timesheets t
JOIN users u ON t.user_id = u.id
WHERE t.deleted_at IS NULL
LIMIT 10;
```

### Error Handling Patterns

```javascript
// Frontend error handling for Supabase calls
try {
  const { data, error } = await supabase.rpc("submit_timesheet", {
    timesheet_uuid: timesheetId,
  });

  if (error) {
    if (error.message.includes("Access denied")) {
      return { error: "Insufficient permissions" };
    }
    if (error.message.includes("Invalid status transition")) {
      return { error: "Timesheet cannot be submitted in current status" };
    }
    throw error;
  }

  return { success: true, data };
} catch (error) {
  console.error("Timesheet submission error:", error);
  return { error: "Submission failed" };
}
```

## Migration & Deployment

### Database Migration Process

1. **Backup Current State** (if upgrading)

   ```sql
   -- In Supabase dashboard or via CLI
   supabase db dump > backup_$(date +%Y%m%d).sql
   ```

2. **Apply Migration**

   ```sql
   -- Copy entire migration.sql content into Supabase SQL Editor
   -- Execute in one transaction for consistency
   ```

3. **Verify Migration**

   ```sql
   -- Check all tables exist
   SELECT count(*) FROM information_schema.tables
   WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

   -- Verify RLS is enabled
   SELECT tablename, rowsecurity FROM pg_tables
   WHERE schemaname = 'public' AND rowsecurity = true;

   -- Test sample data
   SELECT count(*) FROM users WHERE deleted_at IS NULL;
   ```

### Environment-Specific Considerations

**Development Environment:**

- Use test user credentials provided in migration
- Enable additional logging for debugging
- Consider disabling email notifications

**Staging Environment:**

- Use production-like data volumes
- Test approval workflows end-to-end
- Validate RLS policies with different user roles

**Production Environment:**

- Apply migration during maintenance window
- Monitor performance after deployment
- Enable all security features
- Set up regular backups

### Version Control

```sql
-- Track schema version (add to migration)
CREATE TABLE IF NOT EXISTS schema_version (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT
);

INSERT INTO schema_version (version, description)
VALUES ('1.0.0', 'Initial timesheet system migration');
```

## Best Practices

### Database Operations

1. **Use API Functions**: Always use provided functions rather than direct table manipulation

   ```sql
   -- ✅ Good: Use function
   SELECT submit_timesheet('timesheet-uuid');

   -- ❌ Bad: Direct update
   UPDATE timesheets SET status = 'submitted' WHERE id = 'timesheet-uuid';
   ```

2. **Handle Exceptions Properly**: All functions use PostgreSQL exceptions for business rules

   ```javascript
   try {
     const { data, error } = await supabase.rpc("submit_timesheet", {
       timesheet_uuid: id,
     });
     if (error) throw error;
   } catch (error) {
     // Handle specific business rule violations
     if (error.message.includes("zero hours")) {
       setError("Cannot submit timesheet with no time entries");
     }
   }
   ```

3. **Leverage RLS**: Never bypass RLS policies in application code

   ```sql
   -- RLS automatically filters data based on user permissions
   SELECT * FROM timesheets; -- Only returns accessible timesheets
   ```

4. **Audit Everything**: Critical operations are automatically audited
   ```sql
   -- Check what happened with audit logs
   SELECT actor_name, action, details, timestamp
   FROM audit_logs
   WHERE record_id = 'specific-record-id'
   ORDER BY timestamp DESC;
   ```

### Security Guidelines

1. **JWT Integration**: Let Supabase handle authentication automatically
2. **Role Validation**: Use `get_current_user_role()` for role-based logic
3. **Input Validation**: Validate data both client-side and database-side
4. **Principle of Least Privilege**: Users only see data they need
5. **Audit Trail**: All actions are tracked with user attribution

### Performance Guidelines

1. **Use Indexes**: Migration includes optimized indexes for common queries
2. **Paginate Results**: Use limit/offset parameters in API functions
3. **Monitor Slow Queries**: Use Supabase dashboard for query analysis
4. **Cache Static Data**: Cache role definitions, project lists, etc.

### Development Workflow

1. **Test with Sample Data**: Use provided test users for development
2. **Role-Based Testing**: Test functionality with different user roles
3. **Error Scenario Testing**: Test permission denied and invalid state scenarios
4. **Monitor RLS**: Ensure policies work correctly for all roles

This schema provides a production-ready foundation for a comprehensive timesheet approval system with enterprise-grade security, performance, and maintainability features, fully integrated with Supabase's modern Backend-as-a-Service platform.

## Quick Reference

### Key Functions

- `submit_timesheet(uuid)` - Submit timesheet for approval
- `manager_approve_reject_timesheet(uuid, action, reason)` - Manager level approval
- `management_approve_reject_timesheet(uuid, action, reason)` - Management approval
- `escalate_to_management(uuid)` - Escalate approved timesheet
- `mark_timesheet_billed(uuid)` - Mark as billed
- `create_user_with_notification(email, name, role, rate, manager, password)` - Create user
- `api_get_user_timesheets(user, statuses, date, limit, offset)` - Get timesheets

### Key Tables

- `users` - User accounts and roles
- `timesheets` - Weekly timesheet records
- `time_entries` - Individual time entries
- `projects` - Project information
- `audit_logs` - System activity tracking
- `timesheet_approval_history` - Approval workflow tracking

### Status Flow

`draft` → `submitted` → `manager_approved` → `management_pending` → `frozen` → `billed`
