import { Request, Response } from 'express';
import { DriverPortalService, FuelReportData, StatusUpdateData } from '../services/driverPortalService';

interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
  tenantId?: string;
  tenantName?: string;
}

export class DriverPortalController {
  private driverPortalService: DriverPortalService;

  constructor() {
    this.driverPortalService = new DriverPortalService();
  }

  /**
   * Get driver's current assignment
   */
  async getAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const tenantId = req.tenantId!;

      if (!userId || !tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          type: 'auth_error'
        });
        return;
      }

      const assignment = await this.driverPortalService.getDriverAssignment(userId, tenantId);

      if (!assignment) {
        res.json({
          success: true,
          data: null,
          message: 'No active assignment'
        });
        return;
      }

      res.json({
        success: true,
        data: assignment
      });
    } catch (error) {
      this.handleError(res, error, 'fetching driver assignment');
    }
  }

  /**
   * Update truck status
   */
  async updateTruckStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const tenantId = req.tenantId!;
      const { truckId } = req.params;
      const statusData: StatusUpdateData = req.body;

      if (!userId || !tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          type: 'auth_error'
        });
        return;
      }

      if (!truckId) {
        res.status(400).json({
          success: false,
          error: 'Truck ID is required',
          type: 'validation_error'
        });
        return;
      }

      if (!statusData.status) {
        res.status(400).json({
          success: false,
          error: 'Status is required',
          type: 'validation_error'
        });
        return;
      }

      await this.driverPortalService.updateTruckStatus(userId, tenantId, truckId, statusData);

      res.json({
        success: true,
        message: 'Truck status updated successfully'
      });
    } catch (error) {
      this.handleError(res, error, 'updating truck status');
    }
  }

  /**
   * Report fuel
   */
  async reportFuel(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const tenantId = req.tenantId!;
      const { truckId } = req.params;
      const fuelData: FuelReportData = req.body;

      if (!userId || !tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          type: 'auth_error'
        });
        return;
      }

      if (!truckId) {
        res.status(400).json({
          success: false,
          error: 'Truck ID is required',
          type: 'validation_error'
        });
        return;
      }

      if (!fuelData.liters || fuelData.liters <= 0) {
        res.status(400).json({
          success: false,
          error: 'Valid fuel amount is required',
          type: 'validation_error'
        });
        return;
      }

      if (!fuelData.stationName || fuelData.stationName.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'Station name is required',
          type: 'validation_error'
        });
        return;
      }

      await this.driverPortalService.reportFuel(userId, tenantId, truckId, fuelData);

      res.json({
        success: true,
        message: 'Fuel reported successfully'
      });
    } catch (error) {
      this.handleError(res, error, 'reporting fuel');
    }
  }

  /**
   * Get driver profile
   */
  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const tenantId = req.tenantId!;

      if (!userId || !tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          type: 'auth_error'
        });
        return;
      }

      const profile = await this.driverPortalService.getDriverProfile(userId, tenantId);

      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      this.handleError(res, error, 'fetching driver profile');
    }
  }

  private handleError(res: Response, error: unknown, context: string): void {
    console.error(`Error ${context}:`, error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message,
          type: 'not_found_error'
        });
        return;
      }

      if (error.message.includes('not approved')) {
        res.status(403).json({
          success: false,
          error: error.message,
          type: 'permission_error'
        });
        return;
      }

      if (error.message.includes('not assigned')) {
        res.status(403).json({
          success: false,
          error: error.message,
          type: 'permission_error'
        });
        return;
      }

      if (error.message.includes('Invalid status transition')) {
        res.status(400).json({
          success: false,
          error: error.message,
          type: 'validation_error'
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