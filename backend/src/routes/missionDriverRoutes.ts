import { Router } from 'express';
import { MissionDriverController } from '../controllers/missionDriverController';
import { authMiddleware } from '../middleware/auth';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();
const missionDriverController = new MissionDriverController();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route POST /api/missions/:missionId/drivers
 * @desc Assign drivers to a mission
 * @access Private (DISPATCHER, OPS_MANAGER)
 */
router.post(
  '/:missionId/drivers',
  roleMiddleware(['DISPATCHER', 'OPS_MANAGER']),
  missionDriverController.assignDrivers.bind(missionDriverController)
);

/**
 * @route GET /api/missions/:missionId/drivers
 * @desc Get all drivers assigned to a mission
 * @access Private (DISPATCHER, OPS_MANAGER, CONTRACTOR_FOCAL_POINT)
 */
router.get(
  '/:missionId/drivers',
  roleMiddleware(['DISPATCHER', 'OPS_MANAGER', 'CONTRACTOR_FOCAL_POINT']),
  missionDriverController.getMissionDrivers.bind(missionDriverController)
);

/**
 * @route GET /api/missions/:missionId/drivers/stats
 * @desc Get mission driver statistics
 * @access Private (DISPATCHER, OPS_MANAGER)
 */
router.get(
  '/:missionId/drivers/stats',
  roleMiddleware(['DISPATCHER', 'OPS_MANAGER']),
  missionDriverController.getStatistics.bind(missionDriverController)
);

/**
 * @route PATCH /api/missions/:missionId/drivers/:driverId
 * @desc Update driver status for a mission (approve/deny)
 * @access Private (DISPATCHER, OPS_MANAGER)
 */
router.patch(
  '/:missionId/drivers/:driverId',
  roleMiddleware(['DISPATCHER', 'OPS_MANAGER']),
  missionDriverController.updateDriverStatus.bind(missionDriverController)
);

/**
 * @route POST /api/missions/:missionId/drivers/bulk-update
 * @desc Bulk update driver statuses
 * @access Private (DISPATCHER, OPS_MANAGER)
 */
router.post(
  '/:missionId/drivers/bulk-update',
  roleMiddleware(['DISPATCHER', 'OPS_MANAGER']),
  missionDriverController.bulkUpdateStatus.bind(missionDriverController)
);

/**
 * @route DELETE /api/missions/:missionId/drivers/:driverId
 * @desc Remove driver from mission
 * @access Private (DISPATCHER, OPS_MANAGER)
 */
router.delete(
  '/:missionId/drivers/:driverId',
  roleMiddleware(['DISPATCHER', 'OPS_MANAGER']),
  missionDriverController.removeDriver.bind(missionDriverController)
);

export default router;