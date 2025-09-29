import { Router } from 'express';
import { DriverController } from '../controllers/driverController';
import { requireRole, requireTenantAccess                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    } from '../middleware/auth';
import { body } from 'express-validator';

const router = Router();
const driverController = new DriverController();

// Validation middleware
const validateDriver = [
  body('name').isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('nationalId').isLength({ min: 5, max: 20 }).withMessage('National ID must be between 5 and 20 characters'),
  body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
  body('contractorId').isUUID().withMessage('Invalid contractor ID'),
];

const validateDriverApproval = [
  body('approvalStatus').isIn(['APPROVED', 'DENIED']).withMessage('Status must be APPROVED or DENIED'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters'),
];

// Apply tenant isolation to all routes
router.use(requireTenantAccess);

// Create driver (Dispatcher, Ops Manager, or Contractor Focal Point)
router.post('/', 
  requireRole(['DISPATCHER', 'OPS_MANAGER', 'CONTRACTOR_FOCAL_POINT']), 
  validateDriver, 
  driverController.createDriver.bind(driverController)
);

// Bulk import drivers (CSV upload)
router.post('/bulk-import', 
  requireRole(['DISPATCHER', 'OPS_MANAGER', 'CONTRACTOR_FOCAL_POINT']), 
  driverController.bulkImportDrivers.bind(driverController)
);

// Get all drivers for tenant
router.get('/', 
  driverController.getDrivers.bind(driverController)
);

// Get driver by ID
router.get('/:id', 
  driverController.getDriver.bind(driverController)
);

// Approve driver (Ops Manager only)
router.post('/:id/approve', 
  requireRole(['OPS_MANAGER']), 
  driverController.approveDriver.bind(driverController)
);

// Bulk approve drivers
router.post('/bulk-approve', 
  requireRole(['OPS_MANAGER']),
  driverController.bulkApproveDrivers.bind(driverController)
);

// Get driver statistics
router.get('/stats', 
  requireRole(['DISPATCHER', 'OPS_MANAGER', 'FINANCE_AUDIT']),
  driverController.getDriverStats.bind(driverController)
);

// Update driver details
router.put('/:id', 
  requireRole(['DISPATCHER', 'OPS_MANAGER', 'CONTRACTOR_FOCAL_POINT']), 
  validateDriver,
  driverController.updateDriver.bind(driverController)
);

// Delete driver (Ops Manager only)
router.delete('/:id', 
  requireRole(['OPS_MANAGER']), 
  driverController.deleteDriver.bind(driverController)
);

export default router;