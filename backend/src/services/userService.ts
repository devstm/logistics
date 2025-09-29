import { User, UserRole, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../database';
import { config } from '../config';

export interface CreateUserData {
  tenantId?: string;
  email: string;
  name?: string;
  password: string;
  role?: UserRole;
  organizationName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResult {
  user: Omit<User, 'password'>;
  token: string;
}

export class UserService {
  async createUser(data: CreateUserData): Promise<Omit<User, 'password'>> {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    let tenantId = data.tenantId;
    
    // If no tenantId provided, create a new tenant for the user's organization
    if (!tenantId) {
      const organizationName = data.organizationName || `${data.name || data.email.split('@')[0]}'s Organization`;
      
      const tenant = await prisma.tenant.create({
        data: {
          name: organizationName,
        }
      });
      
      tenantId = tenant.id;
    }
    
    const user = await prisma.user.create({
      data: {
        tenantId: tenantId,
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: data.role || 'DISPATCHER',
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async loginUser(data: LoginData): Promise<AuthResult> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        tenantId: user.tenantId,
        email: user.email, 
        role: user.role 
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    );

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async getUserById(id: string, tenantId: string): Promise<Omit<User, 'password'> | null> {
    const user = await prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!user) {
      return null;
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUsersByTenant(tenantId: string): Promise<Omit<User, 'password'>[]> {
    const users = await prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        tenantId: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return users;
  }

  async updateUser(
    id: string, 
    tenantId: string, 
    data: Partial<CreateUserData>
  ): Promise<Omit<User, 'password'>> {
    const updateData: Prisma.UserUpdateInput = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async deactivateUser(id: string, tenantId: string): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async activateUser(id: string, tenantId: string): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async deleteUser(id: string, tenantId: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  async getUserStatistics(tenantId: string) {
    const [
      total,
      active,
      dispatchers,
      opsManagers,
      contractorFocalPoints,
      maintenance,
      financeAudit
    ] = await Promise.all([
      prisma.user.count({ where: { tenantId } }),
      prisma.user.count({ where: { tenantId, isActive: true } }),
      prisma.user.count({ where: { tenantId, role: 'DISPATCHER' } }),
      prisma.user.count({ where: { tenantId, role: 'OPS_MANAGER' } }),
      prisma.user.count({ where: { tenantId, role: 'CONTRACTOR_FOCAL_POINT' } }),
      prisma.user.count({ where: { tenantId, role: 'MAINTENANCE' } }),
      prisma.user.count({ where: { tenantId, role: 'FINANCE_AUDIT' } }),
    ]);

    return {
      total,
      active,
      byRole: {
        dispatchers,
        opsManagers,
        contractorFocalPoints,
        maintenance,
        financeAudit
      }
    };
  }
}