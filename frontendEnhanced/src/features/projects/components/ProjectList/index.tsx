/**
 * Project List Component
 * Display and manage list of projects
 * Cognitive Complexity: 5
 * File Size: ~160 LOC
 */
import React, { useState } from 'react';
import { Plus, Building2, Search, Filter } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '../../../../shared/components/ui';
import { useProjectList } from '../../hooks';
import { ProjectCard } from './ProjectCard';
import type { Project, ProjectStatus } from '../../types/project.types';

interface ProjectListProps {
  userId?: string;
  onNewProject?: () => void;
  onEditProject?: (project: Project) => void;
  onViewProject?: (project: Project) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  userId,
  onNewProject,
  onEditProject,
  onViewProject,
}) => {
  const {
    filteredProjects,
    isLoading,
    error,
    filters,
    setFilters,
    deleteProject,
  } = useProjectList(userId);

  const [showFilters, setShowFilters] = useState(false);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(id);
      } catch (err) {
        // Error handling
        console.error('Delete failed:', err);
      }
    }
  };

  const handleStatusFilter = (status: 'all' | ProjectStatus) => {
    setFilters({ status });
  };

  const stats = {
    total: filteredProjects.length,
    active: filteredProjects.filter(p => p.status === 'active').length,
    completed: filteredProjects.filter(p => p.status === 'completed').length,
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading projects...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Projects</CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span>{stats.total} total</span>
                <span>•</span>
                <span>{stats.active} active</span>
                <span>•</span>
                <span>{stats.completed} completed</span>
              </div>
            </div>
            {onNewProject && (
              <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={onNewProject}>
                New Project
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search projects..."
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Filter className="h-4 w-4" />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Project List */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {filters.search || filters.status !== 'all'
                ? 'No projects match your filters'
                : 'No projects yet'}
            </p>
            {onNewProject && (
              <Button variant="primary" onClick={onNewProject}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={onEditProject || (() => {})}
              onDelete={handleDelete}
              onView={onViewProject || (() => {})}
            />
          ))}
        </div>
      )}
    </div>
  );
};
