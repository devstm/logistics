import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { TenantController } from '../controllers/tenantController';
import { DriverController } from '../controllers/driverController';
import { TruckController } from '../controllers/truckController';
import { ContractorController } from '../controllers/contractorController';

const router = express.Router();

// Initialize controllers
const tenantController = new TenantController();
const driverController = new DriverController();
const truckController = new TruckController();
const contractorController = new ContractorController();

// Tenant management routes (public)
router.post('/tenants', tenantController.createTenant.bind(tenantController));

// Protected routes - require authentication
router.use(authenticateToken);

// Tenant routes
router.get('/tenants/:id', tenantController.getTenantById.bind(tenantController));
router.put('/tenants/:id', tenantController.updateTenant.bind(tenantController));

// Driver management routes
router.post('/drivers', driverController.createDriver.bind(driverController));
router.get('/drivers', driverController.getDrivers.bind(driverController));
router.get('/drivers/stats', driverController.getDriverStats.bind(driverController));
router.get('/drivers/:id', driverController.getDriver.bind(driverController));
router.put('/drivers/:id', driverController.updateDriver.bind(driverController));
router.delete('/drivers/:id', driverController.deleteDriver.bind(driverController));

// Driver approval routes (require ops manager or higher)
router.post('/drivers/:id/approve', 
  requireRole(['OPS_MANAGER', 'DISPATCHER']), 
  driverController.approveDriver.bind(driverController)
);
router.post('/drivers/bulk-approve', 
  requireRole(['OPS_MANAGER', 'DISPATCHER']), 
  driverController.bulkApproveDrivers.bind(driverController)
);

// Driver import routes (require dispatcher)
router.post('/drivers/bulk-import', 
  requireRole(['DISPATCHER']), 
  driverController.bulkImportDrivers.bind(driverController)
);

// Contractor management routes
router.get('/contractors', contractorController.getContractors.bind(contractorController));
router.post('/contractors', contractorController.createContractor.bind(contractorController));

// Truck management routes
router.post('/trucks', truckController.createTruck.bind(truckController));
router.get('/trucks', truckController.getTrucks.bind(truckController));
router.get('/trucks/stats', truckController.getTruckStats.bind(truckController));
router.get('/trucks/:id', truckController.getTruck.bind(truckController));
router.put('/trucks/:id', truckController.updateTruck.bind(truckController));
router.delete('/trucks/:id', truckController.deleteTruck.bind(truckController));

// Truck status and approval routes (require ops manager or higher)
router.post('/trucks/:id/approve', 
  requireRole(['OPS_MANAGER', 'DISPATCHER']), 
  truckController.approveTruck.bind(truckController)
);
router.put('/trucks/:id/status', 
  requireRole(['OPS_MANAGER', 'DISPATCHER', 'CONTRACTOR_FOCAL']), 
  truckController.updateTruckStatus.bind(truckController)
);

export default router;