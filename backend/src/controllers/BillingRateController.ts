import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { BillingRateService } from '@/services/BillingRateService';
import { UserRole } from '@/models/User';
import {
  ValidationError,
  AuthorizationError,
  handleAsyncError
} from '@/utils/errors';
import mongoose from 'mongoose';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    full_name: string;
    hourly_rate: number;
    is_active: boolean;
    is_approved_by_super_admin: boolean;
  };
}

export class BillingRateController {
  
  /**
   * Create a new billing rate
   */
  static readonly createBillingRate = handleAsyncError(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array().map(err => err.msg).join(', '));
    }

    if (!req.user) {
      throw new AuthorizationError('User not authenticated');
    }

    // Validate permissions
    if (!['super_admin', 'management'].includes(req.user.role)) {
      throw new AuthorizationError('Insufficient permissions to create billing rates');
    }

    const rateData = {
      ...req.body,
      created_by: new mongoose.Types.ObjectId(req.user.id)
    };

    const rate = await BillingRateService.createBillingRate(rateData);

    res.status(201).json({
      success: true,
      message: 'Billing rate created successfully',
      rate
    });
  });

  /**
   * Update a billing rate (creates new version)
   */
  static readonly updateBillingRate = handleAsyncError(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array().map(err => err.msg).join(', '));
    }

    if (!req.user) {
      throw new AuthorizationError('User not authenticated');
    }

    // Validate permissions
    if (!['super_admin', 'management'].includes(req.user.role)) {
      throw new AuthorizationError('Insufficient permissions to update billing rates');
    }

    const { rateId } = req.params;
    const updateData = {
      ...req.body,
      created_by: new mongoose.Types.ObjectId(req.user.id)
    };

    const rate = await BillingRateService.updateBillingRate(
      new mongoose.Types.ObjectId(rateId),
      updateData
    );

    res.json({
      success: true,
      message: 'Billing rate updated successfully',
      rate
    });
  });

  /**
   * Get billing rates for an entity
   */
  static readonly getBillingRates = handleAsyncError(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array().map(err => err.msg).join(', '));
    }

    if (!req.user) {
      throw new AuthorizationError('User not authenticated');
    }

    const { entityType, entityId } = req.query;
    
    const rates = await BillingRateService.getBillingRatesForEntity(
      entityType as any,
      entityId ? new mongoose.Types.ObjectId(entityId as string) : undefined
    );

    res.json({
      success: true,
      rates
    });
  });

  /**
   * Calculate effective rate for given criteria
   */
  static readonly calculateEffectiveRate = handleAsyncError(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array().map(err => err.msg).join(', '));
    }

    if (!req.user) {
      throw new AuthorizationError('User not authenticated');
    }

    const { userId, projectId, clientId, date, hours, isHoliday } = req.body;
    
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    const criteria = {
      user_id: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      project_id: projectId ? new mongoose.Types.ObjectId(projectId) : undefined,
      client_id: clientId ? new mongoose.Types.ObjectId(clientId) : undefined,
      date: dateObj,
      hours: parseFloat(hours),
      day_of_week: dayOfWeek,
      is_holiday: Boolean(isHoliday)
    };

    const calculation = await BillingRateService.getEffectiveRate(criteria);

    res.json({
      success: true,
      calculation
    });
  });

  /**
   * Preview rate calculation without saving
   */
  static readonly previewRateCalculation = handleAsyncError(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array().map(err => err.msg).join(', '));
    }

    if (!req.user) {
      throw new AuthorizationError('User not authenticated');
    }

    const { userId, projectId, clientId, date, hours, isHoliday } = req.body;
    
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    const criteria = {
      user_id: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      project_id: projectId ? new mongoose.Types.ObjectId(projectId) : undefined,
      client_id: clientId ? new mongoose.Types.ObjectId(clientId) : undefined,
      date: dateObj,
      hours: parseFloat(hours),
      day_of_week: dayOfWeek,
      is_holiday: Boolean(isHoliday)
    };

    const preview = await BillingRateService.previewRateCalculation(criteria);

    res.json({
      success: true,
      preview
    });
  });
}

// Validation middleware
export const createBillingRateValidation = [
  body('entity_type')
    .isIn(['global', 'client', 'project', 'user', 'role'])
    .withMessage('Invalid entity type'),
  body('standard_rate')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Standard rate must be a positive number'),
  body('effective_from')
    .isISO8601()
    .withMessage('Effective from date must be a valid date'),
  body('minimum_increment')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Minimum increment must be a positive integer'),
  body('rounding_rule')
    .optional()
    .isIn(['up', 'down', 'nearest'])
    .withMessage('Invalid rounding rule')
];

export const updateBillingRateValidation = [
  param('rateId')
    .isMongoId()
    .withMessage('Invalid rate ID'),
  ...createBillingRateValidation
];

export const getBillingRatesValidation = [
  query('entityType')
    .isIn(['global', 'client', 'project', 'user', 'role'])
    .withMessage('Invalid entity type'),
  query('entityId')
    .optional()
    .isMongoId()
    .withMessage('Invalid entity ID')
];

export const calculateEffectiveRateValidation = [
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid date'),
  body('hours')
    .isNumeric()
    .isFloat({ min: 0, max: 24 })
    .withMessage('Hours must be between 0 and 24'),
  body('userId')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID'),
  body('projectId')
    .optional()
    .isMongoId()
    .withMessage('Invalid project ID'),
  body('clientId')
    .optional()
    .isMongoId()
    .withMessage('Invalid client ID')
];