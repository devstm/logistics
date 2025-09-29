import { Truck, TruckStatus, FuelEvent, PaymentBy } from '@prisma/client';
import { prisma } from '../database';
import { AuditService } from './auditService';

export interface CreateTruckData {
  tenantId: string;
  driverId?: string;
  plateNo: string;
  capacityTons: number;
}

export interface UpdateTruckData {
  driverId?: string;
  plateNo?: string;
  capacityTons?: number;
  status?: TruckStatus;
}

export interface CreateFuelEventData {
  truckId: string;
  missionId?: string;
  tenantId: string;
  liters: number;
  stationName: string;
  paidBy: PaymentBy;
  receiptUrl?: string;
}

export interface TruckWithDriver extends Truck {
  driver?: {
    id: string;
    name: string;
    nationalId: string;
    phone?: string;
  };
}

export class TruckService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  async createTruck(data: CreateTruckData, userId: string): Promise<Truck> {
    // Check if truck with same plate number already exists for this tenant
    const existingTruck = await prisma.truck.findFirst({
      where: {
        tenantId: data.tenantId,
        plateNo: data.plateNo,
      },
    });

    if (existingTruck) {
      throw new Error(`Truck with plate number ${data.plateNo} already exists`);
    }

    const truck = await prisma.truck.create({
      data: {
        tenantId: data.tenantId,
        driverId: data.driverId || null,
        plateNo: data.plateNo,
        capacityTons: data.capacityTons,
        status: 'IDLE',
      },
    });

    // Log audit event
    await this.auditService.logEvent({
      tenantId: data.tenantId,
      entityType: 'Truck',
      entityId: truck.id,
      action: 'CREATE',
      afterJson: truck,
      byUser: userId,
    });

    return truck;
  }

  async getTrucksByTenant(tenantId: string, status?: TruckStatus): Promise<TruckWithDriver[]> {
    const whereClause: any = { tenantId };
    if (status) {
      whereClause.status = status;
    }

    return await prisma.truck.findMany({
      where: whereClause,
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            nationalId: true,
            phone: true,
          },
        },
      },
      orderBy: { plateNo: 'asc' },
    });
  }

  async getTruckById(id: string, tenantId: string): Promise<TruckWithDriver | null> {
    return await prisma.truck.findFirst({
      where: { id, tenantId },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            nationalId: true,
            phone: true,
          },
        },
      },
    });
  }

  async updateTruck(
    id: string,
    tenantId: string,
    data: UpdateTruckData,
    userId: string
  ): Promise<Truck> {
    const beforeTruck = await this.getTruckById(id, tenantId);
    if (!beforeTruck) {
      throw new Error('Truck not found');
    }

    // If updating plate number, check for duplicates
    if (data.plateNo && data.plateNo !== beforeTruck.plateNo) {
      const existingTruck = await prisma.truck.findFirst({
        where: {
          tenantId,
          plateNo: data.plateNo,
          id: { not: id },
        },
      });

      if (existingTruck) {
        throw new Error(`Truck with plate number ${data.plateNo} already exists`);
      }
    }

    const updatedTruck = await prisma.truck.update({
      where: { id },
      data,
    });

    // Log audit event
    await this.auditService.logEvent({
      tenantId,
      entityType: 'Truck',
      entityId: id,
      action: data.status ? 'STATUS_CHANGE' : 'UPDATE',
      beforeJson: beforeTruck,
      afterJson: updatedTruck,
      byUser: userId,
    });

    return updatedTruck;
  }

  async assignDriverToTruck(
    truckId: string,
    driverId: string,
    tenantId: string,
    userId: string
  ): Promise<Truck> {
    // Verify driver is approved
    const driver = await prisma.driver.findFirst({
      where: {
        id: driverId,
        tenantId,
        approvalStatus: 'APPROVED',
      },
    });

    if (!driver) {
      throw new Error('Driver not found or not approved');
    }

    return await this.updateTruck(truckId, tenantId, { driverId }, userId);
  }

  async unassignDriverFromTruck(
    truckId: string,
    tenantId: string,
    userId: string
  ): Promise<Truck> {
    return await this.updateTruck(truckId, tenantId, { driverId: null }, userId);
  }

  async updateTruckStatus(
    truckId: string,
    status: TruckStatus,
    tenantId: string,
    userId: string,
    notes?: string
  ): Promise<Truck> {
    const truck = await this.getTruckById(truckId, tenantId);
    if (!truck) {
      throw new Error('Truck not found');
    }

    // Get tenant configuration for status validation
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const config = tenant?.configJson as any;
    const allowedTransitions = config?.missionWorkflow?.transitions?.[truck.status.toLowerCase()] || [];
    
    if (allowedTransitions.length > 0 && !allowedTransitions.includes(status.toLowerCase())) {
      throw new Error(`Invalid status transition from ${truck.status} to ${status}`);
    }

    return await this.updateTruck(truckId, tenantId, { status }, userId);
  }

  async addFuelEvent(data: CreateFuelEventData, userId: string): Promise<FuelEvent> {
    // Verify truck exists and belongs to tenant
    const truck = await this.getTruckById(data.truckId, data.tenantId);
    if (!truck) {
      throw new Error('Truck not found');
    }

    const fuelEvent = await prisma.fuelEvent.create({
      data: {
        truckId: data.truckId,
        missionId: data.missionId || null,
        tenantId: data.tenantId,
        liters: data.liters,
        stationName: data.stationName,
        paidBy: data.paidBy,
        receiptUrl: data.receiptUrl || null,
      },
    });

    // Update truck status if it was fueling
    if (truck.status === 'FUELING_REQUESTED') {
      await this.updateTruckStatus(data.truckId, 'FUELED', data.tenantId, userId);
    }

    // Log audit event
    await this.auditService.logEvent({
      tenantId: data.tenantId,
      entityType: 'FuelEvent',
      entityId: fuelEvent.id,
      action: 'CREATE',
      afterJson: fuelEvent,
      byUser: userId,
    });

    return fuelEvent;
  }

  async getFuelEventsByTruck(truckId: string, tenantId: string): Promise<FuelEvent[]> {
    return await prisma.fuelEvent.findMany({
      where: { truckId, tenantId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getFuelEventsByMission(missionId: string, tenantId: string): Promise<FuelEvent[]> {
    return await prisma.fuelEvent.findMany({
      where: { missionId, tenantId },
      orderBy: { timestamp: 'desc' },
      include: {
        truck: {
          select: {
            plateNo: true,
          },
        },
      },
    });
  }

  async getTruckStatistics(tenantId: string) {
    const [
      totalTrucks,
      idleTrucks,
      activeTrucks,
      maintenanceTrucks,
      trucksByStatus,
      totalFuelEvents,
      totalFuelLiters
    ] = await Promise.all([
      prisma.truck.count({ where: { tenantId } }),
      prisma.truck.count({ where: { tenantId, status: 'IDLE' } }),
      prisma.truck.count({ 
        where: { 
          tenantId, 
          status: { 
            in: ['DISPATCHED', 'FUELED', 'HP1_WAIT', 'HP2_WAIT', 'LOADING_PREP', 'LOADED', 'EXITING']
          }
        }
      }),
      prisma.truck.count({ where: { tenantId, status: 'MAINTENANCE' } }),
      prisma.truck.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { status: true },
      }),
      prisma.fuelEvent.count({ where: { tenantId } }),
      prisma.fuelEvent.aggregate({
        where: { tenantId },
        _sum: { liters: true },
      })
    ]);

    return {
      total: totalTrucks,
      idle: idleTrucks,
      active: activeTrucks,
      maintenance: maintenanceTrucks,
      byStatus: trucksByStatus.reduce((acc: any, item: any) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {}),
      fuel: {
        totalEvents: totalFuelEvents,
        totalLiters: totalFuelLiters._sum.liters || 0,
      },
    };
  }

  async getAvailableTrucks(tenantId: string): Promise<TruckWithDriver[]> {
    return await this.getTrucksByTenant(tenantId, 'IDLE');
  }

  async getTrucksInMission(missionId: string, tenantId: string): Promise<TruckWithDriver[]> {
    return await prisma.truck.findMany({
      where: { 
        missionId, 
        tenantId 
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            nationalId: true,
            phone: true,
          },
        },
      },
      orderBy: { plateNo: 'asc' },
    });
  }

  async deleteTruck(id: string, tenantId: string, userId: string): Promise<void> {
    const truck = await this.getTruckById(id, tenantId);
    if (!truck) {
      throw new Error('Truck not found');
    }

    // Check if truck is in active mission
    if (truck.missionId && truck.status !== 'IDLE') {
      throw new Error('Cannot delete truck: currently assigned to active mission');
    }

    await prisma.truck.delete({
      where: { id },
    });

    // Log audit event
    await this.auditService.logEvent({
      tenantId,
      entityType: 'Truck',
      entityId: id,
      action: 'DELETE',
      beforeJson: truck,
      byUser: userId,
    });
  }
}