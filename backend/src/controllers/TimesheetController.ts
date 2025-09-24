import { Request, Response } from 'express';
import { TimesheetService } from '@/services';
import { handleAsyncError } from '@/utils/errors';
import { AuthUser } from '@/utils/auth';

// Extend Request type to include user
interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export class TimesheetController {
  /**
   * Get user timesheets
   */
  static getAllTimesheets = handleAsyncError(async (req: AuthenticatedRequest, res: Response) => {
    const currentUser = req.user!;
    const result = await TimesheetService.getAllTimesheets(currentUser);

    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.timesheets
    });
  });

  /**
   * Get user timesheets
   */
  static getUserTimesheets = handleAsyncError(async (req: AuthenticatedRequest, res: Response) => {
    const currentUser = req.user!;
    const {
      userId,
      status,
      weekStartDate,
      limit = '50',
      offset = '0'
    } = req.query;

    const statusFilter = status ? (Array.isArray(status) ? status : [status]) : undefined;

    const result = await TimesheetService.getUserTimesheets(
      currentUser,
      userId as string,
      statusFilter as any,
      weekStartDate as string,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.timesheets,
      total: result.total
    });
  });

  /**
   * Create timesheet
   */
  static createTimesheet = handleAsyncError(async (req: AuthenticatedRequest, res: Response) => {
    const currentUser = req.user!;
    const { userId, weekStartDate } = req.body;

    if (!userId || !weekStartDate) {
      return res.status(400).json({
        success: false,
        error: 'userId and weekStartDate are required'
      });
    }

    const result = await TimesheetService.createTimesheet(userId, weekStartDate, currentUser);

    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.status(201).json({
      success: true,
      data: result.timesheet
    });
  });

  /**
   * Get timesheet by user and week
   */
  static getTimesheetByUserAndWeek = handleAsyncError(async (req: AuthenticatedRequest, res: Response) => {
    const currentUser = req.user!;
    const { userId, weekStartDate } = req.params;

    const result = await TimesheetService.getTimesheetByUserAndWeek(userId, weekStartDate, currentUser);

    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.timesheet
    });
  });

  /**
   * Submit timesheet
   */
  static submitTimesheet = handleAsyncError(async (req: AuthenticatedRequest, res: Response) => {
    const currentUser = req.user!;
    const { timesheetId } = req.params;

    const result = await TimesheetService.submitTimesheet(timesheetId, currentUser);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Timesheet submitted successfully'
    });
  });

  /**
   * Manager approve/reject timesheet
   */
  static managerApproveRejectTimesheet = handleAsyncError(async (req: AuthenticatedRequest, res: Response) => {
    const currentUser = req.user!;
    const { timesheetId } = req.params;
    const { action, reason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Action must be either "approve" or "reject"'
      });
    }

    const result = await TimesheetService.managerApproveRejectTimesheet(
      timesheetId,
      action,
      currentUser,
      reason
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: `Timesheet ${action}ed successfully`
    });
  });

  /**
   * Management approve/reject timesheet
   */
  static managementApproveRejectTimesheet = handleAsyncError(async (req: AuthenticatedRequest, res: Response) => {
    const currentUser = req.user!;
    const { timesheetId } = req.params;
    const { action, reason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Action must be either "approve" or "reject"'
      });
    }

    const result = await TimesheetService.managementApproveRejectTimesheet(
      timesheetId,
      action,
      currentUser,
      reason
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: `Timesheet ${action}ed successfully`
    });
  });

  /**
   * Add time entry
   */
  static addTimeEntry = handleAsyncError(async (req: AuthenticatedRequest, res: Response) => {
    const currentUser = req.user!;
    const { timesheetId } = req.params;
    const entryData = req.body;

    const result = await TimesheetService.addTimeEntry(timesheetId, entryData, currentUser);

    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.status(201).json({
      success: true,
      data: result.entry
    });
  });
}

export default TimesheetController;