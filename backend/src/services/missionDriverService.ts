import { MissionDriver, MissionDriverStatus } from '@prisma/client';
import { prisma } from '../database';
import { AuditService } from './auditService';

export interface AssignDriversData {
  missionId: string;
  driverIds: string[];
  tenantId: string;
}

export interface UpdateMissionDriverStatusData {
  status: MissionDriverStatus;
  approvedBy?: string;
  notes?: string;
}

export interface MissionDriverWithDetails extends MissionDriver {
  driver: {
    id: string;
    name: string;
    nationalId: string;
    phone: string | null;
    contractor: {
      id: string;
      name: string;
    };
  };
}

export class MissionDriverService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  /**
   * Assign multiple drivers to a mission
   */
  async assignDriversToMission(
    data: AssignDriversData,
    assignedBy: string
  ): Promise<MissionDriver[]> {
    const { missionId, driverIds, tenantId } = data;

    // Verify mission exists and belongs to tenant
    const mission = await prisma.mission.findFirst({
      where: { id: missionId, tenantId }
    });

    if (!mission) {
      throw new Error('Mission not found or does not belong to your organization');
    }

    // Verify all drivers exist and belong to tenant
    const drivers = await prisma.driver.findMany({
      where: {
        id: { in: driverIds },
        tenantId
      }
    });

    if (drivers.length !== driverIds.length) {
      throw new Error('One or more drivers not found or do not belong to your organization');
    }

    // Create mission driver assignments
    const assignments: MissionDriver[] = [];

    await prisma.$transaction(async (tx) => {
      for (const driverId of driverIds) {
        // Check if already assigned
        const existing = await tx.missionDriver.findUnique({
          where: {
            missionId_driverId: {
              missionId,
              driverId
            }
          }
        });

        if (existing) {
          // Skip if already assigned
          assignments.push(existing);
          continue;
        }

        // Create assignment
        const assignment = await tx.missionDriver.create({
          data: {
            missionId,
            driverId,
            tenantId,
            assignedBy,
            status: 'PENDING'
          }
        });

        assignments.push(assignment);

        // Log audit event
        await this.auditService.logEvent({
          tenantId,
          entityType: 'MissionDriver',
          entityId: assignment.id,
          action: 'ASSIGN',
          afterJson: assignment,
          byUser: assignedBy
        });
      }
    });

    return assignments;
  }

  /**
   * Get all drivers assigned to a mission
   */
  async getMissionDrivers(
    missionId: string,
    tenantId: string,
    statusFilter?: MissionDriverStatus
  ): Promise<MissionDriverWithDetails[]> {
    const whereClause: any = {
      missionId,
      tenantId
    };

    if (statusFilter) {
      whereClause.status = statusFilter;
    }

    return await prisma.missionDriver.findMany({
      where: whereClause,
      include: {
        driver: {
          include: {
            contractor: {
              select: {
                id: true,
                name: true
              }
            }
          },
          select: {
            id: true,
            name: true,
            nationalId: true,
            phone: true,
            contractor: true
          }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      }
    }) as MissionDriverWithDetails[];
  }

  /**
   * Get all missions assigned to a driver
   */
  async getDriverMissions(
    driverId: string,
    tenantId: string,
    statusFilter?: MissionDriverStatus
  ): Promise<any[]> {
    const whereClause: any = {
      driverId,
      tenantId
    };

    if (statusFilter) {
      whereClause.status = statusFilter;
    }

    return await prisma.missionDriver.findMany({
      where: whereClause,
      include: {
        mission: {
          select: {
            id: true,
            name: true,
            date: true,
            border: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      }
    });
  }

  /**
   * Update mission driver status (approve/deny)
   */
  async updateMissionDriverStatus(
    missionId: string,
    driverId: string,
    tenantId: string,
    statusData: UpdateMissionDriverStatusData,
    updatedBy: string
  ): Promise<MissionDriver> {
    // Find the mission driver assignment
    const assignment = await prisma.missionDriver.findFirst({
      where: {
        missionId,
        driverId,
        tenantId
      }
    });

    if (!assignment) {
      throw new Error('Driver assignment to mission not found');
    }

    // Update status
    const updated = await prisma.missionDriver.update({
      where: {
        id: assignment.id
      },
      data: {
        status: statusData.status,
        approvedBy: statusData.approvedBy,
        approvedAt: statusData.status !== 'PENDING' ? new Date() : null,
        notes: statusData.notes
      }
    });

    // Log audit event
    await this.auditService.logEvent({
      tenantId,
      entityType: 'MissionDriver',
      entityId: assignment.id,
      action: statusData.status === 'APPROVED' ? 'APPROVE' : statusData.status === 'DENIED' ? 'DENY' : 'UPDATE',
      beforeJson: assignment,
      afterJson: updated,
      byUser: updatedBy
    });

    return updated;
  }

  /**
   * Bulk update mission driver statuses
   */
  async bulkUpdateMissionDriverStatus(
    missionId: string,
    driverIds: string[],
    tenantId: string,
    status: MissionDriverStatus,
    approvedBy: string | undefined,
    updatedBy: string
  ): Promise<{ updated: number; errors: string[] }> {
    const results = {
      updated: 0,
      errors: [] as string[]
    };

    await prisma.$transaction(async (tx) => {
      for (const driverId of driverIds) {
        try {
          const assignment = await tx.missionDriver.findFirst({
            where: {
              missionId,
              driverId,
              tenantId
            }
          });

          if (!assignment) {
            results.errors.push(`Driver ${driverId} not assigned to this mission`);
            continue;
          }

          await tx.missionDriver.update({
            where: { id: assignment.id },
            data: {
              status,
              approvedBy,
              approvedAt: status !== 'PENDING' ? new Date() : null
            }
          });

          results.updated++;

          // Log audit event
          await this.auditService.logEvent({
            tenantId,
            entityType: 'MissionDriver',
            entityId: assignment.id,
            action: 'BULK_UPDATE_STATUS',
            beforeJson: { status: assignment.status },
            afterJson: { status },
            byUser: updatedBy
          });
        } catch (error) {
          results.errors.push(`Failed to update driver ${driverId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    });

    return results;
  }

  /**
   * Remove driver from mission
   */
  async removeDriverFromMission(
    missionId: string,
    driverId: string,
    tenantId: string,
    removedBy: string
  ): Promise<void> {
    const assignment = await prisma.missionDriver.findFirst({
      where: {
        missionId,
        driverId,
        tenantId
      }
    });

    if (!assignment) {
      throw new Error('Driver assignment not found');
    }

    // Check if driver has started work (has truck assigned with progress)
    const truck = await prisma.truck.findFirst({
      where: {
        driverId,
        missionId,
        status: {
          notIn: ['IDLE', 'DISPATCHED']
        }
      }
    });

    if (truck) {
      throw new Error('Cannot remove driver: truck has already started mission progress');
    }

    await prisma.missionDriver.delete({
      where: { id: assignment.id }
    });

    // Log audit event
    await this.auditService.logEvent({
      tenantId,
      entityType: 'MissionDriver',
      entityId: assignment.id,
      action: 'REMOVE',
      beforeJson: assignment,
      byUser: removedBy
    });
  }

  /**
   * Check if driver is approved for a specific mission
   */
  async isDriverApprovedForMission(
    driverId: string,
    missionId: string,
    tenantId: string
  ): Promise<boolean> {
    const assignment = await prisma.missionDriver.findFirst({
      where: {
        driverId,
        missionId,
        tenantId,
        status: 'APPROVED'
      }
    });

    return !!assignment;
  }

  /**
   * Get mission driver statistics
   */
  async getMissionDriverStatistics(missionId: string, tenantId: string) {
    const [total, pending, approved, denied] = await Promise.all([
      prisma.missionDriver.count({ where: { missionId, tenantId } }),
      prisma.missionDriver.count({ where: { missionId, tenantId, status: 'PENDING' } }),
      prisma.missionDriver.count({ where: { missionId, tenantId, status: 'APPROVED' } }),
      prisma.missionDriver.count({ where: { missionId, tenantId, status: 'DENIED' } })
    ]);

    return {
      total,
      pending,
      approved,
      denied
    };
  }
}