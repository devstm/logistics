import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { MissionService, CreateMissionData, UpdateMissionData } from '../services/missionService';
import { asyncHandler } from '../middleware/errorHandler';

export class MissionController {
  private missionService: MissionService;

  constructor() {
    this.missionService = new MissionService();
  }

  createMission = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const missionData: CreateMissionData = {
      tenantId: req.tenantId!,
      name: req.body.name,
      date: new Date(req.body.date),
      border: req.body.border,
      createdBy: req.userId!,
    };

    const mission = await this.missionService.createMission(missionData, req.userId!);

    res.status(201).json({
      success: true,
      message: 'Mission created successfully',
      mission,
    });
  });

  getMissionsByTenant = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.tenantId!;
    const status = req.query.status as any;

    const missions = await this.missionService.getMissionsByTenant(tenantId, status);

    res.status(200).json({
      success: true,
      missions,
    });
  });

  getMissionById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const tenantId = req.tenantId!;

    const mission = await this.missionService.getMissionById(id, tenantId);

    if (!mission) {
      res.status(404).json({
        success: false,
        message: 'Mission not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      mission,
    });
  });

  updateMission = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const tenantId = req.tenantId!;
    const userId = req.userId!;

    const updateData: UpdateMissionData = {
      name: req.body.name,
      date: req.body.date ? new Date(req.body.date) : undefined,
      border: req.body.border,
      status: req.body.status,
      stepsJson: req.body.stepsJson,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => 
      updateData[key as keyof UpdateMissionData] === undefined && 
      delete updateData[key as keyof UpdateMissionData]
    );

    const mission = await this.missionService.updateMission(id, tenantId, updateData, userId);

    res.status(200).json({
      success: true,
      message: 'Mission updated successfully',
      mission,
    });
  });

  assignTruckToMission = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { missionId, truckId } = req.params;
    const tenantId = req.tenantId!;
    const userId = req.userId!;

    const truck = await this.missionService.assignTruckToMission(missionId, truckId, tenantId, userId);

    res.status(200).json({
      success: true,
      message: 'Truck assigned to mission successfully',
      truck,
    });
  });

  unassignTruckFromMission = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { truckId } = req.params;
    const tenantId = req.tenantId!;
    const userId = req.userId!;

    const truck = await this.missionService.unassignTruckFromMission(truckId, tenantId, userId);

    res.status(200).json({
      success: true,
      message: 'Truck unassigned from mission successfully',
      truck,
    });
  });

  updateTruckStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { truckId } = req.params;
    const { status, notes } = req.body;
    const tenantId = req.tenantId!;
    const userId = req.userId!;

    if (!status) {
      res.status(400).json({
        success: false,
        message: 'Status is required',
      });
      return;
    }

    const truck = await this.missionService.updateTruckStatus(truckId, status, tenantId, userId, notes);

    res.status(200).json({
      success: true,
      message: 'Truck status updated successfully',
      truck,
    });
  });

  getMissionStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.tenantId!;

    const statistics = await this.missionService.getMissionStatistics(tenantId);

    res.status(200).json({
      success: true,
      statistics,
    });
  });

  closeMission = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const tenantId = req.tenantId!;
    const userId = req.userId!;

    const mission = await this.missionService.closeMission(id, tenantId, userId);

    res.status(200).json({
      success: true,
      message: 'Mission closed successfully',
      mission,
    });
  });

  // Green Light (GL) Gates - Only Ops Manager can approve
  approveGreenLight = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { truckId } = req.params;
    const { targetStatus, notes } = req.body;
    const tenantId = req.tenantId!;
    const userId = req.userId!;

    // Validate GL gate transitions
    const validGLTransitions = {
      'HP1_WAIT': 'HP2_WAIT',
      'LOADED': 'EXITING',
    };

    if (!Object.keys(validGLTransitions).includes(targetStatus)) {
      res.status(400).json({
        success: false,
        message: 'Invalid Green Light transition',
      });
      return;
    }

    const truck = await this.missionService.updateTruckStatus(
      truckId, 
      validGLTransitions[targetStatus as keyof typeof validGLTransitions] as any, 
      tenantId, 
      userId, 
      `GL Approved: ${notes || 'Green Light granted'}`
    );

    res.status(200).json({
      success: true,
      message: 'Green Light approved successfully',
      truck,
    });
  });
}