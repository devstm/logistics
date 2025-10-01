import { Driver, Contractor } from '@prisma/client';
import { prisma } from '../database';
import { AuditService } from './auditService';

export interface CreateDriverData {
  contractorId: string;
  tenantId: string;
  name: string;
  nationalId: string;
  phone?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  notes?: string;
}

export interface UpdateDriverData {
  name?: string;
  phone?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
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

export interface DriverFilters {
  contractorId?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface DriverSearchResult {
  drivers: DriverWithContractor[];
  total: number;
}

export class DriverService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  private validateDriverData(data: CreateDriverData): string[] {
    const errors: string[] = [];

    // Required field validation
    if (!data.name?.trim()) {
      errors.push('Driver name is required');
    } else if (data.name.trim().length < 2) {
      errors.push('Driver name must be at least 2 characters long');
    } else if (data.name.trim().length > 100) {
      errors.push('Driver name must be less than 100 characters');
    }

    if (!data.nationalId?.trim()) {
      errors.push('National ID is required');
    } else if (!/^\d{9}$/.test(data.nationalId.trim())) {
      errors.push('National ID must be exactly 9 digits');
    }

    if (!data.contractorId?.trim()) {
      errors.push('Contractor is required');
    }

    // Optional field validation
    if (data.phone && data.phone.trim()) {
      const phoneRegex = /^(\+970|0)(5[0-9]|59)\d{7}$/;
      if (!phoneRegex.test(data.phone.trim())) {
        errors.push('Phone number must be a valid Palestinian mobile number (e.g., +970-59-123-4567 or 059-123-4567)');
      }
    }

    if (data.licenseNumber && data.licenseNumber.trim()) {
      if (data.licenseNumber.trim().length < 3 || data.licenseNumber.trim().length > 20) {
        errors.push('License number must be between 3 and 20 characters');
      }
    }

    if (data.licenseExpiry && data.licenseExpiry.trim()) {
      const expiryDate = new Date(data.licenseExpiry);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (isNaN(expiryDate.getTime())) {
        errors.push('Invalid license expiry date format');
      } else if (expiryDate < today) {
        errors.push('License expiry date cannot be in the past');
      }
    }

    return errors;
  }

  async createDriver(data: CreateDriverData, userId: string): Promise<Driver> {
    // Validate input data
    const validationErrors = this.validateDriverData(data);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Verify contractor exists and belongs to tenant
    const contractor = await prisma.contractor.findFirst({
      where: {
        id: data.contractorId,
        tenantId: data.tenantId,
      },
    });

    if (!contractor) {
      throw new Error('Selected contractor not found or does not belong to your organization');
    }

    // Check if driver with same national ID already exists for this tenant
    const existingDriver = await prisma.driver.findFirst({
      where: {
        tenantId: data.tenantId,
        nationalId: data.nationalId.trim(),
      },
    });

    if (existingDriver) {
      throw new Error(`Driver with National ID ${data.nationalId.trim()} already exists`);
    }

    // Prepare clean data
    const cleanData = {
      contractorId: data.contractorId,
      tenantId: data.tenantId,
      name: data.name.trim(),
      nationalId: data.nationalId.trim(),
      phone: data.phone?.trim() || null,
      licenseNumber: data.licenseNumber?.trim() || null,
      licenseExpiry: data.licenseExpiry?.trim() ? new Date(data.licenseExpiry.trim()) : null,
      notes: data.notes?.trim() || null,
    };

    const driver = await prisma.driver.create({
      data: cleanData,
      include: {
        contractor: true,
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

  async getDriversByTenant(
    tenantId: string,
    filters?: DriverFilters
  ): Promise<DriverWithContractor[] | DriverSearchResult> {
    const whereClause: any = { tenantId };

    if (filters?.contractorId) {
      whereClause.contractorId = filters.contractorId;
    }

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      whereClause.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { nationalId: { contains: searchTerm } },
        { phone: { contains: searchTerm } },
        {
          contractor: {
            name: { contains: searchTerm, mode: 'insensitive' }
          }
        }
      ];
    }

    // If pagination is requested, return paginated result
    if (filters?.page !== undefined || filters?.limit !== undefined) {
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const skip = (page - 1) * limit;

      const [drivers, total] = await Promise.all([
        prisma.driver.findMany({
          where: whereClause,
          include: {
            contractor: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.driver.count({
          where: whereClause,
        }),
      ]);

      return {
        drivers: drivers as DriverWithContractor[],
        total,
      };
    }

    // Default behavior - return all drivers
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
      action: 'UPDATE',
      beforeJson: beforeDriver,
      afterJson: updatedDriver,
      byUser: userId,
    });

    return updatedDriver;
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
      driversByContractor
    ] = await Promise.all([
      prisma.driver.count({ where: { tenantId } }),
      prisma.driver.groupBy({
        by: ['contractorId'],
        where: { tenantId },
        _count: { contractorId: true }
      })
    ]);

    return {
      total: totalDrivers,
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