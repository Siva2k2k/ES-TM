import React, { useState, useEffect } from 'react';
import {
  Building2, CheckSquare, Clock, Calendar, Users, Target, Play, Pause,
  ChevronDown, ChevronRight, AlertCircle, DollarSign, User, Activity,
  Timer, TrendingUp, X, Crown, Star, Award, Briefcase, Eye, Settings
} from 'lucide-react';
import { useAuth } from '../store/contexts/AuthContext';
import { useProject, useProjectRoleSummary } from '../contexts/ProjectContext';
import type { Project, Task, TimeEntry } from '../types';

interface EnhancedEmployeeDashboardProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

interface ProjectWithDetails extends Project {
  myRole: string;
  hasManagerAccess: boolean;
  taskCount: number;
  myTaskCount: number;
  completedTasks: number;
  memberCount: number;
  recentActivity: string;
}

interface TaskWithProject extends Task {
  project?: Project;
  project_name?: string;
  client_name?: string;
  myProjectRole?: string;
}

const EnhancedEmployeeDashboard: React.FC<EnhancedEmployeeDashboardProps> = ({
  activeSection,
  setActiveSection
}) => {
  const { user } = useAuth();
  const {
    userProjectRoles,
    currentProject,
    setCurrentProject,
    loading: projectLoading
  } = useProject();
  const { summary, totalProjects, managerAccessCount, activeProjects } = useProjectRoleSummary();

  const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');

  useEffect(() => {
    if (user && userProjectRoles.length > 0) {
      loadDashboardData();
    }
  }, [user, userProjectRoles]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadProjects(),
        loadTasks(),
        loadTimeEntries()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/v1/projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        // Enhance projects with user role information
        const enhancedProjects: ProjectWithDetails[] = data.projects.map((project: Project) => {
          const userRole = userProjectRoles.find(role => role.projectId === project.id);
          return {
            ...project,
            myRole: userRole?.projectRole || 'none',
            hasManagerAccess: userRole?.hasManagerAccess || false,
            taskCount: 0, // Will be populated when loading tasks
            myTaskCount: 0,
            completedTasks: 0,
            memberCount: 0,
            recentActivity: ''
          };
        }).filter((project: ProjectWithDetails) => project.myRole !== 'none');

        setProjects(enhancedProjects);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const loadTasks = async () => {
    try {
      // Load tasks for all user's projects
      const taskPromises = userProjectRoles.map(async (projectRole) => {
        const response = await fetch(`/api/v1/projects/${projectRole.projectId}/tasks`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });

        const data = await response.json();

        if (response.ok) {
          return data.tasks.map((task: Task) => ({
            ...task,
            project_name: projectRole.projectName,
            myProjectRole: projectRole.projectRole
          }));
        }
        return [];
      });

      const allTasks = await Promise.all(taskPromises);
      const flatTasks = allTasks.flat();

      setTasks(flatTasks);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  };

  const loadTimeEntries = async () => {
    try {
      const response = await fetch('/api/v1/timesheets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setTimeEntries(data.timeEntries || []);
      }
    } catch (err) {
      console.error('Failed to load time entries:', err);
    }
  };

  const toggleProjectExpansion = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
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

  const filterProjects = (projects: ProjectWithDetails[]) => {
    if (selectedProjectFilter === 'all') return projects;
    if (selectedProjectFilter === 'manager') {
      return projects.filter(p => p.hasManagerAccess);
    }
    return projects.filter(p => p.myRole === selectedProjectFilter);
  };

  const myTasks = tasks.filter(task =>
    task.assigned_to_user_id === user?.id &&
    task.status !== 'completed'
  );

  const recentTasks = tasks
    .filter(task => task.assigned_to_user_id === user?.id)
    .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    .slice(0, 5);

  const todaysTimeEntries = timeEntries.filter(entry => {
    const entryDate = new Date(entry.date).toDateString();
    const today = new Date().toDateString();
    return entryDate === today;
  });

  const totalHoursToday = todaysTimeEntries.reduce((sum, entry) => sum + entry.hours_worked, 0);

  if (loading || projectLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Project Role Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.full_name}</h1>
            <p className="text-gray-600 mt-1">Here's your project overview and recent activity</p>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-600">Active in {activeProjects} projects</div>
            <div className="flex items-center space-x-4 mt-2">
              {managerAccessCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <Crown className="h-3 w-3 mr-1" />
                  {managerAccessCount} with manager access
                </span>
              )}
              {Object.entries(summary).map(([role, count]) => (
                <span
                  key={role}
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(role, false)}`}
                >
                  {getRoleIcon(role, false)}
                  <span className="ml-1">{count} as {role}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Active Projects</dt>
                <dd className="text-lg font-medium text-gray-900">{activeProjects}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckSquare className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">My Tasks</dt>
                <dd className="text-lg font-medium text-gray-900">{myTasks.length}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Hours Today</dt>
                <dd className="text-lg font-medium text-gray-900">{totalHoursToday.toFixed(1)}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Crown className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Manager Access</dt>
                <dd className="text-lg font-medium text-gray-900">{managerAccessCount}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Projects */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                My Projects
              </h2>

              <select
                value={selectedProjectFilter}
                onChange={(e) => setSelectedProjectFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">All Projects</option>
                <option value="manager">Manager Access</option>
                <option value="lead">Lead Role</option>
                <option value="employee">Employee Role</option>
              </select>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filterProjects(projects).length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No projects found for the selected filter.
              </div>
            ) : (
              filterProjects(projects).map((project) => {
                const isExpanded = expandedProjects.has(project.id);
                const projectTasks = tasks.filter(task => task.project_id === project.id);
                const myProjectTasks = projectTasks.filter(task => task.assigned_to_user_id === user?.id);

                return (
                  <div key={project.id} className="border-b last:border-b-0">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => toggleProjectExpansion(project.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                          </button>

                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium text-gray-900">{project.name}</h3>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(project.myRole, project.hasManagerAccess)}`}>
                                {getRoleIcon(project.myRole, project.hasManagerAccess)}
                                <span className="ml-1">
                                  {project.myRole}
                                  {project.hasManagerAccess && project.myRole !== 'manager' && ' (Manager)'}
                                </span>
                              </span>
                            </div>

                            {project.client_name && (
                              <p className="text-sm text-gray-500 mt-1">Client: {project.client_name}</p>
                            )}

                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              <span>{myProjectTasks.length} my tasks</span>
                              <span>{projectTasks.length} total tasks</span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                project.status === 'active' ? 'bg-green-100 text-green-800' :
                                project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {project.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        {project.hasManagerAccess && (
                          <button
                            onClick={() => setCurrentProject(project)}
                            className="p-2 text-gray-400 hover:text-blue-600 rounded-lg"
                            title="Manage project"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Expanded Project Details */}
                      {isExpanded && (
                        <div className="mt-4 pl-8 space-y-3">
                          {project.description && (
                            <p className="text-sm text-gray-600">{project.description}</p>
                          )}

                          {/* Project Tasks */}
                          {myProjectTasks.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">My Tasks</h4>
                              <div className="space-y-1">
                                {myProjectTasks.slice(0, 3).map((task) => (
                                  <div key={task.id} className="flex items-center space-x-2 text-sm">
                                    <CheckSquare className={`h-3 w-3 ${
                                      task.status === 'completed' ? 'text-green-600' : 'text-gray-400'
                                    }`} />
                                    <span className={task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-700'}>
                                      {task.name}
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                                      task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {task.priority}
                                    </span>
                                  </div>
                                ))}
                                {myProjectTasks.length > 3 && (
                                  <div className="text-sm text-gray-500">
                                    +{myProjectTasks.length - 3} more tasks
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <CheckSquare className="h-5 w-5 mr-2 text-green-600" />
              Recent Tasks
            </h2>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {recentTasks.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No tasks assigned to you yet.
              </div>
            ) : (
              recentTasks.map((task) => (
                <div key={task.id} className="p-4 border-b last:border-b-0 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{task.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status?.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                        <span>{task.project_name}</span>
                        {task.due_date && (
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                        {task.estimated_hours && (
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {task.estimated_hours}h est.
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 ml-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedEmployeeDashboard;