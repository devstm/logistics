import { AuditEvent, Prisma } from '@prisma/client';
import { prisma } from '../database';

export interface CreateAuditEventData {
  tenantId: string;
  entityType: string;
  entityId: string;
  action: string;
  beforeJson?: any;
  afterJson?: any;
  byUser: string;
}

export class AuditService {
  async logEvent(data: CreateAuditEventData): Promise<AuditEvent> {
    return await prisma.auditEvent.create({
      data: {
        tenantId: data.tenantId,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        beforeJson: data.beforeJson || null,
        afterJson: data.afterJson || null,
        byUser: data.byUser,
      },
    });
  }

  async getAuditEventsByTenant(
    tenantId: string,
    entityType?: string,
    entityId?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditEvent[]> {
    const whereClause: Prisma.AuditEventWhereInput = { tenantId };

    if (entityType) {
      whereClause.entityType = entityType;
    }

    if (entityId) {
      whereClause.entityId = entityId;
    }

    return await prisma.auditEvent.findMany({
      where: whereClause,
      orderBy: { at: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async getAuditEventsByEntity(
    tenantId: string,
    entityType: string,
    entityId: string
  ): Promise<AuditEvent[]> {
    return await prisma.auditEvent.findMany({
      where: {
        tenantId,
        entityType,
        entityId,
      },
      orderBy: { at: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async getAuditStatistics(tenantId: string, dateFrom?: Date, dateTo?: Date) {
    const whereClause: Prisma.AuditEventWhereInput = { tenantId };

    if (dateFrom || dateTo) {
      whereClause.at = {};
      if (dateFrom) whereClause.at.gte = dateFrom;
      if (dateTo) whereClause.at.lte = dateTo;
    }

    const [
      totalEvents,
      eventsByAction,
      eventsByEntity,
      eventsByUser
    ] = await Promise.all([
      prisma.auditEvent.count({ where: whereClause }),
      prisma.auditEvent.groupBy({
        by: ['action'],
        where: whereClause,
        _count: { action: true },
      }),
      prisma.auditEvent.groupBy({
        by: ['entityType'],
        where: whereClause,
        _count: { entityType: true },
      }),
      prisma.auditEvent.groupBy({
        by: ['byUser'],
        where: whereClause,
        _count: { byUser: true },
      })
    ]);

    return {
      totalEvents,
      byAction: eventsByAction.reduce((acc, item) => {
        acc[item.action] = item._count.action;
        return acc;
      }, {} as Record<string, number>),
      byEntityType: eventsByEntity.reduce((acc, item) => {
        acc[item.entityType] = item._count.entityType;
        return acc;
      }, {} as Record<string, number>),
      byUser: eventsByUser.reduce((acc, item) => {
        acc[item.byUser] = item._count.byUser;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  // Helper method to create standard audit messages
  static createAuditMessage(action: string, entityType: string, changes?: any): string {
    const messages: Record<string, string> = {
      'CREATE': `Created new ${entityType.toLowerCase()}`,
      'UPDATE': `Updated ${entityType.toLowerCase()}`,
      'DELETE': `Deleted ${entityType.toLowerCase()}`,
      'STATUS_CHANGE': `Changed ${entityType.toLowerCase()} status`,
      'ASSIGN_TO_MISSION': `Assigned ${entityType.toLowerCase()} to mission`,
      'UNASSIGN_FROM_MISSION': `Unassigned ${entityType.toLowerCase()} from mission`,
      'APPROVE': `Approved ${entityType.toLowerCase()}`,
      'DENY': `Denied ${entityType.toLowerCase()}`,
      'GL_APPROVAL': `Green Light approval for ${entityType.toLowerCase()}`,
    };

    return messages[action] || `${action} on ${entityType.toLowerCase()}`;
  }
}