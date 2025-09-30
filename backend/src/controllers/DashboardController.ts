import { Request, Response } from 'express';
import { DashboardService } from '@/services/DashboardService';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    full_name: string;
    hourly_rate: number;
    is_active: boolean;
    is_approved_by_super_admin: boolean;
  };
}

export class DashboardController {
  static async getRoleSpecificDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      let result;

      switch (req.user.role) {
        case 'super_admin':
          result = await DashboardService.getSuperAdminDashboard(req.user as any);
          break;
        case 'management':
          result = await DashboardService.getManagementDashboard(req.user as any);
          break;
        case 'manager':
          result = await DashboardService.getManagerDashboard(req.user as any);
          break;
        case 'lead':
          result = await DashboardService.getLeadDashboard(req.user as any);
          break;
        case 'employee':
          result = await DashboardService.getEmployeeDashboard(req.user as any);
          break;
        default:
          res.status(400).json({ success: false, message: 'Invalid user role' });
          return;
      }

      if (result.error) {
        res.status(403).json({ success: false, message: result.error });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.dashboard,
        role: req.user.role,
        message: 'Dashboard data fetched successfully'
      });
    } catch (error) {
      console.error('Error in getRoleSpecificDashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async getSuperAdminDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const result = await DashboardService.getSuperAdminDashboard(req.user as any);

      if (result.error) {
        res.status(403).json({ success: false, message: result.error });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.dashboard,
        message: 'Super Admin dashboard fetched successfully'
      });
    } catch (error) {
      console.error('Error in getSuperAdminDashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async getManagementDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const result = await DashboardService.getManagementDashboard(req.user as any);

      if (result.error) {
        res.status(403).json({ success: false, message: result.error });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.dashboard,
        message: 'Management dashboard fetched successfully'
      });
    } catch (error) {
      console.error('Error in getManagementDashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async getManagerDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const result = await DashboardService.getManagerDashboard(req.user as any);

      if (result.error) {
        res.status(403).json({ success: false, message: result.error });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.dashboard,
        message: 'Manager dashboard fetched successfully'
      });
    } catch (error) {
      console.error('Error in getManagerDashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async getLeadDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const result = await DashboardService.getLeadDashboard(req.user as any);

      if (result.error) {
        res.status(403).json({ success: false, message: result.error });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.dashboard,
        message: 'Lead dashboard fetched successfully'
      });
    } catch (error) {
      console.error('Error in getLeadDashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async getEmployeeDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const result = await DashboardService.getEmployeeDashboard(req.user as any);

      if (result.error) {
        res.status(403).json({ success: false, message: result.error });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.dashboard,
        message: 'Employee dashboard fetched successfully'
      });
    } catch (error) {
      console.error('Error in getEmployeeDashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}