import React, { useEffect, useState } from 'react';
import { useAuth } from '../../store/contexts/AuthContext';
import { useRoleManager } from '../../hooks/useRoleManager';
import { ProjectService } from '../../services/ProjectService';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ProjectCard } from './components/ProjectCard';
import type { Project, Task } from '../../types';
import { PageHeader } from '../../components/shared/PageHeader';

export const MyProjectsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { currentRole, canManageProjects } = useRoleManager();

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Record<string, Task[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!currentUser?.id) return;
      setLoading(true);
      setError(null);

      try {
        // If user can manage projects, they should still see the full management page
        if (canManageProjects()) {
          setError('Use Project Management for full access');
          setProjects([]);
          return;
        }

        const projectsResult = await ProjectService.getUserProjects(currentUser.id);
        if (projectsResult.error) {
          setError(projectsResult.error);
          setProjects([]);
          return;
        }

        const normalized = projectsResult.projects || [];
        setProjects(normalized as Project[]);

        // Preload tasks per project (embedded tasks are preferred)
        const tasksMap: Record<string, Task[]> = {};
          for (const p of normalized) {
            // Response objects may have either `id` or `_id` and may embed `tasks`
            const projId = (p as any).id || (p as any)._id;
            if (!projId) continue;

            // If tasks are embedded, use them
            const embeddedTasks = (p as any).tasks;
            if (Array.isArray(embeddedTasks) && embeddedTasks.length > 0) {
              tasksMap[String(projId)] = embeddedTasks as Task[];
            } else {
              const tRes = await ProjectService.getProjectTasks(String(projId));
              tasksMap[String(projId)] = tRes.tasks || [];
            }
          }

        setTasks(tasksMap);
      } catch (err) {
        console.error('Error loading My Projects:', err);
        setError('Failed to load your projects');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentUser, currentRole, canManageProjects]);

  if (loading) return <LoadingSpinner fullScreen text="Loading your projects..." />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{error}</h2>
          <p className="text-gray-600">If you believe this is incorrect, contact your manager.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="My Projects" description="Projects assigned to you and their tasks" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 && (
          <div className="col-span-full">
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-gray-600">You are not assigned to any projects yet.</p>
            </div>
          </div>
        )}

          {projects.map((project) => {
            const pid = (project as any).id || (project as any)._id;
            return (
              <div key={String(pid)}>
                <ProjectCard
                  project={{ ...project, tasks: tasks[String(pid)] || [] } as Project}
                  onViewDetails={() => { /* navigate to project detail handled by existing components when needed */ }}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default MyProjectsPage;
