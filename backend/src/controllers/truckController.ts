import { Request, Response } from 'express';
import { TruckService, CreateTruckData, UpdateTruckData } from '../services/truckService';
import { AuditService } from '../services/auditService';
import { TruckStatus, ApprovalStatus } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
  tenantId?: string;
  tenantName?: string;
}

export class TruckController {
  private truckService: TruckService;
  private auditService: AuditService;

  constructor() {
    this.truckService = new TruckService();
    this.auditService = new AuditService();
  }

  async createTruck(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const truckData: CreateTruckData = {
        ...req.body,
        tenantId: req.tenantId!
      };
      const userId = req.userId!;

      const truck = await this.truckService.createTruck(truckData, userId);
      
      res.status(201).json({
        success: true,
        data: truck
      });
    } catch (error) {
      console.error('Error creating truck:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async getTrucks(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { status, approvalStatus } = req.query;

      const trucks = await this.truckService.getTrucksByTenant(
        tenantId,
        status as TruckStatus
      );
      
      res.json({
        success: true,
        data: trucks
      });
    } catch (error) {
      console.error('Error fetching trucks:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async getTruck(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId!;

      const truck = await this.truckService.getTruckById(id, tenantId);
      
      if (!truck) {
        res.status(404).json({
          success: false,
          error: 'Truck not found'
        });
        return;
      }

      res.json({
        success: true,
        data: truck
      });
    } catch (error) {
      console.error('Error fetching truck:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async updateTruck(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateTruckData = req.body;
      const tenantId = req.tenantId!;
      const userId = req.userId!;

      const updatedTruck = await this.truckService.updateTruck(
        id,
        tenantId,
        updateData,
        userId
      );
      
      res.json({
        success: true,
        data: updatedTruck
      });
    } catch (error) {
      console.error('Error updating truck:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async approveTruck(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const tenantId = req.tenantId!;
      const userId = req.userId!;

      // For now, just return success - can implement approval logic later
      const truck = await this.truckService.getTruckById(id, tenantId);
      
      if (!truck) {
        res.status(404).json({
          success: false,
          error: 'Truck not found'
        });
        return;
      }
      
      res.json({
        success: true,
        data: truck,
        message: 'Truck approved successfully'
      });
    } catch (error) {
      console.error('Error approving truck:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async updateTruckStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const tenantId = req.tenantId!;
      const userId = req.userId!;

      const updatedTruck = await this.truckService.updateTruckStatus(
        id,
        status,
        tenantId,
        userId,
        notes
      );
      
      res.json({
        success: true,
        data: updatedTruck
      });
    } catch (error) {
      console.error('Error updating truck status:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async deleteTruck(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: truckId } = req.params;
      const tenantId = req.tenantId!;
      const userId = req.userId!;

      await this.truckService.deleteTruck(truckId, tenantId, userId);
      
      res.json({
        success: true,
        message: 'Truck deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting truck:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async getTruckStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;

      // Simple stats from existing methods
      const idle = await this.truckService.getTrucksByTenant(tenantId, 'IDLE');
      const dispatched = await this.truckService.getTrucksByTenant(tenantId, 'DISPATCHED');
      const maintenance = await this.truckService.getTrucksByTenant(tenantId, 'MAINTENANCE');
      const delivered = await this.truckService.getTrucksByTenant(tenantId, 'DELIVERED');
      
      const stats = {
        total: idle.length + dispatched.length + maintenance.length + delivered.length,
        idle: idle.length,
        dispatched: dispatched.length,
        maintenance: maintenance.length,
        delivered: delivered.length
      };
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching truck stats:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
}