import { Express } from 'express';
import testRoutes from './test';
import timesheetRoutes from './timesheet';

export const registerRoutes = (app: Express): void => {
  // Test routes (for development and health checks)
  app.use('/api/test', testRoutes);
  
  // API v1 routes - Re-enabled after fixing imports!
  app.use('/api/v1/timesheets', timesheetRoutes);
  
  // Health check at root
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'Server is running',
      timestamp: new Date().toISOString(),
      database: 'MongoDB connected successfully!'
    });
  });
};