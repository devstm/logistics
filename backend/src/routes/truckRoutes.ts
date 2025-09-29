import { Router } from 'express';
import { TruckController } from '../controllers/truckController';
import { requireRole, requireTenantAccess } from '../middleware/auth';
import { body } from 'express-validator';

const router = Router();
const truckController = new TruckController();

// Validation middleware
const validateTruck = [
  body('plateNo').isLength({ min: 2, max: 20 }).withMessage('Plate number must be between 2 and 20 characters'),
  body('capacityTons').isFloat({ min: 0.1 }).withMessage('Capacity must be a positive number'),
  body('driverId').optional().isUUID().withMessage('Invalid driver ID'),
];

// Apply tenant isolation to all routes
router.use(requireTenantAccess);

// Create truck
router.post('/', requireRole(['DISPATCHER', 'OPS_MANAGER']), validateTruck, truckController.createTruck.bind(truckController));

// Get all trucks for tenant
router.get('/', truckController.getTrucks.bind(truckController));

// Truck stats (must come before /:id to avoid conflict)
router.get('/stats', truckController.getTruckStats.bind(truckController));

// Get truck by ID
router.get('/:id', truckController.getTruck.bind(truckController));

// Update truck
router.put('/:id', requireRole(['DISPATCHER', 'OPS_MANAGER']), validateTruck, truckController.updateTruck.bind(truckController));

// Update truck status
router.patch('/:id/status', requireRole(['DISPATCHER', 'OPS_MANAGER']), truckController.updateTruckStatus.bind(truckController));

// Approve truck
router.post('/:id/approve', requireRole(['OPS_MANAGER']), truckController.approveTruck.bind(truckController));

// Delete truck
router.delete('/:id', requireRole(['OPS_MANAGER']), truckController.deleteTruck.bind(truckController));

export default router;
