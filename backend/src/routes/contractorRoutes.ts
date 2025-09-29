import { Router } from 'express';
import { ContractorController } from '../controllers/contractorController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const contractorController = new ContractorController();

// Protected routes - require authentication
router.use(authenticateToken);

// Get all contractors for tenant
router.get('/', contractorController.getContractors.bind(contractorController));

// Create new contractor
router.post('/', contractorController.createContractor.bind(contractorController));

export default router;