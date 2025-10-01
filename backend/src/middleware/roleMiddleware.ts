import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
  tenantId?: string;
}

/**
 * Middleware to check if user has one of the required roles
 */
export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userRole = req.userRole;

    if (!userRole) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        type: 'auth_error'
      });
      return;
    }

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        type: 'permission_error'
      });
      return;
    }

    next();
  };
};