import { Request, Response } from 'express';
import { TenantService, CreateTenantData, UpdateTenantData } from '../services/tenantService';
import { asyncHandler } from '../middleware/errorHandler';

export class TenantController {
  private tenantService: TenantService;

  constructor() {
    this.tenantService = new TenantService();
  }

  createTenant = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantData: CreateTenantData = {
      name: req.body.name,
      configJson: req.body.configJson,
    };

    const tenant = await this.tenantService.createTenant(tenantData);

    res.status(201).json({
      success: true,
      message: 'Tenant created successfully',
      tenant,
    });
  });

  getAllTenants = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenants = await this.tenantService.getAllTenants();

    res.status(200).json({
      success: true,
      tenants,
    });
  });

  getTenantById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    const tenant = await this.tenantService.getTenantById(id);
    
    if (!tenant) {
      res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      tenant,
    });
  });

  updateTenant = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const updateData: UpdateTenantData = {
      name: req.body.name,
      configJson: req.body.configJson,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => 
      updateData[key as keyof UpdateTenantData] === undefined && 
      delete updateData[key as keyof UpdateTenantData]
    );

    const tenant = await this.tenantService.updateTenant(id, updateData);

    res.status(200).json({
      success: true,
      message: 'Tenant updated successfully',
      tenant,
    });
  });

  getTenantStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    const stats = await this.tenantService.getTenantStats(id);

    res.status(200).json({
      success: true,
      stats,
    });
  });

  getTenantConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    const config = await this.tenantService.getTenantConfig(id);

    res.status(200).json({
      success: true,
      config,
    });
  });

  updateTenantConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { configJson } = req.body;
    
    const tenant = await this.tenantService.updateTenantConfig(id, configJson);

    res.status(200).json({
      success: true,
      message: 'Tenant configuration updated successfully',
      tenant,
    });
  });

  deleteTenant = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    await this.tenantService.deleteTenant(id);

    res.status(200).json({
      success: true,
      message: 'Tenant deleted successfully',
    });
  });
}