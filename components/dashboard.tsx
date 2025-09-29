'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Truck, Users, MapPin, Activity, CheckCircle, Clock, AlertTriangle, Wrench } from 'lucide-react';
import apiClient from '../lib/api-client';
import { DashboardStats, TruckStatusCount, TruckStatus, UserRole } from '../types';

interface DashboardProps {
  className?: string;
}

export function Dashboard({ className }: DashboardProps) {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [truckStatusCounts, setTruckStatusCounts] = useState<TruckStatusCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [driverStatsResponse, truckStatsResponse] = await Promise.all([
          apiClient.getDriverStats(),
          apiClient.getTruckStats(),
        ]);

        const driverStats = driverStatsResponse as {
          total?: number;
          approved?: number;
          pending?: number;
        };

        const truckStats = truckStatsResponse as {
          total?: number;
          active?: number;
          idle?: number;
          byStatus?: TruckStatusCount[];
        };

        // Transform the stats data
        const dashboardStats: DashboardStats = {
          totalDrivers: driverStats.total || 0,
          approvedDrivers: driverStats.approved || 0,
          pendingDrivers: driverStats.pending || 0,
          totalTrucks: truckStats.total || 0,
          activeTrucks: truckStats.active || 0,
          idleTrucks: truckStats.idle || 0,
          totalMissions: 0, // Will be populated when missions API is available
          activeMissions: 0,
          completedMissions: 0,
        };

        setStats(dashboardStats);
        setTruckStatusCounts(truckStats.byStatus || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  const getStatusBadgeVariant = (status: TruckStatus) => {
    switch (status) {
      case TruckStatus.IDLE:
        return 'secondary';
      case TruckStatus.DISPATCHED:
      case TruckStatus.EN_ROUTE:
        return 'default';
      case TruckStatus.DELIVERED:
      case TruckStatus.HP2_CLEARED:
        return 'default';
      case TruckStatus.MAINTENANCE:
      case TruckStatus.OUT_OF_SERVICE:
        return 'destructive';
      case TruckStatus.AT_FUEL_STATION:
      case TruckStatus.FUELED:
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: TruckStatus) => {
    switch (status) {
      case TruckStatus.IDLE:
        return <Clock className="h-4 w-4" />;
      case TruckStatus.DELIVERED:
        return <CheckCircle className="h-4 w-4" />;
      case TruckStatus.EN_ROUTE:
      case TruckStatus.DISPATCHED:
        return <Activity className="h-4 w-4" />;
      case TruckStatus.MAINTENANCE:
        return <Wrench className="h-4 w-4" />;
      case TruckStatus.OUT_OF_SERVICE:
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const canViewStatistics = () => {
    if (!user) return false;
    return [
      UserRole.DISPATCHER,
      UserRole.OPS_MANAGER,
      UserRole.CONTRACTOR_FOCAL_POINT,
      UserRole.MAINTENANCE,
      UserRole.FINANCE_AUDIT,
    ].includes(user.role);
  };

  if (!isAuthenticated || !canViewStatistics()) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. Insufficient permissions.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Welcome Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Gaza Logistics Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name || user?.email}. Here&apos;s your operational overview.
        </p>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>Organization:</span>
          <Badge variant="outline">{user?.tenant?.name}</Badge>
          <span>Role:</span>
          <Badge variant="secondary">{user?.role.replace('_', ' ')}</Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDrivers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.approvedDrivers || 0} approved, {stats?.pendingDrivers || 0} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fleet Status</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTrucks || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeTrucks || 0} active, {stats?.idleTrucks || 0} idle
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Missions</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeMissions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.completedMissions || 0} completed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Truck Status Breakdown */}
      {truckStatusCounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fleet Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {truckStatusCounts.map((statusCount) => (
                <div key={statusCount.status} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(statusCount.status)}
                    <span className="font-medium">{statusCount.status.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusBadgeVariant(statusCount.status)}>
                      {statusCount.count}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ({statusCount.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <Users className="h-6 w-6 mb-2 text-primary" />
              <p className="font-medium">Manage Drivers</p>
              <p className="text-sm text-muted-foreground">Add, approve, or update driver records</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <Truck className="h-6 w-6 mb-2 text-primary" />
              <p className="font-medium">Fleet Management</p>
              <p className="text-sm text-muted-foreground">Monitor and update truck status</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <MapPin className="h-6 w-6 mb-2 text-primary" />
              <p className="font-medium">Create Mission</p>
              <p className="text-sm text-muted-foreground">Plan and dispatch new logistics missions</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <Activity className="h-6 w-6 mb-2 text-primary" />
              <p className="font-medium">Live Tracking</p>
              <p className="text-sm text-muted-foreground">Real-time fleet and mission monitoring</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}