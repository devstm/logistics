import { Tenant, Prisma } from '@prisma/client';
import { prisma } from '../database';

export interface CreateTenantData {
  name: string;
  configJson?: any;
}

export interface UpdateTenantData {
  name?: string;
  configJson?: any;
}

export class TenantService {
  async createTenant(data: CreateTenantData): Promise<Tenant> {
    // Default mission workflow configuration for Gaza operations
    const defaultConfig = {
      missionWorkflow: {
        states: [
          'idle',
          'dispatched',
          'fueling_requested',
          'fueled',
          'hp1_wait',
          'hp2_wait',
          'loading_prep',
          'loaded',
          'exiting',
          'delivered',
          'reconciled'
        ],
        transitions: {
          idle: ['dispatched'],
          dispatched: ['fueling_requested', 'hp1_wait'], // Can go direct or fuel first
          fueling_requested: ['fueled'],
          fueled: ['hp1_wait'],
          hp1_wait: ['hp2_wait', 'loading_prep'], // GL gate to HP2 or direct to loading
          hp2_wait: ['loading_prep'],
          loading_prep: ['loaded'],
          loaded: ['exiting'],
          exiting: ['delivered', 'looted'],
          delivered: ['reconciled'],
          looted: ['maintenance'],
          maintenance: ['idle']
        },
        glGates: ['hp1_wait', 'loaded'], // Green Light required at these stages
        holdingPoints: ['HP1', 'HP2']
      },
      reconciliationRules: {
        requiredFields: ['fuelTotal', 'pallets', 'damages'],
        autoCloseAfterHours: 24
      }
    };

    return await prisma.tenant.create({
      data: {
        name: data.name,
        configJson: data.configJson || defaultConfig,
      },
    });
  }

  async getTenantById(id: string): Promise<Tenant | null> {
    return await prisma.tenant.findUnique({
      where: { id },
    });
  }

  async getAllTenants(): Promise<Tenant[]> {
    return await prisma.tenant.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async updateTenant(id: string, data: UpdateTenantData): Promise<Tenant> {
    return await prisma.tenant.update({
      where: { id },
      data,
    });
  }

  async deleteTenant(id: string): Promise<void> {
    await prisma.tenant.delete({
      where: { id },
    });
  }

  async getTenantConfig(tenantId: string): Promise<any> {
    const tenant = await this.getTenantById(tenantId);
    return tenant?.configJson || {};
  }

  async updateTenantConfig(tenantId: string, configJson: any): Promise<Tenant> {
    return await this.updateTenant(tenantId, { configJson });
  }

  // Get tenant statistics
  async getTenantStats(tenantId: string) {
    const [
      totalMissions,
      activeMissions,
      totalTrucks,
      activeTrucks,
      totalDrivers,
      approvedDrivers
    ] = await Promise.all([
      prisma.mission.count({ where: { tenantId } }),
      prisma.mission.count({ 
        where: { 
          tenantId, 
          status: { in: ['ACTIVE'] }
        }
      }),
      prisma.truck.count({ where: { tenantId } }),
      prisma.truck.count({ 
        where: { 
          tenantId, 
          status: { not: 'IDLE' }
        }
      }),
      prisma.driver.count({ where: { tenantId } }),
      prisma.driver.count({ 
        where: { 
          tenantId, 
          approvalStatus: 'APPROVED'
        }
      })
    ]);

    return {
      missions: { total: totalMissions, active: activeMissions },
      trucks: { total: totalTrucks, active: activeTrucks },
      drivers: { total: totalDrivers, approved: approvedDrivers }
    };
  }
}