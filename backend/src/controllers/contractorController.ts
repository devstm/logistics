import { Request, Response } from 'express';
import { prisma } from '../database';

interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
  tenantId?: string;
}

export class ContractorController {
  async getContractors(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      
      const contractors = await prisma.contractor.findMany({
        where: { tenantId },
        orderBy: { name: 'asc' }
      });
      
      res.json({
        success: true,
        data: contractors
      });
    } catch (error) {
      console.error('Error fetching contractors:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async createContractor(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, pocName, pocPhone } = req.body;
      const tenantId = req.tenantId!;

      const contractor = await prisma.contractor.create({
        data: {
          name,
          pocName,
          pocPhone,
          tenantId
        }
      });

      res.status(201).json({
        success: true,
        data: contractor
      });
    } catch (error) {
      console.error('Error creating contractor:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
}