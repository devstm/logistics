import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateUserRegistration, validateUserLogin, validateUserUpdate } from '../middleware/validation';

const router = Router();
const userController = new UserController();

// Public routes (no authentication required)
router.post('/register', validateUserRegistration, userController.register.bind(userController));
router.post('/login', validateUserLogin, userController.login.bind(userController));

// Protected routes (authentication required)
router.get('/profile', authenticateToken, userController.getProfile.bind(userController));
router.get('/', authenticateToken, requireRole(['OPS_MANAGER', 'FINANCE_AUDIT']), userController.getAllUsers.bind(userController));
router.put('/:id', authenticateToken, validateUserUpdate, userController.updateUser.bind(userController));
router.delete('/:id', authenticateToken, requireRole(['OPS_MANAGER']), userController.deleteUser.bind(userController));

// Health check for users
router.get('/health', (req, res) => {
  res.json({ status: 'User routes OK' });
});

export default router;
