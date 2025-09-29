import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { UserService } from '../services/userService';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const user = await this.userService.createUser(req.body);
      res.status(201).json({
        message: 'User created successfully',
        user,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        res.status(409).json({ message: 'Email already exists' });
        return;
      }
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const result = await this.userService.loginUser(req.body);
      res.json({
        message: 'Login successful',
        ...result,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid credentials') {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }
      next(error);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const tenantId = (req as any).tenantId;
      const user = await this.userService.getUserById(userId, tenantId);
      
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json({ user });
    } catch (error) {
      next(error);
    }
  };

  getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = (req as any).tenantId;
      const users = await this.userService.getUsersByTenant(tenantId);
      res.json({ users });
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const tenantId = (req as any).tenantId;
      const user = await this.userService.updateUser(id, tenantId, req.body);
      res.json({
        message: 'User updated successfully',
        user,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      next(error);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = (req as any).tenantId;
      await this.userService.deleteUser(id, tenantId);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      next(error);
    }
  };
}