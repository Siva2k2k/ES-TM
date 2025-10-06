/**
 * API Endpoints
 * Centralized endpoint definitions
 */

export const ENDPOINTS = {
  // Auth
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    register: '/auth/register',
    profile: '/auth/profile',
    resetPassword: '/auth/reset-password',
  },

  // Users
  users: {
    list: '/users',
    byId: (id: string) => `/users/${id}`,
    create: '/users',
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
  },

  // Timesheets
  timesheets: {
    list: '/timesheets',
    byId: (id: string) => `/timesheets/${id}`,
    create: '/timesheets',
    update: (id: string) => `/timesheets/${id}`,
    submit: (id: string) => `/timesheets/${id}/submit`,
    approve: (id: string) => `/timesheets/${id}/approve`,
    reject: (id: string) => `/timesheets/${id}/reject`,
    entries: (id: string) => `/timesheets/${id}/entries`,
  },

  // Projects
  projects: {
    list: '/projects',
    byId: (id: string) => `/projects/${id}`,
    create: '/projects',
    update: (id: string) => `/projects/${id}`,
    delete: (id: string) => `/projects/${id}`,
    tasks: (id: string) => `/projects/${id}/tasks`,
    members: (id: string) => `/projects/${id}/members`,
  },

  // Reports
  reports: {
    templates: '/reports/templates',
    generate: '/reports/generate',
    history: '/reports/history',
    download: (id: string) => `/reports/${id}/download`,
  },

  // Dashboard
  dashboard: {
    metrics: '/dashboard/metrics',
    recentActivity: '/dashboard/activity',
    byRole: (role: string) => `/dashboard/${role}`,
  },

  // Settings
  settings: {
    profile: '/settings/profile',
    preferences: '/settings/preferences',
    notifications: '/settings/notifications',
    security: '/settings/security',
  },
} as const;
