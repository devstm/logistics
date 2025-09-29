# 🇵🇸 Gaza Humanitarian Logistics System - Complete Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [API Documentation](#api-documentation)
6. [Authentication & Security](#authentication--security)
7. [Multi-Tenant Architecture](#multi-tenant-architecture)
8. [Gaza Logistics Workflow](#gaza-logistics-workflow)
9. [Installation & Setup](#installation--setup)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Guide](#deployment-guide)
12. [API Usage Examples](#api-usage-examples)
13. [Postman Collection](#postman-collection)
14. [Troubleshooting](#troubleshooting)
15. [Future Enhancements](#future-enhancements)

---

## Project Overview

### 🎯 Mission Statement
The Gaza Humanitarian Logistics System is a secure, multi-tenant web application designed to model and manage humanitarian aid logistics workflows specifically for Gaza operations. It provides comprehensive tracking from driver registration through final delivery reconciliation.

### 🏗️ Core Objectives
- **Multi-Tenant Isolation**: Each humanitarian organization operates independently
- **Role-Based Access Control**: 5 distinct roles with granular permissions
- **Complete Audit Trail**: Every operation is logged for compliance and transparency
- **Gaza-Specific Workflow**: Models real humanitarian logistics processes
- **Real-Time Tracking**: Live status updates throughout the mission lifecycle
- **Security First**: JWT authentication with tenant-scoped authorization

### 🌟 Key Features
- ✅ **Self-Service Registration**: Organizations can register and create their tenant space
- ✅ **Driver Management**: Registration, approval, and assignment workflows
- ✅ **Fleet Management**: Truck registration, assignment, and real-time status tracking  
- ✅ **Mission Workflow**: Complete Gaza logistics pipeline (11-stage process)
- ✅ **Border Gate Processing**: HP1 and HP2 gate simulation
- ✅ **Audit Logging**: Comprehensive operation tracking
- ✅ **Statistics & Reporting**: Real-time metrics and performance data
- ✅ **API-First Design**: RESTful APIs with comprehensive Postman collection

---

## System Architecture

### 🏛️ Overall Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Database      │
│   (Future)      │◄──►│   Express.js    │◄──►│   PostgreSQL    │
│                 │    │   + Middleware  │    │   + Prisma ORM  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Services      │
                    │   Controllers   │
                    │   Routes        │
                    └─────────────────┘
```

### 🔄 Request Flow
```
Client Request → Rate Limiter → CORS → Authentication → Tenant Validation → 
Role Authorization → Controller → Service → Database → Response
```

### 📁 Project Structure
```
backend/
├── src/
│   ├── config/              # Configuration settings
│   ├── controllers/         # Request handlers
│   ├── middleware/          # Authentication, validation, error handling
│   ├── routes/             # API route definitions
│   ├── services/           # Business logic layer
│   ├── database.ts         # Prisma client setup
│   ├── app.ts              # Express app configuration
│   └── server.ts           # Server startup
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Database migrations
│   └── seed.ts             # Sample data seeding
├── tests/
│   ├── integration/        # API integration tests
│   ├── unit/              # Unit tests
│   └── setup.ts           # Test configuration
├── dist/                   # Compiled JavaScript
└── docs/                   # Documentation files
```

---

## Technology Stack

### 🖥️ Backend Technologies
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18+
- **Language**: TypeScript 5.0+
- **Database**: PostgreSQL 14+
- **ORM**: Prisma 5.22+
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Testing**: Jest + Supertest
- **Development**: ts-node-dev

### 🔐 Security Stack
- **Authentication**: JWT tokens with role-based claims
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: bcrypt password hashing (12 rounds)
- **Security Headers**: Helmet.js
- **Rate Limiting**: express-rate-limit
- **CORS**: Configurable cross-origin resource sharing
- **Input Validation**: express-validator with custom rules

### 🛠️ Development Tools
- **Code Quality**: ESLint + Prettier
- **API Documentation**: Postman collections
- **Database Management**: Prisma Studio
- **Environment Management**: dotenv
- **Build System**: TypeScript compiler
- **Process Management**: PM2 (production)

---

## Database Schema

### 🗄️ Core Entities

#### 1. Tenant (Multi-Tenancy)
```sql
model Tenant {
  id         String   @id @default(cuid())
  name       String
  configJson Json?    -- Mission flow configuration
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  -- Relations (all entities are tenant-scoped)
  users      User[]
  missions   Mission[]
  contractors Contractor[]
  drivers    Driver[]
  trucks     Truck[]
  -- ... all other entities
}
```

#### 2. User (Authentication & Authorization)
```sql
model User {
  id        String   @id @default(cuid())
  tenantId  String   -- Foreign key to Tenant
  email     String   @unique
  name      String?
  password  String   -- bcrypt hashed
  role      UserRole @default(DISPATCHER)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
}
```

#### 3. Driver (Gaza Personnel)
```sql
model Driver {
  id             String        @id @default(cuid())
  tenantId       String
  contractorId   String
  name           String
  nationalId     String
  phone          String?
  approvalStatus ApprovalStatus @default(PENDING)
  notes          String?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  
  -- Unique constraint for tenant isolation
  @@unique([tenantId, nationalId])
}
```

#### 4. Truck (Fleet Management)
```sql
model Truck {
  id           String      @id @default(cuid())
  tenantId     String
  plateNo      String
  capacityTons Float
  status       TruckStatus @default(IDLE)
  driverId     String?     -- Optional driver assignment
  missionId    String?     -- Current mission
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  
  -- Unique constraint for tenant isolation
  @@unique([tenantId, plateNo])
}
```

#### 5. Mission (Operations)
```sql
model Mission {
  id        String        @id @default(cuid())
  tenantId  String
  name      String
  date      DateTime
  border    BorderType    -- KS, ZIKIM, OTHER
  status    MissionStatus @default(PLANNING)
  createdBy String        -- User who created the mission
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
}
```

### 📊 Enumerations

#### User Roles
```sql
enum UserRole {
  DISPATCHER              -- Daily operations, create drivers/trucks, dispatch
  OPS_MANAGER            -- Full management, approvals, deletions
  CONTRACTOR_FOCAL_POINT -- Manage own contractor's resources
  MAINTENANCE            -- Fleet maintenance operations
  FINANCE_AUDIT          -- Read-only access, reporting, compliance
}
```

#### Truck Status Flow
```sql
enum TruckStatus {
  IDLE                  -- Available for assignment
  DISPATCHED           -- Assigned to mission
  AT_FUEL_STATION      -- Refueling process
  FUELED               -- Fuel completed, ready for gates
  AT_HP1_GATE          -- First checkpoint
  HP1_CLEARED          -- Security cleared, proceeding
  AT_HP2_GATE          -- Second checkpoint  
  HP2_CLEARED          -- Final clearance, entering Gaza
  AT_LOADING_POINT     -- Cargo pickup location
  LOADED               -- Cargo loaded, ready to depart
  EN_ROUTE             -- Traveling to destination
  DELIVERED            -- Mission completed
  RETURNING            -- Returning to base
  MAINTENANCE          -- Under maintenance
  OUT_OF_SERVICE       -- Disabled/unavailable
}
```

#### Border Gates
```sql
enum BorderType {
  KS      -- Kerem Shalom crossing
  ZIKIM   -- Zikim crossing
  OTHER   -- Alternative crossings
}
```

### 🔗 Key Relationships
- **Tenant ↔ All Entities**: Complete tenant isolation
- **User ↔ Tenant**: Users belong to single tenant
- **Driver ↔ Contractor**: Drivers are assigned to contractors
- **Truck ↔ Driver**: Optional driver assignment
- **Mission ↔ User**: Missions created by users
- **All Events ↔ Tenant**: Complete audit trail per tenant

---

## API Documentation

### 🌐 Base URL
```
Development: http://localhost:8080
Production: https://your-domain.com
```

### 📍 API Endpoints Overview

#### Authentication Endpoints
```http
POST /api/users/register     # User registration with tenant creation
POST /api/users/login        # User authentication
GET  /api/users/profile      # Get current user profile
GET  /api/users/             # Get all users (Admin only)
PUT  /api/users/:id          # Update user
DELETE /api/users/:id        # Delete user (Admin only)
```

#### Gaza Logistics Endpoints
```http
# Driver Management
POST   /api/gaza/drivers                 # Create driver
GET    /api/gaza/drivers                 # List all drivers
GET    /api/gaza/drivers/:id             # Get driver details
PUT    /api/gaza/drivers/:id             # Update driver
DELETE /api/gaza/drivers/:id             # Delete driver (Ops Manager)
POST   /api/gaza/drivers/:id/approve     # Approve/deny driver (Ops Manager)
POST   /api/gaza/drivers/bulk-import     # CSV import
POST   /api/gaza/drivers/bulk-approve    # Bulk approval
GET    /api/gaza/drivers/stats           # Driver statistics

# Fleet Management  
POST   /api/gaza/trucks                  # Register truck
GET    /api/gaza/trucks                  # List all trucks
GET    /api/gaza/trucks/:id              # Get truck details
PUT    /api/gaza/trucks/:id              # Update truck
DELETE /api/gaza/trucks/:id              # Delete truck (Ops Manager)
PATCH  /api/gaza/trucks/:id/status       # Update truck status
POST   /api/gaza/trucks/:id/approve      # Approve truck (Ops Manager)
GET    /api/gaza/trucks/stats            # Fleet statistics
```

#### Health Check Endpoints
```http
GET /health                  # Overall system health
GET /api/gaza/health        # Gaza API health
GET /api/users/health       # User API health
```

### 🔐 Authentication
All protected endpoints require JWT token in Authorization header:
```http
Authorization: Bearer <jwt-token>
```

### 📝 Request/Response Examples

#### User Registration
```http
POST /api/users/register
Content-Type: application/json

{
  "email": "dispatcher@myorg.com",
  "name": "Ahmed Hassan",
  "password": "SecurePass123",
  "role": "DISPATCHER",
  "organizationName": "My Humanitarian Org"
}
```

Response:
```json
{
  "message": "User created successfully",
  "user": {
    "id": "user-uuid",
    "tenantId": "tenant-uuid",
    "email": "dispatcher@myorg.com",
    "name": "Ahmed Hassan", 
    "role": "DISPATCHER",
    "isActive": true,
    "tenant": {
      "id": "tenant-uuid",
      "name": "My Humanitarian Org"
    }
  }
}
```

#### Create Driver
```http
POST /api/gaza/drivers
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Omar Hassan Khalil",
  "nationalId": "123456789",
  "phone": "+970-59-123-4567",
  "contractorId": "contractor-uuid",
  "licenseNumber": "GZ-DRV-001",
  "licenseExpiry": "2025-12-31T00:00:00.000Z"
}
```

#### Update Truck Status
```http
PATCH /api/gaza/trucks/{truck-id}/status
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "status": "DISPATCHED",
  "notes": "Emergency food delivery to northern Gaza"
}
```

---

## Authentication & Security

### 🔐 JWT Token Structure
```json
{
  "userId": "user-uuid",
  "tenantId": "tenant-uuid", 
  "email": "user@example.com",
  "role": "DISPATCHER",
  "iat": 1758801006,
  "exp": 1758887406
}
```

### 🛡️ Security Middleware Stack
1. **Rate Limiting**: 100 requests per 15 minutes per IP
2. **Helmet.js**: Security headers (XSS, CSRF protection)
3. **CORS**: Configurable allowed origins
4. **JWT Validation**: Token verification and payload extraction
5. **Tenant Isolation**: Automatic tenant-scoped data access
6. **Role Authorization**: Granular permission checking

### 👥 Role-Based Permissions

| Endpoint | DISPATCHER | OPS_MANAGER | CONTRACTOR | MAINTENANCE | FINANCE_AUDIT |
|----------|------------|-------------|------------|-------------|---------------|
| Create Driver | ✅ | ✅ | ✅ (own contractor) | ❌ | ❌ |
| Approve Driver | ❌ | ✅ | ❌ | ❌ | ❌ |
| Delete Driver | ❌ | ✅ | ❌ | ❌ | ❌ |
| Create Truck | ✅ | ✅ | ❌ | ❌ | ❌ |
| Update Truck Status | ✅ | ✅ | ❌ | ✅ | ❌ |
| View Statistics | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete Truck | ❌ | ✅ | ❌ | ❌ | ❌ |
| Manage Users | ❌ | ✅ | ❌ | ❌ | ✅ (read-only) |

### 🔒 Tenant Isolation
- All database queries automatically scoped to user's tenant
- Cross-tenant access attempts blocked at middleware level
- JWT token includes tenant context for every request
- Database schema enforces tenant foreign keys on all entities

---

## Multi-Tenant Architecture

### 🏢 Tenant Model
Each humanitarian organization operates as a separate tenant with:
- **Complete Data Isolation**: No cross-tenant data access
- **Independent Configuration**: Custom mission flows and business rules
- **Separate User Management**: Role assignments per tenant
- **Isolated Statistics**: Metrics and reporting per organization

### 🔄 Tenant Creation Flow
1. **User Registration**: User provides organization name
2. **Automatic Tenant Creation**: System creates tenant record
3. **User Association**: User linked to new tenant
4. **Default Configuration**: Basic settings applied
5. **Ready for Operations**: User can start adding drivers, trucks, etc.

### 🎯 Tenant-Scoped Operations
```typescript
// All service methods automatically include tenant filtering
async getDrivers(tenantId: string): Promise<Driver[]> {
  return prisma.driver.findMany({
    where: { tenantId }, // Automatic tenant isolation
    include: { contractor: true }
  });
}
```

---

## Gaza Logistics Workflow

### 🚛 Complete Mission Flow

#### Phase 1: Pre-Mission Setup
1. **Driver Registration** → **Approval** → **Assignment**
2. **Truck Registration** → **Inspection** → **Assignment** 
3. **Mission Planning** → **Resource Allocation**

#### Phase 2: Dispatch Process
```
IDLE → DISPATCHED
├── Driver assigned to truck
├── Mission parameters set
├── Route planning completed
└── Dispatch authorization granted
```

#### Phase 3: Gaza Entry Workflow
```
DISPATCHED → AT_FUEL_STATION → FUELED → AT_HP1_GATE → HP1_CLEARED → 
AT_HP2_GATE → HP2_CLEARED
```

**Checkpoint Details:**
- **Fuel Station**: Mandatory refueling at designated stations
- **HP1 Gate**: Initial security checkpoint and documentation review
- **HP2 Gate**: Final clearance before entering Gaza territory

#### Phase 4: Cargo Operations
```
HP2_CLEARED → AT_LOADING_POINT → LOADED → EN_ROUTE → DELIVERED
```

**Operations:**
- **Loading Point**: Designated cargo pickup locations
- **Cargo Loading**: Weight verification and manifest completion
- **Transit**: GPS tracking and status updates
- **Delivery**: Recipient confirmation and documentation

#### Phase 5: Return & Reconciliation
```
DELIVERED → RETURNING → IDLE
```

**Post-Mission:**
- **Return Journey**: Back to base operations
- **Documentation**: Mission report and reconciliation
- **Asset Status**: Truck availability for next mission
- **Performance Metrics**: KPI calculation and reporting

### 📊 Real-Time Tracking
- **Status Updates**: Automatic logging of all status changes
- **GPS Integration**: Ready for location tracking (future enhancement)
- **Time Stamps**: Precise timing for each workflow stage
- **Audit Trail**: Complete operation history for compliance

### 🎯 Key Performance Indicators
- **Mission Completion Time**: End-to-end delivery duration
- **Gate Processing Time**: HP1 and HP2 clearance efficiency
- **Fleet Utilization**: Truck usage statistics
- **Driver Performance**: Assignment and completion metrics
- **Border Crossing Efficiency**: Gate throughput analysis

---

## Installation & Setup

### 🔧 Prerequisites
- Node.js 18.0 or higher
- PostgreSQL 14.0 or higher
- npm or yarn package manager
- Git

### 📦 Installation Steps

#### 1. Clone Repository
```bash
git clone <repository-url>
cd YaffaSolutions/backend
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Environment Configuration
Create `.env` file:
```bash
cp .env.example .env
```

Configure environment variables:
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/gaza_logistics"
TEST_DATABASE_URL="postgresql://username:password@localhost:5432/gaza_logistics_test"

# JWT Configuration  
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRES_IN="24h"

# Server Configuration
PORT=8080
NODE_ENV=development

# CORS Configuration
CORS_ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### 4. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed demo data (optional)
npm run db:seed
```

#### 5. Start Development Server
```bash
npm run dev
```

Server will start at `http://localhost:8080`

#### 6. Verify Installation
```bash
curl http://localhost:8080/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-09-25T12:00:00.000Z",
  "environment": "development"
}
```

### 🗄️ Database Setup (PostgreSQL)

#### Option 1: Local PostgreSQL
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE gaza_logistics;
CREATE DATABASE gaza_logistics_test;
CREATE USER gaza_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE gaza_logistics TO gaza_user;
GRANT ALL PRIVILEGES ON DATABASE gaza_logistics_test TO gaza_user;
\q
```

#### Option 2: Docker PostgreSQL
```bash
# Create docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: gaza_logistics
      POSTGRES_USER: gaza_user
      POSTGRES_PASSWORD: your_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:

# Start PostgreSQL
docker-compose up -d
```

#### Option 3: Cloud Database (Supabase/Neon/Railway)
1. Create account on chosen platform
2. Create PostgreSQL database
3. Copy connection string to `.env` file
4. Run migrations: `npm run db:migrate`

---

## Testing Strategy

### 🧪 Test Structure
```
tests/
├── integration/          # API endpoint testing
│   ├── users.test.ts    # User authentication tests
│   ├── drivers.test.ts  # Driver management tests
│   ├── trucks.test.ts   # Fleet management tests
│   └── gaza-logistics.test.ts # Complete workflow tests
├── unit/                # Service layer testing
│   ├── userService.test.ts
│   ├── driverService.test.ts
│   └── truckService.test.ts
└── setup.ts            # Test configuration
```

### 🚀 Running Tests

#### All Tests
```bash
npm test
```

#### Integration Tests Only
```bash
npm run test:integration
```

#### Unit Tests Only
```bash
npm run test:unit
```

#### Watch Mode (Development)
```bash
npm run test:watch
```

#### Test Coverage
```bash
npm run test -- --coverage
```

### 📊 Test Coverage Targets
- **Unit Tests**: 85%+ coverage
- **Integration Tests**: All API endpoints
- **Error Scenarios**: Authentication, validation, permissions
- **Business Logic**: Gaza workflow state transitions

### 🎯 Test Examples

#### Integration Test (Authentication)
```typescript
describe('User Authentication', () => {
  it('should register new user with tenant creation', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'TestPass123',
      organizationName: 'Test Org'
    };

    const response = await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    expect(response.body.user).toHaveProperty('tenantId');
    expect(response.body.user.tenant.name).toBe('Test Org');
  });
});
```

#### Unit Test (Service Layer)
```typescript
describe('DriverService', () => {
  it('should create driver with proper tenant isolation', async () => {
    const driverData = {
      name: 'Test Driver',
      nationalId: '123456789',
      contractorId: 'contractor-id',
      tenantId: 'tenant-id'
    };

    const driver = await driverService.createDriver(driverData);
    
    expect(driver.tenantId).toBe('tenant-id');
    expect(driver.approvalStatus).toBe('PENDING');
  });
});
```

---

## Deployment Guide

### 🚀 Production Deployment

#### Prerequisites
- Linux server (Ubuntu 20.04+ recommended)
- Node.js 18+ installed
- PostgreSQL 14+ database
- Nginx (reverse proxy)
- SSL certificate
- Process manager (PM2)

#### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx
```

#### 2. Application Deployment
```bash
# Clone repository
git clone <repository-url> /var/www/gaza-logistics
cd /var/www/gaza-logistics/backend

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Set up environment
cp .env.example .env.production
# Edit .env.production with production values
```

#### 3. Database Migration
```bash
# Run migrations
NODE_ENV=production npx prisma migrate deploy

# Generate Prisma client
NODE_ENV=production npx prisma generate
```

#### 4. PM2 Configuration
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'gaza-logistics-api',
    script: './dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

Start application:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 5. Nginx Configuration
Create `/etc/nginx/sites-available/gaza-logistics`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/gaza-logistics /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 6. SSL Certificate (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

#### 7. Production Environment Variables
```bash
# .env.production
NODE_ENV=production
PORT=8080
DATABASE_URL="postgresql://user:pass@localhost:5432/gaza_logistics_prod"
JWT_SECRET="production-secret-key-64-chars-minimum-for-security"
JWT_EXPIRES_IN="24h"
CORS_ALLOWED_ORIGINS="https://your-frontend-domain.com"
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 📊 Monitoring & Logging

#### PM2 Monitoring
```bash
pm2 monit                # Real-time monitoring
pm2 logs                 # View logs
pm2 restart gaza-logistics-api  # Restart app
```

#### Log Management
```bash
# Set up log rotation
sudo nano /etc/logrotate.d/gaza-logistics

/var/www/gaza-logistics/backend/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 0644 www-data www-data
    postrotate
        pm2 reload gaza-logistics-api
    endscript
}
```

### 🔒 Security Hardening

#### Firewall Setup
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

#### Database Security
```bash
# PostgreSQL security
sudo nano /etc/postgresql/14/main/postgresql.conf
# Set: listen_addresses = 'localhost'

sudo nano /etc/postgresql/14/main/pg_hba.conf  
# Ensure proper authentication methods
```

#### Application Security
- Use environment variables for secrets
- Implement rate limiting (already configured)
- Regular security updates
- Monitor error logs for suspicious activity

---

## API Usage Examples

### 🔄 Complete Workflow Example

#### 1. Organization Setup
```bash
# Register organization and first user
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gazaaid.org",
    "name": "Ahmad Hassan",
    "password": "SecurePass123",
    "role": "OPS_MANAGER",
    "organizationName": "Gaza Aid Organization"
  }'
```

#### 2. Authentication
```bash
# Login and get token
curl -X POST http://localhost:8080/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gazaaid.org", 
    "password": "SecurePass123"
  }'

# Save token for subsequent requests
TOKEN="eyJhbGciOiJIUzI1NiIs..."
```

#### 3. Driver Registration & Approval
```bash
# Register new driver
curl -X POST http://localhost:8080/api/gaza/drivers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Omar Khalil Hassan",
    "nationalId": "987654321",
    "phone": "+970-59-123-4567",
    "contractorId": "contractor-id",
    "licenseNumber": "GZ-001",
    "licenseExpiry": "2025-12-31"
  }'

# Approve driver (OPS_MANAGER only)
curl -X POST http://localhost:8080/api/gaza/drivers/{driver-id}/approve \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approvalStatus": "APPROVED",
    "notes": "Documentation verified and approved"
  }'
```

#### 4. Fleet Management
```bash
# Register truck
curl -X POST http://localhost:8080/api/gaza/trucks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plateNo": "GZ-T-001",
    "capacityTons": 15.5,
    "driverId": "driver-id"
  }'

# Dispatch truck for mission
curl -X PATCH http://localhost:8080/api/gaza/trucks/{truck-id}/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "DISPATCHED",
    "notes": "Emergency food delivery mission to northern Gaza"
  }'
```

#### 5. Gaza Workflow Execution
```bash
# Fuel station arrival
curl -X PATCH http://localhost:8080/api/gaza/trucks/{truck-id}/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "AT_FUEL_STATION",
    "notes": "Arrived at designated fuel station"
  }'

# Fueling completed
curl -X PATCH http://localhost:8080/api/gaza/trucks/{truck-id}/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "FUELED", 
    "notes": "Refueling completed - 200L diesel"
  }'

# HP1 Gate processing
curl -X PATCH http://localhost:8080/api/gaza/trucks/{truck-id}/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "AT_HP1_GATE",
    "notes": "Arrived at HP1 for security check"
  }'

curl -X PATCH http://localhost:8080/api/gaza/trucks/{truck-id}/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "HP1_CLEARED",
    "notes": "Security clearance obtained, proceeding to HP2"
  }'

# Continue through complete workflow...
# HP2_CLEARED → AT_LOADING_POINT → LOADED → EN_ROUTE → DELIVERED → RETURNING → IDLE
```

#### 6. Statistics & Reporting
```bash
# Get driver statistics
curl -X GET http://localhost:8080/api/gaza/drivers/stats \
  -H "Authorization: Bearer $TOKEN"

# Get fleet statistics  
curl -X GET http://localhost:8080/api/gaza/trucks/stats \
  -H "Authorization: Bearer $TOKEN"
```

### 📊 Response Examples

#### Driver Statistics Response
```json
{
  "success": true,
  "data": {
    "total": 25,
    "approved": 22,
    "pending": 2,
    "denied": 1,
    "byContractor": {
      "contractor-1": {"total": 10, "approved": 9},
      "contractor-2": {"total": 8, "approved": 7},
      "contractor-3": {"total": 7, "approved": 6}
    },
    "recentActivity": {
      "registrationsLast30Days": 5,
      "approvalsLast30Days": 4
    }
  }
}
```

#### Fleet Statistics Response  
```json
{
  "success": true,
  "data": {
    "totalTrucks": 15,
    "statusBreakdown": {
      "IDLE": 8,
      "DISPATCHED": 3, 
      "EN_ROUTE": 2,
      "MAINTENANCE": 2
    },
    "utilizationRate": 0.73,
    "averageMissionTime": "4.5 hours",
    "completedMissionsLast30Days": 45,
    "capacityBreakdown": {
      "under15Tons": 8,
      "15to20Tons": 5,
      "over20Tons": 2
    }
  }
}
```

---

## Postman Collection

### 📦 Collection Overview
The Gaza Logistics API Postman collection includes:
- **120+ Requests** across 6 main categories
- **Automated Authentication** with token management
- **Environment Variables** for seamless testing
- **Complete Workflows** from registration to delivery
- **Error Scenarios** and edge case testing

### 📁 Collection Structure

#### 1. 🏥 Health Checks
- System health endpoints
- Service availability verification
- Environment validation

#### 2. 🔐 Authentication & User Management  
- User registration with tenant creation
- Multi-role login (5 different roles)
- Profile management
- JWT token handling

#### 3. 🚛 Driver Management
- Driver registration workflow
- Approval process (role-based)
- Bulk operations (import/approve)
- Statistics and reporting

#### 4. 🚚 Truck Management
- Fleet registration
- Real-time status updates
- Assignment management
- Performance metrics

#### 5. 🎯 Gaza Workflow Scenarios
- Complete mission workflows
- Border gate processing
- Cargo operations
- Emergency scenarios

#### 6. ❌ Error Handling & Edge Cases
- Authentication errors (401, 403)
- Validation errors (400)
- Resource not found (404)
- Role permission testing

### 🚀 Quick Setup

#### Import Collection
1. Download files:
   - `Gaza_Logistics_API.postman_collection.json`
   - `Gaza_Logistics_Environment.postman_environment.json`

2. Import to Postman:
   - Open Postman → Import → Select both files
   - Select "Gaza Logistics - Local Development" environment

3. Configure Base URL:
   - Ensure environment variable `base_url` = `http://localhost:8080`

#### Authentication Setup
1. Run "🔑 Login - Dispatcher" request
2. Token automatically saved to `{{auth_token}}`
3. All subsequent requests use this token

#### Test Complete Workflow
1. Navigate to "🎯 Gaza Workflow Scenarios"
2. Run "📝 Scenario 1: Emergency Food Distribution"  
3. Follow step-by-step Gaza logistics process

### 🎯 Demo Credentials
```bash
# Available in seeded data
Dispatcher: dispatcher@gaza-logistics.org / dispatcher123
Ops Manager: ops@gaza-logistics.org / ops123
Contractor: contractor@gaza-logistics.org / contractor123
Maintenance: maintenance@gaza-logistics.org / maintenance123
Auditor: audit@gaza-logistics.org / audit123
```

### 📊 Auto-Generated Variables
The collection automatically manages:
- `{{auth_token}}` - JWT authentication token
- `{{user_id}}` - Current user ID
- `{{tenant_id}}` - Current tenant ID  
- `{{driver_id}}` - Created driver ID
- `{{truck_id}}` - Created truck ID

---

## Troubleshooting

### 🐛 Common Issues & Solutions

#### 1. Database Connection Issues
```bash
Error: "Can't reach database server at localhost:5432"

Solutions:
- Verify PostgreSQL is running: sudo systemctl status postgresql
- Check connection string in .env file
- Verify database exists: psql -U username -d gaza_logistics -c "SELECT 1;"
- Check firewall/port access
```

#### 2. JWT Token Issues
```bash
Error: "Invalid or expired token"

Solutions:
- Generate new token via login endpoint
- Check JWT_SECRET in environment variables
- Verify token format: "Bearer <token>"
- Check token expiration (default 24h)
```

#### 3. Tenant Access Issues
```bash
Error: "Tenant ID is required" or "Access denied"

Solutions:
- Ensure authentication middleware runs before tenant middleware
- Check JWT token includes tenantId claim
- Verify user belongs to correct tenant
- Use proper Authorization header format
```

#### 4. Migration Issues
```bash
Error: "Migration failed" or "Database schema out of sync"

Solutions:
- Reset database: npm run db:reset
- Generate fresh client: npm run db:generate
- Check migration files in prisma/migrations/
- Verify DATABASE_URL format
```

#### 5. Port Already in Use
```bash
Error: "EADDRINUSE: address already in use :::8080"

Solutions:
- Kill process: sudo lsof -ti:8080 | xargs kill -9
- Change port in .env: PORT=8081
- Check for other Node.js processes: ps aux | grep node
```

### 🔍 Debug Mode
Enable detailed logging:
```bash
# Add to .env
DEBUG=gaza-logistics:*
LOG_LEVEL=debug

# View detailed logs
npm run dev
```

### 📊 Health Check Diagnostics
```bash
# System health
curl http://localhost:8080/health

# Component health
curl http://localhost:8080/api/gaza/health
curl http://localhost:8080/api/users/health

# Database connectivity
npm run db:studio  # Opens Prisma Studio
```

### 🛠️ Development Tools

#### Prisma Studio (Database GUI)
```bash
npm run db:studio
# Opens http://localhost:5555
```

#### Log Analysis
```bash
# Real-time logs
npm run dev

# Production logs (PM2)
pm2 logs gaza-logistics-api

# Error logs only
pm2 logs gaza-logistics-api --err
```

#### Database Inspection
```bash
# Connect to database
psql $DATABASE_URL

# List tables
\dt

# Describe table
\d users

# Check row counts
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'drivers', COUNT(*) FROM drivers
UNION ALL  
SELECT 'trucks', COUNT(*) FROM trucks;
```

---

## Future Enhancements

### 🚀 Planned Features

#### Phase 2: Advanced Operations
- **GPS Tracking Integration**: Real-time location tracking for trucks
- **Mobile App**: React Native app for drivers and field operations
- **Document Management**: File upload for licenses, permits, certificates
- **Advanced Reporting**: Custom report builder with charts and export
- **Notification System**: Email/SMS alerts for critical events
- **Inventory Management**: Cargo tracking and warehouse operations

#### Phase 3: Intelligence & Automation
- **Route Optimization**: AI-powered route planning
- **Predictive Analytics**: Maintenance scheduling and demand forecasting
- **Automated Workflows**: Rule-based status transitions
- **Integration APIs**: Connect with external logistics systems
- **Advanced Security**: SSO integration and OAuth2 support
- **Multi-Language Support**: Arabic, Hebrew, English localization

### 🔧 Technical Improvements

#### Performance Optimization
- **Database Indexing**: Query optimization for large datasets
- **Caching Layer**: Redis integration for frequently accessed data
- **API Rate Limiting**: Enhanced protection and throttling
- **Database Sharding**: Horizontal scaling for massive multi-tenancy
- **CDN Integration**: Static asset optimization

#### DevOps & Infrastructure
- **Docker Containerization**: Complete containerized deployment
- **Kubernetes Support**: Orchestrated scaling and management
- **CI/CD Pipeline**: Automated testing and deployment
- **Infrastructure as Code**: Terraform/CloudFormation templates
- **Monitoring & Alerting**: Prometheus, Grafana, and PagerDuty integration

#### Security Enhancements
- **Audit Log Encryption**: Enhanced data protection
- **API Versioning**: Backward compatibility management
- **Advanced RBAC**: Fine-grained permissions and policies
- **Data Anonymization**: Privacy-compliant data handling
- **Vulnerability Scanning**: Automated security assessments

### 🌍 Scaling Considerations

#### Multi-Region Support
- **Geographic Distribution**: Multiple data centers for global operations
- **Data Residency**: Compliance with local data protection laws
- **Cross-Border Logistics**: International humanitarian operations
- **Currency Support**: Multi-currency financial operations

#### Enterprise Features
- **Advanced Analytics**: Business intelligence and dashboards
- **Custom Integrations**: Enterprise resource planning (ERP) connectivity
- **Compliance Reporting**: Automated regulatory compliance
- **Advanced Backup**: Point-in-time recovery and disaster recovery
- **SLA Monitoring**: Service level agreement tracking

---

## 📞 Support & Contact

### 🛠️ Technical Support
- **Documentation**: This comprehensive guide
- **API Reference**: Postman collection with examples
- **Code Repository**: Source code with inline comments
- **Issue Tracking**: GitHub issues for bug reports and feature requests

### 👥 Community
- **Developer Community**: For technical discussions and contributions
- **User Feedback**: Feature requests and usability improvements
- **Security Issues**: Responsible disclosure process

### 📧 Contact Information
- **Project Lead**: [Contact Information]
- **Technical Team**: [Team Contact Information]
- **Security Contact**: [Security Team Contact]

---

## 📜 License & Legal

### 📄 Software License
This project is licensed under [License Type] - see LICENSE file for details.

### 🛡️ Data Protection
- **GDPR Compliance**: European data protection regulation compliance
- **Data Minimization**: Collection of only necessary data
- **Right to Deletion**: User data removal capabilities
- **Data Portability**: User data export functionality

### 🔒 Security Disclosure
For security vulnerabilities, please contact: [security@example.com]
- Do not create public GitHub issues for security vulnerabilities
- Allow reasonable time for response and fix implementation
- Coordinate disclosure timeline with development team

---

## 🎉 Conclusion

The Gaza Humanitarian Logistics System represents a comprehensive, production-ready solution for managing complex humanitarian aid operations. With its robust multi-tenant architecture, granular role-based access control, and Gaza-specific workflow modeling, it provides organizations with the tools needed for efficient, transparent, and auditable logistics operations.

### ✅ Key Achievements
- **Complete Multi-Tenancy**: Secure isolation for multiple organizations
- **Real-World Workflow**: Authentic Gaza logistics process modeling
- **Production Ready**: Comprehensive security, testing, and deployment
- **Developer Friendly**: Extensive documentation and API tooling
- **Scalable Architecture**: Built for growth and expansion

### 🚀 Getting Started
1. **Quick Start**: Follow installation guide (15 minutes)
2. **Import Postman**: Test all APIs with provided collection
3. **Explore Workflows**: Run complete Gaza logistics scenarios
4. **Customize**: Adapt to your organization's specific needs
5. **Deploy**: Use production deployment guide for live operations

The system is ready for immediate use and provides a solid foundation for future enhancements and scaling to meet the evolving needs of humanitarian logistics operations worldwide.

---

*Last Updated: September 25, 2025*  
*Version: 1.0.0*  
*Gaza Humanitarian Logistics System - Complete Documentation*