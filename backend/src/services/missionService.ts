import { Mission, MissionStatus, Truck, TruckStatus, Prisma } from '@prisma/client';
import { prisma } from '../database';
import { AuditService } from './auditService';

export interface CreateMissionData {
  tenantId: string;
  name: string;
  date: Date;
  border: 'KS' | 'ZIKIM' | 'OTHER';
  createdBy: string;
}

export interface UpdateMissionData {
  name?: string;
  date?: Date;
  border?: 'KS' | 'ZIKIM' | 'OTHER';
  status?: MissionStatus;
  stepsJson?: any;
}

export interface MissionWithDetails extends Mission {
  trucks: Truck[];
  creator: { id: string; name: string | null; email: string };
}

export class MissionService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  async createMission(data: CreateMissionData, userId: string): Promise<Mission> {
    const mission = await prisma.mission.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        date: data.date,
        border: data.border,
        status: 'CREATED',
        createdBy: data.createdBy,
      },
    });

    // Log audit event
    await this.auditService.logEvent({
      tenantId: data.tenantId,
      entityType: 'Mission',
      entityId: mission.id,
      action: 'CREATE',
      afterJson: mission,
      byUser: userId,
    });

    return mission;
  }

  async getMissionById(id: string, tenantId: string): Promise<MissionWithDetails | null> {
    return await prisma.mission.findFirst({
      where: { id, tenantId },
      include: {
        trucks: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getMissionsByTenant(tenantId: string, status?: MissionStatus): Promise<Mission[]> {
    const whereClause: Prisma.MissionWhereInput = { tenantId };
    if (status) {
      whereClause.status = status;
    }

    return await prisma.mission.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        trucks: {
          select: {
            id: true,
            plateNo: true,
            status: true,
          },
        },
      },
    });
  }

  async updateMission(
    id: string, 
    tenantId: string, 
    data: UpdateMissionData, 
    userId: string
  ): Promise<Mission> {
    const beforeMission = await this.getMissionById(id, tenantId);
    if (!beforeMission) {
      throw new Error('Mission not found');
    }

    const updatedMission = await prisma.mission.update({
      where: { id },
      data,
    });

    // Log audit event
    await this.auditService.logEvent({
      tenantId,
      entityType: 'Mission',
      entityId: id,
      action: 'UPDATE',
      beforeJson: beforeMission,
      afterJson: updatedMission,
      byUser: userId,
    });

    return updatedMission;
  }

  async assignTruckToMission(
    missionId: string, 
    truckId: string, 
    tenantId: string, 
    userId: string
  ): Promise<Truck> {
    // Verify mission belongs to tenant
    const mission = await this.getMissionById(missionId, tenantId);
    if (!mission) {
      throw new Error('Mission not found');
    }

    // Check if truck is available
    const truck = await prisma.truck.findFirst({
      where: { 
        id: truckId, 
        tenantId, 
        status: 'IDLE',
        missionId: null 
      },
    });

    if (!truck) {
      throw new Error('Truck not available for assignment');
    }

    const updatedTruck = await prisma.truck.update({
      where: { id: truckId },
      data: {
        missionId,
        status: 'DISPATCHED',
      },
    });

    // Log audit event
    await this.auditService.logEvent({
      tenantId,
      entityType: 'Truck',
      entityId: truckId,
      action: 'ASSIGN_TO_MISSION',
      beforeJson: truck,
      afterJson: { ...updatedTruck, missionId },
      byUser: userId,
    });

    return updatedTruck;
  }

  async unassignTruckFromMission(
    truckId: string, 
    tenantId: string, 
    userId: string
  ): Promise<Truck> {
    const truck = await prisma.truck.findFirst({
      where: { id: truckId, tenantId },
    });

    if (!truck) {
      throw new Error('Truck not found');
    }

    const updatedTruck = await prisma.truck.update({
      where: { id: truckId },
      data: {
        missionId: null,
        status: 'IDLE',
      },
    });

    // Log audit event
    await this.auditService.logEvent({
      tenantId,
      entityType: 'Truck',
      entityId: truckId,
      action: 'UNASSIGN_FROM_MISSION',
      beforeJson: truck,
      afterJson: updatedTruck,
      byUser: userId,
    });

    return updatedTruck;
  }

  async updateTruckStatus(
    truckId: string, 
    status: TruckStatus, 
    tenantId: string, 
    userId: string,
    notes?: string
  ): Promise<Truck> {
    const truck = await prisma.truck.findFirst({
      where: { id: truckId, tenantId },
    });

    if (!truck) {
      throw new Error('Truck not found');
    }

    // Get tenant configuration to validate state transitions
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const config = tenant?.configJson as any;
    const allowedTransitions = config?.missionWorkflow?.transitions?.[truck.status.toLowerCase()] || [];
    
    if (allowedTransitions.length > 0 && !allowedTransitions.includes(status.toLowerCase())) {
      throw new Error(`Invalid status transition from ${truck.status} to ${status}`);
    }

    const updatedTruck = await prisma.truck.update({
      where: { id: truckId },
      data: { status },
    });

    // Log audit event
    await this.auditService.logEvent({
      tenantId,
      entityType: 'Truck',
      entityId: truckId,
      action: 'STATUS_CHANGE',
      beforeJson: { ...truck, notes: notes || 'Status change' },
      afterJson: updatedTruck,
      byUser: userId,
    });

    return updatedTruck;
  }

  async getMissionStatistics(tenantId: string) {
    const [
      totalMissions,
      activeMissions,
      completedMissions,
      reconciledMissions,
      trucksInTransit,
      trucksAtHP1,
      trucksAtHP2,
      trucksLoading
    ] = await Promise.all([
      prisma.mission.count({ where: { tenantId } }),
      prisma.mission.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.mission.count({ where: { tenantId, status: 'COMPLETED' } }),
      prisma.mission.count({ where: { tenantId, status: 'RECONCILED' } }),
      prisma.truck.count({ 
        where: { 
          tenantId, 
          status: { in: ['DISPATCHED', 'FUELED', 'EXITING', 'DELIVERED'] }
        }
      }),
      prisma.truck.count({ where: { tenantId, status: 'HP1_WAIT' } }),
      prisma.truck.count({ where: { tenantId, status: 'HP2_WAIT' } }),
      prisma.truck.count({ where: { tenantId, status: 'LOADING_PREP' } })
    ]);

    return {
      missions: {
        total: totalMissions,
        active: activeMissions,
        completed: completedMissions,
        reconciled: reconciledMissions
      },
      trucks: {
        inTransit: trucksInTransit,
        atHP1: trucksAtHP1,
        atHP2: trucksAtHP2,
        loading: trucksLoading
      }
    };
  }

  async closeMission(missionId: string, tenantId: string, userId: string): Promise<Mission> {
    // Check if all trucks are reconciled
    const trucksInMission = await prisma.truck.findMany({
      where: { missionId, tenantId },
    });

    const unreconciledTrucks = trucksInMission.filter(truck => truck.status !== 'RECONCILED');
    if (unreconciledTrucks.length > 0) {
      throw new Error('Cannot close mission: not all trucks are reconciled');
    }

    return await this.updateMission(missionId, tenantId, { status: 'RECONCILED' }, userId);
  }
}