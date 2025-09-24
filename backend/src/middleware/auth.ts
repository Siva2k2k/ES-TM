import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Simplified auth middleware for now
type UserRole = 'employee' | 'lead' | 'manager' | 'management' | 'super_admin';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
}

interface AuthRequest extends Request {
  user?: AuthUser;
}

/**
 * Middleware to check if user is authenticated
 */
export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ success: false, message: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // For now, create a mock user - we'll implement proper user lookup later
    req.user = {
      id: decoded.id || '1',
      email: decoded.email || 'user@example.com',
      role: decoded.role || 'employee',
      full_name: decoded.name || 'Test User'
    };

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
    return;
  }
};

/**
 * Middleware to require specific roles
 */
export const requireRole = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: `Access denied. Required roles: ${roles.join(', ')}` });
      return;
    }

    next();
  };
};

/**
 * Middleware to require manager role or above
 */
export const requireManager = requireRole(['manager', 'management', 'super_admin']);

/**
 * Middleware to require management role or above
 */
export const requireManagement = requireRole(['management', 'super_admin']);

/**
 * Middleware to require super admin role
 */
export const requireSuperAdmin = requireRole(['super_admin']);

/**
 * Check maintenance mode
 */
export const checkMaintenanceMode = (req: Request, res: Response, next: NextFunction): Response | void => {
  if (process.env.MAINTENANCE_MODE === 'true') {
    // Allow access to health check and admin routes during maintenance
    if (req.path === '/health' || req.path.startsWith('/api/v1/admin')) {
      return next();
    }

    return res.status(503).json({
      success: false,
      message: 'System is currently under maintenance. Please try again later.',
      maintenance: true
    });
  }

  next();
};