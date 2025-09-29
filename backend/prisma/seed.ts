import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Gaza Humanitarian Logistics database...');

  try {
    // Create demo tenant for Gaza logistics
    const tenant = await prisma.tenant.upsert({
      where: { id: 'gaza-demo-org' },
      update: {},
      create: {
        id: 'gaza-demo-org',
        name: 'Gaza Humanitarian Aid Organization',
        configJson: {
          type: 'NGO',
          glGates: ['RAFAH', 'KEREM_SHALOM'],
          holdingPoints: ['HP1', 'HP2'],
          warehouseLocations: ['GAZA_CITY', 'KHAN_YOUNIS', 'RAFAH'],
          operationHours: '06:00-18:00'
        }
      }
    });

    console.log('✅ Created tenant:', tenant.name);

    // Create users with different roles
    const users = [
      {
        email: 'dispatcher@gaza-logistics.org',
        name: 'Ahmed Hassan Al-Masri',
        role: 'DISPATCHER' as const,
        password: 'dispatcher123'
      },
      {
        email: 'ops@gaza-logistics.org',
        name: 'Fatima Zahra Khalil',
        role: 'OPS_MANAGER' as const,
        password: 'ops123'
      },
      {
        email: 'contractor@gaza-logistics.org',
        name: 'Mohammed Ali Qasemi',
        role: 'CONTRACTOR_FOCAL_POINT' as const,
        password: 'contractor123'
      },
      {
        email: 'maintenance@gaza-logistics.org',
        name: 'Omar Yusuf Nawfal',
        role: 'MAINTENANCE' as const,
        password: 'maintenance123'
      },
      {
        email: 'audit@gaza-logistics.org',
        name: 'Layla Ahmad Salim',
        role: 'FINANCE_AUDIT' as const,
        password: 'audit123'
      }
    ];

    const createdUsers = [];
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          tenantId: tenant.id,
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          role: userData.role,
          isActive: true
        }
      });

      createdUsers.push(user);
      console.log(`✅ Created user: ${user.name} (${user.role})`);
    }

    // Create contractors
    const contractors = [
      {
        id: 'gaza-transport-co',
        name: 'Gaza Transport & Logistics Company',
        pocName: 'Khalil Ahmad Mansour',
        pocPhone: '+970-59-123-4567'
      },
      {
        id: 'al-nour-logistics',
        name: 'Al-Nour Humanitarian Logistics',
        pocName: 'Saeed Abdullah Omar',
        pocPhone: '+970-59-234-5678'
      },
      {
        id: 'unity-transport',
        name: 'Unity Transport Services',
        pocName: 'Yusuf Ibrahim Khalil',
        pocPhone: '+970-59-345-6789'
      }
    ];

    for (const contractorData of contractors) {
      const contractor = await prisma.contractor.upsert({
        where: { id: contractorData.id },
        update: {},
        create: {
          id: contractorData.id,
          tenantId: tenant.id,
          name: contractorData.name,
          pocName: contractorData.pocName,
          pocPhone: contractorData.pocPhone
        }
      });

      console.log(`✅ Created contractor: ${contractor.name}`);
    }

    // Create drivers
    const drivers = [
      {
        name: 'Omar Hassan Mansour',
        nationalId: '400123456',
        phone: '+970-59-987-6543',
        contractorId: 'gaza-transport-co',
        status: 'APPROVED' as const
      },
      {
        name: 'Yusuf Ahmad Ibrahim',
        nationalId: '400234567',
        phone: '+970-59-876-5432',
        contractorId: 'gaza-transport-co',
        status: 'APPROVED' as const
      },
      {
        name: 'Saeed Mohammed Ali',
        nationalId: '400345678',
        phone: '+970-59-765-4321',
        contractorId: 'al-nour-logistics',
        status: 'APPROVED' as const
      },
      {
        name: 'Khalil Yusuf Nawfal',
        nationalId: '400456789',
        phone: '+970-59-654-3210',
        contractorId: 'al-nour-logistics',
        status: 'PENDING' as const
      },
      {
        name: 'Abdullah Omar Qasemi',
        nationalId: '400567890',
        phone: '+970-59-543-2109',
        contractorId: 'unity-transport',
        status: 'APPROVED' as const
      }
    ];

    for (const driverData of drivers) {
      const driver = await prisma.driver.upsert({
        where: { 
          tenantId_nationalId: {
            tenantId: tenant.id,
            nationalId: driverData.nationalId
          }
        },
        update: {},
        create: {
          tenantId: tenant.id,
          contractorId: driverData.contractorId,
          name: driverData.name,
          nationalId: driverData.nationalId,
          phone: driverData.phone,
          approvalStatus: driverData.status
        }
      });

      console.log(`✅ Created driver: ${driver.name} (${driver.approvalStatus})`);
    }

    // Create trucks
    const trucks = [
      {
        plateNo: 'GZ-1001',
        capacityTons: 15.5,
        status: 'IDLE' as const
      },
      {
        plateNo: 'GZ-1002',
        capacityTons: 20.0,
        status: 'DISPATCHED' as const
      },
      {
        plateNo: 'GZ-1003',
        capacityTons: 12.0,
        status: 'MAINTENANCE' as const
      },
      {
        plateNo: 'GZ-1004',
        capacityTons: 18.5,
        status: 'IDLE' as const
      },
      {
        plateNo: 'GZ-2001',
        capacityTons: 25.0,
        status: 'FUELED' as const
      }
    ];

    for (const truckData of trucks) {
      const truck = await prisma.truck.upsert({
        where: { 
          tenantId_plateNo: {
            tenantId: tenant.id,
            plateNo: truckData.plateNo
          }
        },
        update: {},
        create: {
          tenantId: tenant.id,
          plateNo: truckData.plateNo,
          capacityTons: truckData.capacityTons,
          status: truckData.status
        }
      });

      console.log(`✅ Created truck: ${truck.plateNo} (${truck.capacityTons}T - ${truck.status})`);
    }

    // Get the first user to assign as mission creator
    const dispatcher = await prisma.user.findFirst({
      where: { tenantId: tenant.id, role: 'DISPATCHER' }
    });

    // Create a sample mission
    const mission = await prisma.mission.create({
      data: {
        name: "Food Distribution - Northern Gaza",
        date: new Date(),
        border: 'KS',
        createdBy: createdUsers[1].id, // OPS Manager
        tenantId: tenant.id,
      }
    });

    console.log(`✅ Created mission: ${mission.name}`);

    console.log('\n🎉 Gaza Logistics database seeding completed successfully!');
    console.log('\n📋 Demo Login Credentials:');
    console.log('🔑 Dispatcher: dispatcher@gaza-logistics.org / dispatcher123');
    console.log('🔑 Ops Manager: ops@gaza-logistics.org / ops123');
    console.log('🔑 Contractor: contractor@gaza-logistics.org / contractor123');
    console.log('🔑 Maintenance: maintenance@gaza-logistics.org / maintenance123');
    console.log('🔑 Auditor: audit@gaza-logistics.org / audit123');
    
    console.log('\n📊 Seeded Data Summary:');
    console.log(`• 1 Tenant: ${tenant.name}`);
    console.log(`• 5 Users with different roles`);
    console.log(`• 3 Contractors`);
    console.log(`• 5 Drivers (4 approved, 1 pending)`);
    console.log(`• 5 Trucks with various statuses`);
    console.log(`• 1 Active mission`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
