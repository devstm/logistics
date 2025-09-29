// Types for Gaza Logistics System
export interface User {
  id: string;
  tenantId: string;
  email: string;
  name?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tenant?: Tenant;
}

export interface Tenant {
  id: string;
  name: string;
  configJson?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  contractorId: string;
  tenantId: string;
  name: string;
  nationalId: string;
  phone?: string;
  approvalStatus: ApprovalStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  contractor?: Contractor;
}

export interface Contractor {
  id: string;
  tenantId: string;
  name: string;
  pocName: string;
  pocPhone: string;
  createdAt: string;
  updatedAt: string;
  drivers?: Driver[];
}

export interface Truck {
  id: string;
  driverId?: string;
  tenantId: string;
  plateNo: string;
  capacityTons: number;
  status: TruckStatus;
  missionId?: string;
  createdAt: string;
  updatedAt: string;
  driver?: Driver;
  mission?: Mission;
}

export interface Mission {
  id: string;
  tenantId: string;
  name: string;
  date: string;
  border: BorderType;
  status: MissionStatus;
  stepsJson?: any;
  createdAt: string;
  createdBy: string;
  creator?: User;
  trucks?: Truck[];
}

// Enums
export enum UserRole {
  DISPATCHER = 'DISPATCHER',
  OPS_MANAGER = 'OPS_MANAGER',
  CONTRACTOR_FOCAL_POINT = 'CONTRACTOR_FOCAL_POINT',
  MAINTENANCE = 'MAINTENANCE',
  FINANCE_AUDIT = 'FINANCE_AUDIT'
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DENIED = 'DENIED'
}

export enum TruckStatus {
  IDLE = 'IDLE',
  DISPATCHED = 'DISPATCHED',
  AT_FUEL_STATION = 'AT_FUEL_STATION',
  FUELED = 'FUELED',
  AT_HP1_GATE = 'AT_HP1_GATE',
  HP1_CLEARED = 'HP1_CLEARED',
  AT_HP2_GATE = 'AT_HP2_GATE',
  HP2_CLEARED = 'HP2_CLEARED',
  AT_LOADING_POINT = 'AT_LOADING_POINT',
  LOADED = 'LOADED',
  EN_ROUTE = 'EN_ROUTE',
  DELIVERED = 'DELIVERED',
  RETURNING = 'RETURNING',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE'
}

export enum BorderType {
  KS = 'KS',
  ZIKIM = 'ZIKIM',
  OTHER = 'OTHER'
}

export enum MissionStatus {
  CREATED = 'CREATED',
  PLANNING = 'PLANNING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// API Response Types
export interface ApiResponse<T> {
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  organizationName: string;
}

export interface DriverForm {
  name: string;
  nationalId: string;
  phone?: string;
  contractorId: string;
  licenseNumber?: string;
  licenseExpiry?: string;
}

export interface TruckForm {
  driverId?: string;
  plateNo: string;
  capacityTons: number;
}

export interface ContractorForm {
  name: string;
  pocName: string;
  pocPhone: string;
}

export interface MissionForm {
  name: string;
  date: string;
  border: BorderType;
}

// Statistics Types
export interface DashboardStats {
  totalDrivers: number;
  approvedDrivers: number;
  pendingDrivers: number;
  totalTrucks: number;
  activeTrucks: number;
  idleTrucks: number;
  totalMissions: number;
  activeMissions: number;
  completedMissions: number;
}

export interface TruckStatusCount {
  status: TruckStatus;
  count: number;
  percentage: number;
}