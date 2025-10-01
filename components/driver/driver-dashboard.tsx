'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Truck as TruckIcon,
  MapPin,
  Fuel,
  Package,
  CheckCircle,
  Clock,
  AlertTriangle,
  Navigation,
  FileText,
  Camera
} from 'lucide-react';
import apiClient from '../../lib/api-client';
import { TruckStatus } from '../../types';

interface DriverAssignment {
  truck: {
    id: string;
    plateNo: string;
    capacityTons: number;
    status: TruckStatus;
  };
  mission?: {
    id: string;
    name: string;
    date: string;
    border: string;
  };
  currentCheckpoint?: string;
  nextAction?: string;
  fuelEvents?: Array<{
    id: string;
    liters: number;
    stationName: string;
    timestamp: string;
  }>;
  lastUpdate?: string;
}

export function DriverDashboard() {
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<DriverAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchAssignment();
    // Poll every 30 seconds for updates
    const interval = setInterval(fetchAssignment, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/driver/assignment');
      setAssignment(response.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch assignment:', err);
      setError('Failed to load assignment data');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: TruckStatus) => {
    if (!assignment?.truck) return;

    try {
      setUpdating(true);
      await apiClient.post(`/api/driver/truck/${assignment.truck.id}/status`, {
        status: newStatus
      });
      await fetchAssignment();
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const reportFuel = async (liters: number, stationName: string) => {
    if (!assignment?.truck) return;

    try {
      setUpdating(true);
      await apiClient.post(`/api/driver/truck/${assignment.truck.id}/fuel`, {
        liters,
        stationName,
        missionId: assignment.mission?.id
      });
      await fetchAssignment();
    } catch (err) {
      console.error('Failed to report fuel:', err);
      setError('Failed to report fuel');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: TruckStatus) => {
    const statusConfig: Record<TruckStatus, { color: string; label: string; icon: any }> = {
      [TruckStatus.IDLE]: { color: 'bg-gray-500', label: 'Idle', icon: Clock },
      [TruckStatus.DISPATCHED]: { color: 'bg-blue-500', label: 'Dispatched', icon: Navigation },
      [TruckStatus.FUELING_REQUESTED]: { color: 'bg-yellow-500', label: 'At Fuel Station', icon: Fuel },
      [TruckStatus.FUELED]: { color: 'bg-green-500', label: 'Fueled', icon: CheckCircle },
      [TruckStatus.HP1_WAIT]: { color: 'bg-orange-500', label: 'At HP1', icon: MapPin },
      [TruckStatus.HP2_WAIT]: { color: 'bg-orange-500', label: 'At HP2', icon: MapPin },
      [TruckStatus.LOADING_PREP]: { color: 'bg-purple-500', label: 'At Loading', icon: Package },
      [TruckStatus.LOADED]: { color: 'bg-green-600', label: 'Loaded', icon: Package },
      [TruckStatus.EXITING]: { color: 'bg-blue-600', label: 'En Route', icon: Navigation },
      [TruckStatus.DELIVERED]: { color: 'bg-green-700', label: 'Delivered', icon: CheckCircle },
      [TruckStatus.RECONCILED]: { color: 'bg-green-800', label: 'Reconciled', icon: CheckCircle },
      [TruckStatus.MAINTENANCE]: { color: 'bg-red-500', label: 'Maintenance', icon: AlertTriangle },
      [TruckStatus.LOOTED]: { color: 'bg-red-700', label: 'Looted', icon: AlertTriangle },
    };

    const config = statusConfig[status] || statusConfig[TruckStatus.IDLE];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getNextActions = (status: TruckStatus) => {
    const actions: Record<TruckStatus, Array<{ label: string; status: TruckStatus; variant?: 'default' | 'outline' }>> = {
      [TruckStatus.IDLE]: [],
      [TruckStatus.DISPATCHED]: [
        { label: 'Arrived at Fuel Station', status: TruckStatus.FUELING_REQUESTED },
        { label: 'Arrived at HP1', status: TruckStatus.HP1_WAIT },
      ],
      [TruckStatus.FUELING_REQUESTED]: [
        { label: 'Fueling Complete', status: TruckStatus.FUELED },
      ],
      [TruckStatus.FUELED]: [
        { label: 'Arrived at HP1', status: TruckStatus.HP1_WAIT },
      ],
      [TruckStatus.HP1_WAIT]: [
        { label: 'Proceed to HP2', status: TruckStatus.HP2_WAIT },
        { label: 'Proceed to Loading', status: TruckStatus.LOADING_PREP },
      ],
      [TruckStatus.HP2_WAIT]: [
        { label: 'Proceed to Loading', status: TruckStatus.LOADING_PREP },
      ],
      [TruckStatus.LOADING_PREP]: [
        { label: 'Loading Complete', status: TruckStatus.LOADED },
      ],
      [TruckStatus.LOADED]: [
        { label: 'Start Delivery Route', status: TruckStatus.EXITING },
      ],
      [TruckStatus.EXITING]: [
        { label: 'Delivery Complete', status: TruckStatus.DELIVERED },
      ],
      [TruckStatus.DELIVERED]: [],
      [TruckStatus.RECONCILED]: [],
      [TruckStatus.MAINTENANCE]: [],
      [TruckStatus.LOOTED]: [],
    };

    return actions[status] || [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your assignment...</p>
        </div>
      </div>
    );
  }

  if (!assignment || !assignment.truck) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="flex flex-col space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Driver Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {user?.name}</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <TruckIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No Active Assignment</p>
              <p className="text-muted-foreground">
                You don't have any active truck assignment at the moment.
                Please contact your dispatcher for assignment.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const nextActions = getNextActions(assignment.truck.status);

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Driver Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {user?.name}</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TruckIcon className="h-5 w-5 mr-2" />
            Current Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Truck Plate</p>
              <p className="text-2xl font-bold">{assignment.truck.plateNo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Capacity</p>
              <p className="text-2xl font-bold">{assignment.truck.capacityTons} tons</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Current Status</p>
            {getStatusBadge(assignment.truck.status)}
          </div>

          {assignment.mission && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-2">Mission Details</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Mission:</span>
                  <span className="text-sm font-medium">{assignment.mission.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Border:</span>
                  <span className="text-sm font-medium">{assignment.mission.border}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Date:</span>
                  <span className="text-sm font-medium">
                    {new Date(assignment.mission.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Actions */}
      {nextActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Next Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {nextActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={() => updateStatus(action.status)}
                  disabled={updating}
                  className="w-full"
                  variant={action.variant || 'default'}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fuel Events */}
      {assignment.fuelEvents && assignment.fuelEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Fuel className="h-5 w-5 mr-2" />
              Fuel History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assignment.fuelEvents.map((event) => (
                <div key={event.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{event.stationName}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{event.liters}L</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Important Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start">
              <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
              <span>Update your status at each checkpoint</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
              <span>Keep fuel receipts and upload them if requested</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
              <span>Report any issues or damages immediately</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
              <span>Follow all security protocols at checkpoints</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}