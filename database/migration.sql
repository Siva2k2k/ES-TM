-- ==========================================================================
-- TIMESHEET APPROVAL SYSTEM - CORRECTED SUPABASE MIGRATION
-- ==========================================================================
-- File: 001_timesheet_system_corrected.sql
-- Description: Recursion-free, consistent timesheet system with proper role-based access
-- ==========================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Note: For Supabase compatibility, both uuid_generate_v4() and gen_random_uuid() work
-- Using uuid_generate_v4() for consistency with uuid-ossp extension

-- ==========================================================================
-- ENUMS (Consistent with Frontend)
-- ==========================================================================

-- User roles enum (matches frontend UserRole type)
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'management', 
  'manager',
  'lead',
  'employee'
);

-- Project status enum (matches frontend ProjectStatus type)
CREATE TYPE project_status AS ENUM (
  'active',
  'completed', 
  'archived'
);

-- Timesheet status enum (matches frontend TimesheetStatus type)
CREATE TYPE timesheet_status AS ENUM (
  'draft',
  'submitted',
  'manager_approved',
  'manager_rejected',
  'management_pending',
  'management_rejected',
  'frozen',
  'billed'
);

-- Entry type enum
CREATE TYPE entry_type AS ENUM (
  'project_task',
  'custom_task'
);

-- Audit action enum (matches frontend AuditAction type)
CREATE TYPE audit_action AS ENUM (
  'INSERT',
  'UPDATE', 
  'DELETE',
  'APPROVE',
  'REJECT',
  'VERIFY',
  'FREEZE',
  'SUBMIT',
  'ESCALATE',
  'USER_LOGIN',
  'USER_LOGOUT',
  'USER_CREATED',
  'USER_APPROVED',
  'USER_DEACTIVATED',
  'USER_ROLE_CHANGED',
  'TIMESHEET_SUBMITTED',
  'TIMESHEET_APPROVED',
  'TIMESHEET_VERIFIED',
  'TIMESHEET_REJECTED',
  'PROJECT_CREATED',
  'PROJECT_UPDATED',
  'PROJECT_DELETED',
  'BILLING_SNAPSHOT_GENERATED',
  'BILLING_APPROVED',
  'ROLE_SWITCHED',
  'PERMISSION_DENIED',
  'DATA_EXPORT',
  'SYSTEM_CONFIG_CHANGED'
);

-- ==========================================================================
-- CORE TABLES (Field names consistent with frontend)
-- ==========================================================================

-- Users table (matches frontend User interface)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL, -- matches frontend
  role user_role NOT NULL DEFAULT 'employee',
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_approved_by_super_admin BOOLEAN NOT NULL DEFAULT false, -- matches frontend
  manager_id UUID REFERENCES users(id),
  
  -- Timestamps with consistent naming
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- for soft delete
);

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_person TEXT,
  contact_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Projects table (matches frontend Project interface)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id),
  primary_manager_id UUID NOT NULL REFERENCES users(id), -- matches frontend
  status project_status NOT NULL DEFAULT 'active',
  start_date DATE NOT NULL,
  end_date DATE,
  budget DECIMAL(15,2),
  description TEXT,
  is_billable BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Project members (matches frontend ProjectMember interface)
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  project_role user_role NOT NULL, -- matches frontend
  is_primary_manager BOOLEAN NOT NULL DEFAULT false, -- matches frontend
  is_secondary_manager BOOLEAN NOT NULL DEFAULT false, -- matches frontend
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- matches frontend
  removed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(project_id, user_id)
);

-- Tasks table (matches frontend Task interface)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  assigned_to_user_id UUID REFERENCES users(id), -- matches frontend
  status TEXT NOT NULL DEFAULT 'open',
  estimated_hours DECIMAL(6,2), -- matches frontend
  is_billable BOOLEAN NOT NULL DEFAULT true,
  created_by_user_id UUID NOT NULL REFERENCES users(id), -- matches frontend
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Timesheets table (matches frontend Timesheet interface)
CREATE TABLE timesheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  week_start_date DATE NOT NULL, -- matches frontend
  week_end_date DATE NOT NULL, -- matches frontend
  total_hours DECIMAL(6,2) NOT NULL DEFAULT 0.00, -- matches frontend
  status timesheet_status NOT NULL DEFAULT 'draft',
  
  -- Manager approval fields
  approved_by_manager_id UUID REFERENCES users(id), -- matches frontend
  approved_by_manager_at TIMESTAMPTZ, -- matches frontend
  manager_rejection_reason TEXT, -- matches frontend
  manager_rejected_at TIMESTAMPTZ, -- matches frontend
  
  -- Management approval fields  
  approved_by_management_id UUID REFERENCES users(id), -- matches frontend
  approved_by_management_at TIMESTAMPTZ, -- matches frontend
  management_rejection_reason TEXT, -- matches frontend
  management_rejected_at TIMESTAMPTZ, -- matches frontend
  
  -- Verification fields (frozen = verified)
  verified_by_id UUID REFERENCES users(id), -- matches frontend
  verified_at TIMESTAMPTZ, -- matches frontend
  is_verified BOOLEAN NOT NULL DEFAULT false, -- matches frontend
  is_frozen BOOLEAN NOT NULL DEFAULT false, -- matches frontend
  
  -- Billing integration
  billing_snapshot_id UUID, -- matches frontend
  
  -- Submission tracking
  submitted_at TIMESTAMPTZ, -- matches frontend
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(user_id, week_start_date)
);

-- Time entries table (matches frontend TimeEntry interface)
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timesheet_id UUID NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  task_id UUID REFERENCES tasks(id),
  date DATE NOT NULL,
  hours DECIMAL(6,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
  description TEXT,
  is_billable BOOLEAN NOT NULL DEFAULT true, -- matches frontend
  custom_task_description TEXT, -- matches frontend
  entry_type entry_type NOT NULL DEFAULT 'project_task', -- matches frontend
  hourly_rate DECIMAL(10,2), -- Snapshot of rate at time of entry
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_project_or_custom CHECK (
    (project_id IS NOT NULL) OR 
    (project_id IS NULL AND custom_task_description IS NOT NULL)
  )
);

-- Billing snapshots table
CREATE TABLE billing_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timesheet_id UUID NOT NULL REFERENCES timesheets(id),
  user_id UUID NOT NULL REFERENCES users(id),
  week_start_date DATE NOT NULL, -- matches frontend
  week_end_date DATE NOT NULL, -- matches frontend
  total_hours DECIMAL(6,2) NOT NULL, -- matches frontend
  billable_hours DECIMAL(6,2) NOT NULL, -- matches frontend
  hourly_rate DECIMAL(10,2) NOT NULL, -- matches frontend
  total_amount DECIMAL(15,2) NOT NULL, -- matches frontend
  billable_amount DECIMAL(15,2) NOT NULL, -- matches frontend
  snapshot_data JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Audit logs table (matches frontend ActivityAuditLog interface)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action audit_action NOT NULL,
  actor_id UUID REFERENCES users(id), -- matches frontend (changed from changed_by)
  actor_name TEXT NOT NULL, -- matches frontend
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- matches frontend
  details JSONB, -- matches frontend
  metadata JSONB, -- matches frontend
  old_data JSONB,
  new_data JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Timesheet approval history
CREATE TABLE timesheet_approval_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timesheet_id UUID NOT NULL REFERENCES timesheets(id),
  action audit_action NOT NULL,
  performed_by UUID NOT NULL REFERENCES users(id),
  performer_name TEXT NOT NULL, -- Add performer name for consistency
  from_status timesheet_status,
  to_status timesheet_status NOT NULL,
  reason TEXT,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- matches frontend
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================================================
-- INDEXES FOR PERFORMANCE
-- ==========================================================================

-- Users indexes
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_active ON users(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_manager ON users(manager_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;

-- Projects indexes
CREATE INDEX idx_projects_client ON projects(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_status ON projects(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_manager ON projects(primary_manager_id) WHERE deleted_at IS NULL;

-- Project members indexes
CREATE INDEX idx_project_members_project ON project_members(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_project_members_user ON project_members(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_project_members_role ON project_members(project_role) WHERE deleted_at IS NULL;

-- Timesheets indexes
CREATE INDEX idx_timesheets_user_date ON timesheets(user_id, week_start_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_timesheets_status ON timesheets(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_timesheets_approval_queue ON timesheets(status) WHERE status IN ('submitted', 'manager_approved', 'management_pending') AND deleted_at IS NULL;

-- Time entries indexes
CREATE INDEX idx_time_entries_timesheet ON time_entries(timesheet_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_time_entries_project ON time_entries(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_time_entries_date ON time_entries(date) WHERE deleted_at IS NULL;

-- Audit logs indexes
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp) WHERE deleted_at IS NULL;
CREATE INDEX idx_audit_logs_action ON audit_logs(action) WHERE deleted_at IS NULL;

-- ==========================================================================
-- HELPER FUNCTIONS (Recursion-Free with RLS Bypass)
-- ==========================================================================

-- NOTE: auth.uid() is built-in to Supabase, no need to define it
-- Supabase provides auth.uid() function automatically

-- Function to get current user role from JWT (AVOIDS RECURSION)
CREATE OR REPLACE FUNCTION get_current_user_role() RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'user_role')::user_role,
    (
      SELECT role FROM users 
      WHERE id = auth.uid() 
      AND is_active = true 
      AND deleted_at IS NULL
      LIMIT 1
    ),
    'employee'::user_role
  );
$$;

-- Function to get user role directly (BYPASSES RLS to prevent recursion)
CREATE OR REPLACE FUNCTION get_user_role_safe(target_user_id UUID) RETURNS user_role
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  user_role_result user_role;
BEGIN
  -- BYPASS RLS by using a direct query with security definer
  SELECT role INTO user_role_result 
  FROM users 
  WHERE id = target_user_id AND deleted_at IS NULL;
  
  RETURN COALESCE(user_role_result, 'employee'::user_role);
END;
$$;

-- Set function to bypass RLS
ALTER FUNCTION get_user_role_safe(UUID) SECURITY DEFINER;

-- Function to check role hierarchy (NO table queries - recursion-free)
CREATE OR REPLACE FUNCTION can_manage_role_hierarchy(curr_role user_role, tgt_role user_role) RETURNS BOOLEAN
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE 
    WHEN curr_role = 'super_admin' THEN true -- Super admin manages all
    WHEN curr_role = 'management' AND tgt_role IN ('manager', 'lead', 'employee') THEN true
    WHEN curr_role = 'manager' AND tgt_role IN ('lead', 'employee') THEN true
    WHEN curr_role = 'lead' AND tgt_role = 'employee' THEN true -- Lead can view employees
    ELSE false
  END;
$$;

-- Helper function for Lead's read-only access to employee timesheets in same projects
CREATE OR REPLACE FUNCTION lead_can_view_employee_in_project(employee_user_id UUID) RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  current_role user_role;
  employee_role user_role;
BEGIN
  SELECT get_current_user_role() INTO current_role; -- Use JWT-based function
  SELECT get_user_role_safe(employee_user_id) INTO employee_role; -- Only query target user (RLS bypass)
  
  -- Only lead can view employee data, and only in same projects
  IF current_role = 'lead' AND employee_role = 'employee' THEN
    RETURN EXISTS(
      SELECT 1 FROM project_members pm1, project_members pm2
      WHERE pm1.user_id = auth.uid() 
      AND pm2.user_id = employee_user_id
      AND pm1.project_id = pm2.project_id
      AND pm1.project_role = 'lead'
      AND pm1.removed_at IS NULL AND pm2.removed_at IS NULL
      AND pm1.deleted_at IS NULL AND pm2.deleted_at IS NULL
    );
  END IF;
  
  RETURN FALSE;
END;
$$;

-- ==========================================================================
-- TRIGGERS FOR TIMESTAMPS AND SOFT DELETE
-- ==========================================================================

-- Trigger function for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger function for soft delete (set deleted_at)
CREATE OR REPLACE FUNCTION soft_delete_record()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Instead of deleting, set deleted_at timestamp
  UPDATE users SET deleted_at = NOW(), updated_at = NOW() WHERE id = OLD.id;
  RETURN NULL; -- Prevent actual delete
END;
$$;

-- Apply updated_at triggers to all tables
CREATE TRIGGER trigger_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_clients_updated_at 
  BEFORE UPDATE ON clients 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_project_members_updated_at 
  BEFORE UPDATE ON project_members 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_tasks_updated_at 
  BEFORE UPDATE ON tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_timesheets_updated_at 
  BEFORE UPDATE ON timesheets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_time_entries_updated_at 
  BEFORE UPDATE ON time_entries 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_billing_snapshots_updated_at 
  BEFORE UPDATE ON billing_snapshots 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_audit_logs_updated_at 
  BEFORE UPDATE ON audit_logs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Soft delete triggers (optional - for critical tables)
CREATE TRIGGER trigger_users_soft_delete 
  BEFORE DELETE ON users 
  FOR EACH ROW EXECUTE FUNCTION soft_delete_record();

-- ==========================================================================
-- BUSINESS LOGIC FUNCTIONS (Updated with consistent field names)
-- ==========================================================================

-- Trigger function to enforce time entry date within timesheet week
CREATE OR REPLACE FUNCTION check_time_entry_date_within_timesheet()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  ts_start DATE;
  ts_end DATE;
BEGIN
  SELECT week_start_date, week_end_date INTO ts_start, ts_end
  FROM timesheets WHERE id = NEW.timesheet_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parent timesheet not found for time entry.';
  END IF;
  IF NEW.date < ts_start OR NEW.date > ts_end THEN
    RAISE EXCEPTION 'Time entry date % is outside the timesheet week (% to %)', NEW.date, ts_start, ts_end;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_time_entry_date_within_timesheet
  BEFORE INSERT OR UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION check_time_entry_date_within_timesheet();

-- Function to calculate timesheet totals
CREATE OR REPLACE FUNCTION calculate_timesheet_totals(timesheet_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE timesheets 
  SET total_hours = (
    SELECT COALESCE(SUM(hours), 0) 
    FROM time_entries 
    WHERE timesheet_id = timesheet_uuid 
    AND deleted_at IS NULL
  ),
  updated_at = NOW()
  WHERE id = timesheet_uuid;
END;
$$;

-- Function to submit timesheet
CREATE OR REPLACE FUNCTION submit_timesheet(timesheet_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  ts_record RECORD;
  current_user_role user_role;
BEGIN
  -- Get current user role from JWT (avoids recursion)
  current_user_role := get_current_user_role();
  
  -- Management cannot submit timesheets
  IF current_user_role = 'management' THEN
    RAISE EXCEPTION 'Management role cannot submit timesheets';
  END IF;
  
  -- Get timesheet with lock
  SELECT * INTO ts_record FROM timesheets WHERE id = timesheet_uuid AND deleted_at IS NULL FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Timesheet not found';
  END IF;
  
  -- Check permissions
  IF ts_record.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: You can only submit your own timesheets';
  END IF;
  
  -- Check status
  IF ts_record.status NOT IN ('draft', 'manager_rejected', 'management_rejected') THEN
    RAISE EXCEPTION 'Timesheet cannot be submitted from current status: %', ts_record.status;
  END IF;
  
  -- Check if timesheet has entries
  IF ts_record.total_hours = 0 THEN
    RAISE EXCEPTION 'Cannot submit timesheet with zero hours';
  END IF;
  
  -- Update status
  UPDATE timesheets 
  SET status = 'submitted',
      submitted_at = NOW(),
      updated_at = NOW()
  WHERE id = timesheet_uuid;
  
  -- Add to approval history
  INSERT INTO timesheet_approval_history (
    timesheet_id, action, performed_by, performer_name, from_status, to_status
  ) 
  SELECT 
    timesheet_uuid, 
    'SUBMIT'::audit_action, 
    auth.uid(), 
    u.full_name,
    ts_record.status, 
    'submitted'::timesheet_status
  FROM users u WHERE u.id = auth.uid();
END;
$$;

-- Manager approval function (updated field names)
CREATE OR REPLACE FUNCTION manager_approve_reject_timesheet(
  timesheet_uuid UUID,
  action TEXT,
  reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  ts_record RECORD;
  current_user_role user_role;
  new_status timesheet_status;
  performer_name TEXT;
  has_manager_permission BOOLEAN := FALSE;
BEGIN
  -- Get current user role from JWT (avoids recursion)
  current_user_role := get_current_user_role();
  
  -- Get timesheet with lock first to check ownership
  SELECT * INTO ts_record FROM timesheets WHERE id = timesheet_uuid AND deleted_at IS NULL FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Timesheet not found';
  END IF;
  
  -- Check permissions: direct manager/management roles OR lead with manager project role
  IF current_user_role IN ('manager', 'management', 'super_admin') THEN
    has_manager_permission := TRUE;
  ELSIF current_user_role = 'lead' THEN
    -- Check if lead has manager role in any project where the timesheet owner is also a member
    SELECT EXISTS(
      SELECT 1 
      FROM project_members pm_lead
      JOIN project_members pm_employee ON pm_lead.project_id = pm_employee.project_id
      WHERE pm_lead.user_id = auth.uid()
      AND pm_lead.project_role = 'manager'
      AND pm_employee.user_id = ts_record.user_id
      AND pm_lead.removed_at IS NULL 
      AND pm_employee.removed_at IS NULL
      AND pm_lead.deleted_at IS NULL 
      AND pm_employee.deleted_at IS NULL
    ) INTO has_manager_permission;
  END IF;
  
  -- Raise exception if no permission
  IF NOT has_manager_permission THEN
    RAISE EXCEPTION 'Access denied: Insufficient permissions for timesheet approval';
  END IF;
  
  -- Check status
  IF ts_record.status != 'submitted' THEN
    RAISE EXCEPTION 'Timesheet cannot be processed from current status: %', ts_record.status;
  END IF;
  
  -- Process action
  IF action = 'approve' THEN
    new_status := 'manager_approved';
    
    UPDATE timesheets 
    SET status = new_status,
        approved_by_manager_id = auth.uid(),
        approved_by_manager_at = NOW(),
        updated_at = NOW()
    WHERE id = timesheet_uuid;
    
  ELSIF action = 'reject' THEN
    new_status := 'manager_rejected';
    
    IF reason IS NULL OR trim(reason) = '' THEN
      RAISE EXCEPTION 'Rejection reason is required';
    END IF;
    
    UPDATE timesheets 
    SET status = new_status,
        manager_rejection_reason = reason,
        manager_rejected_at = NOW(),
        updated_at = NOW()
    WHERE id = timesheet_uuid;
    
  ELSE
    RAISE EXCEPTION 'Invalid action: %. Must be approve or reject', action;
  END IF;
  
  -- Add to approval history (get performer name safely)
  INSERT INTO timesheet_approval_history (
    timesheet_id, action, performed_by, performer_name, from_status, to_status, reason
  ) 
  SELECT 
    timesheet_uuid, 
    CASE WHEN action = 'approve' THEN 'APPROVE'::audit_action ELSE 'REJECT'::audit_action END,
    auth.uid(), 
    u.full_name,
    ts_record.status, 
    new_status, 
    reason
  FROM users u WHERE u.id = auth.uid();
END;
$$;

-- Management approval function (updated field names)
CREATE OR REPLACE FUNCTION management_approve_reject_timesheet(
  timesheet_uuid UUID,
  action TEXT,
  reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  ts_record RECORD;
  current_user_role user_role;
  new_status timesheet_status;
  performer_name TEXT;
BEGIN
  -- Get current user role from JWT (avoids recursion)
  current_user_role := get_current_user_role();
  
  -- Check permissions
  IF current_user_role NOT IN ('management', 'super_admin') THEN
    RAISE EXCEPTION 'Access denied: Management level permissions required';
  END IF;
  
  -- Get timesheet with lock
  SELECT * INTO ts_record FROM timesheets WHERE id = timesheet_uuid AND deleted_at IS NULL FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Timesheet not found';
  END IF;
  
  -- Check status (management can process manager_approved or management_pending)
  IF ts_record.status NOT IN ('manager_approved', 'management_pending') THEN
    RAISE EXCEPTION 'Timesheet cannot be processed from current status: %', ts_record.status;
  END IF;
  
  -- Process action
  IF action = 'approve' THEN
    new_status := 'frozen'; -- Management approval = frozen (verified and locked)
    
    -- Create billing snapshot first
    INSERT INTO billing_snapshots (
      timesheet_id, user_id, week_start_date, week_end_date,
      total_hours, billable_hours, hourly_rate, total_amount, billable_amount,
      snapshot_data
    )
    SELECT 
      ts_record.id,
      ts_record.user_id,
      ts_record.week_start_date,
      ts_record.week_end_date,
      ts_record.total_hours,
      COALESCE(
        (SELECT SUM(hours) FROM time_entries 
         WHERE timesheet_id = ts_record.id AND is_billable = true AND deleted_at IS NULL), 
        0
      ),
      u.hourly_rate,
      ts_record.total_hours * u.hourly_rate,
      COALESCE(
        (SELECT SUM(hours) FROM time_entries 
         WHERE timesheet_id = ts_record.id AND is_billable = true AND deleted_at IS NULL), 
        0
      ) * u.hourly_rate,
      jsonb_build_object(
        'approved_by', auth.uid(),
        'approved_at', NOW(),
        'timesheet_data', row_to_json(ts_record)
      )
    FROM users u WHERE u.id = ts_record.user_id AND u.deleted_at IS NULL;
    
    -- Update timesheet to frozen status
    UPDATE timesheets 
    SET status = new_status,
        approved_by_management_id = auth.uid(),
        approved_by_management_at = NOW(),
        verified_by_id = auth.uid(),
        verified_at = NOW(),
        is_verified = true,
        is_frozen = true,
        billing_snapshot_id = (SELECT id FROM billing_snapshots WHERE timesheet_id = timesheet_uuid ORDER BY created_at DESC LIMIT 1),
        updated_at = NOW()
    WHERE id = timesheet_uuid;
    
  ELSIF action = 'reject' THEN
    new_status := 'management_rejected';
    
    IF reason IS NULL OR trim(reason) = '' THEN
      RAISE EXCEPTION 'Rejection reason is required';
    END IF;
    
    UPDATE timesheets 
    SET status = new_status,
        management_rejection_reason = reason,
        management_rejected_at = NOW(),
        updated_at = NOW()
    WHERE id = timesheet_uuid;
    
  ELSE
    RAISE EXCEPTION 'Invalid action: %. Must be approve or reject', action;
  END IF;
  
  -- Add to approval history (get performer name safely)
  INSERT INTO timesheet_approval_history (
    timesheet_id, action, performed_by, performer_name, from_status, to_status, reason
  ) 
  SELECT 
    timesheet_uuid, 
    CASE WHEN action = 'approve' THEN 'VERIFY'::audit_action ELSE 'REJECT'::audit_action END,
    auth.uid(), 
    u.full_name,
    ts_record.status, 
    new_status, 
    reason
  FROM users u WHERE u.id = auth.uid();
END;
$$;

-- Function to escalate manager-approved timesheets to management_pending
CREATE OR REPLACE FUNCTION escalate_to_management(timesheet_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  ts_record RECORD;
  current_user_role user_role;
BEGIN
  -- Get current user role from JWT
  current_user_role := get_current_user_role();
  
  -- Check permissions (managers or management can escalate)
  IF current_user_role NOT IN ('manager', 'management', 'super_admin') THEN
    RAISE EXCEPTION 'Access denied: Insufficient permissions to escalate timesheet';
  END IF;
  
  -- Get timesheet with lock
  SELECT * INTO ts_record FROM timesheets WHERE id = timesheet_uuid AND deleted_at IS NULL FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Timesheet not found';
  END IF;
  
  -- Check status
  IF ts_record.status != 'manager_approved' THEN
    RAISE EXCEPTION 'Timesheet cannot be escalated from current status: %', ts_record.status;
  END IF;
  
  -- Update status to management_pending
  UPDATE timesheets 
  SET status = 'management_pending',
      updated_at = NOW()
  WHERE id = timesheet_uuid;
  
  -- Add to approval history
  INSERT INTO timesheet_approval_history (
    timesheet_id, action, performed_by, performer_name, from_status, to_status
  ) 
  SELECT 
    timesheet_uuid, 
    'ESCALATE'::audit_action,
    auth.uid(), 
    u.full_name,
    ts_record.status, 
    'management_pending'::timesheet_status
  FROM users u WHERE u.id = auth.uid();
END;
$$;

-- Function to mark frozen timesheets as billed
CREATE OR REPLACE FUNCTION mark_timesheet_billed(timesheet_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  ts_record RECORD;
  current_user_role user_role;
BEGIN
  -- Get current user role from JWT
  current_user_role := get_current_user_role();
  
  -- Check permissions (only management and super_admin can bill)
  IF current_user_role NOT IN ('management', 'super_admin') THEN
    RAISE EXCEPTION 'Access denied: Management level permissions required for billing';
  END IF;
  
  -- Get timesheet with lock
  SELECT * INTO ts_record FROM timesheets WHERE id = timesheet_uuid AND deleted_at IS NULL FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Timesheet not found';
  END IF;
  
  -- Check status
  IF ts_record.status != 'frozen' THEN
    RAISE EXCEPTION 'Only frozen timesheets can be marked as billed. Current status: %', ts_record.status;
  END IF;
  
  -- Update status to billed
  UPDATE timesheets 
  SET status = 'billed',
      updated_at = NOW()
  WHERE id = timesheet_uuid;
  
  -- Add to approval history
  INSERT INTO timesheet_approval_history (
    timesheet_id, action, performed_by, performer_name, from_status, to_status
  ) 
  SELECT 
    timesheet_uuid, 
    'BILLING_APPROVED'::audit_action,
    auth.uid(), 
    u.full_name,
    ts_record.status, 
    'billed'::timesheet_status
  FROM users u WHERE u.id = auth.uid();
END;
$$;

-- ==========================================================================
-- ROW LEVEL SECURITY POLICIES (Recursion-Free)
-- ==========================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_approval_history ENABLE ROW LEVEL SECURITY;

-- Users policies (JWT-Based - NO RECURSION)
CREATE POLICY users_select_policy ON users FOR SELECT TO authenticated
USING (
  deleted_at IS NULL AND (
    id = auth.uid() OR -- Own record
    can_manage_role_hierarchy(get_current_user_role(), get_user_role_safe(id)) -- Management hierarchy (JWT + RLS bypass)
  )
);

CREATE POLICY users_update_policy ON users FOR UPDATE TO authenticated
USING (
  deleted_at IS NULL AND (
    id = auth.uid() OR -- Own record
    -- can_manage_role_hierarchy(get_current_user_role(), get_user_role_safe(id)) -- Management hierarchy (JWT + RLS bypass)
    get_current_user_role() IN ('sup')
  )
)
WITH CHECK (
  deleted_at IS NULL AND (
    id = auth.uid() OR 
    can_manage_role_hierarchy(get_current_user_role(), get_user_role_safe(id))
  )
);

--Clients policies
CREATE POLICY clients_select_policy ON clients FOR SELECT TO authenticated
USING (
  deleted_at IS NULL -- All roles can view active clients
);

-- Timesheets policies (JWT-Based - NO RECURSION)
CREATE POLICY timesheets_select_policy ON timesheets FOR SELECT TO authenticated
USING (
  deleted_at IS NULL AND (
    user_id = auth.uid() OR -- Own timesheet
    can_manage_role_hierarchy(get_current_user_role(), get_user_role_safe(user_id)) -- Management hierarchy (JWT + RLS bypass)
  )
);

CREATE POLICY timesheets_insert_policy ON timesheets FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() OR 
  (can_manage_role_hierarchy(get_current_user_role(), get_user_role_safe(user_id)) 
   AND get_current_user_role() != 'management') -- Management CANNOT create timesheets
  -- Lead CANNOT create timesheets for others
);

CREATE POLICY timesheets_update_policy ON timesheets FOR UPDATE TO authenticated
USING (
  deleted_at IS NULL AND (
    user_id = auth.uid() OR -- Own timesheet
    (can_manage_role_hierarchy(get_current_user_role(), get_user_role_safe(user_id))
     AND get_current_user_role() != 'management') -- Management CANNOT edit timesheets
    -- Lead CANNOT edit timesheets, only view
  )
  AND is_frozen = false -- CANNOT edit frozen timesheets
  AND status != 'billed' -- CANNOT edit billed timesheets
)
WITH CHECK (
  deleted_at IS NULL AND (
    user_id = auth.uid() OR 
    (can_manage_role_hierarchy(get_current_user_role(), get_user_role_safe(user_id))
     AND get_current_user_role() != 'management') -- Management CANNOT edit timesheets
  )
  AND is_frozen = false -- CANNOT edit frozen timesheets
  AND status != 'billed' -- CANNOT edit billed timesheets
);

-- Time entries policies (JWT-Based - NO RECURSION)
CREATE POLICY time_entries_select_policy ON time_entries FOR SELECT TO authenticated
USING (
  deleted_at IS NULL AND EXISTS(
    SELECT 1 FROM timesheets ts
    WHERE ts.id = time_entries.timesheet_id
    AND ts.deleted_at IS NULL
    AND (
      ts.user_id = auth.uid() OR
      can_manage_role_hierarchy(get_current_user_role(), get_user_role_safe(ts.user_id))
    )
  )
);

CREATE POLICY time_entries_insert_policy ON time_entries FOR INSERT TO authenticated
WITH CHECK (
  EXISTS(
    SELECT 1 FROM timesheets ts
    WHERE ts.id = time_entries.timesheet_id
    AND ts.deleted_at IS NULL
    AND (ts.user_id = auth.uid() OR 
         (can_manage_role_hierarchy(get_current_user_role(), get_user_role_safe(ts.user_id))
          AND get_current_user_role() != 'management')) -- Management CANNOT create time entries
    AND ts.status IN ('draft', 'manager_rejected', 'management_rejected')
    AND ts.status != 'billed' -- CANNOT add entries to billed timesheets
  )
  -- Lead CANNOT create time entries
);

CREATE POLICY time_entries_update_policy ON time_entries FOR UPDATE TO authenticated
USING (
  deleted_at IS NULL AND EXISTS(
    SELECT 1 FROM timesheets ts
    WHERE ts.id = time_entries.timesheet_id
    AND ts.deleted_at IS NULL
    AND (ts.user_id = auth.uid() OR 
         (can_manage_role_hierarchy(get_current_user_role(), get_user_role_safe(ts.user_id))
          AND get_current_user_role() != 'management')) -- Management CANNOT edit time entries
    AND ts.status IN ('draft', 'manager_rejected', 'management_rejected')
    AND ts.is_frozen = false -- CANNOT edit time entries in frozen timesheets
    AND ts.status != 'billed' -- CANNOT edit time entries in billed timesheets
  )
  -- Lead CANNOT update time entries
)
WITH CHECK (
  deleted_at IS NULL AND EXISTS(
    SELECT 1 FROM timesheets ts
    WHERE ts.id = time_entries.timesheet_id
    AND ts.deleted_at IS NULL
    AND (ts.user_id = auth.uid() OR 
         (can_manage_role_hierarchy(get_current_user_role(), get_user_role_safe(ts.user_id))
          AND get_current_user_role() != 'management')) -- Management CANNOT edit time entries
    AND ts.status IN ('draft', 'manager_rejected', 'management_rejected')
    AND ts.is_frozen = false -- CANNOT edit time entries in frozen timesheets
  )
);

CREATE POLICY time_entries_delete_policy ON time_entries FOR DELETE TO authenticated
USING (
  deleted_at IS NULL AND EXISTS(
    SELECT 1 FROM timesheets ts
    WHERE ts.id = time_entries.timesheet_id
    AND ts.deleted_at IS NULL
    AND (ts.user_id = auth.uid() OR 
         (can_manage_role_hierarchy(get_current_user_role(), get_user_role_safe(ts.user_id))
          AND get_current_user_role() != 'management')) -- Management CANNOT delete time entries
    AND ts.status IN ('draft', 'manager_rejected', 'management_rejected')
    AND ts.is_frozen = false -- CANNOT delete time entries in frozen timesheets
    AND ts.status != 'billed' -- CANNOT delete time entries in billed timesheets
  )
  -- Lead CANNOT delete time entries
);

-- Project members policies (JWT-Based - NO RECURSION)
DROP POLICY IF EXISTS project_members_select_policy ON project_members;
CREATE POLICY project_members_select_policy ON project_members FOR SELECT TO authenticated
USING (
  deleted_at IS NULL AND (
    user_id = auth.uid() OR -- Own membership
    get_current_user_role() IN ('management', 'manager', 'lead', 'super_admin') -- Management roles (JWT-based)
  )
);

-- Additional policies for other tables (JWT-Based - NO RECURSION)
CREATE POLICY projects_select_policy ON projects FOR SELECT TO authenticated
USING (
  deleted_at IS NULL AND (
    EXISTS(
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = projects.id
      AND pm.user_id = auth.uid()
      AND pm.removed_at IS NULL
      AND pm.deleted_at IS NULL
    ) OR
    get_current_user_role() IN ('management', 'manager', 'super_admin') -- JWT-based role check
  )
);

CREATE POLICY billing_snapshots_select_policy ON billing_snapshots FOR SELECT TO authenticated
USING (
  deleted_at IS NULL AND (
    user_id = auth.uid() OR
    get_current_user_role() IN ('management', 'super_admin') -- JWT-based role check
  )
);

-- Tasks policies
DROP POLICY IF EXISTS tasks_select_policy ON tasks;
DROP POLICY IF EXISTS tasks_insert_policy ON tasks;
DROP POLICY IF EXISTS tasks_update_policy ON tasks;

-- Tasks policies (SAFE - No recursion risk, includes management access)
CREATE POLICY tasks_select_policy ON tasks FOR SELECT TO authenticated
USING (
  deleted_at IS NULL AND (
    -- Project members can see tasks
    EXISTS(
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = tasks.project_id
      AND pm.user_id = auth.uid()
      AND pm.removed_at IS NULL
      AND pm.deleted_at IS NULL
    )
    OR
    -- Management and super admin can see all tasks (uses safe function)
    get_user_role_safe(auth.uid()) IN ('management', 'super_admin')
  )
);

CREATE POLICY tasks_insert_policy ON tasks FOR INSERT TO authenticated
WITH CHECK (
  -- Project managers/leads can create tasks
  EXISTS(
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = tasks.project_id
    AND pm.user_id = auth.uid()
    AND pm.project_role IN ('manager', 'lead')
    AND pm.removed_at IS NULL
    AND pm.deleted_at IS NULL
  )
  OR
  -- Management and super admin can create tasks anywhere (uses safe function)
  get_user_role_safe(auth.uid()) = 'management'
);

CREATE POLICY tasks_update_policy ON tasks FOR UPDATE TO authenticated
USING (
  deleted_at IS NULL AND (
    -- Project managers/leads can update tasks
    EXISTS(
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = tasks.project_id
      AND pm.user_id = auth.uid()
      AND pm.project_role IN ('manager', 'lead')
      AND pm.removed_at IS NULL
      AND pm.deleted_at IS NULL
    )
    OR
    -- Management and super admin can update all tasks (uses safe function)
    get_user_role_safe(auth.uid()) = 'management'
  )
);



-- ==========================================================================
-- SOFT DELETE FUNCTIONS
-- ==========================================================================

-- Function for soft delete with audit
CREATE OR REPLACE FUNCTION soft_delete_with_audit(
  table_name TEXT,
  record_id UUID,
  reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  query TEXT;
  actor_name TEXT;
BEGIN
  -- Get actor name
  SELECT full_name INTO actor_name FROM users WHERE id = auth.uid();
  
  -- Build dynamic query
  query := format('UPDATE %I SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL', table_name);
  
  -- Execute soft delete
  EXECUTE query USING record_id;
  
  -- Log audit event
  INSERT INTO audit_logs (table_name, record_id, action, actor_id, actor_name, details)
  VALUES (table_name, record_id, 'DELETE', auth.uid(), actor_name, jsonb_build_object('reason', reason));
  
  RETURN FOUND;
END;
$$;

-- Function for hard delete (admin only)
CREATE OR REPLACE FUNCTION hard_delete_record(
  table_name TEXT,
  record_id UUID,
  reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  query TEXT;
  current_user_role user_role;
  actor_name TEXT;
BEGIN
  -- Check permissions (only super_admin can hard delete)
  SELECT role, full_name INTO current_user_role, actor_name 
  FROM users WHERE id = auth.uid() AND deleted_at IS NULL;
  
  IF current_user_role != 'super_admin' THEN
    RAISE EXCEPTION 'Access denied: Only super_admin can perform hard deletes';
  END IF;
  
  IF reason IS NULL OR trim(reason) = '' THEN
    RAISE EXCEPTION 'Reason is required for hard delete';
  END IF;
  
  -- Log before deletion
  INSERT INTO audit_logs (table_name, record_id, action, actor_id, actor_name, details)
  VALUES (table_name, record_id, 'DELETE', auth.uid(), actor_name, 
          jsonb_build_object('type', 'HARD_DELETE', 'reason', reason));
  
  -- Build and execute delete query
  query := format('DELETE FROM %I WHERE id = $1', table_name);
  EXECUTE query USING record_id;
  
  RETURN FOUND;
END;
$$;

-- ==========================================================================
-- API FUNCTIONS (Frontend-Ready)
-- ==========================================================================

-- Get user timesheets (matches frontend expectations)
CREATE OR REPLACE FUNCTION api_get_user_timesheets(
  target_user_id UUID DEFAULT NULL,
  status_filter timesheet_status[] DEFAULT NULL,
  week_start_filter DATE DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  effective_user_id UUID;
  current_user_role user_role;
  target_user_role user_role;
  result JSONB;
BEGIN
  effective_user_id := COALESCE(target_user_id, auth.uid());
  
  -- Check permissions (recursion-free)
  IF effective_user_id != auth.uid() THEN
    SELECT role INTO current_user_role FROM users WHERE id = auth.uid() AND deleted_at IS NULL;
    SELECT role INTO target_user_role FROM users WHERE id = effective_user_id AND deleted_at IS NULL;
    
    IF NOT (
      current_user_role = 'super_admin' OR
      (current_user_role = 'management' AND target_user_role IN ('manager', 'lead', 'employee')) OR
      (current_user_role = 'manager' AND target_user_role IN ('lead', 'employee'))
    ) THEN
      RAISE EXCEPTION 'Access denied: Cannot access this user''s timesheets';
    END IF;
  END IF;
  
  SELECT jsonb_build_object(
    'success', true,
    'data', jsonb_agg(
      jsonb_build_object(
        'id', t.id,
        'user_id', t.user_id,
        'week_start_date', t.week_start_date,
        'week_end_date', t.week_end_date,
        'total_hours', t.total_hours,
        'status', t.status,
        'is_verified', t.is_verified,
        'is_frozen', t.is_frozen,
        'submitted_at', t.submitted_at,
        'billable_hours', COALESCE(billable.hours, 0),
        'entry_count', COALESCE(entries.count, 0),
        'permissions', jsonb_build_object(
          'can_edit', (t.user_id = auth.uid() AND t.status IN ('draft', 'manager_rejected', 'management_rejected')),
          'can_submit', (t.user_id = auth.uid() AND t.status IN ('draft', 'manager_rejected', 'management_rejected') AND t.total_hours > 0),
          'can_approve', (current_user_role IN ('manager', 'management', 'super_admin') AND t.status IN ('submitted', 'management_pending')),
          'can_reject', (current_user_role IN ('manager', 'management', 'super_admin') AND t.status IN ('submitted', 'management_pending'))
        )
      ) ORDER BY t.week_start_date DESC
    ),
    'total', COUNT(*),
    'has_more', (COUNT(*) > limit_count)
  ) INTO result
  FROM timesheets t
  LEFT JOIN (
    SELECT timesheet_id, SUM(hours) as hours
    FROM time_entries 
    WHERE is_billable = true AND deleted_at IS NULL
    GROUP BY timesheet_id
  ) billable ON t.id = billable.timesheet_id
  LEFT JOIN (
    SELECT timesheet_id, COUNT(*) as count
    FROM time_entries 
    WHERE deleted_at IS NULL
    GROUP BY timesheet_id
  ) entries ON t.id = entries.timesheet_id
  WHERE t.user_id = effective_user_id
  AND t.deleted_at IS NULL
  AND (status_filter IS NULL OR t.status = ANY(status_filter))
  AND (week_start_filter IS NULL OR t.week_start_date >= week_start_filter)
  LIMIT limit_count
  OFFSET offset_count;
  
  RETURN COALESCE(result, '{"success": true, "data": [], "total": 0, "has_more": false}'::jsonb);
END;
$$;

-- ==========================================================================
-- GRANT PERMISSIONS
-- ==========================================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role_safe(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_manage_role_hierarchy(user_role, user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION lead_can_view_employee_in_project(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION submit_timesheet(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION manager_approve_reject_timesheet(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION management_approve_reject_timesheet(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION escalate_to_management(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_timesheet_billed(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION api_get_user_timesheets(UUID, timesheet_status[], DATE, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_with_audit(TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION hard_delete_record(TEXT, UUID, TEXT) TO authenticated;

-- Grant usage on custom types
GRANT USAGE ON TYPE user_role TO authenticated;
GRANT USAGE ON TYPE timesheet_status TO authenticated;
GRANT USAGE ON TYPE project_status TO authenticated;
GRANT USAGE ON TYPE entry_type TO authenticated;
GRANT USAGE ON TYPE audit_action TO authenticated;

-- ==========================================================================
-- SAMPLE DATA (Consistent with Frontend)
-- ==========================================================================

-- Insert sample users
INSERT INTO users (id, email, full_name, role, hourly_rate, is_active, is_approved_by_super_admin) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@company.com', 'System Administrator', 'super_admin', 100.00, true, true),
  ('576a5cbf-0a48-42cb-8ba8-8fee00805dbf', 'ceo@company.com', 'Chief Executive', 'management', 150.00, true, true),
  ('a001465b-d049-42a4-a0f7-24ade37113ec', 'manager@company.com', 'Project Manager', 'manager', 80.00, true, true),
  ('f4854104-f9ac-44df-b1a5-872a82184754', 'lead@company.com', 'Team Lead', 'lead', 70.00, true, true),
  ('21b62b61-59e2-4db1-ba3a-f162c90e4995', 'employee@company.com', 'Software Developer', 'employee', 60.00, true, true);

-- ==========================================================================
-- END OF MIGRATION
-- ==========================================================================


-- ==========================================================================
-- SIMPLIFIED USER CREATION - USING EXISTING USERS TABLE
-- ==========================================================================

-- Drop existing user policies to recreate with insert policy
DROP POLICY IF EXISTS users_select_policy ON users;
DROP POLICY IF EXISTS users_update_policy ON users;
DROP POLICY IF EXISTS users_insert_policy ON users;

-- ==========================================================================
-- ENHANCED USER POLICIES WITH INSERT SUPPORT
-- ==========================================================================

-- Users select policy (unchanged)
CREATE POLICY users_select_policy ON users FOR SELECT TO authenticated
USING (
  deleted_at IS NULL AND (
    id = auth.uid() OR -- Own record
    can_manage_role_hierarchy(get_current_user_role(), get_user_role_safe(id)) OR -- Management hierarchy
    -- Same project team check
    EXISTS(
      SELECT 1 FROM project_members pm1, project_members pm2
      WHERE pm1.user_id = auth.uid() AND pm2.user_id = users.id
      AND pm1.project_id = pm2.project_id
      AND pm1.removed_at IS NULL AND pm2.removed_at IS NULL
      AND pm1.deleted_at IS NULL AND pm2.deleted_at IS NULL
    )
  )
);

-- Users insert policy - Role-based user creation
CREATE POLICY users_insert_policy ON users FOR INSERT TO authenticated
WITH CHECK (
  -- Super admin can create any role including management
  (get_current_user_role() = 'super_admin') OR
  -- Management can create manager, lead, employee users
  (get_current_user_role() = 'management' AND role IN ('manager', 'lead', 'employee'))
);

-- Users update policy - Enhanced to handle approval workflow
CREATE POLICY users_update_policy ON users FOR UPDATE TO authenticated
USING (
  deleted_at IS NULL AND (
    id = auth.uid() OR -- Own record
    can_manage_role_hierarchy(get_current_user_role(), get_user_role_safe(id)) -- Management hierarchy
  )
)
WITH CHECK (
  deleted_at IS NULL AND (
    id = auth.uid() OR 
    can_manage_role_hierarchy(get_current_user_role(), get_user_role_safe(id))
  )
);

-- ==========================================================================
-- EMAIL NOTIFICATION TABLE (Still needed for email queue)
-- ==========================================================================

-- Email notification queue
CREATE TABLE email_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_text TEXT NOT NULL,
  body_html TEXT,
  email_type TEXT NOT NULL, -- 'user_creation', 'password_reset', etc.
  related_record_id UUID, -- Reference to users.id
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed, retry
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_email_notifications_status ON email_notifications(status);
CREATE INDEX idx_email_notifications_type ON email_notifications(email_type);

-- Apply updated_at trigger
CREATE TRIGGER trigger_email_notifications_updated_at 
  BEFORE UPDATE ON email_notifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==========================================================================
-- SIMPLIFIED USER CREATION FUNCTIONS
-- ==========================================================================

-- Function to create user directly (with approval logic handled by is_approved_by_super_admin field)
CREATE OR REPLACE FUNCTION create_user_with_notification(
  p_email TEXT,
  p_full_name TEXT,
  p_role user_role,
  p_hourly_rate DECIMAL DEFAULT 0.00,
  p_manager_id UUID DEFAULT NULL,
  p_temp_password TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  current_role user_role;
  creator_name TEXT;
  new_user_id UUID;
  needs_approval BOOLEAN;
  email_content JSONB;
  notification_id UUID;
  result JSONB;
BEGIN
  -- Get current user info
  SELECT role, full_name INTO current_role, creator_name 
  FROM users WHERE id = auth.uid() AND deleted_at IS NULL;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Current user not found or inactive';
  END IF;
  
  -- Validate permissions
  IF current_role = 'management' THEN
    IF p_role NOT IN ('manager', 'lead', 'employee') THEN
      RAISE EXCEPTION 'Management can only create manager, lead, or employee roles';
    END IF;
    needs_approval := true; -- Created by management, needs super admin approval
  ELSIF current_role = 'super_admin' THEN
    needs_approval := false; -- Super admin approval not needed
  ELSE
    RAISE EXCEPTION 'Access denied: Only management and super_admin can create users';
  END IF;
  
  -- Validate email uniqueness
  IF EXISTS(SELECT 1 FROM users WHERE email = p_email AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Email already exists';
  END IF;
  
  -- Validate manager_id if provided
  IF p_manager_id IS NOT NULL THEN
    IF NOT EXISTS(SELECT 1 FROM users WHERE id = p_manager_id AND role IN ('manager', 'lead') AND deleted_at IS NULL) THEN
      RAISE EXCEPTION 'Invalid manager_id: Must reference an active manager or lead';
    END IF;
  END IF;
  
  -- Generate UUID for new user (you'll use this for Supabase auth creation)
  new_user_id := uuid_generate_v4();
  
  -- Create user in users table
  INSERT INTO users (
    id, email, full_name, role, hourly_rate, manager_id,
    is_active, is_approved_by_super_admin
  ) VALUES (
    new_user_id,
    p_email,
    p_full_name,
    p_role,
    p_hourly_rate,
    p_manager_id,
    NOT needs_approval, -- Active only if no approval needed
    NOT needs_approval  -- Approved only if no approval needed
  );
  
  -- Queue email notification if password provided and user is active
  IF p_temp_password IS NOT NULL AND NOT needs_approval THEN
    -- Generate email content
    email_content := generate_user_creation_email(
      p_email, p_full_name, p_temp_password, creator_name
    );
    
    -- Queue email
    notification_id := queue_email_notification(
      p_email, p_full_name,
      email_content->>'subject',
      email_content->>'body_text',
      email_content->>'body_html',
      'user_creation',
      new_user_id
    );
  END IF;
  
  -- Log audit event
  INSERT INTO audit_logs (
    table_name, record_id, action, actor_id, actor_name, details
  ) VALUES (
    'users', new_user_id, 'USER_CREATED', auth.uid(), creator_name,
    jsonb_build_object(
      'email', p_email,
      'role', p_role,
      'needs_approval', needs_approval,
      'email_queued', notification_id
    )
  );
  
  result := jsonb_build_object(
    'success', true,
    'user_id', new_user_id,
    'needs_approval', needs_approval,
    'is_active', NOT needs_approval,
    'email_notification_id', notification_id,
    'message', CASE 
      WHEN needs_approval THEN 'User created but requires super admin approval before activation'
      ELSE 'User created successfully and is active'
    END
  );
  
  RETURN result;
END;
$$;

-- Function for super admin to approve users
CREATE OR REPLACE FUNCTION approve_user(p_user_id UUID, p_temp_password TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  current_role user_role;
  user_record RECORD;
  approver_name TEXT;
  email_content JSONB;
  notification_id UUID;
  result JSONB;
BEGIN
  -- Check permissions
  SELECT role, full_name INTO current_role, approver_name 
  FROM users WHERE id = auth.uid() AND deleted_at IS NULL;
  
  IF current_role != 'super_admin' THEN
    RAISE EXCEPTION 'Access denied: Only super_admin can approve users';
  END IF;
  
  -- Get user record
  SELECT * INTO user_record 
  FROM users 
  WHERE id = p_user_id AND deleted_at IS NULL 
  AND is_approved_by_super_admin = false;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found or already approved';
  END IF;
  
  -- Approve and activate user
  UPDATE users 
  SET is_approved_by_super_admin = true,
      is_active = true,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Queue welcome email if password provided
  IF p_temp_password IS NOT NULL THEN
    email_content := generate_user_creation_email(
      user_record.email, user_record.full_name, p_temp_password, approver_name
    );
    
    notification_id := queue_email_notification(
      user_record.email, user_record.full_name,
      email_content->>'subject',
      email_content->>'body_text',
      email_content->>'body_html',
      'user_creation',
      p_user_id
    );
  END IF;
  
  -- Log audit event
  INSERT INTO audit_logs (
    table_name, record_id, action, actor_id, actor_name, details
  ) VALUES (
    'users', p_user_id, 'USER_APPROVED', auth.uid(), approver_name,
    jsonb_build_object(
      'email', user_record.email,
      'role', user_record.role,
      'email_queued', notification_id
    )
  );
  
  result := jsonb_build_object(
    'success', true,
    'message', 'User approved and activated successfully',
    'email_notification_id', notification_id
  );
  
  RETURN result;
END;
$$;

-- ==========================================================================
-- EMAIL FUNCTIONS (Same as before)
-- ==========================================================================

-- Function to queue email notification
CREATE OR REPLACE FUNCTION queue_email_notification(
  p_recipient_email TEXT,
  p_recipient_name TEXT,
  p_subject TEXT,
  p_body_text TEXT,
  p_body_html TEXT DEFAULT NULL,
  p_email_type TEXT DEFAULT 'general',
  p_related_record_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO email_notifications (
    recipient_email, recipient_name, subject, body_text, body_html,
    email_type, related_record_id
  ) VALUES (
    p_recipient_email, p_recipient_name, p_subject, p_body_text, p_body_html,
    p_email_type, p_related_record_id
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Function to generate user creation email content
CREATE OR REPLACE FUNCTION generate_user_creation_email(
  p_user_email TEXT,
  p_user_name TEXT,
  p_temp_password TEXT,
  p_created_by_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  subject TEXT;
  body_text TEXT;
  body_html TEXT;
BEGIN
  subject := 'Welcome to Timesheet System - Account Created';
  
  body_text := format('
Dear %s,

Your account has been created in the Timesheet System by %s.

Login Details:
Email: %s
Temporary Password: %s

Please log in at your earliest convenience and change your password.

Important:
- Change your temporary password immediately after first login
- Keep your login credentials secure
- Contact your manager if you have any questions

Best regards,
Timesheet System Team
  ', p_user_name, p_created_by_name, p_user_email, p_temp_password);
  
  body_html := format('
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .credentials { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .warning { color: #dc3545; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Welcome to Timesheet System</h2>
        </div>
        
        <p>Dear <strong>%s</strong>,</p>
        
        <p>Your account has been created in the Timesheet System by <strong>%s</strong>.</p>
        
        <div class="credentials">
            <h3>Login Details:</h3>
            <p><strong>Email:</strong> %s</p>
            <p><strong>Temporary Password:</strong> <code>%s</code></p>
        </div>
        
        <p>Please log in at your earliest convenience and change your password.</p>
        
        <div class="warning">
            <h3>Important:</h3>
            <ul>
                <li>Change your temporary password immediately after first login</li>
                <li>Keep your login credentials secure</li>
                <li>Contact your manager if you have any questions</li>
            </ul>
        </ul>
        
        <p>Best regards,<br>Timesheet System Team</p>
    </div>
</body>
</html>
  ', p_user_name, p_created_by_name, p_user_email, p_temp_password);
  
  RETURN jsonb_build_object(
    'subject', subject,
    'body_text', body_text,
    'body_html', body_html
  );
END;
$$;

-- ==========================================================================
-- API FUNCTIONS
-- ==========================================================================

-- Get unapproved users (for super admin)
CREATE OR REPLACE FUNCTION api_get_unapproved_users()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  current_role user_role;
  result JSONB;
BEGIN
  SELECT role INTO current_role FROM users WHERE id = auth.uid() AND deleted_at IS NULL;
  
  IF current_role != 'super_admin' THEN
    RAISE EXCEPTION 'Access denied: Only super_admin can view unapproved users';
  END IF;
  
  SELECT jsonb_build_object(
    'success', true,
    'data', jsonb_agg(
      jsonb_build_object(
        'id', u.id,
        'email', u.email,
        'full_name', u.full_name,
        'role', u.role,
        'hourly_rate', u.hourly_rate,
        'manager_id', u.manager_id,
        'manager_name', m.full_name,
        'created_at', u.created_at,
        'is_active', u.is_active
      ) ORDER BY u.created_at DESC
    ),
    'total', COUNT(*)
  ) INTO result
  FROM users u
  LEFT JOIN users m ON m.id = u.manager_id
  WHERE u.is_approved_by_super_admin = false
  AND u.deleted_at IS NULL;
  
  RETURN COALESCE(result, '{"success": true, "data": [], "total": 0}'::jsonb);
END;
$$;

-- ==========================================================================
-- RLS POLICIES FOR EMAIL NOTIFICATIONS
-- ==========================================================================

-- Enable RLS
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Email notifications policies (restricted access)
CREATE POLICY email_notifications_select_policy ON email_notifications FOR SELECT TO authenticated
USING (
  get_current_user_role() IN ('management', 'super_admin')
);

-- ==========================================================================
-- GRANT PERMISSIONS
-- ==========================================================================

GRANT EXECUTE ON FUNCTION create_user_with_notification(TEXT, TEXT, user_role, DECIMAL, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_user(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION queue_email_notification(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_user_creation_email(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION api_get_unapproved_users() TO authenticated;

-- ==========================================================================
-- CLIENT TABLE RLS POLICIES
-- ==========================================================================

-- ==========================================================================
-- CLIENT INSERT POLICY
-- ==========================================================================

-- Only super_admin and management can create clients
CREATE POLICY clients_insert_policy ON clients FOR INSERT TO authenticated
WITH CHECK (
  get_current_user_role() IN ('super_admin', 'management')
);

-- ==========================================================================
-- CLIENT UPDATE POLICY
-- ==========================================================================

-- Only super_admin and management can update clients
CREATE POLICY clients_update_policy ON clients FOR UPDATE TO authenticated
USING (
  deleted_at IS NULL AND
  get_current_user_role() IN ('super_admin', 'management')
)
WITH CHECK (
  deleted_at IS NULL AND
  get_current_user_role() IN ('super_admin', 'management')
);

-- ==========================================================================
-- CLIENT DELETE POLICY
-- ==========================================================================

-- Only super_admin and management can delete clients
CREATE POLICY clients_delete_policy ON clients FOR DELETE TO authenticated
USING (
  deleted_at IS NULL AND
  get_current_user_role() IN ('super_admin', 'management')
);

-- ==========================================================================
-- ADDITIONAL CLIENT MANAGEMENT FUNCTIONS
-- ==========================================================================

-- Function to safely delete client (checks for dependencies)
CREATE OR REPLACE FUNCTION safe_delete_client(p_client_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  current_role user_role;
  client_record RECORD;
  project_count INTEGER;
  actor_name TEXT;
  result JSONB;
BEGIN
  -- Check permissions
  SELECT role, full_name INTO current_role, actor_name 
  FROM users WHERE id = auth.uid() AND deleted_at IS NULL;
  
  IF current_role NOT IN ('super_admin', 'management') THEN
    RAISE EXCEPTION 'Access denied: Only super_admin and management can delete clients';
  END IF;
  
  -- Get client record
  SELECT * INTO client_record 
  FROM clients WHERE id = p_client_id AND deleted_at IS NULL;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Client not found or already deleted';
  END IF;
  
  -- Check for active projects
  SELECT COUNT(*) INTO project_count 
  FROM projects 
  WHERE client_id = p_client_id 
  AND deleted_at IS NULL 
  AND status = 'active';
  
  IF project_count > 0 THEN
    result := jsonb_build_object(
      'success', false,
      'message', format('Cannot delete client: %s active projects exist. Please archive or complete projects first.', project_count),
      'active_project_count', project_count
    );
    RETURN result;
  END IF;
  
  -- Soft delete the client
  UPDATE clients 
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE id = p_client_id;
  
  -- Log audit event
  INSERT INTO audit_logs (
    table_name, record_id, action, actor_id, actor_name, details
  ) VALUES (
    'clients', p_client_id, 'DELETE', auth.uid(), actor_name,
    jsonb_build_object(
      'client_name', client_record.name,
      'soft_delete', true
    )
  );
  
  result := jsonb_build_object(
    'success', true,
    'message', 'Client deleted successfully'
  );
  
  RETURN result;
END;
$$;

-- Function to get clients with project counts and permissions
CREATE OR REPLACE FUNCTION api_get_clients_with_stats(
  p_include_inactive BOOLEAN DEFAULT false,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  current_role user_role;
  result JSONB;
BEGIN
  SELECT role INTO current_role FROM users WHERE id = auth.uid() AND deleted_at IS NULL;
  
  IF current_role IS NULL THEN
    RAISE EXCEPTION 'User not found or inactive';
  END IF;
  
  SELECT jsonb_build_object(
    'success', true,
    'data', jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'contact_person', c.contact_person,
        'contact_email', c.contact_email,
        'is_active', c.is_active,
        'created_at', c.created_at,
        'updated_at', c.updated_at,
        'project_counts', jsonb_build_object(
          'active', COALESCE(stats.active_projects, 0),
          'completed', COALESCE(stats.completed_projects, 0),
          'total', COALESCE(stats.total_projects, 0)
        ),
        'permissions', jsonb_build_object(
          'can_edit', current_role IN ('super_admin', 'management'),
          'can_delete', current_role IN ('super_admin', 'management'),
          'can_create_project', current_role IN ('super_admin', 'management', 'manager')
        )
      ) ORDER BY c.name
    ),
    'total', COUNT(*),
    'user_permissions', jsonb_build_object(
      'can_create_client', current_role IN ('super_admin', 'management'),
      'role', current_role
    )
  ) INTO result
  FROM clients c
  LEFT JOIN (
    SELECT 
      client_id,
      COUNT(*) FILTER (WHERE status = 'active' AND deleted_at IS NULL) as active_projects,
      COUNT(*) FILTER (WHERE status = 'completed' AND deleted_at IS NULL) as completed_projects,
      COUNT(*) FILTER (WHERE deleted_at IS NULL) as total_projects
    FROM projects 
    GROUP BY client_id
  ) stats ON c.id = stats.client_id
  WHERE c.deleted_at IS NULL
  AND (p_include_inactive OR c.is_active = true)
  LIMIT p_limit
  OFFSET p_offset;
  
  RETURN COALESCE(result, '{"success": true, "data": [], "total": 0}'::jsonb);
END;
$$;

-- ==========================================================================
-- GRANT PERMISSIONS
-- ==========================================================================

GRANT EXECUTE ON FUNCTION safe_delete_client(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION api_get_clients_with_stats(BOOLEAN, INTEGER, INTEGER) TO authenticated;

-- ==========================================================================
-- PROJECT POLICIES (Missing from original migration)
-- ==========================================================================

-- Drop existing projects select policy to recreate complete set
DROP POLICY IF EXISTS projects_select_policy ON projects;

-- Projects select policy
CREATE POLICY projects_select_policy ON projects FOR SELECT TO authenticated
USING (
  deleted_at IS NULL AND (
    -- User is part of the project
    EXISTS(
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = projects.id
      AND pm.user_id = auth.uid()
      AND pm.removed_at IS NULL
      AND pm.deleted_at IS NULL
    ) OR
    -- Management hierarchy access (super_admin, management, manager have full access)
    get_current_user_role() IN ('management', 'manager', 'super_admin')
  )
);

-- Projects insert policy
CREATE POLICY projects_insert_policy ON projects FOR INSERT TO authenticated
WITH CHECK (
  -- Only super_admin, management, and manager can create projects
  get_current_user_role() IN ('super_admin', 'management', 'manager') AND
  -- Validate primary_manager_id exists and has appropriate role
  EXISTS(
    SELECT 1 FROM users u 
    WHERE u.id = primary_manager_id 
    AND u.role IN ('manager', 'lead') 
    AND u.deleted_at IS NULL
  ) AND
  -- Validate client_id exists
  EXISTS(
    SELECT 1 FROM clients c 
    WHERE c.id = client_id 
    AND c.deleted_at IS NULL
  )
);

-- Projects update policy
CREATE POLICY projects_update_policy ON projects FOR UPDATE TO authenticated
USING (
  deleted_at IS NULL AND (
    -- Primary manager can update their project
    primary_manager_id = auth.uid() OR
    -- Management hierarchy access
    get_current_user_role() IN ('super_admin', 'management', 'manager')
  )
)
WITH CHECK (
  deleted_at IS NULL AND (
    primary_manager_id = auth.uid() OR
    get_current_user_role() IN ('super_admin', 'management', 'manager')
  ) AND
  -- Validate primary_manager_id if being changed
  EXISTS(
    SELECT 1 FROM users u 
    WHERE u.id = primary_manager_id 
    AND u.role IN ('manager', 'lead') 
    AND u.deleted_at IS NULL
  )
);

-- Projects delete policy
CREATE POLICY projects_delete_policy ON projects FOR DELETE TO authenticated
USING (
  deleted_at IS NULL AND
  get_current_user_role() IN ('super_admin', 'management')
);

-- ==========================================================================
-- PROJECT MANAGEMENT FUNCTIONS
-- ==========================================================================

-- Function to safely delete project (checks for dependencies)
CREATE OR REPLACE FUNCTION safe_delete_project(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  current_role user_role;
  project_record RECORD;
  timesheet_count INTEGER;
  task_count INTEGER;
  actor_name TEXT;
  result JSONB;
BEGIN
  -- Check permissions
  SELECT role, full_name INTO current_role, actor_name 
  FROM users WHERE id = auth.uid() AND deleted_at IS NULL;
  
  IF current_role NOT IN ('super_admin', 'management') THEN
    RAISE EXCEPTION 'Access denied: Only super_admin and management can delete projects';
  END IF;
  
  -- Get project record
  SELECT * INTO project_record 
  FROM projects WHERE id = p_project_id AND deleted_at IS NULL;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found or already deleted';
  END IF;
  
  -- Check for time entries via timesheets
  SELECT COUNT(DISTINCT te.timesheet_id) INTO timesheet_count
  FROM time_entries te
  WHERE te.project_id = p_project_id AND te.deleted_at IS NULL;
  
  -- Check for active tasks
  SELECT COUNT(*) INTO task_count
  FROM tasks t
  WHERE t.project_id = p_project_id 
  AND t.deleted_at IS NULL 
  AND t.status NOT IN ('completed', 'cancelled');
  
  -- If project has dependencies, suggest archiving instead
  IF timesheet_count > 0 OR task_count > 0 THEN
    result := jsonb_build_object(
      'success', false,
      'message', format('Cannot delete project: %s timesheets with entries and %s active tasks exist. Consider archiving the project instead.', 
                       timesheet_count, task_count),
      'timesheet_count', timesheet_count,
      'task_count', task_count,
      'suggestion', 'Archive project instead of deleting'
    );
    RETURN result;
  END IF;
  
  -- Safe to soft delete
  UPDATE projects 
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE id = p_project_id;
  
  -- Also remove project members (soft delete)
  UPDATE project_members 
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE project_id = p_project_id AND deleted_at IS NULL;
  
  -- Log audit event
  INSERT INTO audit_logs (
    table_name, record_id, action, actor_id, actor_name, details
  ) VALUES (
    'projects', p_project_id, 'DELETE', auth.uid(), actor_name,
    jsonb_build_object(
      'project_name', project_record.name,
      'client_id', project_record.client_id,
      'soft_delete', true
    )
  );
  
  result := jsonb_build_object(
    'success', true,
    'message', 'Project and associated memberships deleted successfully'
  );
  
  RETURN result;
END;
$$;

-- Function to archive project (safer alternative to deletion)
CREATE OR REPLACE FUNCTION archive_project(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  current_role user_role;
  project_record RECORD;
  actor_name TEXT;
  result JSONB;
BEGIN
  -- Check permissions
  SELECT role, full_name INTO current_role, actor_name 
  FROM users WHERE id = auth.uid() AND deleted_at IS NULL;
  
  IF current_role NOT IN ('super_admin', 'management', 'manager') THEN
    RAISE EXCEPTION 'Access denied: Insufficient permissions to archive projects';
  END IF;
  
  -- Get project record
  SELECT * INTO project_record 
  FROM projects WHERE id = p_project_id AND deleted_at IS NULL;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found or already deleted';
  END IF;
  
  -- Check if user can manage this specific project
  IF current_role NOT IN ('super_admin', 'management') THEN
    IF project_record.primary_manager_id != auth.uid() THEN
      RAISE EXCEPTION 'Access denied: You can only archive projects you manage';
    END IF;
  END IF;
  
  -- Update project status to archived
  UPDATE projects 
  SET status = 'archived', updated_at = NOW()
  WHERE id = p_project_id;
  
  -- Log audit event
  INSERT INTO audit_logs (
    table_name, record_id, action, actor_id, actor_name, details
  ) VALUES (
    'projects', p_project_id, 'UPDATE', auth.uid(), actor_name,
    jsonb_build_object(
      'action', 'archive',
      'project_name', project_record.name,
      'old_status', project_record.status,
      'new_status', 'archived'
    )
  );
  
  result := jsonb_build_object(
    'success', true,
    'message', 'Project archived successfully'
  );
  
  RETURN result;
END;
$$;

-- Fix for project_members table - Add missing INSERT policy
-- This script adds the missing INSERT policy for project_members table
-- Run this in your Supabase SQL editor or psql

-- Add INSERT policy for project_members
DROP POLICY IF EXISTS project_members_insert_policy ON project_members;
CREATE POLICY project_members_insert_policy ON project_members FOR INSERT TO authenticated
WITH CHECK (
  -- Only management, managers, and super_admin can add members
  get_current_user_role() IN ('management', 'manager', 'super_admin') AND
  deleted_at IS NULL
);

-- Add UPDATE policy for project_members (if not exists)
DROP POLICY IF EXISTS project_members_update_policy ON project_members;
CREATE POLICY project_members_update_policy ON project_members FOR UPDATE TO authenticated
USING (
  deleted_at IS NULL AND (
    user_id = auth.uid() OR -- Own membership
    get_current_user_role() IN ('management', 'super_admin', 'manager') -- Management roles
  )
)
WITH CHECK (
  deleted_at IS NULL AND (
    user_id = auth.uid() OR -- Own membership
    get_current_user_role() IN ('management', 'super_admin', 'manager') -- Management roles
  )
);

-- Add DELETE policy for project_members (if not exists)  
DROP POLICY IF EXISTS project_members_delete_policy ON project_members;
CREATE POLICY project_members_delete_policy ON project_members FOR DELETE TO authenticated
USING (
  deleted_at IS NULL AND
  -- Only management, managers, and super_admin can remove members
  get_current_user_role() IN ('management', 'super_admin', 'manager')
);

DROP POLICY IF EXISTS tasks_insert_policy ON tasks;
CREATE POLICY tasks_insert_policy ON tasks FOR INSERT TO authenticated
WITH CHECK (
  deleted_at IS NULL AND (
    -- Project managers/leads can create tasks
    EXISTS(
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = tasks.project_id
      AND pm.user_id = auth.uid()
      AND pm.project_role IN ('manager', 'lead')
      AND pm.removed_at IS NULL
      AND pm.deleted_at IS NULL
    )
    OR
    -- Management, super admin, and managers can create tasks anywhere
    get_current_user_role() IN ('management', 'super_admin', 'manager')
    OR
    -- Project primary managers can create tasks  
    EXISTS(
      SELECT 1 FROM projects p
      WHERE p.id = tasks.project_id
      AND p.primary_manager_id = auth.uid()
      AND p.deleted_at IS NULL
    )
  )
);