import React, { useEffect, useState } from 'react';
import { Users, List, Layers, X } from 'lucide-react';
import { ProjectService } from '../../services/ProjectService';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { ProjectCard } from '../../components/project/ProjectCard';
import { TaskList } from '../../components/project/TaskList';
import type { Project as ProjectType, Task } from '../../components/project/ProjectList';

type ViewTab = 'overview' | 'tasks' | 'members';

interface Props {
  projectId: string;
  onClose: () => void;
}

export const ProjectDetailModal: React.FC<Props> = ({ projectId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectType | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [membersCount, setMembersCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<ViewTab>('overview');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [projRes, tasksRes, membersRes] = await Promise.all([
          ProjectService.getProjectById(projectId),
          ProjectService.getProjectTasks(projectId),
          ProjectService.getProjectMembers?.(projectId) || Promise.resolve({ members: [] })
        ]);

        if (projRes.error) {
          setProject(null);
          return;
        }

        if (projRes.project) {
          const p = projRes.project as any;
          setProject({
            id: p.id || p._id,
            name: p.name,
            client_name: p.client_name || p.client_id?.name || p.client?.name,
            status: p.status,
            start_date: p.start_date,
            end_date: p.end_date,
            budget: p.budget || 0,
            description: p.description,
            is_billable: p.is_billable ?? true,
            tasks: (p.tasks || []) as any,
            total_hours_logged: p.total_hours_logged || 0,
            avg_hourly_rate: p.avg_hourly_rate || 0,
            team_members: (p.team_members || []).map((m: any) => ({ name: m.user?.full_name || m.user_name || m.name }))
          });
        }

        if (!tasksRes.error && tasksRes.tasks) {
          setTasks(tasksRes.tasks as Task[]);
        }

        if (!membersRes.error && Array.isArray(membersRes.members)) {
          setMembersCount(membersRes.members.length);
        }
      } catch (err) {
        console.error('Error loading project detail modal:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  if (loading) return <LoadingSpinner fullScreen={false} text="Loading project..." />;

  if (!project) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl p-6">
          <EmptyState icon={Layers} title="Project not found" description="The requested project could not be loaded." />
          <div className="mt-4 text-right">
            <Button onClick={onClose} icon={X}>Close</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold">{project.name}</h3>
            <div className="text-sm text-gray-600">{project.client_name}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onClose} variant="ghost" icon={X}>Close</Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <button className={`px-3 py-2 rounded ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-white'}`} onClick={() => setActiveTab('overview')}>Overview</button>
            <button className={`px-3 py-2 rounded ${activeTab === 'tasks' ? 'bg-blue-600 text-white' : 'bg-white'}`} onClick={() => setActiveTab('tasks')}>Tasks ({tasks.length})</button>
            <button className={`px-3 py-2 rounded ${activeTab === 'members' ? 'bg-blue-600 text-white' : 'bg-white'}`} onClick={() => setActiveTab('members')}>Members ({membersCount})</button>
          </div>

          {activeTab === 'overview' && (
            <div>
              <ProjectCard project={project} onViewDetails={() => {}} onEdit={() => {}} />
              {project.description && <p className="mt-4 text-sm text-gray-700">{project.description}</p>}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div>
              <TaskList tasks={tasks} />
            </div>
          )}

          {activeTab === 'members' && (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-semibold mb-2">Members</h3>
              <p className="text-sm">Members: {membersCount}</p>
              <div className="mt-3">
                <Button onClick={() => window.location.assign(`/dashboard/projects/${projectId}/members`)} icon={Users}>Manage Members</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailModal;
