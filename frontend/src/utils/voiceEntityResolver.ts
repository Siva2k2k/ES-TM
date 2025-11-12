/**
 * Simplified Voice Entity Resolver for Frontend
 * Handles name-to-ID resolution for voice commands
 */

interface SimpleEntity {
  id: string;
  name?: string;
  full_name?: string;
  email?: string;
  role?: string;
  project_id?: string;
  projectId?: string;
  [key: string]: unknown;
}

export class VoiceEntityResolver {
  private projects: SimpleEntity[] = [];
  private users: SimpleEntity[] = [];
  private clients: SimpleEntity[] = [];
  private tasks: SimpleEntity[] = [];

  setProjects(projects: SimpleEntity[]): void {
    this.projects = projects;
  }

  setUsers(users: SimpleEntity[]): void {
    this.users = users;
  }

  setClients(clients: SimpleEntity[]): void {
    this.clients = clients;
  }

  setTasks(tasks: SimpleEntity[]): void {
    this.tasks = tasks;
  }

  /**
   * Check if string is a valid ObjectId
   */
  private isValidObjectId(str: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(str);
  }

  /**
   * Resolve project name or ID to valid ObjectId
   */
  resolveProjectId(identifier: string): string | null {
    if (this.isValidObjectId(identifier)) {
      return identifier;
    }
    
    const project = this.projects.find(p => 
      p.name?.toLowerCase() === identifier.toLowerCase()
    );
    
    return project ? project.id : null;
  }

  /**
   * Resolve user name or ID to valid ObjectId
   */
  resolveUserId(identifier: string): string | null {
    if (this.isValidObjectId(identifier)) {
      return identifier;
    }
    
    const user = this.users.find(u => 
      u.full_name?.toLowerCase() === identifier.toLowerCase() ||
      u.email?.toLowerCase() === identifier.toLowerCase()
    );
    
    return user ? user.id : null;
  }

  /**
   * Resolve client name or ID to valid ObjectId
   */
  resolveClientId(identifier: string): string | null {
    if (this.isValidObjectId(identifier)) {
      return identifier;
    }
    
    const client = this.clients.find(c => 
      c.name?.toLowerCase() === identifier.toLowerCase()
    );
    
    return client ? client.id : null;
  }

  /**
   * Resolve manager name or ID (users with manager role)
   */
  resolveManagerId(identifier: string): string | null {
    if (this.isValidObjectId(identifier)) {
      return identifier;
    }
    
    const manager = this.users.find(u => 
      u.role?.toLowerCase() === 'manager' &&
      (u.full_name?.toLowerCase() === identifier.toLowerCase() ||
       u.email?.toLowerCase() === identifier.toLowerCase())
    );
    
    return manager ? manager.id : null;
  }

  /**
   * Resolve task within project context
   */
  resolveTaskIdInProject(taskName: string, projectId: string): string | null {
    if (this.isValidObjectId(taskName)) {
      return taskName;
    }
    
    const task = this.tasks.find(t => 
      t.name?.toLowerCase() === taskName.toLowerCase() &&
      (t.project_id === projectId || t.projectId === projectId)
    );
    
    return task ? task.id : null;
  }

  /**
   * Resolve task globally (no project filter)
   */
  resolveTaskId(taskName: string): string | null {
    if (this.isValidObjectId(taskName)) {
      return taskName;
    }
    
    const task = this.tasks.find(t => 
      t.name?.toLowerCase() === taskName.toLowerCase()
    );
    
    return task ? task.id : null;
  }

  /**
   * Get entity suggestions for error messages
   */
  getProjectSuggestions(): string[] {
    return this.projects.map(p => p.name).filter(Boolean) as string[];
  }

  getUserSuggestions(): string[] {
    return this.users.map(u => u.full_name).filter(Boolean) as string[];
  }

  getClientSuggestions(): string[] {
    return this.clients.map(c => c.name).filter(Boolean) as string[];
  }

  getTaskSuggestions(projectId?: string): string[] {
    let filteredTasks = this.tasks;
    
    if (projectId) {
      filteredTasks = this.tasks.filter(t => 
        t.project_id === projectId || t.projectId === projectId
      );
    }
    
    return filteredTasks.map(t => t.name).filter(Boolean) as string[];
  }
}

// Export singleton instance
export const voiceEntityResolver = new VoiceEntityResolver();