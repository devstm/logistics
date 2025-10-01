import { Router } from 'express';
import { DriverPortalController } from '../controllers/driverPortalController';
import { authMiddleware } from '../middleware/auth';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();
const driverPortalController = new DriverPortalController();

// All routes require authentication and DRIVER role
router.use(authMiddleware);
router.use(roleMiddleware(['DRIVER']));

/**
 * @route GET /api/driver/assignment
 * @desc Get current driver assignment
 * @access Private (DRIVER)
 */
router.get(
  '/assignment',
  driverPortalController.getAssignment.bind(driverPortalController)
);

/**
 * @route GET /api/driver/profile
 * @desc Get driver profile
 * @access Private (DRIVER)
 */
router.get(
  '/profile',
  driverPortalController.getProfile.bind(driverPortalController)
);

/**
 * @route POST /api/driver/truck/:truckId/status
 * @desc Update truck status
 * @access Private (DRIVER)
 */
router.post(
  '/truck/:truckId/status',
  driverPortalController.updateTruckStatus.bind(driverPortalController)
);

/**
 * @route POST /api/driver/truck/:truckId/fuel
 * @desc Report fuel
 * @access Private (DRIVER)
 */
router.post(
  '/truck/:truckId/fuel',
  driverPortalController.reportFuel.bind(driverPortalController)
);

export default router;