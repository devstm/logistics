# Driver Flow Implementation

## Overview
This document describes the driver flow functionality implemented for the Gaza Logistics POC system, ensuring it matches the master prompt requirements.

## Key Changes Made

### 1. Database Schema Changes
- **Added DRIVER role** to `UserRole` enum in Prisma schema
- **Added `userId` field** to Driver model (optional, unique) to link driver records to user accounts
- This allows drivers to log in and access their driver portal

### 2. Backend Services Created

#### DriverPortalService (`backend/src/services/driverPortalService.ts`)
Handles all driver-facing operations:
- `getDriverAssignment()` - Gets current truck and mission assignment for logged-in driver
- `updateTruckStatus()` - Allows driver to update truck status at checkpoints
- `reportFuel()` - Allows driver to report fuel events
- `getDriverProfile()` - Gets driver profile information

**Key Features:**
- Status transition validation (prevents invalid status changes)
- Automatic checkpoint event creation (HP1, HP2)
- Truck ownership verification (drivers can only update their own trucks)
- Audit logging for all driver actions

#### DriverPortalController (`backend/src/controllers/driverPortalController.ts`)
Express controller with endpoints:
- `GET /api/driver/assignment` - Get current assignment
- `GET /api/driver/profile` - Get driver profile
- `POST /api/driver/truck/:truckId/status` - Update truck status
- `POST /api/driver/truck/:truckId/fuel` - Report fuel

#### Driver Portal Routes (`backend/src/routes/driverPortalRoutes.ts`)
- All routes protected by authentication middleware
- Role-based access control (DRIVER role required)

### 3. Frontend Components

#### Driver Dashboard Page (`app/driver-dashboard/page.tsx`)
- Protected route (only DRIVER role can access)
- Redirects non-drivers to main dashboard
- Authentication check

#### Driver Dashboard Component (`components/driver/driver-dashboard.tsx`)
Mobile-friendly driver interface showing:

**Current Assignment Card:**
- Truck plate number
- Truck capacity
- Current status with color-coded badge
- Mission details (name, border, date)

**Next Actions Card:**
- Context-aware action buttons based on current status
- Examples:
  - "Arrived at Fuel Station" (when dispatched)
  - "Fueling Complete" (when at fuel station)
  - "Arrived at HP1" (when fueled)
  - "HP1 Cleared" (when at HP1)
  - etc.

**Fuel History Card:**
- Shows all fuel events for current mission
- Station name, liters, timestamp

**Instructions Card:**
- Important reminders for drivers
- Security and safety protocols

**Features:**
- Real-time status updates (polls every 30 seconds)
- One-click status updates
- Visual progress tracking
- Mobile-optimized UI

### 4. State Machine Implementation

Valid status transitions enforced in backend:
```
IDLE → DISPATCHED
DISPATCHED → FUELING_REQUESTED | HP1_WAIT
FUELING_REQUESTED → FUELED
FUELED → HP1_WAIT
HP1_WAIT → HP2_WAIT | LOADING_PREP
HP2_WAIT → LOADING_PREP
LOADING_PREP → LOADED
LOADED → EXITING
EXITING → DELIVERED | LOOTED
DELIVERED → RECONCILED | IDLE
```

### 5. Navigation Updates (`components/main-layout.tsx`)
- Added "My Assignment" navigation item for DRIVER role
- Updated logo link to redirect drivers to driver dashboard
- Added DRIVER role badge styling

### 6. Type Definitions (`types/index.ts`)
New types added:
- `DriverAssignment` - Full assignment details for driver
- `FuelReportData` - Fuel reporting structure
- `StatusUpdateData` - Status update payload

## Driver Workflow (As Per Prompt)

### Phase 1: Driver Intake & Approval ✅
- Contractor uploads driver list (CSV)
- Ops Manager/Dispatcher approves or denies drivers
- Only approved drivers can be assigned

### Phase 2: Dispatch ✅
- Dispatcher assigns approved driver to truck
- Driver receives mission assignment
- Driver can see truck and mission details in portal

### Phase 3: Fuel Tracking ✅
- Driver reports when arriving at fuel station
- Driver reports fuel amount and station name
- System tracks company-paid vs driver-paid fuel

### Phase 4: Holding Points (HP1 → HP2) ✅
- Driver updates status when arriving at HP1
- System waits for GL (Green Light) from Ops
- Driver proceeds to HP2 after clearance
- Same process at HP2

### Phase 5: Loading ✅
- Driver updates status at loading point
- Driver marks loading complete
- Cargo details tracked

### Phase 6: Delivery ✅
- Driver updates status when en route
- Driver marks delivery complete at warehouse
- System tracks delivery timestamp

### Phase 7: Reconciliation
- Handled by Ops Manager (not driver-facing)
- Fuel totals, pallets, damages reviewed
- Mission marked as reconciled

## Security Features

1. **Authentication Required**: All driver endpoints require valid JWT token
2. **Role-Based Access Control**: Only users with DRIVER role can access driver portal
3. **Truck Ownership Verification**: Drivers can only update trucks assigned to them
4. **Status Transition Validation**: Prevents invalid status changes
5. **Audit Logging**: All driver actions logged with user ID, timestamp, before/after values

## Mobile Optimization

- Responsive design (mobile-first)
- Touch-friendly buttons
- Large click targets
- Clear visual hierarchy
- Real-time updates
- Minimal data usage (polling, not continuous streaming)

## Multi-Tenant Support

- All driver data scoped by `tenantId`
- Driver can only see their own assignments within their tenant
- Audit logs segmented per tenant

## Next Steps / Migration Required

To deploy these changes:

1. **Run Prisma Migration**:
   ```bash
   cd backend
   npx prisma migrate dev --name add_driver_role_and_userid
   npx prisma generate
   ```

2. **Create Driver User Accounts**:
   - Option A: Ops Manager creates user accounts for approved drivers
   - Option B: Implement self-registration flow with driver national ID verification
   - Link user account to driver record via `userId` field

3. **Test Driver Flow**:
   - Create test driver with DRIVER role
   - Assign driver to truck in mission
   - Test status updates through driver portal
   - Verify audit logs

## API Endpoints Summary

### Driver Portal APIs
```
GET  /api/driver/assignment          - Get current assignment
GET  /api/driver/profile              - Get driver profile
POST /api/driver/truck/:id/status     - Update truck status
POST /api/driver/truck/:id/fuel       - Report fuel event
```

### Required Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Example Status Update
```json
POST /api/driver/truck/clx123/status
{
  "status": "FUELED",
  "notes": "Fueled at Gaza Central Station"
}
```

### Example Fuel Report
```json
POST /api/driver/truck/clx123/fuel
{
  "liters": 50,
  "stationName": "Gaza Central Fuel Station",
  "missionId": "mission123"
}
```

## Matching Prompt Requirements

✅ **Driver Intake & Approval**: Implemented via driver management UI
✅ **Multi-Tenant**: All data scoped by tenantId
✅ **Driver Role**: Added to enum and permissions
✅ **Driver Dashboard**: Mobile-friendly portal created
✅ **Status Updates**: Driver can update status at checkpoints
✅ **Fuel Tracking**: Driver can report fuel events
✅ **Holding Points (HP1/HP2)**: Status tracking implemented
✅ **Loading & Delivery**: Status updates supported
✅ **Audit Trail**: All actions logged with user, timestamp
✅ **Security**: Role-based access, truck ownership verification
✅ **State Machine**: Valid transitions enforced

## Notes

- Drivers cannot modify mission details (read-only)
- Drivers cannot see other drivers' assignments
- GL (Green Light) approvals still handled by Ops Manager (not driver-facing)
- Border official interactions remain out of scope (as per prompt)
- CLA interactions remain out of scope (as per prompt)