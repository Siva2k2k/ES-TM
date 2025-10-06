/**
 * useProjectTasks Hook
 * Manages tasks for a specific project
 * Cognitive Complexity: 5
 */
import { useState, useEffect, useCallback } from 'react';
import { projectService } from '../services/projectService';
import type { Task, TaskFormData } from '../types/project.types';

interface UseProjectTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  addTask: (data: TaskFormData) => Promise<Task>;
  updateTask: (id: string, data: Partial<TaskFormData>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
}

export const useProjectTasks = (projectId: string): UseProjectTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await projectService.getProjectTasks(projectId);
      setTasks(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tasks';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = useCallback(
    async (data: TaskFormData): Promise<Task> => {
      try {
        const newTask = await projectService.createTask(projectId, data);
        setTasks(prev => [...prev, newTask]);
        return newTask;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create task';
        setError(message);
        throw new Error(message);
      }
    },
    [projectId]
  );

  const updateTask = useCallback(
    async (id: string, data: Partial<TaskFormData>): Promise<Task> => {
      try {
        const updatedTask = await projectService.updateTask(id, data);
        setTasks(prev => prev.map(t => (t.id === id ? updatedTask : t)));
        return updatedTask;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update task';
        setError(message);
        throw new Error(message);
      }
    },
    []
  );

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    try {
      await projectService.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete task';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const refreshTasks = useCallback(async () => {
    await fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    isLoading,
    error,
    addTask,
    updateTask,
    deleteTask,
    refreshTasks,
  };
};
