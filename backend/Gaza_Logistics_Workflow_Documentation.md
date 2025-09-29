# 🇵🇸 Gaza Humanitarian Logistics API - Complete Workflow Documentation

## 📋 Overview
This document provides complete end-to-end workflows for the Gaza Humanitarian Logistics system, covering all scenarios from driver onboarding to delivery reconciliation.

## 🏗️ System Architecture

### Multi-Tenant Structure
- **Tenant Isolation**: Each humanitarian organization operates in its own tenant space
- **Role-Based Access Control**: 5 distinct roles with specific permissions
- **Audit Logging**: Complete audit trail for all operations

### User Roles & Permissions

| Role | Permissions | Use Cases |
|------|-------------|-----------|
| **DISPATCHER** | Create/view drivers & trucks, dispatch operations | Daily dispatch operations |
| **OPS_MANAGER** | Full CRUD access, approvals, statistics | Management oversight |
| **CONTRACTOR_FOCAL_POINT** | Manage own contractors' drivers/trucks | Contractor coordination |
| **MAINTENANCE** | View fleet, update maintenance status | Technical operations |
| **FINANCE_AUDIT** | Read-only access to all data, reports | Auditing & compliance |

## 🔄 Complete Gaza Logistics Workflow

### Phase 1: System Setup & Authentication

#### 1.1 Initial Login & Authorization
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "dispatcher@gaza-logistics.org",
  "password": "dispatcher123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user-uuid",
    "email": "dispatcher@gaza-logistics.org",
    "name": "Ahmed Hassan Al-Masri",
    "role": "DISPATCHER",
    "tenant": {
      "id": "tenant-uuid",
      "name": "Gaza Humanitarian Aid Organization"
    }
  },
  "token": "jwt-token-here"
}
```

#### 1.2 Environment Variables Setup
Set these in Postman Environment:
- `base_url`: `http://localhost:8080`
- `auth_token`: From login response
- `tenant_id`: From user response
- `user_id`: From user response

### Phase 2: Driver Management Workflow

#### 2.1 Driver Registration Process
```http
POST /api/gaza/drivers
Authorization: Bearer {{auth_token}}
Content-Type: application/json

{
  "name": "Ahmad Hassan Khalil",
  "nationalId": "987654321",
  "phone": "+970-59-987-6543",
  "contractorId": "gaza-transport-co",
  "licenseNumber": "GZ-DRV-2024-001",
  "licenseExpiry": "2025-12-31T00:00:00.000Z"
}
```

#### 2.2 Driver Approval Workflow (Operations Manager)
```http
POST /api/gaza/drivers/{driver-id}/approve
Authorization: Bearer {{ops_manager_token}}
Content-Type: application/json

{
  "approvalStatus": "APPROVED",
  "notes": "Driver documentation verified and approved for Gaza operations"
}
```

#### 2.3 Bulk Driver Operations
```http
POST /api/gaza/drivers/bulk-approve
Authorization: Bearer {{ops_manager_token}}
Content-Type: application/json

{
  "driverIds": ["driver-1", "driver-2", "driver-3"],
  "approvalStatus": "APPROVED",
  "notes": "Emergency response team batch approval"
}
```

### Phase 3: Fleet Management Workflow

#### 3.1 Truck Registration
```http
POST /api/gaza/trucks
Authorization: Bearer {{auth_token}}
Content-Type: application/json

{
  "plateNo": "GZ-1005",
  "capacityTons": 18.5,
  "driverId": null
}
```

#### 3.2 Driver-Truck Assignment
```http
PUT /api/gaza/trucks/{truck-id}
Authorization: Bearer {{auth_token}}
Content-Type: application/json

{
  "driverId": "approved-driver-id"
}
```

### Phase 4: Mission Dispatch Workflow

#### 4.1 Pre-Mission Checks
```http
GET /api/gaza/drivers?status=APPROVED
GET /api/gaza/trucks?status=IDLE
```

#### 4.2 Mission Dispatch
```http
PATCH /api/gaza/trucks/{truck-id}/status
Authorization: Bearer {{dispatcher_token}}
Content-Type: application/json

{
  "status": "DISPATCHED",
  "notes": "Emergency food distribution mission - Northern Gaza via KS Border"
}
```

### Phase 5: Gaza Operational Workflow

#### 5.1 Fueling Station Process
```http
# Arrived at fuel station
PATCH /api/gaza/trucks/{truck-id}/status
{
  "status": "AT_FUEL_STATION",
  "notes": "Truck arrived at designated fueling station"
}

# Fueling completed
PATCH /api/gaza/trucks/{truck-id}/status
{
  "status": "FUELED",
  "notes": "Fueling completed - 200L diesel, ready for HP1 gate"
}
```

#### 5.2 HP1 Gate Processing
```http
# Arrived at HP1
PATCH /api/gaza/trucks/{truck-id}/status
{
  "status": "AT_HP1_GATE",
  "notes": "Truck arrived at HP1 gate for security check"
}

# HP1 Cleared
PATCH /api/gaza/trucks/{truck-id}/status
{
  "status": "HP1_CLEARED",
  "notes": "Security check completed, proceeding to HP2"
}
```

#### 5.3 HP2 Gate Processing
```http
# Arrived at HP2
PATCH /api/gaza/trucks/{truck-id}/status
{
  "status": "AT_HP2_GATE",
  "notes": "Truck at HP2 gate for final clearance"
}

# HP2 Cleared
PATCH /api/gaza/trucks/{truck-id}/status
{
  "status": "HP2_CLEARED",
  "notes": "Final clearance obtained, entering Gaza territory"
}
```

#### 5.4 Loading Process
```http
# At loading point
PATCH /api/gaza/trucks/{truck-id}/status
{
  "status": "AT_LOADING_POINT",
  "notes": "Truck at designated loading point for cargo pickup"
}

# Loading completed
PATCH /api/gaza/trucks/{truck-id}/status
{
  "status": "LOADED",
  "notes": "15 tons of food supplies loaded, departing for delivery"
}
```

#### 5.5 Delivery Process
```http
# En route
PATCH /api/gaza/trucks/{truck-id}/status
{
  "status": "EN_ROUTE",
  "notes": "Truck en route to northern Gaza distribution center"
}

# Delivered
PATCH /api/gaza/trucks/{truck-id}/status
{
  "status": "DELIVERED",
  "notes": "Delivery completed - 15 tons food supplies delivered to northern Gaza distribution center"
}
```

#### 5.6 Return & Reconciliation
```http
# Returning
PATCH /api/gaza/trucks/{truck-id}/status
{
  "status": "RETURNING",
  "notes": "Truck returning to base after successful delivery"
}

# Mission complete
PATCH /api/gaza/trucks/{truck-id}/status
{
  "status": "IDLE",
  "notes": "Mission completed successfully - truck returned to base and available for next assignment"
}
```

### Phase 6: Monitoring & Analytics

#### 6.1 Real-time Statistics
```http
GET /api/gaza/drivers/stats    # Driver metrics
GET /api/gaza/trucks/stats     # Fleet metrics
```

#### 6.2 Audit Logging
All operations are automatically logged with:
- User ID and role
- Timestamp
- Action performed
- Resource affected
- Tenant context
- Additional metadata

## 🚨 Emergency Scenarios

### Emergency Response Workflow
1. **Rapid Deployment**: Skip normal approval delays for pre-approved emergency drivers
2. **Priority Routing**: Emergency status trucks get priority at gates
3. **Real-time Tracking**: Enhanced monitoring during emergency operations

### Maintenance Emergency
```http
PATCH /api/gaza/trucks/{truck-id}/status
{
  "status": "MAINTENANCE",
  "notes": "EMERGENCY: Engine failure - requires immediate mechanical support"
}
```

## 🔐 Security & Compliance

### Authentication Flow
1. User logs in with credentials
2. System returns JWT token with tenant context
3. All subsequent requests include Bearer token
4. Token includes user role for authorization
5. Automatic tenant isolation enforced

### Role-Based Access Examples

#### Dispatcher Permissions
```http
✅ POST /api/gaza/drivers          # Create drivers
✅ GET /api/gaza/drivers           # View all drivers
✅ PATCH /api/gaza/trucks/{id}/status  # Update truck status
❌ DELETE /api/gaza/drivers/{id}   # Cannot delete drivers
❌ POST /api/gaza/drivers/{id}/approve  # Cannot approve drivers
```

#### Operations Manager Permissions
```http
✅ All dispatcher permissions
✅ POST /api/gaza/drivers/{id}/approve  # Can approve drivers
✅ DELETE /api/gaza/drivers/{id}   # Can delete drivers
✅ GET /api/users/                 # Can view all users
✅ Bulk operations                 # Can perform bulk actions
```

#### Contractor Focal Point Permissions
```http
✅ POST /api/gaza/drivers          # Create drivers (own contractor only)
✅ GET /api/gaza/drivers           # View drivers (own contractor only)
✅ PUT /api/gaza/drivers/{id}      # Update drivers (own contractor only)
❌ POST /api/gaza/drivers/{id}/approve  # Cannot approve drivers
❌ DELETE /api/gaza/drivers/{id}   # Cannot delete drivers
```

## 📊 Data Models

### Driver Status Flow
```
PENDING → APPROVED → ACTIVE → INACTIVE
        ↘ DENIED
```

### Truck Status Flow
```
IDLE → DISPATCHED → AT_FUEL_STATION → FUELED → AT_HP1_GATE → HP1_CLEARED 
→ AT_HP2_GATE → HP2_CLEARED → AT_LOADING_POINT → LOADED → EN_ROUTE → DELIVERED → RETURNING → IDLE

Alternative paths:
→ MAINTENANCE (from any status)
→ OUT_OF_SERVICE (from any status)
```

### Mission Status Flow
```
PLANNING → ACTIVE → COMPLETED → RECONCILED
         ↘ CANCELLED
```

## 🛠️ API Testing Guidelines

### Using the Postman Collection

1. **Import Collection**: Import `Gaza_Logistics_API.postman_collection.json`
2. **Set Environment**: Configure base_url and credentials
3. **Run Health Checks**: Verify system status
4. **Authenticate**: Login with appropriate role
5. **Execute Workflows**: Follow scenario-based testing

### Test Data Available

#### Demo Users (from seed data)
- **Dispatcher**: `dispatcher@gaza-logistics.org` / `dispatcher123`
- **Ops Manager**: `ops@gaza-logistics.org` / `ops123`
- **Contractor**: `contractor@gaza-logistics.org` / `contractor123`
- **Maintenance**: `maintenance@gaza-logistics.org` / `maintenance123`
- **Auditor**: `audit@gaza-logistics.org` / `audit123`

#### Demo Contractors
- Gaza Transport & Logistics Company
- Al-Nour Humanitarian Logistics  
- Unity Transport Services

#### Demo Drivers (5 available)
- 4 pre-approved drivers
- 1 pending approval driver

#### Demo Trucks (5 available)
- Various capacities (12T - 25T)
- Different statuses (IDLE, DISPATCHED, MAINTENANCE, etc.)

## 🔍 Troubleshooting

### Common Error Scenarios

#### 401 Unauthorized
```json
{
  "message": "Access token required"
}
```
**Solution**: Include valid JWT token in Authorization header

#### 403 Forbidden
```json
{
  "message": "Insufficient permissions for this action"
}
```
**Solution**: Use account with appropriate role

#### 400 Bad Request
```json
{
  "errors": [
    {
      "msg": "Name must be between 2 and 100 characters",
      "param": "name"
    }
  ]
}
```
**Solution**: Fix validation errors in request data

#### 404 Not Found
```json
{
  "message": "Resource not found"
}
```
**Solution**: Verify resource ID exists in current tenant

## 📈 Performance Monitoring

### Key Metrics to Track
- **Response Times**: API endpoint performance
- **Success Rates**: Operation completion rates
- **Active Missions**: Real-time operation count
- **Fleet Utilization**: Truck usage statistics
- **Driver Productivity**: Delivery completion metrics

### Monitoring Endpoints
```http
GET /health                    # Overall system health
GET /api/gaza/health          # Gaza API health
GET /api/gaza/drivers/stats   # Driver performance metrics
GET /api/gaza/trucks/stats    # Fleet performance metrics
```

## 🎯 Next Steps

1. **Import Postman Collection**: Use provided collection file
2. **Configure Environment**: Set up base URL and test credentials
3. **Test Authentication**: Verify login with different roles
4. **Execute Scenarios**: Run complete workflow scenarios
5. **Monitor Operations**: Track real-time metrics and logs
6. **Scale Operations**: Add more drivers, trucks, and missions as needed

---

**🔗 Quick Links:**
- Postman Collection: `Gaza_Logistics_API.postman_collection.json`
- API Base URL: `http://localhost:8080`
- Health Check: `GET /health`
- Gaza API Health: `GET /api/gaza/health`

**📞 Support:**
For technical issues or questions about the Gaza logistics workflow, refer to the API documentation or check the audit logs for detailed operation tracking.