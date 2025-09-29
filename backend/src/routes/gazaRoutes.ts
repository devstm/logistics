import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';

// Import route modules
import userRoutes from './userRoutes';
import driverRoutes from './driverRoutes';
import truckRoutes from './truckRoutes';
import contractorRoutes from './contractorRoutes';

const router = Router();

// Health check route (no auth required)
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Gaza Humanitarian Logistics API',
    version: '1.0.0'
  });
});

// Apply authentication to all protected routes
router.use('/users', userRoutes); // Auth handled individually in userRoutes
router.use('/drivers', authenticateToken, driverRoutes);
router.use('/trucks', authenticateToken, truckRoutes);
router.use('/contractors', authenticateToken, contractorRoutes);

export default router;