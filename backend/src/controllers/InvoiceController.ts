import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { InvoiceWorkflowService } from '@/services/InvoiceWorkflowService';
import { UserRole } from '@/models/User';
import {
  ValidationError,
  AuthorizationError,
  handleAsyncError
} from '@/utils/errors';
import { AuthUser } from '@/utils/auth';
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

export class InvoiceController {
  
  /**
   * Generate invoice draft from timesheets
   */
  static readonly generateInvoiceDraft = handleAsyncError(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array().map(err => err.msg).join(', '));
    }

    if (!req.user) {
      throw new AuthorizationError('User not authenticated');
    }

    // Validate permissions
    if (!['super_admin', 'management', 'manager'].includes(req.user.role)) {
      throw new AuthorizationError('Insufficient permissions to generate invoices');
    }

    const { clientId, startDate, endDate } = req.body;

    const invoiceDraft = await InvoiceWorkflowService.generateInvoiceFromTimesheets(
      new mongoose.Types.ObjectId(clientId),
      { start: new Date(startDate), end: new Date(endDate) },
      req.user
    );

    res.status(201).json({
      success: true,
      message: 'Invoice draft generated successfully',
      draft: invoiceDraft
    });
  });

  /**
   * Create invoice from draft
   */
  static readonly createInvoice = handleAsyncError(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array().map(err => err.msg).join(', '));
    }

    if (!req.user) {
      throw new AuthorizationError('User not authenticated');
    }

    // Validate permissions
    if (!['super_admin', 'management', 'manager'].includes(req.user.role)) {
      throw new AuthorizationError('Insufficient permissions to create invoices');
    }

    const invoice = await InvoiceWorkflowService.createInvoice(req.body, req.user);

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      invoice
    });
  });

  /**
   * Submit invoice for approval
   */
  static readonly submitForApproval = handleAsyncError(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array().map(err => err.msg).join(', '));
    }

    if (!req.user) {
      throw new AuthorizationError('User not authenticated');
    }

    const { invoiceId } = req.params;

    const invoice = await InvoiceWorkflowService.submitForApproval(
      new mongoose.Types.ObjectId(invoiceId),
      new mongoose.Types.ObjectId(req.user.id)
    );

    res.json({
      success: true,
      message: 'Invoice submitted for approval',
      invoice
    });
  });

  /**
   * Approve or reject invoice
   */
  static readonly processApproval = handleAsyncError(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array().map(err => err.msg).join(', '));
    }

    if (!req.user) {
      throw new AuthorizationError('User not authenticated');
    }

    const { invoiceId } = req.params;
    const { action, reason } = req.body;

    const invoice = await InvoiceWorkflowService.processApproval(
      new mongoose.Types.ObjectId(invoiceId),
      new mongoose.Types.ObjectId(req.user.id),
      action,
      reason
    );

    res.json({
      success: true,
      message: `Invoice ${action}d successfully`,
      invoice
    });
  });

  /**
   * Get invoice line items
   */
  static readonly getInvoiceLineItems = handleAsyncError(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array().map(err => err.msg).join(', '));
    }

    if (!req.user) {
      throw new AuthorizationError('User not authenticated');
    }

    const { invoiceId } = req.params;

    const lineItems = await InvoiceWorkflowService.getInvoiceLineItems(
      new mongoose.Types.ObjectId(invoiceId)
    );

    res.json({
      success: true,
      lineItems
    });
  });

  /**
   * Get invoice dashboard statistics
   */
  static readonly getDashboardStats = handleAsyncError(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError('User not authenticated');
    }

    // Validate permissions
    if (!['super_admin', 'management', 'manager'].includes(req.user.role)) {
      throw new AuthorizationError('Insufficient permissions to view invoice statistics');
    }

    const stats = await InvoiceWorkflowService.getInvoiceDashboardStats();

    res.json({
      success: true,
      stats
    });
  });

  /**
   * Get all invoices with optional filtering
   */
  static readonly getAllInvoices = handleAsyncError(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError('User not authenticated');
    }

    // Validate permissions
    if (!['super_admin', 'management', 'manager'].includes(req.user.role)) {
      throw new AuthorizationError('Insufficient permissions to view invoices');
    }

    const { status, client_id } = req.query;
    
    // Build filter criteria
    const filter: any = {};
    if (status) {
      filter.status = status;
    }
    if (client_id && mongoose.Types.ObjectId.isValid(client_id as string)) {
      filter.client_id = new mongoose.Types.ObjectId(client_id as string);
    }

    const invoices = await InvoiceWorkflowService.getInvoicesWithDetails(filter);

    res.json({
      success: true,
      invoices
    });
  });

  /**
   * Generate invoice from timesheet data
   */
  static readonly generateInvoice = handleAsyncError(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError('User not authenticated');
    }

    // Validate permissions
    if (!['super_admin', 'management', 'manager'].includes(req.user.role)) {
      throw new AuthorizationError('Insufficient permissions to generate invoices');
    }

    const { client_id, week_start_date } = req.body;

    if (!client_id || !mongoose.Types.ObjectId.isValid(client_id)) {
      throw new ValidationError('Valid client ID is required');
    }

    if (!week_start_date) {
      throw new ValidationError('Week start date is required');
    }

    const weekStart = new Date(week_start_date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const invoice = await InvoiceWorkflowService.generateInvoiceFromTimesheets(
      new mongoose.Types.ObjectId(client_id),
      {
        start: weekStart,
        end: weekEnd
      },
      req.user as AuthUser
    );

    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      invoice
    });
  });

  /**
   * Approve an invoice
   */
  static readonly approveInvoice = handleAsyncError(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError('User not authenticated');
    }

    // Validate permissions
    if (!['super_admin', 'management', 'manager'].includes(req.user.role)) {
      throw new AuthorizationError('Insufficient permissions to approve invoices');
    }

    const { invoiceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      throw new ValidationError('Invalid invoice ID');
    }

    const invoice = await InvoiceWorkflowService.processApproval(
      new mongoose.Types.ObjectId(invoiceId),
      new mongoose.Types.ObjectId(req.user.id),
      'approve'
    );

    res.json({
      success: true,
      message: 'Invoice approved successfully',
      invoice
    });
  });

  /**
   * Reject an invoice
   */
  static readonly rejectInvoice = handleAsyncError(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError('User not authenticated');
    }

    // Validate permissions
    if (!['super_admin', 'management', 'manager'].includes(req.user.role)) {
      throw new AuthorizationError('Insufficient permissions to reject invoices');
    }

    const { invoiceId } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      throw new ValidationError('Invalid invoice ID');
    }

    if (!reason) {
      throw new ValidationError('Rejection reason is required');
    }

    const invoice = await InvoiceWorkflowService.processApproval(
      new mongoose.Types.ObjectId(invoiceId),
      new mongoose.Types.ObjectId(req.user.id),
      'reject',
      reason
    );

    res.json({
      success: true,
      message: 'Invoice rejected successfully',
      invoice
    });
  });
}

// Validation middleware
export const generateInvoiceDraftValidation = [
  body('clientId')
    .isMongoId()
    .withMessage('Invalid client ID'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date')
];

export const createInvoiceValidation = [
  body('client_id')
    .isMongoId()
    .withMessage('Invalid client ID'),
  body('billing_period.start_date')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('billing_period.end_date')
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('subtotal')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Subtotal must be a positive number'),
  body('total_amount')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-character code'),
  body('payment_terms_days')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Payment terms must be a non-negative integer')
];

export const invoiceIdValidation = [
  param('invoiceId')
    .isMongoId()
    .withMessage('Invalid invoice ID')
];

export const processApprovalValidation = [
  param('invoiceId')
    .isMongoId()
    .withMessage('Invalid invoice ID'),
  body('action')
    .isIn(['approve', 'reject'])
    .withMessage('Action must be either approve or reject'),
  body('reason')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Reason must be a string with maximum 500 characters')
];