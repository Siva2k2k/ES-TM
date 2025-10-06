import { Router } from 'express';
import { 
  ProjectBillingController,
  getProjectBillingViewValidation,
  getTaskBillingViewValidation,
  updateBillableHoursValidation
} from '@/controllers/ProjectBillingController';
import { requireAuth, requireManager } from '@/middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

/**
 * @route GET /api/v1/project-billing/projects
 * @desc Get project-based billing view with monthly/weekly breakdown
 * @access Private (Manager+)
 */
router.get('/projects', getProjectBillingViewValidation, ProjectBillingController.getProjectBillingView);

/**
 * @route GET /api/v1/project-billing/tasks
 * @desc Get task-based billing view with detailed breakdown
 * @access Private (Manager+)
 */
router.get('/tasks', ProjectBillingController.getTaskBillingView);

/**
 * @route GET /api/v1/project-billing/test
 * @desc Test endpoint
 * @access Private
 */
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Project billing routes are working!', user: req.user });
});

/**
 * @route PUT /api/v1/project-billing/billable-hours
 * @desc Update billable hours for a specific time entry
 * @access Private (Manager+)
 */
router.put('/billable-hours', updateBillableHoursValidation, ProjectBillingController.updateBillableHours);

export default router;