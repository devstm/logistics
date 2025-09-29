'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/auth-context';
import { MainLayout } from '../../components/main-layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Plus,
  Search,
  MoreHorizontal,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Wrench,
  Edit,
  Trash2,
} from 'lucide-react';
import { Truck as TruckType, TruckStatus, UserRole, Driver } from '../../types';
import apiClient from '../../lib/api-client';
import { useRouter } from 'next/navigation';

export default function FleetPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [trucks, setTrucks] = useState<TruckType[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    plateNo: '',
    capacityTons: '',
    driverId: '',
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [trucksResponse, driversResponse] = await Promise.all([
        apiClient.getTrucks(),
        apiClient.getDrivers(),
      ]);
      
      setTrucks(trucksResponse as TruckType[]);
      setDrivers(driversResponse as Driver[]);
      setError('');
    } catch (err) {
      setError('Failed to load fleet data. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const truckData = {
        plateNo: formData.plateNo,
        capacityTons: parseFloat(formData.capacityTons),
        driverId: formData.driverId || undefined,
      };

      await apiClient.createTruck(truckData);
      await fetchData();
      setShowAddForm(false);
      setFormData({
        plateNo: '',
        capacityTons: '',
        driverId: '',
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create truck');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusUpdate = async (truckId: string, status: TruckStatus) => {
    try {
      await apiClient.updateTruckStatus(truckId, { status });
      await fetchData();
    } catch (err) {
      console.error('Failed to update truck status:', err);
      setError('Failed to update truck status');
    }
  };

  const handleDelete = async (truckId: string) => {
    if (confirm('Are you sure you want to delete this truck?')) {
      try {
        await apiClient.deleteTruck(truckId);
        await fetchData();
      } catch (err) {
        console.error('Failed to delete truck:', err);
        setError('Failed to delete truck');
      }
    }
  };

  const canManageFleet = () => {
    if (!user) return false;
    return [UserRole.DISPATCHER, UserRole.OPS_MANAGER, UserRole.MAINTENANCE].includes(user.role);
  };

  const canDelete = () => {
    return user?.role === UserRole.OPS_MANAGER;
  };

  const filteredTrucks = trucks.filter(truck => {
    const matchesSearch = truck.plateNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         truck.driver?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || truck.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: TruckStatus) => {
    switch (status) {
      case TruckStatus.IDLE:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Idle</Badge>;
      case TruckStatus.DISPATCHED:
        return <Badge variant="default"><Truck className="w-3 h-3 mr-1" />Dispatched</Badge>;
      case TruckStatus.DELIVERED:
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Delivered</Badge>;
      case TruckStatus.MAINTENANCE:
        return <Badge variant="destructive"><Wrench className="w-3 h-3 mr-1" />Maintenance</Badge>;
      case TruckStatus.OUT_OF_SERVICE:
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Out of Service</Badge>;
      default:
        return <Badge variant="outline"><MapPin className="w-3 h-3 mr-1" />{status.replace('_', ' ')}</Badge>;
    }
  };

  if (!canManageFleet()) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Access denied. Insufficient permissions to manage fleet.</p>
        </div>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fleet Management</h1>
            <p className="text-muted-foreground">
              Monitor and manage your vehicle fleet operations
            </p>
          </div>
          
          <Button onClick={() => setShowAddForm(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Truck
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Add Truck Form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Truck</CardTitle>
              <CardDescription>Register a new vehicle to the fleet</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTruck} className="space-y-4">
                {formError && (
                  <Alert variant="destructive">
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plateNo">Plate Number *</Label>
                    <Input
                      id="plateNo"
                      value={formData.plateNo}
                      onChange={(e) => setFormData(prev => ({ ...prev, plateNo: e.target.value }))}
                      placeholder="GZ-001-23"
                      required
                      disabled={formLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="capacityTons">Capacity (Tons) *</Label>
                    <Input
                      id="capacityTons"
                      type="number"
                      step="0.1"
                      value={formData.capacityTons}
                      onChange={(e) => setFormData(prev => ({ ...prev, capacityTons: e.target.value }))}
                      placeholder="25.5"
                      required
                      disabled={formLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="driverId">Assign Driver</Label>
                    <Select 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, driverId: value }))}
                      disabled={formLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select driver (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No driver assigned</SelectItem>
                        {drivers
                          .filter(driver => driver.approvalStatus === 'APPROVED')
                          .map((driver) => (
                            <SelectItem key={driver.id} value={driver.id}>
                              {driver.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddForm(false)}
                    disabled={formLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={formLoading}>
                    {formLoading && <Truck className="w-4 h-4 mr-2 animate-spin" />}
                    Add Truck
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search trucks by plate number or driver..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.values(TruckStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Trucks Table */}
        <Card>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plate Number</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mission</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrucks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <Truck className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {searchTerm || statusFilter !== 'all' ? 'No trucks match your search criteria' : 'No trucks registered yet'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTrucks.map((truck) => (
                      <TableRow key={truck.id}>
                        <TableCell className="font-medium">{truck.plateNo}</TableCell>
                        <TableCell>{truck.capacityTons} tons</TableCell>
                        <TableCell>{truck.driver?.name || 'Unassigned'}</TableCell>
                        <TableCell>{getStatusBadge(truck.status)}</TableCell>
                        <TableCell>{truck.mission?.name || 'N/A'}</TableCell>
                        <TableCell>{new Date(truck.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleStatusUpdate(truck.id, TruckStatus.DISPATCHED)}
                              >
                                <Truck className="mr-2 h-4 w-4" />
                                Dispatch
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleStatusUpdate(truck.id, TruckStatus.MAINTENANCE)}
                              >
                                <Wrench className="mr-2 h-4 w-4" />
                                Maintenance
                              </DropdownMenuItem>
                              {canDelete() && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(truck.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}