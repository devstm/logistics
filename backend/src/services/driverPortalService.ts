import { TruckStatus } from '@prisma/client';
import { prisma } from '../database';
import { AuditService } from './auditService';
import { MissionDriverService } from './missionDriverService';

export interface DriverAssignment {
  truck: {
    id: string;
    plateNo: string;
    capacityTons: number;
    status: TruckStatus;
  };
  mission?: {
    id: string;
    name: string;
    date: Date;
    border: string;
  };
  currentCheckpoint?: string;
  nextAction?: string;
  fuelEvents?: Array<{
    id: string;
    liters: number;
    stationName: string;
    timestamp: Date;
  }>;
  lastUpdate?: Date;
}

export interface FuelReportData {
  liters: number;
  stationName: string;
  missionId?: string;
  receiptUrl?: string;
}

export interface StatusUpdateData {
  status: TruckStatus;
  notes?: string;
}

export class DriverPortalService {
  private auditService: AuditService;
  private missionDriverService: MissionDriverService;

  constructor() {
    this.auditService = new AuditService();
    this.missionDriverService = new MissionDriverService();
  }

  /**
   * Get current assignment for a driver based on their user ID
   */
  async getDriverAssignment(userId: string, tenantId: string): Promise<DriverAssignment | null> {
    // Find driver record linked to this user
    const driver = await prisma.driver.findFirst({
      where: {
        userId,
        tenantId
      }
    });

    if (!driver) {
      return null;
    }

    // Find current truck assignment
    const truck = await prisma.truck.findFirst({
      where: {
        driverId: driver.id,
        tenantId,
        status: {
          notIn: ['IDLE']
        }
      },
      include: {
        mission: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    if (!truck) {
      return null;
    }

    // Check if driver is approved for this mission
    if (truck.missionId) {
      const isApproved = await this.missionDriverService.isDriverApprovedForMission(
        driver.id,
        truck.missionId,
        tenantId
      );

      if (!isApproved) {
        throw new Error('Driver is not approved for this mission');
      }
    }

    // Get fuel events for this truck in current mission
    const fuelEvents = truck.missionId
      ? await prisma.fuelEvent.findMany({
          where: {
            truckId: truck.id,
            missionId: truck.missionId
          },
          orderBy: {
            timestamp: 'desc'
          },
          take: 5
        })
      : [];

    return {
      truck: {
        id: truck.id,
        plateNo: truck.plateNo,
        capacityTons: truck.capacityTons,
        status: truck.status
      },
      mission: truck.mission
        ? {
            id: truck.mission.id,
            name: truck.mission.name,
            date: truck.mission.date,
            border: truck.mission.border
          }
        : undefined,
      fuelEvents: fuelEvents.map(event => ({
        id: event.id,
        liters: event.liters,
        stationName: event.stationName,
        timestamp: event.timestamp
      })),
      lastUpdate: truck.updatedAt
    };
  }

  /**
   * Update truck status by driver
   */
  async updateTruckStatus(
    userId: string,
    tenantId: string,
    truckId: string,
    data: StatusUpdateData
  ): Promise<void> {
    // Verify driver exists
    const driver = await prisma.driver.findFirst({
      where: { userId, tenantId }
    });

    if (!driver) {
      throw new Error('Driver not found');
    }

    const truck = await prisma.truck.findFirst({
      where: {
        id: truckId,
        driverId: driver.id,
        tenantId
      }
    });

    if (!truck) {
      throw new Error('Truck not found or not assigned to this driver');
    }

    // Check if driver is approved for the current mission
    if (truck.missionId) {
      const isApproved = await this.missionDriverService.isDriverApprovedForMission(
        driver.id,
        truck.missionId,
        tenantId
      );

      if (!isApproved) {
        throw new Error('Driver is not approved for this mission');
      }
    }

    const beforeStatus = truck.status;

    // Validate status transition
    this.validateStatusTransition(beforeStatus, data.status);

    // Update truck status
    const updatedTruck = await prisma.truck.update({
      where: { id: truckId },
      data: {
        status: data.status,
        updatedAt: new Date()
      }
    });

    // Log audit event
    await this.auditService.logEvent({
      tenantId,
      entityType: 'Truck',
      entityId: truckId,
      action: 'STATUS_UPDATE',
      beforeJson: { status: beforeStatus },
      afterJson: { status: data.status, notes: data.notes },
      byUser: userId
    });

    // Create checkpoint event if applicable
    await this.createCheckpointEvent(truck, data.status, tenantId);
  }

  /**
   * Report fuel by driver
   */
  async reportFuel(
    userId: string,
    tenantId: string,
    truckId: string,
    data: FuelReportData
  ): Promise<void> {
    // Verify driver exists
    const driver = await prisma.driver.findFirst({
      where: { userId, tenantId }
    });

    if (!driver) {
      throw new Error('Driver not found');
    }

    const truck = await prisma.truck.findFirst({
      where: {
        id: truckId,
        driverId: driver.id,
        tenantId
      }
    });

    if (!truck) {
      throw new Error('Truck not found or not assigned to this driver');
    }

    // Check if driver is approved for the current mission
    if (truck.missionId) {
      const isApproved = await this.missionDriverService.isDriverApprovedForMission(
        driver.id,
        truck.missionId,
        tenantId
      );

      if (!isApproved) {
        throw new Error('Driver is not approved for this mission');
      }
    }

    // Create fuel event
    await prisma.fuelEvent.create({
      data: {
        truckId,
        missionId: data.missionId || truck.missionId || undefined,
        tenantId,
        liters: data.liters,
        stationName: data.stationName,
        paidBy: 'DRIVER_SELF', // Default to driver self-paid
        receiptUrl: data.receiptUrl,
        timestamp: new Date()
      }
    });

    // Log audit event
    await this.auditService.logEvent({
      tenantId,
      entityType: 'FuelEvent',
      entityId: truckId,
      action: 'FUEL_REPORT',
      afterJson: data,
      byUser: userId
    });
  }

  /**
   * Validate status transitions
   */
  private validateStatusTransition(currentStatus: TruckStatus, newStatus: TruckStatus): void {
    const validTransitions: Record<TruckStatus, TruckStatus[]> = {
      IDLE: ['DISPATCHED'],
      DISPATCHED: ['FUELING_REQUESTED', 'HP1_WAIT'],
      FUELING_REQUESTED: ['FUELED'],
      FUELED: ['HP1_WAIT'],
      HP1_WAIT: ['HP2_WAIT', 'LOADING_PREP'],
      HP2_WAIT: ['LOADING_PREP'],
      LOADING_PREP: ['LOADED'],
      LOADED: ['EXITING'],
      EXITING: ['DELIVERED', 'LOOTED'],
      DELIVERED: ['RECONCILED', 'IDLE'],
      RECONCILED: ['IDLE'],
      MAINTENANCE: ['IDLE'],
      LOOTED: ['MAINTENANCE', 'IDLE']
    };

    const allowedTransitions = validTransitions[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  /**
   * Create checkpoint event based on status
   */
  private async createCheckpointEvent(
    truck: any,
    status: TruckStatus,
    tenantId: string
  ): Promise<void> {
    if (!truck.missionId) return;

    const checkpointMap: Record<string, string> = {
      HP1_WAIT: 'HP1',
      HP2_WAIT: 'HP2'
    };

    const checkpointName = checkpointMap[status];

    if (checkpointName) {
      await prisma.holdingPointEvent.create({
        data: {
          truckId: truck.id,
          missionId: truck.missionId,
          tenantId,
          hpName: checkpointName,
          arrivedAt: new Date()
        }
      });
    }
  }

  /**
   * Get driver profile
   */
  async getDriverProfile(userId: string, tenantId: string) {
    const driver = await prisma.driver.findFirst({
      where: { userId, tenantId },
      include: {
        contractor: true,
        trucks: {
          include: {
            mission: true
          }
        }
      }
    });

    if (!driver) {
      throw new Error('Driver profile not found');
    }

    return driver;
  }
}