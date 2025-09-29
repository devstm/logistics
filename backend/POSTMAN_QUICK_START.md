# 🚀 Gaza Logistics API - Postman Quick Start Guide

## 📦 What You'll Get

### 1. Complete Postman Collection (`Gaza_Logistics_API.postman_collection.json`)
- **120+ API endpoints** covering all Gaza logistics workflows
- **5 main sections**: Health Checks, Authentication, Driver Management, Truck Management, Gaza Workflows
- **Complete scenarios**: Emergency food distribution, fueling, border gates, delivery, reconciliation
- **Error handling**: All edge cases and validation scenarios
- **Automatic environment variables**: Tokens and IDs auto-saved between requests

### 2. Pre-configured Environment (`Gaza_Logistics_Environment.postman_environment.json`)
- Base URL configuration
- Token storage for all user roles
- ID tracking for resources

### 3. Complete Documentation (`Gaza_Logistics_Workflow_Documentation.md`)
- End-to-end workflow descriptions
- Role-based access control examples
- Security and compliance guidelines
- Troubleshooting guide

## ⚡ Quick Setup (5 minutes)

### Step 1: Import to Postman
1. Open Postman
2. Click **Import** 
3. Import both files:
   - `Gaza_Logistics_API.postman_collection.json`
   - `Gaza_Logistics_Environment.postman_environment.json`
4. Select the "Gaza Logistics - Local Development" environment

### Step 2: Verify Server is Running
```bash
# Check if your server is running
curl http://localhost:8080/health
```

### Step 3: Test Authentication
1. Go to "🔐 Authentication & User Management" folder
2. Run "🔑 Login - Dispatcher" request
3. Token will be automatically saved to environment

### Step 4: Test a Complete Workflow
1. Navigate to "🎯 Gaza Workflow Scenarios"
2. Run "📝 Scenario 1: Emergency Food Distribution"
3. Follow the step-by-step mission workflow

## 🎯 Demo Credentials (Already Seeded)

| Role | Email | Password | Use Case |
|------|--------|----------|----------|
| **Dispatcher** | `dispatcher@gaza-logistics.org` | `dispatcher123` | Daily operations |
| **Ops Manager** | `ops@gaza-logistics.org` | `ops123` | Management & approvals |
| **Contractor** | `contractor@gaza-logistics.org` | `contractor123` | Contractor coordination |
| **Maintenance** | `maintenance@gaza-logistics.org` | `maintenance123` | Fleet maintenance |
| **Auditor** | `audit@gaza-logistics.org` | `audit123` | Audit & compliance |

## 🔥 Most Important Endpoints to Test

### 1. System Health
```
GET /health
GET /api/gaza/health
```

### 2. Authentication
```
POST /api/users/login
GET /api/users/profile
```

### 3. Driver Workflow
```
POST /api/gaza/drivers          # Create driver
GET /api/gaza/drivers           # List all drivers  
POST /api/gaza/drivers/{id}/approve  # Approve driver (Ops Manager)
```

### 4. Truck Operations
```
POST /api/gaza/trucks           # Register truck
PATCH /api/gaza/trucks/{id}/status  # Update status
GET /api/gaza/trucks/stats      # Fleet metrics
```

### 5. Complete Gaza Mission Flow
```
DISPATCHED → AT_FUEL_STATION → FUELED → AT_HP1_GATE → HP1_CLEARED → 
AT_HP2_GATE → HP2_CLEARED → AT_LOADING_POINT → LOADED → 
EN_ROUTE → DELIVERED → RETURNING → IDLE
```

## 🎬 Recommended Testing Flow

### Phase 1: Authentication (2 min)
1. Test login with Dispatcher role
2. Test login with Ops Manager role  
3. Verify role-based access differences

### Phase 2: Driver Management (5 min)
1. Create new driver (Dispatcher)
2. Approve driver (Ops Manager)
3. Test role-based restrictions (Contractor trying to delete)

### Phase 3: Fleet Management (5 min)
1. Register new truck
2. Assign driver to truck
3. Update truck status through mission flow

### Phase 4: Complete Mission (10 min)
1. Run "Emergency Food Distribution" scenario
2. Track truck through all Gaza workflow stages
3. Complete mission and return to base

### Phase 5: Error Scenarios (3 min)
1. Test without authentication token (401)
2. Test with wrong role permissions (403)
3. Test with invalid data (400)

## 📊 Key Features Demonstrated

### Multi-Tenant Security
- All operations are tenant-isolated
- JWT tokens include tenant context
- Cross-tenant access automatically blocked

### Role-Based Access Control
- **Dispatcher**: Create & dispatch operations
- **Ops Manager**: Full management + approvals  
- **Contractor**: Limited to own contractor's resources
- **Maintenance**: Fleet status updates only
- **Finance Audit**: Read-only access to all data

### Gaza-Specific Workflow
- **Border Gates**: HP1 and HP2 processing
- **Fuel Stations**: Designated refueling points
- **Loading Points**: Cargo pickup locations
- **Status Tracking**: Real-time mission monitoring
- **Audit Logging**: Complete operation history

### Real-time Operations
- Status updates trigger automatic logging
- Fleet statistics update in real-time
- Mission progress tracked through all stages
- Driver availability automatically managed

## 🔍 Troubleshooting

### Common Issues

#### "Connection Error"
**Problem**: Can't connect to API
**Solution**: Ensure server is running on `localhost:8080`
```bash
npm run dev  # Start development server
```

#### "401 Unauthorized"  
**Problem**: Missing or expired token
**Solution**: Run login request first, token auto-saves

#### "403 Forbidden"
**Problem**: Insufficient role permissions
**Solution**: Use appropriate role account (check documentation)

#### "400 Bad Request"
**Problem**: Invalid request data
**Solution**: Check request body matches required format

### Debug Tips
1. **Check Environment**: Ensure "Gaza Logistics - Local Development" is selected
2. **View Console**: Postman console shows auto-saved variables
3. **Check Responses**: Error messages provide specific guidance
4. **Follow Order**: Some requests depend on previous ones (login → operations)

## 🎯 Advanced Testing Scenarios

### Load Testing
- Use Postman Runner to execute workflows repeatedly
- Test concurrent driver registrations
- Simulate multiple truck status updates

### Security Testing  
- Test cross-tenant access (should fail)
- Verify JWT token expiration handling
- Test SQL injection protection in search endpoints

### Business Logic Testing
- Test Gaza workflow state transitions
- Verify driver approval requirements
- Test truck capacity constraints

## 📈 Monitoring & Analytics

### Built-in Metrics Endpoints
```
GET /api/gaza/drivers/stats     # Driver performance
GET /api/gaza/trucks/stats      # Fleet utilization
```

### Auto-Generated Test Reports
- Postman automatically tracks response times
- Success/failure rates for each endpoint
- Environment variable usage tracking

## 🎉 Success Indicators

You'll know everything is working when you can:

✅ **Login with all 5 roles successfully**
✅ **Create and approve a new driver** 
✅ **Register a truck and assign a driver**
✅ **Execute a complete Gaza mission workflow**
✅ **See real-time status updates and statistics**
✅ **Handle error scenarios gracefully**

## 📞 Need Help?

1. **Check the documentation**: `Gaza_Logistics_Workflow_Documentation.md`
2. **Review error responses**: API provides detailed error messages
3. **Check server logs**: Console output shows detailed operation logs
4. **Verify seed data**: Ensure database has demo data loaded

---

**🔗 Quick Access:**
- Collection: `Gaza_Logistics_API.postman_collection.json`
- Environment: `Gaza_Logistics_Environment.postman_environment.json` 
- Documentation: `Gaza_Logistics_Workflow_Documentation.md`
- Server: `http://localhost:8080`

**⏱️ Total Setup Time: ~5 minutes**
**🎯 Complete Testing: ~30 minutes**