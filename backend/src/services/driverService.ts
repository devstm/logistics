import { Driver, ApprovalStatus, Contractor } from '@prisma/client';
import { prisma } from '../database';
import { AuditService } from './auditService';

export interface CreateDriverData {
  contractorId: string;
  tenantId: string;
  name: string;
  nationalId: string;
  phone?: string;
  notes?: string;
}

export interface UpdateDriverData {
  name?: string;
  phone?: string;
  approvalStatus?: ApprovalStatus;
  notes?: string;
}

export interface DriverWithContractor extends Driver {
  contractor: Contractor;
}

export interface DriverImportData {
  name: string;
  nationalId: string;
  phone?: string;
  contractorName: string;
}

export class DriverService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  async createDriver(data: CreateDriverData, userId: string): Promise<Driver> {
    // Check if driver with same national ID already exists for this tenant
    const existingDriver = await prisma.driver.findFirst({
      where: {
        tenantId: data.tenantId,
        nationalId: data.nationalId,
      },
    });

    if (existingDriver) {
      throw new Error(`Driver with National ID ${data.nationalId} already exists`);
    }

    const driver = await prisma.driver.create({
      data: {
        contractorId: data.contractorId,
        tenantId: data.tenantId,
        name: data.name,
        nationalId: data.nationalId,
        phone: data.phone,
        notes: data.notes,
        approvalStatus: 'PENDING',
      },
    });

    // Log audit event
    await this.auditService.logEvent({
      tenantId: data.tenantId,
      entityType: 'Driver',
      entityId: driver.id,
      action: 'CREATE',
      afterJson: driver,
      byUser: userId,
    });

    return driver;
  }

  async getDriversByTenant(tenantId: string, approvalStatus?: ApprovalStatus): Promise<DriverWithContractor[]> {
    const whereClause: any = { tenantId };
    if (approvalStatus) {
      whereClause.approvalStatus = approvalStatus;
    }

    return await prisma.driver.findMany({
      where: whereClause,
      include: {
        contractor: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDriversByContractor(contractorId: string, tenantId: string): Promise<Driver[]> {
    return await prisma.driver.findMany({
      where: { contractorId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDriverById(id: string, tenantId: string): Promise<DriverWithContractor | null> {
    return await prisma.driver.findFirst({
      where: { id, tenantId },
      include: {
        contractor: true,
      },
    });
  }

  async updateDriver(
    id: string,
    tenantId: string,
    data: UpdateDriverData,
    userId: string
  ): Promise<Driver> {
    const beforeDriver = await this.getDriverById(id, tenantId);
    if (!beforeDriver) {
      throw new Error('Driver not found');
    }

    const updatedDriver = await prisma.driver.update({
      where: { id },
      data,
    });

    // Log audit event
    await this.auditService.logEvent({
      tenantId,
      entityType: 'Driver',
      entityId: id,
      action: data.approvalStatus ? 
        (data.approvalStatus === 'APPROVED' ? 'APPROVE' : 'DENY') : 
        'UPDATE',
      beforeJson: beforeDriver,
      afterJson: updatedDriver,
      byUser: userId,
    });

    return updatedDriver;
  }

  async approveDriver(id: string, tenantId: string, userId: string, notes?: string): Promise<Driver> {
    return await this.updateDriver(id, tenantId, {
      approvalStatus: 'APPROVED',
      notes: notes || 'Driver approved for missions',
    }, userId);
  }

  async denyDriver(id: string, tenantId: string, userId: string, reason: string): Promise<Driver> {
    return await this.updateDriver(id, tenantId, {
      approvalStatus: 'DENIED',
      notes: reason,
    }, userId);
  }

  async bulkApproveDrivers(driverIds: string[], tenantId: string, userId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      for (const driverId of driverIds) {
        const beforeDriver = await tx.driver.findFirst({
          where: { id: driverId, tenantId },
        });

        if (beforeDriver) {
          const updatedDriver = await tx.driver.update({
            where: { id: driverId },
            data: { approvalStatus: 'APPROVED' },
          });

          // Log audit event
          await this.auditService.logEvent({
            tenantId,
            entityType: 'Driver',
            entityId: driverId,
            action: 'BULK_APPROVE',
            beforeJson: beforeDriver,
            afterJson: updatedDriver,
            byUser: userId,
          });
        }
      }
    });
  }

  async importDrivers(
    driversData: DriverImportData[],
    tenantId: string,
    userId: string
  ): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;

    await prisma.$transaction(async (tx) => {
      for (const driverData of driversData) {
        try {
          // Find or create contractor
          let contractor = await tx.contractor.findFirst({
            where: {
              tenantId,
              name: driverData.contractorName,
            },
          });

          if (!contractor) {
            contractor = await tx.contractor.create({
              data: {
                tenantId,
                name: driverData.contractorName,
                pocName: 'TBD',
                pocPhone: 'TBD',
              },
            });
          }

          // Check if driver already exists
          const existingDriver = await tx.driver.findFirst({
            where: {
              tenantId,
              nationalId: driverData.nationalId,
            },
          });

          if (existingDriver) {
            errors.push(`Driver with National ID ${driverData.nationalId} already exists`);
            continue;
          }

          // Create driver
          const driver = await tx.driver.create({
            data: {
              contractorId: contractor.id,
              tenantId,
              name: driverData.name,
              nationalId: driverData.nationalId,
              phone: driverData.phone,
              approvalStatus: 'PENDING',
            },
          });

          // Log audit event
          await this.auditService.logEvent({
            tenantId,
            entityType: 'Driver',
            entityId: driver.id,
            action: 'IMPORT',
            afterJson: driver,
            byUser: userId,
          });

          imported++;
        } catch (error) {
          errors.push(`Failed to import driver ${driverData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    });

    return { imported, errors };
  }

  async getDriverStatistics(tenantId: string) {
    const [
      totalDrivers,
      approvedDrivers,
      pendingDrivers,
      deniedDrivers,
      driversByContractor
    ] = await Promise.all([
      prisma.driver.count({ where: { tenantId } }),
      prisma.driver.count({ where: { tenantId, approvalStatus: 'APPROVED' } }),
      prisma.driver.count({ where: { tenantId, approvalStatus: 'PENDING' } }),
      prisma.driver.count({ where: { tenantId, approvalStatus: 'DENIED' } }),
      prisma.driver.groupBy({
        by: ['contractorId'],
        where: { tenantId },
        _count: { contractorId: true }
      })
    ]);

    return {
      total: totalDrivers,
      approved: approvedDrivers,
      pending: pendingDrivers,
      denied: deniedDrivers,
      byContractor: driversByContractor.map((item: any) => ({
        contractorId: item.contractorId,
        count: item._count.contractorId,
      })),
    };
  }

  async deleteDriver(id: string, tenantId: string, userId: string): Promise<void> {
    const driver = await this.getDriverById(id, tenantId);
    if (!driver) {
      throw new Error('Driver not found');
    }

    // Check if driver has associated trucks
    const associatedTrucks = await prisma.truck.findMany({
      where: { driverId: id },
    });

    if (associatedTrucks.length > 0) {
      throw new Error('Cannot delete driver: has associated trucks');
    }

    await prisma.driver.delete({
      where: { id },
    });

    // Log audit event
    await this.auditService.logEvent({
      tenantId,
      entityType: 'Driver',
      entityId: id,
      action: 'DELETE',
      beforeJson: driver,
      byUser: userId,
    });
  }
}