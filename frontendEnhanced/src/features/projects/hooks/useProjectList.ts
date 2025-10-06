/**
 * useProjectList Hook
 * Manages project list state, filtering, and operations
 * Cognitive Complexity: 7
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { projectService } from '../services/projectService';
import type { Project, ProjectFilters } from '../types/project.types';

interface UseProjectListReturn {
  projects: Project[];
  filteredProjects: Project[];
  isLoading: boolean;
  error: string | null;
  filters: ProjectFilters;
  setFilters: (filters: Partial<ProjectFilters>) => void;
  refreshProjects: () => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

export const useProjectList = (userId?: string): UseProjectListReturn => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<ProjectFilters>({
    status: 'all',
    search: '',
  });

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = userId
        ? await projectService.getUserProjects(userId)
        : await projectService.getAllProjects();

      // Deduplicate projects by ID
      const uniqueProjects = data.reduce((acc, project) => {
        if (!acc.find(p => p.id === project.id)) {
          acc.push(project);
        }
        return acc;
      }, [] as Project[]);

      setProjects(uniqueProjects);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load projects';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = useMemo(() => {
    let filtered = [...projects];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(p => p.status === filters.status);
    }

    // Filter by client
    if (filters.clientId) {
      filtered = filtered.filter(p => p.client_id === filters.clientId);
    }

    // Filter by manager
    if (filters.managerId) {
      filtered = filtered.filter(p => p.primary_manager_id === filters.managerId);
    }

    // Search by name or description
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower) ||
          p.client_name?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by most recent first
    return filtered.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }, [projects, filters]);

  const setFilters = useCallback((newFilters: Partial<ProjectFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const refreshProjects = useCallback(async () => {
    await fetchProjects();
  }, [fetchProjects]);

  const deleteProject = useCallback(
    async (id: string) => {
      try {
        await projectService.deleteProject(id);
        setProjects(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete project';
        throw new Error(message);
      }
    },
    []
  );

  return {
    projects,
    filteredProjects,
    isLoading,
    error,
    filters,
    setFilters,
    refreshProjects,
    deleteProject,
  };
};
