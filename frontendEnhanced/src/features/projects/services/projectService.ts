/**
 * Project Service
 * API communication for projects, tasks, and teams
 * Cognitive Complexity: 7
 */
import { apiClient } from '../../../core/api/client';
import type {
  Project,
  Task,
  Client,
  ProjectMember,
  ProjectFormData,
  TaskFormData,
  ProjectAnalytics,
  ProjectStats,
} from '../types/project.types';

export const projectService = {
  // Projects
  async getAllProjects(): Promise<Project[]> {
    return apiClient.get<Project[]>('/projects');
  },

  async getUserProjects(userId: string): Promise<Project[]> {
    return apiClient.get<Project[]>(`/projects/user/${userId}`);
  },

  async getProjectById(id: string): Promise<Project> {
    return apiClient.get<Project>(`/projects/${id}`);
  },

  async createProject(data: ProjectFormData): Promise<Project> {
    return apiClient.post<Project>('/projects', data);
  },

  async updateProject(id: string, data: Partial<ProjectFormData>): Promise<Project> {
    return apiClient.patch<Project>(`/projects/${id}`, data);
  },

  async deleteProject(id: string): Promise<void> {
    return apiClient.delete(`/projects/${id}`);
  },

  async getProjectStats(id: string): Promise<ProjectStats> {
    return apiClient.get<ProjectStats>(`/projects/${id}/stats`);
  },

  async getProjectAnalytics(): Promise<ProjectAnalytics> {
    return apiClient.get<ProjectAnalytics>('/projects/analytics');
  },

  // Tasks
  async getProjectTasks(projectId: string): Promise<Task[]> {
    return apiClient.get<Task[]>(`/projects/${projectId}/tasks`);
  },

  async getUserTasks(userId: string): Promise<Task[]> {
    return apiClient.get<Task[]>(`/tasks/user/${userId}`);
  },

  async getLeadTasks(userId: string): Promise<Task[]> {
    return apiClient.get<Task[]>(`/tasks/lead/${userId}`);
  },

  async getTaskById(id: string): Promise<Task> {
    return apiClient.get<Task>(`/tasks/${id}`);
  },

  async createTask(projectId: string, data: TaskFormData): Promise<Task> {
    return apiClient.post<Task>(`/projects/${projectId}/tasks`, data);
  },

  async updateTask(id: string, data: Partial<TaskFormData>): Promise<Task> {
    return apiClient.patch<Task>(`/tasks/${id}`, data);
  },

  async deleteTask(id: string): Promise<void> {
    return apiClient.delete(`/tasks/${id}`);
  },

  // Team Members
  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    return apiClient.get<ProjectMember[]>(`/projects/${projectId}/members`);
  },

  async addProjectMember(
    projectId: string,
    data: { user_id: string; project_role: string }
  ): Promise<ProjectMember> {
    return apiClient.post<ProjectMember>(`/projects/${projectId}/members`, data);
  },

  async updateProjectMember(
    projectId: string,
    memberId: string,
    data: { project_role: string }
  ): Promise<ProjectMember> {
    return apiClient.patch<ProjectMember>(
      `/projects/${projectId}/members/${memberId}`,
      data
    );
  },

  async removeProjectMember(projectId: string, memberId: string): Promise<void> {
    return apiClient.delete(`/projects/${projectId}/members/${memberId}`);
  },

  // Clients
  async getAllClients(): Promise<Client[]> {
    return apiClient.get<Client[]>('/clients');
  },

  async getClientById(id: string): Promise<Client> {
    return apiClient.get<Client>(`/clients/${id}`);
  },
};
