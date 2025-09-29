import { Request, Response } from 'express';
import { DriverService, CreateDriverData, UpdateDriverData, DriverImportData } from '../services/driverService';
import { AuditService } from '../services/auditService';
import { ApprovalStatus } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
  tenantId?: string;
  tenantName?: string;
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

      const driver = await this.driverService.createDriver(driverData, userId);
      
      res.status(201).json({
        success: true,
        data: driver
      });
    } catch (error) {
      console.error('Error creating driver:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async getDrivers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { status } = req.query;

      const drivers = await this.driverService.getDriversByTenant(
        tenantId,
        status as ApprovalStatus
      );
      
      res.json({
        success: true,
        data: drivers
      });
    } catch (error) {
      console.error('Error fetching drivers:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async getDriver(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId!;

      const driver = await this.driverService.getDriverById(id, tenantId);
      
      if (!driver) {
        res.status(404).json({
          success: false,
          error: 'Driver not found'
        });
        return;
      }

      res.json({
        success: true,
        data: driver
      });
    } catch (error) {
      console.error('Error fetching driver:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async updateDriver(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateDriverData = req.body;
      const tenantId = req.tenantId!;
      const userId = req.userId!;

      const updatedDriver = await this.driverService.updateDriver(
        id,
        tenantId,
        updateData,
        userId
      );
      
      res.json({
        success: true,
        data: updatedDriver
      });
    } catch (error) {
      console.error('Error updating driver:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async approveDriver(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const tenantId = req.tenantId!;
      const userId = req.userId!;

      const updatedDriver = await this.driverService.approveDriver(
        id,
        tenantId,
        userId,
        notes
      );
      
      res.json({
        success: true,
        data: updatedDriver
      });
    } catch (error) {
      console.error('Error approving driver:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async bulkImportDrivers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { drivers }: { drivers: DriverImportData[] } = req.body;
      const tenantId = req.tenantId!;
      const userId = req.userId!;

      if (!Array.isArray(drivers) || drivers.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid drivers data'
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
        data: results
      });
    } catch (error) {
      console.error('Error bulk importing drivers:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async bulkApproveDrivers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { driverIds }: { driverIds: string[] } = req.body;
      const tenantId = req.tenantId!;
      const userId = req.userId!;

      if (!Array.isArray(driverIds) || driverIds.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid driver IDs'
        });
        return;
      }

      await this.driverService.bulkApproveDrivers(driverIds, tenantId, userId);
      
      res.json({
        success: true,
        message: `Approved ${driverIds.length} drivers`
      });
    } catch (error) {
      console.error('Error bulk approving drivers:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async deleteDriver(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: driverId } = req.params;
      const tenantId = req.tenantId!;
      const userId = req.userId!;

      await this.driverService.deleteDriver(driverId, tenantId, userId);
      
      res.json({
        success: true,
        message: 'Driver deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting driver:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async getDriverStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;

      // Simple stats from existing methods
      const approved = await this.driverService.getDriversByTenant(tenantId, 'APPROVED');
      const pending = await this.driverService.getDriversByTenant(tenantId, 'PENDING');
      const denied = await this.driverService.getDriversByTenant(tenantId, 'DENIED');
      
      const stats = {
        total: approved.length + pending.length + denied.length,
        approved: approved.length,
        pending: pending.length,
        denied: denied.length
      };
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching driver stats:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
}