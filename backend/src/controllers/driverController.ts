import { Request, Response } from 'express';
import { DriverService, CreateDriverData, UpdateDriverData, DriverImportData } from '../services/driverService';
import { AuditService } from '../services/auditService';

interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
  tenantId?: string;
  tenantName?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  type?: string;
}

export class DriverController {
  private driverService: DriverService;
  private auditService: AuditService;

  constructor() {
    this.driverService = new DriverService();
    this.auditService = new AuditService();
  }

  async createDriver(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const driverData: CreateDriverData = {
        ...req.body,
        tenantId: req.tenantId!
      };
      const userId = req.userId!;

      if (!userId || !req.tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          type: 'auth_error'
        });
        return;
      }

      const driver = await this.driverService.createDriver(driverData, userId);

      res.status(201).json({
        success: true,
        data: driver,
        message: 'Driver created successfully'
      });
    } catch (error) {
      this.handleError(res, error, 'creating driver');
    }
  }

  async getDrivers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { contractorId, page = '1', limit = '50', search } = req.query;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          type: 'auth_error'
        });
        return;
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        res.status(400).json({
          success: false,
          error: 'Invalid pagination parameters',
          type: 'validation_error'
        });
        return;
      }

      const result = await this.driverService.getDriversByTenant(
        tenantId,
        {
          contractorId: contractorId as string,
          page: pageNum,
          limit: limitNum,
          search: search as string
        }
      );

      if (Array.isArray(result)) {
        res.json({
          success: true,
          data: result
        });
      } else {
        res.json({
          success: true,
          data: result.drivers,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: result.total,
            totalPages: Math.ceil(result.total / limitNum)
          }
        });
      }
    } catch (error) {
      this.handleError(res, error, 'fetching drivers');
    }
  }

  async getDriver(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId!;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          type: 'auth_error'
        });
        return;
      }

      if (!id || id.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'Driver ID is required',
          type: 'validation_error'
        });
        return;
      }

      const driver = await this.driverService.getDriverById(id, tenantId);

      if (!driver) {
        res.status(404).json({
          success: false,
          error: 'Driver not found',
          type: 'not_found_error'
        });
        return;
      }

      res.json({
        success: true,
        data: driver
      });
    } catch (error) {
      this.handleError(res, error, 'fetching driver');
    }
  }

  async updateDriver(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateDriverData = req.body;
      const tenantId = req.tenantId!;
      const userId = req.userId!;

      if (!userId || !tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          type: 'auth_error'
        });
        return;
      }

      if (!id || id.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'Driver ID is required',
          type: 'validation_error'
        });
        return;
      }

      const updatedDriver = await this.driverService.updateDriver(
        id,
        tenantId,
        updateData,
        userId
      );

      res.json({
        success: true,
        data: updatedDriver,
        message: 'Driver updated successfully'
      });
    } catch (error) {
      this.handleError(res, error, 'updating driver');
    }
  }

  async bulkImportDrivers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { drivers }: { drivers: DriverImportData[] } = req.body;
      const tenantId = req.tenantId!;
      const userId = req.userId!;

      if (!userId || !tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          type: 'auth_error'
        });
        return;
      }

      if (!Array.isArray(drivers) || drivers.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid drivers data - must be a non-empty array',
          type: 'validation_error'
        });
        return;
      }

      if (drivers.length > 1000) {
        res.status(400).json({
          success: false,
          error: 'Too many drivers - maximum 1000 per import',
          type: 'validation_error'
        });
        return;
      }

      const results = await this.driverService.importDrivers(drivers, tenantId, userId);

      await this.auditService.logEvent({
        tenantId,
        byUser: userId,
        action: 'BULK_IMPORT',
        entityType: 'Driver',
        entityId: 'bulk',
        afterJson: { imported: results.imported, errors: results.errors }
      });

      res.json({
        success: true,
        data: results,
        message: `Successfully imported ${results.imported} drivers${results.errors.length > 0 ? ` with ${results.errors.length} errors` : ''}`
      });
    } catch (error) {
      this.handleError(res, error, 'bulk importing drivers');
    }
  }

  async deleteDriver(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: driverId } = req.params;
      const tenantId = req.tenantId!;
      const userId = req.userId!;

      if (!userId || !tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          type: 'auth_error'
        });
        return;
      }

      if (!driverId || driverId.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'Driver ID is required',
          type: 'validation_error'
        });
        return;
      }

      await this.driverService.deleteDriver(driverId, tenantId, userId);

      res.json({
        success: true,
        message: 'Driver deleted successfully'
      });
    } catch (error) {
      this.handleError(res, error, 'deleting driver');
    }
  }

  async getDriverStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          type: 'auth_error'
        });
        return;
      }

      const stats = await this.driverService.getDriverStatistics(tenantId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      this.handleError(res, error, 'fetching driver statistics');
    }
  }

  private handleError(res: Response, error: unknown, context: string): void {
    console.error(`Error ${context}:`, error);

    if (error instanceof Error) {
      if (error.message.includes('Validation failed:')) {
        res.status(400).json({
          success: false,
          error: error.message.replace('Validation failed: ', ''),
          type: 'validation_error'
        });
        return;
      }

      if (error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          error: error.message,
          type: 'duplicate_error'
        });
        return;
      }

      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message,
          type: 'not_found_error'
        });
        return;
      }

      if (error.message.includes('associated trucks')) {
        res.status(409).json({
          success: false,
          error: error.message,
          type: 'constraint_error'
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      type: 'server_error'
    });
  }
}