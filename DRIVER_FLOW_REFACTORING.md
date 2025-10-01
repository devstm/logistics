# Driver Flow Refactoring - Mission-Based Approval

## Summary of Changes

The driver flow has been refactored to match the correct business requirements:

### Old Model (Incorrect):
- Drivers had global `approvalStatus` (PENDING/APPROVED/DENIED)
- Approval was permanent and attached to the driver profile
- Dispatchers could approve/deny drivers globally

### New Model (Correct):
- Drivers are registered without approval status
- Drivers are **assigned to missions** via `MissionDriver` junction table
- Each mission assignment has its own status (PENDING/APPROVED/DENIED)
- External party approves/denies drivers **per mission**

## Database Schema Changes

### 1. Removed from Driver Model:
```prisma
- approvalStatus ApprovalStatus @default(PENDING)
```

### 2. Added MissionDriver Junction Table:
```prisma
model MissionDriver {
  id              String                @id @default(cuid())
  missionId       String
  driverId        String
  tenantId        String
  status          MissionDriverStatus   @default(PENDING)
  assignedAt      DateTime              @default(now())
  assignedBy      String                // Dispatcher who assigned
  approvedBy      String?               // External party (note/reference)
  approvedAt      DateTime?
  notes           String?

  @@unique([missionId, driverId])
}
```

### 3. Added Enum:
```prisma
enum MissionDriverStatus {
  PENDING
  APPROVED
  DENIED
}
```

## TypeScript Changes

### Frontend Types Updated:
- Removed `ApprovalStatus` enum
- Added `MissionDriverStatus` enum
- Added `MissionDriver` interface
- Updated `Driver` interface (removed `approvalStatus`)
- Updated `Mission` interface (added `missionDrivers`)

### Backend Services Updated:
- **DriverService**: Removed all approval methods
  - ❌ `approveDriver()`
  - ❌ `denyDriver()`
  - ❌ `updateDriverApprovalStatus()`
  - ❌ `bulkApproveDrivers()`
  - ✅ Simplified `getDriversByTenant()` (removed status filter)
  - ✅ Simplified `getDriverStatistics()` (removed approval stats)

## New Workflow

### 1. Driver Registration (Unchanged):
```
Contractor → Upload Driver List (CSV)
Dispatcher → Review & Add Drivers to System
```

### 2. Mission Assignment (NEW):
```
Dispatcher → Create Mission
Dispatcher → Select Drivers for Mission
System → Create MissionDriver records (status: PENDING)
```

### 3. External Approval (Outside System):
```
System → Export driver list for mission
External Party → Approve/Deny each driver
Dispatcher → Update MissionDriver status manually
```

### 4. Driver sees assignments:
```
Driver → Login → See missions assigned to them
Driver → See status per mission (PENDING/APPROVED/DENIED)
Driver → If APPROVED → Can update truck status
```

## Files Changed

### Schema:
- ✅ `backend/prisma/schema.prisma`

### Backend Services:
- ✅ `backend/src/services/driverService.ts`
- ⏳ `backend/src/controllers/driverController.ts` (needs update)
- ⏳ `backend/src/services/driverPortalService.ts` (needs update)
- ⏳ Need to create: `backend/src/services/missionDriverService.ts`

### Frontend Types:
- ✅ `types/index.ts`

### Frontend Components (need major updates):
- ⏳ `components/drivers/driver-management.tsx`
- ⏳ `components/driver/driver-dashboard.tsx`
- ⏳ Need mission assignment UI

## Next Steps (Remaining)

### 1. Run Database Migration:
```bash
cd backend
npx prisma migrate dev --name remove_driver_approval_add_mission_driver
npx prisma generate
```

### 2. Create MissionDriverService:
```typescript
// backend/src/services/missionDriverService.ts
export class MissionDriverService {
  async assignDriversToMission(...)
  async updateMissionDriverStatus(...)
  async getMissionDrivers(...)
  async getDriverMissions(...)
}
```

### 3. Update DriverController:
- Remove approval endpoints
- Remove bulk approval endpoint
- Update stats endpoint

### 4. Update Driver Management UI:
- Remove approval/deny buttons
- Remove status filter (approved/pending/denied)
- Add "Assign to Mission" button
- Show driver list by contractor

### 5. Create Mission Assignment UI:
- Driver selection interface
- Multi-select drivers for mission
- Export driver list for external approval
- Import approval results

### 6. Update Driver Dashboard:
- Show list of missions assigned to driver
- Show status per mission
- Only allow truck updates if mission status = APPROVED

### 7. Update Driver Portal Service:
- Check mission assignment status before allowing updates
- Only allow updates if driver is APPROVED for that mission

## Migration Impact

### Data Loss:
⚠️ **WARNING**: Running this migration will **drop the `approval_status` column** from the `drivers` table. All existing approval data will be lost.

### Recommended Approach:
1. **Backup database first**
2. **Create data migration script** to convert existing approvals:
   - Find all APPROVED drivers
   - Find their current/recent missions
   - Create MissionDriver records with APPROVED status
3. **Then run schema migration**

## Testing Checklist

- [ ] Create driver without approval status
- [ ] Assign driver to mission (creates MissionDriver with PENDING)
- [ ] Update MissionDriver status to APPROVED
- [ ] Driver logs in and sees mission assignment
- [ ] Driver can update truck status for APPROVED mission
- [ ] Driver cannot update truck status for PENDING mission
- [ ] Dispatcher can export driver list for mission
- [ ] Dispatcher can update mission driver statuses

## API Endpoints to Create

```
POST /api/missions/:id/drivers          - Assign drivers to mission
GET  /api/missions/:id/drivers          - Get mission drivers
PATCH /api/missions/:id/drivers/:did    - Update driver status for mission
POST /api/missions/:id/drivers/export   - Export driver list for external approval
POST /api/missions/:id/drivers/import   - Import approval results
```

## Rollback Plan

If issues arise:
1. Restore database backup
2. Revert schema changes
3. Revert code changes
4. Run `npx prisma generate`

---

**Status**: ⚠️ **PARTIALLY COMPLETE** - Schema and services updated, migration and UI updates pending
**Priority**: HIGH - Blocking feature
**Estimated Remaining Work**: 4-6 hours