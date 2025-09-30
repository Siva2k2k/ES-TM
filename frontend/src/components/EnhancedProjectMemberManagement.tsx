import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Trash2, AlertCircle, CheckCircle, User, Mail, Shield, X, Search,
  Crown, Star, Settings, Eye, UserPlus, Edit3, Badge, ChevronDown, ChevronUp,
  Award, Briefcase, UserCheck
} from 'lucide-react';

interface EnhancedProjectMember {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_system_role: string;
  project_role: string;
  has_manager_access: boolean;
  is_primary_manager: boolean;
  is_secondary_manager: boolean;
  assigned_at: Date;
  other_project_roles: Array<{
    projectId: string;
    projectName: string;
    projectRole: string;
  }>;
}

interface AvailableUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  currentProjectRoles: Array<{
    projectId: string;
    projectName: string;
    projectRole: string;
  }>;
}

interface ProjectPermissions {
  projectRole: string | null;
  hasManagerAccess: boolean;
  canAddMembers: boolean;
  canApproveTimesheets: boolean;
  canViewAllTasks: boolean;
  canAssignTasks: boolean;
}

interface EnhancedProjectMemberManagementProps {
  projectId: string;
  projectName: string;
  currentUserRole: string;
  currentUserId: string;
  onUpdate?: () => void;
}

export const EnhancedProjectMemberManagement: React.FC<EnhancedProjectMemberManagementProps> = ({
  projectId,
  projectName,
  currentUserRole,
  currentUserId,
  onUpdate
}) => {
  const [members, setMembers] = useState<EnhancedProjectMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [permissions, setPermissions] = useState<ProjectPermissions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('employee');
  const [hasManagerAccess, setHasManagerAccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
  const [editingMember, setEditingMember] = useState<string | null>(null);

  const canManageMembers = permissions?.canAddMembers || false;

  useEffect(() => {
    loadPermissions();
    loadMembers();
  }, [projectId]);

  useEffect(() => {
    if (canManageMembers) {
      loadAvailableUsers();
    }
  }, [canManageMembers]);

  const loadPermissions = async () => {
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/permissions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setPermissions(data.permissions);
      }
    } catch (err) {
      console.error('Failed to load permissions:', err);
    }
  };

  const loadMembers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/projects/${projectId}/members/enhanced`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load project members');
      }

      setMembers(data.members || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project members');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/available-users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const data = await response.json();

      if (response.ok && data.users) {
        setAvailableUsers(data.users);
      } else {
        console.error('Failed to load available users:', data.error);
      }
    } catch (err) {
      console.error('Error loading available users:', err);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUser || !selectedRole) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/projects/${projectId}/members/enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          userId: selectedUser,
          projectRole: selectedRole,
          hasManagerAccess
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add project member');
      }

      setSuccess('Project member added successfully');
      setShowAddModal(false);
      setSelectedUser('');
      setSelectedRole('employee');
      setHasManagerAccess(false);
      await loadMembers();
      await loadAvailableUsers();
      onUpdate?.();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add project member');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: string, newManagerAccess: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const member = members.find(m => m.id === memberId);
      if (!member) return;

      const response = await fetch(`/api/v1/projects/${projectId}/members/${member.user_id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          projectRole: newRole,
          hasManagerAccess: newManagerAccess
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update member role');
      }

      setSuccess('Member role updated successfully');
      setEditingMember(null);
      await loadMembers();
      onUpdate?.();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update member role');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName} from this project?`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/projects/${projectId}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove project member');
      }

      setSuccess(`${userName} removed from project successfully`);
      await loadMembers();
      await loadAvailableUsers();
      onUpdate?.();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove project member');
    } finally {
      setLoading(false);
    }
  };

  const toggleMemberExpansion = (memberId: string) => {
    const newExpanded = new Set(expandedMembers);
    if (newExpanded.has(memberId)) {
      newExpanded.delete(memberId);
    } else {
      newExpanded.add(memberId);
    }
    setExpandedMembers(newExpanded);
  };

  const getRoleIcon = (role: string, hasManagerAccess: boolean) => {
    if (role === 'manager' || hasManagerAccess) {
      return <Crown className="h-4 w-4 text-yellow-600" />;
    }
    if (role === 'lead') {
      return <Star className="h-4 w-4 text-blue-600" />;
    }
    return <User className="h-4 w-4 text-gray-600" />;
  };

  const getRoleBadgeColor = (role: string, hasManagerAccess: boolean) => {
    if (role === 'manager' || hasManagerAccess) {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (role === 'lead') {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const filteredUsers = availableUsers.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMembers = members.filter(member =>
    member.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && members.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading project members...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Project Team</h3>
              <p className="text-sm text-gray-600">
                {projectName} • {members.length} member{members.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {canManageMembers && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </button>
          )}
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mx-6 mt-4 flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {success && (
        <div className="mx-6 mt-4 flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {/* Members List */}
      <div className="divide-y">
        {filteredMembers.map((member) => {
          const isExpanded = expandedMembers.has(member.id);
          const isEditing = editingMember === member.id;

          return (
            <div key={member.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      {getRoleIcon(member.project_role, member.has_manager_access)}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-sm font-medium text-gray-900">{member.user_name}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.project_role, member.has_manager_access)}`}>
                        {member.project_role}
                        {member.has_manager_access && member.project_role !== 'manager' && ' (Manager Access)'}
                      </span>
                      {member.is_primary_manager && (
                        <Badge className="h-4 w-4 text-purple-600" title="Primary Manager" />
                      )}
                    </div>

                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-500 flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {member.user_email}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center">
                        <Briefcase className="h-3 w-3 mr-1" />
                        System: {member.user_system_role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {canManageMembers && member.user_id !== currentUserId && (
                    <>
                      <button
                        onClick={() => setEditingMember(isEditing ? null : member.id)}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg"
                        title="Edit role"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member.user_id, member.user_name)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg"
                        title="Remove from project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}

                  {member.other_project_roles.length > 0 && (
                    <button
                      onClick={() => toggleMemberExpansion(member.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                      title="View other project roles"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Edit Role Form */}
              {isEditing && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <EditMemberRoleForm
                    member={member}
                    onSave={handleUpdateMemberRole}
                    onCancel={() => setEditingMember(null)}
                    loading={loading}
                  />
                </div>
              )}

              {/* Other Project Roles */}
              {isExpanded && member.other_project_roles.length > 0 && (
                <div className="mt-4 pl-14">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Other Project Roles</h5>
                  <div className="space-y-1">
                    {member.other_project_roles.map((role) => (
                      <div key={role.projectId} className="flex items-center space-x-2 text-sm text-gray-600">
                        {getRoleIcon(role.projectRole, false)}
                        <span>{role.projectName}</span>
                        <span className="text-gray-400">•</span>
                        <span className={`px-2 py-1 rounded text-xs ${getRoleBadgeColor(role.projectRole, false)}`}>
                          {role.projectRole}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredMembers.length === 0 && !loading && (
          <div className="p-6 text-center text-gray-500">
            {searchTerm ? 'No members found matching your search.' : 'No members added to this project yet.'}
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <AddMemberModal
          availableUsers={filteredUsers}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          hasManagerAccess={hasManagerAccess}
          setHasManagerAccess={setHasManagerAccess}
          onAdd={handleAddMember}
          onCancel={() => {
            setShowAddModal(false);
            setSelectedUser('');
            setSelectedRole('employee');
            setHasManagerAccess(false);
          }}
          loading={loading}
        />
      )}
    </div>
  );
};

// Edit Member Role Form Component
interface EditMemberRoleFormProps {
  member: EnhancedProjectMember;
  onSave: (memberId: string, newRole: string, hasManagerAccess: boolean) => void;
  onCancel: () => void;
  loading: boolean;
}

const EditMemberRoleForm: React.FC<EditMemberRoleFormProps> = ({
  member,
  onSave,
  onCancel,
  loading
}) => {
  const [newRole, setNewRole] = useState(member.project_role);
  const [newManagerAccess, setNewManagerAccess] = useState(member.has_manager_access);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Project Role
        </label>
        <select
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          <option value="employee">Employee</option>
          <option value="lead">Lead</option>
          <option value="manager">Manager</option>
        </select>
      </div>

      {newRole !== 'manager' && (
        <div className="flex items-center">
          <input
            id={`manager-access-${member.id}`}
            type="checkbox"
            checked={newManagerAccess}
            onChange={(e) => setNewManagerAccess(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={loading}
          />
          <label htmlFor={`manager-access-${member.id}`} className="ml-2 block text-sm text-gray-700">
            Grant manager access (can add/remove members, approve timesheets)
          </label>
        </div>
      )}

      <div className="flex items-center space-x-3">
        <button
          onClick={() => onSave(member.id, newRole, newRole === 'manager' ? true : newManagerAccess)}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// Add Member Modal Component
interface AddMemberModalProps {
  availableUsers: AvailableUser[];
  selectedUser: string;
  setSelectedUser: (userId: string) => void;
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  hasManagerAccess: boolean;
  setHasManagerAccess: (hasAccess: boolean) => void;
  onAdd: () => void;
  onCancel: () => void;
  loading: boolean;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({
  availableUsers,
  selectedUser,
  setSelectedUser,
  selectedRole,
  setSelectedRole,
  hasManagerAccess,
  setHasManagerAccess,
  onAdd,
  onCancel,
  loading
}) => {
  const selectedUserData = availableUsers.find(u => u.id === selectedUser);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Add Project Member</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select User
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">Choose a user...</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} ({user.email}) - {user.role}
                </option>
              ))}
            </select>
          </div>

          {/* Show current project roles for selected user */}
          {selectedUserData && selectedUserData.currentProjectRoles.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <h5 className="text-sm font-medium text-blue-900 mb-2">Current Project Roles</h5>
              <div className="space-y-1">
                {selectedUserData.currentProjectRoles.map((role) => (
                  <div key={role.projectId} className="text-sm text-blue-800">
                    {role.projectName}: <span className="font-medium">{role.projectRole}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="employee">Employee</option>
              <option value="lead">Lead</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          {/* Manager Access Option */}
          {selectedRole !== 'manager' && (
            <div className="flex items-center">
              <input
                id="manager-access"
                type="checkbox"
                checked={hasManagerAccess}
                onChange={(e) => setHasManagerAccess(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={loading}
              />
              <label htmlFor="manager-access" className="ml-2 block text-sm text-gray-700">
                Grant manager access (can add/remove members, approve timesheets)
              </label>
            </div>
          )}

          {/* Role Description */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <h5 className="text-sm font-medium text-gray-900 mb-1">Role Permissions</h5>
            <ul className="text-xs text-gray-600 space-y-1">
              {selectedRole === 'employee' && !hasManagerAccess && (
                <>
                  <li>• View assigned tasks</li>
                  <li>• Submit timesheets</li>
                  <li>• View project team</li>
                </>
              )}
              {selectedRole === 'lead' && !hasManagerAccess && (
                <>
                  <li>• View and assign team tasks</li>
                  <li>• View all project tasks</li>
                  <li>• Submit timesheets</li>
                </>
              )}
              {(selectedRole === 'manager' || hasManagerAccess) && (
                <>
                  <li>• Full project management access</li>
                  <li>• Add/remove project members</li>
                  <li>• Approve timesheets</li>
                  <li>• View all project data</li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onAdd}
            disabled={loading || !selectedUser || !selectedRole}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProjectMemberManagement;