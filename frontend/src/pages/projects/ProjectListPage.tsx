import React, { useState, useEffect } from 'react';
import {
  Building2,
  Shield,
  Calendar,
  Clock,
  CheckCircle,
  Edit,
  Save,
  Search,
  UserPlus,
  Users,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp
  , X, Target, CheckSquare,
  Plus,
  BarChart3,
  Eye
} from 'lucide-react';
import { useRoleManager } from '../../hooks/useRoleManager';
import { useAuth } from '../../store/contexts/AuthContext';
import { ProjectService } from '../../services/ProjectService';
import { UserService } from '../../services/UserService';
import { showSuccess, showError, showWarning } from '../../utils/toast';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { DeleteActionModal } from '../../components/DeleteActionModal';
import type { Project, Client, User, Task, ProjectWithClients } from '../../types';
import { DeleteButton } from '@/components/common/DeleteButton';
import TaskSlideOver from './components/TaskSlideOver';

interface ProjectFormData {
  name: string;
  client_id: string;
  primary_manager_id: string;
  status: 'active' | 'completed' | 'archived';
  start_date: string;
  end_date: string;
  budget: number;
  description: string;
  is_billable: boolean;
}

interface TaskFormData {
  name: string;
  description: string;
  assigned_to_user_id: string;
  status: string;
  estimated_hours: number;
  is_billable: boolean;
}

/**
 * ProjectListPage - Completely restructured with horizontal tabs
 * Features horizontal navigation and comprehensive project management
 */
export const ProjectListPage: React.FC = () => {
  const { canManageProjects, currentRole } = useRoleManager();
  const { currentUser } = useAuth();
  
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<{
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalTasks: number;
    completedTasks: number;
    budgetUtilization: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Form states
  const [showEditProject, setShowEditProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const [projectTasks, setProjectTasks] = useState<Record<string, Task[]>>({});
  const [projectMembersMap, setProjectMembersMap] = useState<Record<string, typeof projectMembersList>>({});
  
  // Member management states
  const [projectMembersList, setProjectMembersList] = useState<{
    id: string;
    user_id: string;
    project_role: string;
    is_primary_manager: boolean;
    user_name: string;
    user_email: string;
  }[]>([]);
  // Task SlideOver state
  const [showTaskSlide, setShowTaskSlide] = useState(false);
  const [taskSlideProjectId, setTaskSlideProjectId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskSlideMembers, setTaskSlideMembers] = useState<any[]>([]);
  const [selectedMemberProject, setSelectedMemberProject] = useState<Project | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('employee');

  const [projectForm, setProjectForm] = useState<ProjectFormData>({
    name: '',
    client_id: '',
    primary_manager_id: '',
    status: 'active',
    start_date: '',
    end_date: '',
    budget: 0,
    description: '',
    is_billable: true
  });

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'archived'>('all');

  // Load initial data for management view
  useEffect(() => {
    const loadData = async () => {
      if (!canManageProjects()) return;

      setLoading(true);
      setError(null);

      try {
        const [projectsResult, clientsResult, usersResult, analyticsResult] = await Promise.all([
          ProjectService.getAllProjects(),
          ProjectService.getAllClients(),
          UserService.getAllUsers(),
          ProjectService.getProjectAnalytics()
        ] as const);

        if (projectsResult.error) {
          setError(projectsResult.error);
        } else {
          const raw = projectsResult.projects || [];
          const seen = new Set<string>();
          const deduped: typeof raw = [];
          for (const p of raw) {
            if (!p?.id) continue;
            if (!seen.has(p.id)) {
              seen.add(p.id);
              deduped.push(p);
            }
          }
          setProjects(deduped);
        }

        if (!clientsResult.error) {
          setClients(clientsResult.clients);
        }

        if (!usersResult.error) {
          setUsers(usersResult.users);
        }

        if (!analyticsResult.error) {
          setAnalytics(analyticsResult);
        }
      } catch (err) {
        setError('Failed to load project data');
        console.error('Error loading project data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [refreshTrigger, canManageProjects, currentRole, currentUser]);

  const loadAllProjects = async () => {
    try{
      setLoading(true);
      setError(null);

      const projectsResult = await ProjectService.getAllProjects();;

      if (projectsResult.error) {
        setError(projectsResult.error);
        setProjects([]);
      } else {
        const raw = projectsResult.projects || [];
        const seen = new Set<string>();
        const deduped: typeof raw = [];
        for (const p of raw) {
          if (!p || !p.id) continue;
          if (!seen.has(p.id)) {
            seen.add(p.id);
            deduped.push(p);
          }
        }
        setProjects(deduped);
      }
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Failed to load project data');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await ProjectService.createProject(projectForm);
      if (result.error) {
        showError(`Error creating project: ${result.error}`);
        return;
      }

      // Add primary manager
      if (result.project) {
        await ProjectService.addUserToProject(
          result.project.id,
          projectForm.primary_manager_id,
          'manager',
          true // isPrimaryManager
        );
      }

      showSuccess('Project created successfully!');
      setActiveTab('overview');
      resetProjectForm();
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      showError('Error creating project');
      console.error('Error creating project:', err);
    }
  };

  const handleDeleteProject = async (entityType: string, entityId: string, deleteType: 'soft' | 'hard') => {
    try {
      // For now, use the existing ProjectService delete method
      // This will be enhanced when we implement the full DeleteService
      await ProjectService.deleteProject(entityId);
      
      if (deleteType === 'soft') {
        showSuccess('Project moved to trash successfully');
      } else {
        showSuccess('Project permanently deleted');
      }
      
      // Refresh the projects list
      await loadAllProjects();
      
      // Close expanded view if this project was expanded
      setExpandedProjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(entityId);
        return newSet;
      });
      
    } catch (error) {
      console.error('Delete project error:', error);
      showError(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingProject) return;

    try {
      const result = await ProjectService.updateProject(editingProject.id, projectForm);
      
      if (result.error) {
        showError(`Error updating project: ${result.error}`);
        return;
      }

      showSuccess('Project updated successfully!');
      setShowEditProject(false);
      setEditingProject(null);
      resetProjectForm();
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Error updating project:', err);
      showError('Error updating project');
    }
  };

  const handleProjectExpand = async (project: Project) => {
    const isExpanded = expandedProjects.has(project.id);
    
    if (isExpanded) {
      setExpandedProjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(project.id);
        return newSet;
      });
      setSelectedProject(null);
    } else {
      setExpandedProjects(prev => {
        const newSet = new Set(prev);
        newSet.add(project.id);
        return newSet;
      });
      setSelectedProject(project);
      await Promise.all([loadProjectMembers(project.id), loadProjectTasks(project.id)]);
    }
  };

  const loadProjectMembers = async (projectId: string) => {
    try {
      const result = await ProjectService.getProjectMembers(projectId);
      if (!result.error) {
        setProjectMembersMap(prev => ({ ...prev, [projectId]: result.members }));
        // update focused list if same project
        if (selectedMemberProject?.id === projectId) {
          setProjectMembersList(result.members);
        }
      }
    } catch (err) {
      console.error('Error loading project members:', err);
    }
  };

  const loadProjectTasks = async (projectId: string) => {
    try {
      const result = await ProjectService.getProjectTasks(projectId);
      if (!result.error) {
        setProjectTasks(prev => ({ ...prev, [projectId]: result.tasks || [] }));
      }
    } catch (err) {
      console.error('Error loading project tasks:', err);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberProject || !selectedUserId) return;

    try {
      const result = await ProjectService.addUserToProject(
        selectedMemberProject.id,
        selectedUserId,
        selectedRole,
        false // isPrimaryManager
      );

      if (!result.success) {
        showError(`Error adding member: ${result.error || 'Unknown error'}`);
        return;
      }
      showSuccess('Employee added successfully!');
      setShowAddMember(false);
      setSelectedUserId('');
      setSelectedRole('employee');
      await loadProjectMembers(selectedMemberProject.id);
    } catch (err) {
      showError('Error adding member');
      console.error('Error adding member:', err);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedMemberProject) return;
    
    if (confirm('Are you sure you want to remove this member from the project?')) {
      try {
        await ProjectService.removeUserFromProject(selectedMemberProject.id, userId);
        showSuccess('Employee removed successfully!');
        await loadProjectMembers(selectedMemberProject.id);
      } catch (err) {
        showError('Error removing employee');
        console.error('Error removing employee:', err);
      }
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const result = await UserService.getAllUsers();
      setAvailableUsers(result.users.filter((user: User) => user.is_active));
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const openTaskSlideForProject = async (projectId: string, task?: Task | null) => {
    setTaskSlideProjectId(projectId);
    setEditingTask(task || null);
    // load users and project members so Assigned To shows project members first
    await loadAvailableUsers();
    try {
      const membersRes = await ProjectService.getProjectMembers(projectId);
      if (!membersRes.error) {
        setTaskSlideMembers(membersRes.members || []);
      } else {
        setTaskSlideMembers([]);
      }
    } catch (err) {
      console.error('Error loading project members for task slide:', err);
      setTaskSlideMembers([]);
    }
    setShowTaskSlide(true);
  };

  const resetProjectForm = () => {
    setProjectForm({
      name: '',
      client_id: '',
      primary_manager_id: '',
      status: 'active',
      start_date: '',
      end_date: '',
      budget: 0,
      description: '',
      is_billable: true
    });
  };

  // Filter projects based on search and status
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get managers for project assignment (manager, management, super_admin)
  const managers = users.filter(user =>
    ['manager', 'management', 'super_admin'].includes(user.role) && user.is_active
  );

  const getManagerDisplayName = (project: Project) => {
    const pm = project.primary_manager_id;
    if (!pm) return 'Unassigned';

    if (typeof pm === 'object' && pm !== null) {
      const managerObj = pm as { full_name?: string; name?: string; _id?: string };
      if (managerObj.full_name) return managerObj.full_name;
      if (managerObj._id && managerObj.name) return managerObj.name;
      return String(pm);
    }

    const manager = users.find(u => {
      const userObj = u as User & { _id?: string };
      return u.id === pm || userObj._id === pm || String(u.id) === String(pm);
    });
    return manager ? manager.full_name : String(pm);
  };

  // Access control
  if (!canManageProjects()) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access Project Management.</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Project Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Project Management</h1>
          <p className="text-gray-600">Create and manage all projects across the organization</p>

          {/* Navigation Tabs */}
          <div className="mt-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Project Overview ({filteredProjects.length})
              </button>
              
              <button
                onClick={() => setActiveTab('create')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'create'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Create Project
              </button>
              
              <button
                onClick={() => setActiveTab('members')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'members'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Member Management
              </button>
              
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Analytics
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">

              {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="flex flex-wrap gap-4">
                    {currentRole === 'management' && (
                      <button 
                        onClick={() => setActiveTab('create')}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Project
                      </button>
                    )}
                    
                    <button 
                      onClick={() => setActiveTab('analytics')}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Analytics
                    </button>

                    {selectedProject && (
                      <button 
                        onClick={() => openTaskSlideForProject(selectedProject.id, null)}
                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Add Task to {selectedProject.name}
                      </button>
                    )}
                  </div>
                </div>

              
              {/* Search and Filters */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'completed' | 'archived')}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                    <div className="ml-3 flex items-center space-x-2">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                        title="Grid view"
                      >
                        <LayoutGrid className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                        title="List view"
                      >
                        <List className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            
            {/* Projects Grid */}
              {filteredProjects.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Found</h3>
                  <p className="text-gray-600">
                    {searchTerm || statusFilter !== 'all' ? 'No projects match your filters.' : 'No projects created yet.'}
                  </p>
                </div>
              ) : (
                viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                      <div key={project.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            project.status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : project.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {project.status}
                          </span>
                        </div>
                        
                        {project.description && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-3">{project.description}</p>
                        )}

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-2" />
                            {project.start_date && new Date(project.start_date).toLocaleDateString()}
                            {project.end_date && ` - ${new Date(project.end_date).toLocaleDateString()}`}
                          </div>
                          {project.is_billable && (
                            <div className="flex items-center text-sm text-green-600">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Billable Project
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t">
                          <button
                            onClick={() => handleProjectExpand(project)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            {expandedProjects.has(project.id) ? 'Hide Details' : 'View Details'}
                          </button>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingProject(project);
                                setProjectForm({
                                  name: project.name,
                                  description: project.description || '',
                                  client_id: typeof project.client_id === 'string' ? project.client_id : '',
                                  primary_manager_id: typeof project.primary_manager_id === 'string' ? project.primary_manager_id : '',
                                  start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '',
                                  end_date: project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : '',
                                  budget: project.budget || 0,
                                  status: project.status as 'active' | 'completed' | 'archived',
                                  is_billable: project.is_billable ?? true
                                });
                                setShowEditProject(true);
                              }}
                              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                              title="Edit project"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Expanded Project Details */}
                        {expandedProjects.has(project.id) && (
                          <div className="mt-4 pt-4 border-t space-y-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                <Users className="h-4 w-4 mr-2" />
                                Project Members ({(projectMembersMap[project.id] || []).length})
                              </h4>
                              <div className="space-y-2">
                                {(projectMembersMap[project.id] || []).map((member) => (
                                  <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{member.user_name}</p>
                                      <p className="text-xs text-gray-500">{member.user_email}</p>
                                    </div>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                      {member.project_role}
                                    </span>
                                  </div>
                                ))}
                                {(projectMembersMap[project.id] || []).length === 0 && (
                                  <p className="text-sm text-gray-500">No members assigned</p>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedMemberProject(project);
                                  loadAvailableUsers();
                                  setShowAddMember(true);
                                }}
                                className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                + Add Member
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  // List view: each project is a horizontal card with two columns (members | tasks)
                  <div className="space-y-4">
                    {filteredProjects.map((project) => (
                      <div key={project.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                            <p className="text-sm text-gray-500">{project.description}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              project.status === 'active' 
                                ? 'bg-green-100 text-green-800'
                                : project.status === 'completed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {project.status}
                            </span>
                            <button
                              onClick={() => handleProjectExpand(project)}
                              className="p-2 rounded hover:bg-gray-100"
                              aria-expanded={expandedProjects.has(project.id)}
                              aria-label={expandedProjects.has(project.id) ? 'Collapse project details' : 'Expand project details'}
                              title={expandedProjects.has(project.id) ? 'Collapse' : 'Expand'}
                            >
                              {expandedProjects.has(project.id) ? (
                                <ChevronUp className="h-4 w-4 text-blue-600" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-blue-600" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="mt-4">
                          {expandedProjects.has(project.id) ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Members column */}
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                                    <Users className="h-4 w-4 mr-2" /> Members
                                  </h4>
                                  <div className="space-y-2">
                                    {(projectMembersMap[project.id] || []).map(member => (
                                      <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                        <div>
                                          <p className="text-sm font-medium text-gray-900">{member.user_name}</p>
                                          <p className="text-xs text-gray-500">{member.user_email}</p>
                                        </div>
                                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">{member.project_role}</span>
                                      </div>
                                    ))}
                                    {(projectMembersMap[project.id] || []).length === 0 && (
                                      <p className="text-sm text-gray-500">No members assigned</p>
                                    )}
                                  </div>
                                </div>

                                {/* Tasks column */}
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                                    <Clock className="h-4 w-4 mr-2" /> Tasks
                                  </h4>
                                  <div className="space-y-2">
                                    {(projectTasks[project.id] || []).map(task => (
                                      <div key={task.id} className="p-2 bg-gray-50 rounded">
                                        <p className="text-sm font-medium text-gray-900">{task.name}</p>
                                        <p className="text-xs text-gray-500">{task.status} • {task.estimated_hours || 0}h</p>
                                        <div className="mt-2 flex gap-2">
                                          <button onClick={() => openTaskSlideForProject(project.id, task)} className="text-indigo-600 text-sm">Edit</button>
                                        </div>
                                      </div>
                                    ))}
                                    {(projectTasks[project.id] || []).length === 0 && (
                                      <p className="text-sm text-gray-500">No tasks</p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Full project meta */}
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t">
                                <div>
                                  <p className="text-xs text-gray-600">Manager</p>
                                  <p className="font-medium text-gray-900">{getManagerDisplayName(project)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Dates</p>
                                  <p className="font-medium text-gray-900">{project.start_date ? new Date(project.start_date).toLocaleDateString() : '—'}{project.end_date ? ` - ${new Date(project.end_date).toLocaleDateString()}` : ''}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Budget</p>
                                  <p className="font-medium text-gray-900">{project.budget ? `$${project.budget}` : '—'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Billable</p>
                                  <p className="font-medium text-gray-900">{project.is_billable ? 'Yes' : 'No'}</p>
                                </div>
                              </div>
                              {project.description && (
                                <div className="pt-2">
                                  <p className="text-xs text-gray-600">Description</p>
                                  <p className="text-sm text-gray-800">{project.description}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* condensed members/tasks as before (first 5)") */}
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                                  <Users className="h-4 w-4 mr-2" /> Members
                                </h4>
                                <div className="space-y-2">
                                  {(projectMembersMap[project.id] || []).slice(0,5).map(member => (
                                    <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">{member.user_name}</p>
                                        <p className="text-xs text-gray-500">{member.user_email}</p>
                                      </div>
                                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">{member.project_role}</span>
                                    </div>
                                  ))}
                                  {(projectMembersMap[project.id] || []).length === 0 && (
                                    <p className="text-sm text-gray-500">No members assigned</p>
                                  )}
                                </div>
                              </div>

                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                                  <Clock className="h-4 w-4 mr-2" /> Tasks
                                </h4>
                                <div className="space-y-2">
                                  {(projectTasks[project.id] || []).slice(0,5).map(task => (
                                    <div key={task.id} className="p-2 bg-gray-50 rounded">
                                      <p className="text-sm font-medium text-gray-900">{task.name}</p>
                                      <p className="text-xs text-gray-500">{task.status} • {task.estimated_hours || 0}h</p>
                                    </div>
                                  ))}
                                  {(projectTasks[project.id] || []).length === 0 && (
                                    <p className="text-sm text-gray-500">No tasks</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )} 

              
            </div>
          )}

          {/* Task SlideOver for Add/Edit */}
          <TaskSlideOver
            open={showTaskSlide}
            onClose={() => { setShowTaskSlide(false); setTaskSlideProjectId(null); setEditingTask(null); }}
            projectId={taskSlideProjectId || ''}
            task={editingTask}
            members={taskSlideMembers}
            onSaved={async () => {
              // refresh tasks for the active project
              if (taskSlideProjectId) {
                await loadProjectTasks(taskSlideProjectId);
              }
            }}
            onDeleted={async (taskId) => {
              if (taskSlideProjectId) await loadProjectTasks(taskSlideProjectId);
            }}
          />

          {/* Create Project Tab */}
          {activeTab === 'create' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Project</h2>
              <form onSubmit={handleCreateProject} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      value={projectForm.name}
                      onChange={(e) => setProjectForm({...projectForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client *
                    </label>
                    <select
                      value={projectForm.client_id}
                      onChange={(e) => setProjectForm({...projectForm, client_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select a client</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Primary Manager *
                    </label>
                    <select
                      value={projectForm.primary_manager_id}
                      onChange={(e) => setProjectForm({...projectForm, primary_manager_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select a manager</option>
                      {managers.map((manager) => (
                        <option key={manager.id} value={manager.id}>
                          {manager.full_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={projectForm.status}
                      onChange={(e) => setProjectForm({...projectForm, status: e.target.value as 'active' | 'completed' | 'archived'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={projectForm.start_date}
                      onChange={(e) => setProjectForm({...projectForm, start_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={projectForm.end_date}
                      onChange={(e) => setProjectForm({...projectForm, end_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Budget ($)
                    </label>
                    <input
                      type="number"
                      value={projectForm.budget}
                      onChange={(e) => setProjectForm({...projectForm, budget: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_billable"
                      checked={projectForm.is_billable}
                      onChange={(e) => setProjectForm({...projectForm, is_billable: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_billable" className="ml-2 text-sm text-gray-900">
                      Billable Project
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={projectForm.description}
                    onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter project description..."
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={resetProjectForm}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Create Project</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Member Management Tab */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              {/* Project Selection */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Member Management</h2>
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Project to Manage
                    </label>
                    <select
                      value={selectedMemberProject?.id || ''}
                      onChange={(e) => {
                        const project = projects.find(p => p.id === e.target.value);
                        setSelectedMemberProject(project || null);
                        if (project) {
                          loadProjectMembers(project.id);
                          loadAvailableUsers();
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a project...</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedMemberProject && (
                    <button
                      onClick={() => setShowAddMember(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 mt-6"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Add Member</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Project Members List */}
              {selectedMemberProject && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Members for "{selectedMemberProject.name}"
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {projectMembersList.length} members assigned
                      </p>
                    </div>
                  </div>

                  {projectMembersList.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No Members Assigned</h4>
                      <p className="text-gray-600 mb-4">This project has no members yet.</p>
                      <button
                        onClick={() => setShowAddMember(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Add First Member
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {projectMembersList.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{member.user_name}</h4>
                              <p className="text-sm text-gray-600">{member.user_email}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              member.project_role === 'manager' 
                                ? 'bg-blue-100 text-blue-800'
                                : member.project_role === 'lead'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {member.project_role === 'manager' ? 'Manager' : 
                               member.project_role === 'lead' ? 'Lead' : 'Employee'}
                            </span>

                            {member.is_primary_manager && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Primary Manager
                              </span>
                            )}

                            {!member.is_primary_manager && (
                              <button
                                onClick={() => handleRemoveMember(member.user_id)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Remove member"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && analytics && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Projects</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.totalProjects}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Target className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Projects</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.activeProjects}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <CheckSquare className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.totalTasks}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.completedTasks}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Project Modal */}
        {showEditProject && editingProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-semibold">Edit Project</h3>
                <button
                  onClick={() => {
                    setShowEditProject(false);
                    setEditingProject(null);
                    resetProjectForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleEditProject} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                    <input
                      type="text"
                      value={projectForm.name}
                      onChange={(e) => setProjectForm({...projectForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={projectForm.status}
                      onChange={(e) => setProjectForm({...projectForm, status: e.target.value as 'active' | 'completed' | 'archived'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={projectForm.description}
                    onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditProject(false);
                      setEditingProject(null);
                      resetProjectForm();
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Update Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {showAddMember && selectedMemberProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-semibold">Add Project Member</h3>
                <button
                  onClick={() => setShowAddMember(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => {
                      setSelectedRole(e.target.value);
                      setSelectedUserId(''); // Reset user selection when role changes
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="employee">Employee</option>
                    <option value="lead">Lead</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select User ({selectedRole === 'employee' ? 'Employees' : 'Leads'} only)
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a user</option>
                    {(() => {
                      const existing = new Set(projectMembersList.map((m) => m.user_id));
                      return availableUsers
                        .filter((user) => !existing.has(user.id))
                        .filter((user) => {
                          if (selectedRole === 'employee') return user.role === 'employee';
                          if (selectedRole === 'lead') return user.role === 'lead';
                          return false;
                        })
                        .map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.full_name} ({user.email})
                          </option>
                        ));
                    })()}
                  </select>
                  {(() => {
                    const existing = new Set(projectMembersList.map((m) => m.user_id));
                    const count = availableUsers.filter((user) => !existing.has(user.id)).filter((user) => selectedRole === 'employee' ? user.role === 'employee' : user.role === 'lead').length;
                    if (count === 0) {
                      return (
                        <p className="text-sm text-gray-500 mt-1">
                          No {selectedRole === 'employee' ? 'employees' : 'leads'} available to assign.
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddMember(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
