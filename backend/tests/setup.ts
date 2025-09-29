import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Reset the test database before running tests
  try {
    execSync('npx prisma migrate reset --force', {
      env: { ...process.env, NODE_ENV: 'test' },
      stdio: 'inherit',
    });
  } catch (error) {
    console.error('Failed to reset test database:', error);
  }
});

afterAll(async () => {
  // Clean up database connections
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up Gaza data before each test
  await prisma.auditEvent.deleteMany();
  await prisma.fuelEvent.deleteMany();
  await prisma.holdingPointEvent.deleteMany();
  await prisma.loadEvent.deleteMany();
  await prisma.exitEvent.deleteMany();
  await prisma.warehouseDelivery.deleteMany();
  await prisma.maintenanceRecord.deleteMany();
  await prisma.reconciliation.deleteMany();
  await prisma.mission.deleteMany();
  await prisma.truck.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.contractor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
});

export { prisma };