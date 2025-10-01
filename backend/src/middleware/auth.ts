import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  tenantId: string;
  tenantName: string;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
      tenantId?: string;
      tenantName?: string;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.tenantId = decoded.tenantId;
    req.tenantName = decoded.tenantName;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      res.status(403).json({
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
      return;
    }
    next();
  };
};

export const requireOpsManager = requireRole(['OPS_MANAGER']);
export const requireDispatcherOrOps = requireRole(['DISPATCHER', 'OPS_MANAGER']);
export const requireFinanceAudit = requireRole(['FINANCE_AUDIT', 'OPS_MANAGER']);

// Export alias for consistency
export const authMiddleware = authenticateToken;

export const requireTenantAccess = (req: Request, res: Response, next: NextFunction): void => {
  // For Gaza API routes, tenant access is controlled by JWT token
  // The tenantId is already set by authenticateToken middleware
  if (!req.tenantId) {
    res.status(400).json({ message: 'Tenant ID is required' });
    return;
  }
  
  // If a specific tenantId is requested in params/query/body, verify it matches the user's tenant
  const requestedTenantId = req.params.tenantId || req.query.tenantId || req.body.tenantId;
  
  if (requestedTenantId && req.tenantId !== requestedTenantId) {
    res.status(403).json({ message: 'Access denied. You can only access your tenant resources.' });
    return;
  }
  
  next();
};

export const requireOwnershipOrOps = (req: Request, res: Response, next: NextFunction): void => {
  const { id } = req.params;
  
  if (req.userRole === 'OPS_MANAGER' || req.userId === id) {
    next();
    return;
  }
  
  res.status(403).json({ message: 'Access denied. You can only access your own resources or need Ops Manager role.' });
};

// Green Light (GL) authorization - only OPS_MANAGER can approve
export const requireGLApproval = (req: Request, res: Response, next: NextFunction): void => {
  if (req.userRole !== 'OPS_MANAGER') {
    res.status(403).json({ message: 'Green Light approval requires Ops Manager role' });
    return;
  }
  next();
};