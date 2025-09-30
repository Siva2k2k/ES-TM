import { Router } from 'express';
import { DashboardController } from '@/controllers/DashboardController';
import { requireAuth } from '@/middleware/auth';

const router = Router();

// Apply authentication middleware to all dashboard routes
router.use(requireAuth);

// Role-specific dashboard routes
router.get('/', DashboardController.getRoleSpecificDashboard);
router.get('/super-admin', DashboardController.getSuperAdminDashboard);
router.get('/management', DashboardController.getManagementDashboard);
router.get('/manager', DashboardController.getManagerDashboard);
router.get('/lead', DashboardController.getLeadDashboard);
router.get('/employee', DashboardController.getEmployeeDashboard);

export default router;