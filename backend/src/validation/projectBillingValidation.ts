/**
 * Project Billing Validation Rules
 * Express-validator rules for project billing endpoints
 */

import { body, param, query } from 'express-validator';

/**
 * Validation for GET /api/v1/project-billing/projects
 * Get project-based billing view with monthly/weekly breakdown
 */
export const getProjectBillingViewValidation = [
  query('startDate').isISO8601().withMessage('Valid start date is required'),
  query('endDate').isISO8601().withMessage('Valid end date is required'),
  query('view').optional().isIn(['weekly', 'monthly', 'custom']).withMessage('View must be weekly, monthly, or custom'),
  query('projectIds').optional().isString().withMessage('Project IDs must be a comma-separated string'),
  query('clientIds').optional().isString().withMessage('Client IDs must be a comma-separated string')
];

/**
 * Validation for GET /api/v1/project-billing/tasks
 * Get task-based billing view with detailed breakdown
 */
export const getTaskBillingViewValidation = [
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date'),
  query('projectIds').optional().isString().withMessage('Project IDs must be a comma-separated string'),
  query('taskIds').optional().isString().withMessage('Task IDs must be a comma-separated string')
];

/**
 * Validation for GET /api/v1/project-billing/users
 * Get user-based billing analytics with task breakdown
 */
export const getUserBillingViewValidation = [
  query('startDate').isISO8601().withMessage('Valid start date is required'),
  query('endDate').isISO8601().withMessage('Valid end date is required'),
  query('view').optional().isIn(['weekly', 'monthly', 'custom']).withMessage('View must be weekly, monthly, or custom'),
  query('projectIds').optional().isString().withMessage('Project IDs must be a comma-separated string'),
  query('clientIds').optional().isString().withMessage('Client IDs must be a comma-separated string'),
  query('roles').optional().isString().withMessage('Roles must be a comma-separated string'),
  query('search').optional().isString().withMessage('Search must be a string')
];

/**
 * Validation for PUT /api/v1/project-billing/billable-hours
 * Update billable hours for a specific time entry
 */
export const updateBillableHoursValidation = [
  body('user_id').isMongoId().withMessage('Valid user ID is required'),
  body('project_id').isMongoId().withMessage('Valid project ID is required'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('end_date').isISO8601().withMessage('Valid end date is required'),
  body('billable_hours').isNumeric().withMessage('Billable hours must be a number'),
  body('total_hours').optional().isNumeric().withMessage('Total hours must be a number'),
  body('reason').optional().isString().withMessage('Reason must be a string')
];

/**
 * Validation for PUT /api/v1/project-billing/projects/:projectId/billable-total
 * Update total billable hours for a project (distributes across members)
 */
export const updateProjectBillableTotalValidation = [
  param('projectId').isMongoId().withMessage('Valid project ID is required'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('end_date').isISO8601().withMessage('Valid end date is required'),
  body('billable_hours').isNumeric().withMessage('Billable hours must be a number')
];

/**
 * Validation for POST /api/v1/project-billing/adjustments (if used)
 * Create or update billing adjustment
 */
export const createBillingAdjustmentValidation = [
  body('user_id').isMongoId().withMessage('Valid user ID is required'),
  body('project_id').isMongoId().withMessage('Valid project ID is required'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('end_date').isISO8601().withMessage('Valid end date is required'),
  body('adjusted_billable_hours').isNumeric().withMessage('Adjusted billable hours must be a number'),
  body('original_billable_hours').isNumeric().withMessage('Original billable hours must be a number'),
  body('reason').optional().isString().withMessage('Reason must be a string')
];

/**
 * Validation for GET /api/v1/project-billing/breakdown
 * Get user breakdown (weekly or monthly) for a project
 */
export const getUserBreakdownValidation = [
  query('type').isIn(['weekly', 'monthly']).withMessage('Type must be weekly or monthly'),
  query('projectId').isMongoId().withMessage('Valid project ID is required'),
  query('userId').isMongoId().withMessage('Valid user ID is required'),
  query('startDate').isISO8601().withMessage('Valid start date is required'),
  query('endDate').isISO8601().withMessage('Valid end date is required')
];
