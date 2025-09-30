import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../store/contexts/AuthContext';

interface ProjectPermissions {
  projectRole: string | null;
  hasManagerAccess: boolean;
  canAddMembers: boolean;
  canApproveTimesheets: boolean;
  canViewAllTasks: boolean;
  canAssignTasks: boolean;
}

interface UserProjectRole {
  projectId: string;
  projectName: string;
  projectRole: string;
  hasManagerAccess: boolean;
  isActive: boolean;
}

interface Project {
  id: string;
  name: string;
  client_name?: string;
  status: string;
  description?: string;
  is_billable: boolean;
  primary_manager_id: string;
  created_at: string;
  updated_at: string;
}

interface ProjectContextType {
  // Current project state
  currentProject: Project | null;
  currentProjectPermissions: ProjectPermissions | null;

  // User project roles across all projects
  userProjectRoles: UserProjectRole[];

  // Project management
  setCurrentProject: (project: Project | null) => void;
  loadProjectPermissions: (projectId: string) => Promise<void>;
  loadUserProjectRoles: () => Promise<void>;
  refreshCurrentProject: () => Promise<void>;

  // Project filtering and selection
  getProjectsByRole: (role?: string) => UserProjectRole[];
  getProjectsWithManagerAccess: () => UserProjectRole[];
  isCurrentUserProjectManager: (projectId: string) => boolean;
  hasManagerAccessInProject: (projectId: string) => boolean;

  // Loading states
  loading: boolean;
  error: string | null;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

interface ProjectContextProviderProps {
  children: ReactNode;
}

export const ProjectContextProvider: React.FC<ProjectContextProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [currentProjectPermissions, setCurrentProjectPermissions] = useState<ProjectPermissions | null>(null);
  const [userProjectRoles, setUserProjectRoles] = useState<UserProjectRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's project roles when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserProjectRoles();
    }
  }, [isAuthenticated, user]);

  // Load permissions when current project changes
  useEffect(() => {
    if (currentProject) {
      loadProjectPermissions(currentProject.id);
    } else {
      setCurrentProjectPermissions(null);
    }
  }, [currentProject]);

  const setCurrentProject = (project: Project | null) => {
    setCurrentProjectState(project);
    setError(null);
  };

  const loadProjectPermissions = async (projectId: string) => {
    if (!user || !projectId) return;

    try {
      const response = await fetch(`/api/v1/projects/${projectId}/permissions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentProjectPermissions(data.permissions);
      } else {
        console.error('Failed to load project permissions:', data.error);
        setCurrentProjectPermissions(null);
      }
    } catch (err) {
      console.error('Error loading project permissions:', err);
      setCurrentProjectPermissions(null);
    }
  };

  const loadUserProjectRoles = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/projects/users/${user.id}/roles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setUserProjectRoles(data.userProjectRoles || []);
      } else {
        throw new Error(data.error || 'Failed to load user project roles');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load project roles';
      console.error('Error loading user project roles:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const refreshCurrentProject = async () => {
    if (!currentProject) return;

    try {
      const response = await fetch(`/api/v1/projects/${currentProject.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const data = await response.json();

      if (response.ok && data.project) {
        setCurrentProject(data.project);
      }
    } catch (err) {
      console.error('Error refreshing current project:', err);
    }
  };

  const getProjectsByRole = (role?: string): UserProjectRole[] => {
    if (!role) return userProjectRoles;
    return userProjectRoles.filter(project => project.projectRole === role);
  };

  const getProjectsWithManagerAccess = (): UserProjectRole[] => {
    return userProjectRoles.filter(project => project.hasManagerAccess);
  };

  const isCurrentUserProjectManager = (projectId: string): boolean => {
    const projectRole = userProjectRoles.find(project => project.projectId === projectId);
    return projectRole?.hasManagerAccess || false;
  };

  const hasManagerAccessInProject = (projectId: string): boolean => {
    return isCurrentUserProjectManager(projectId);
  };

  const contextValue: ProjectContextType = {
    // Current project state
    currentProject,
    currentProjectPermissions,

    // User project roles
    userProjectRoles,

    // Project management
    setCurrentProject,
    loadProjectPermissions,
    loadUserProjectRoles,
    refreshCurrentProject,

    // Project filtering and selection
    getProjectsByRole,
    getProjectsWithManagerAccess,
    isCurrentUserProjectManager,
    hasManagerAccessInProject,

    // Loading states
    loading,
    error
  };

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
};

// Custom hook to use the project context
export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectContextProvider');
  }
  return context;
};

// Helper hooks for common use cases
export const useCurrentProjectPermissions = () => {
  const { currentProjectPermissions } = useProject();
  return currentProjectPermissions;
};

export const useUserProjectRoles = () => {
  const { userProjectRoles, loading, error } = useProject();
  return { userProjectRoles, loading, error };
};

export const useProjectManagerAccess = (projectId?: string) => {
  const { isCurrentUserProjectManager, currentProject } = useProject();
  const targetProjectId = projectId || currentProject?.id;

  if (!targetProjectId) return false;
  return isCurrentUserProjectManager(targetProjectId);
};

// Project role summary hook
export const useProjectRoleSummary = () => {
  const { userProjectRoles } = useProject();

  const summary = userProjectRoles.reduce((acc, project) => {
    if (!acc[project.projectRole]) {
      acc[project.projectRole] = 0;
    }
    acc[project.projectRole]++;
    return acc;
  }, {} as Record<string, number>);

  const managerAccessCount = userProjectRoles.filter(p => p.hasManagerAccess).length;

  return {
    summary,
    totalProjects: userProjectRoles.length,
    managerAccessCount,
    activeProjects: userProjectRoles.filter(p => p.isActive).length
  };
};

export default ProjectContext;