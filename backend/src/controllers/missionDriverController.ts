import { Request, Response } from 'express';
import { MissionDriverService, AssignDriversData, UpdateMissionDriverStatusData } from '../services/missionDriverService';
import { MissionDriverStatus } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
  tenantId?: string;
}

export class MissionDriverController {
  private missionDriverService: MissionDriverService;

  constructor() {
    this.missionDriverService = new MissionDriverService();
  }

  /**
   * Assign drivers to a mission
   * POST /api/missions/:missionId/drivers
   */
  async assignDrivers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { missionId } = req.params;
      const { driverIds } = req.body;
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

      if (!missionId) {
        res.status(400).json({
          success: false,
          error: 'Mission ID is required',
          type: 'validation_error'
        });
        return;
      }

      if (!Array.isArray(driverIds) || driverIds.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Driver IDs must be a non-empty array',
          type: 'validation_error'
        });
        return;
      }

      const data: AssignDriversData = {
        missionId,
        driverIds,
        tenantId
      };

      const assignments = await this.missionDriverService.assignDriversToMission(data, userId);

      res.status(201).json({
        success: true,
        data: assignments,
        message: `${assignments.length} driver(s) assigned to mission`
      });
    } catch (error) {
      this.handleError(res, error, 'assigning drivers to mission');
    }
  }

  /**
   * Get drivers assigned to a mission
   * GET /api/missions/:missionId/drivers
   */
  async getMissionDrivers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { missionId } = req.params;
      const { status } = req.query;
      const tenantId = req.tenantId!;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          type: 'auth_error'
        });
        return;
      }

      if (!missionId) {
        res.status(400).json({
          success: false,
          error: 'Mission ID is required',
          type: 'validation_error'
        });
        return;
      }

      const statusFilter = status ? (status as MissionDriverStatus) : undefined;
      const drivers = await this.missionDriverService.getMissionDrivers(missionId, tenantId, statusFilter);

      res.json({
        success: true,
        data: drivers
      });
    } catch (error) {
      this.handleError(res, error, 'fetching mission drivers');
    }
  }

  /**
   * Update mission driver status
   * PATCH /api/missions/:missionId/drivers/:driverId
   */
  async updateDriverStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { missionId, driverId } = req.params;
      const statusData: UpdateMissionDriverStatusData = req.body;
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

      if (!missionId || !driverId) {
        res.status(400).json({
          success: false,
          error: 'Mission ID and Driver ID are required',
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

      const validStatuses: MissionDriverStatus[] = ['PENDING', 'APPROVED', 'DENIED'];
      if (!validStatuses.includes(statusData.status)) {
        res.status(400).json({
          success: false,
          error: 'Invalid status. Must be PENDING, APPROVED, or DENIED',
          type: 'validation_error'
        });
        return;
      }

      const updated = await this.missionDriverService.updateMissionDriverStatus(
        missionId,
        driverId,
        tenantId,
        statusData,
        userId
      );

      res.json({
        success: true,
        data: updated,
        message: `Driver status updated to ${statusData.status}`
      });
    } catch (error) {
      this.handleError(res, error, 'updating driver status');
    }
  }

  /**
   * Bulk update driver statuses
   * POST /api/missions/:missionId/drivers/bulk-update
   */
  async bulkUpdateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { missionId } = req.params;
      const { driverIds, status, approvedBy } = req.body;
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

      if (!missionId) {
        res.status(400).json({
          success: false,
          error: 'Mission ID is required',
          type: 'validation_error'
        });
        return;
      }

      if (!Array.isArray(driverIds) || driverIds.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Driver IDs must be a non-empty array',
          type: 'validation_error'
        });
        return;
      }

      if (!status) {
        res.status(400).json({
          success: false,
          error: 'Status is required',
          type: 'validation_error'
        });
        return;
      }

      const results = await this.missionDriverService.bulkUpdateMissionDriverStatus(
        missionId,
        driverIds,
        tenantId,
        status as MissionDriverStatus,
        approvedBy,
        userId
      );

      res.json({
        success: true,
        data: results,
        message: `Updated ${results.updated} driver(s)`
      });
    } catch (error) {
      this.handleError(res, error, 'bulk updating driver statuses');
    }
  }

  /**
   * Remove driver from mission
   * DELETE /api/missions/:missionId/drivers/:driverId
   */
  async removeDriver(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { missionId, driverId } = req.params;
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

      if (!missionId || !driverId) {
        res.status(400).json({
          success: false,
          error: 'Mission ID and Driver ID are required',
          type: 'validation_error'
        });
        return;
      }

      await this.missionDriverService.removeDriverFromMission(missionId, driverId, tenantId, userId);

      res.json({
        success: true,
        message: 'Driver removed from mission'
      });
    } catch (error) {
      this.handleError(res, error, 'removing driver from mission');
    }
  }

  /**
   * Get mission driver statistics
   * GET /api/missions/:missionId/drivers/stats
   */
  async getStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { missionId } = req.params;
      const tenantId = req.tenantId!;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          type: 'auth_error'
        });
        return;
      }

      if (!missionId) {
        res.status(400).json({
          success: false,
          error: 'Mission ID is required',
          type: 'validation_error'
        });
        return;
      }

      const stats = await this.missionDriverService.getMissionDriverStatistics(missionId, tenantId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      this.handleError(res, error, 'fetching mission driver statistics');
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

      if (error.message.includes('already assigned') || error.message.includes('already started')) {
        res.status(409).json({
          success: false,
          error: error.message,
          type: 'conflict_error'
        });
        return;
      }

      if (error.message.includes('Cannot remove')) {
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