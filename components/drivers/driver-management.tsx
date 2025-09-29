'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/auth-context';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Alert, AlertDescription } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Plus,
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Upload,
  FileText,
  Edit,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Driver, ApprovalStatus, UserRole, Contractor } from '../../types';
import apiClient from '../../lib/api-client';

export function DriverManagement() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nationalId: '',
    phone: '',
    contractorId: '',
    licenseNumber: '',
    licenseExpiry: '',
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Contractor creation state
  const [showContractorForm, setShowContractorForm] = useState(false);
  const [contractorFormData, setContractorFormData] = useState({
    name: '',
    pocName: '',
    pocPhone: '',
  });
  const [contractorFormLoading, setContractorFormLoading] = useState(false);
  const [contractorFormError, setContractorFormError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch drivers (required)
      try {
        const driversResponse = await apiClient.getDrivers();
        const driversArray = Array.isArray(driversResponse) ? driversResponse :
                            ((driversResponse as { data?: unknown })?.data && Array.isArray((driversResponse as { data?: unknown }).data)) ? (driversResponse as { data: Driver[] }).data : [];
        console.log('Processed drivers array:', driversArray);
        setDrivers(driversArray as Driver[]);
      } catch (err) {
        console.error('Failed to fetch drivers:', err);
        setDrivers([]);
      }

      // Fetch contractors (optional - may not be implemented yet)
      try {
        const contractorsResponse = await apiClient.getContractors();
        const contractorsArray = Array.isArray(contractorsResponse) ? contractorsResponse :
                                ((contractorsResponse as { data?: unknown })?.data && Array.isArray((contractorsResponse as { data?: unknown }).data)) ? (contractorsResponse as { data: Contractor[] }).data : [];
        console.log('Processed contractors array:', contractorsArray);
        setContractors(contractorsArray as Contractor[]);
      } catch (err) {
        console.warn('Contractors endpoint not available (this is normal if not implemented yet):', err);
        setContractors([]);
      }

      setError('');
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    // Validation
    if (!formData.contractorId) {
      setFormError('Please select a contractor');
      setFormLoading(false);
      return;
    }

    if (!formData.name.trim()) {
      setFormError('Driver name is required');
      setFormLoading(false);
      return;
    }

    if (!formData.nationalId.trim()) {
      setFormError('National ID is required');
      setFormLoading(false);
      return;
    }

    try {
      await apiClient.createDriver(formData);
      await fetchData();
      setShowAddForm(false);
      setFormData({
        name: '',
        nationalId: '',
        phone: '',
        contractorId: '',
        licenseNumber: '',
        licenseExpiry: '',
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create driver');
    } finally {
      setFormLoading(false);
    }
  };

  const handleApproval = async (driverId: string, status: ApprovalStatus, notes?: string) => {
    try {
      await apiClient.approveDriver(driverId, { status, notes });
      await fetchData();
    } catch (err) {
      console.error('Failed to update driver status:', err);
      setError('Failed to update driver status');
    }
  };

  const handleDelete = async (driverId: string) => {
    if (confirm('Are you sure you want to delete this driver?')) {
      try {
        await apiClient.deleteDriver(driverId);
        await fetchData();
      } catch (err) {
        console.error('Failed to delete driver:', err);
        setError('Failed to delete driver');
      }
    }
  };

  const handleAddContractor = async (e: React.FormEvent) => {
    e.preventDefault();
    setContractorFormLoading(true);
    setContractorFormError('');

    // Validation
    if (!contractorFormData.name.trim()) {
      setContractorFormError('Contractor name is required');
      setContractorFormLoading(false);
      return;
    }

    if (!contractorFormData.pocName.trim()) {
      setContractorFormError('Point of contact name is required');
      setContractorFormLoading(false);
      return;
    }

    if (!contractorFormData.pocPhone.trim()) {
      setContractorFormError('Point of contact phone is required');
      setContractorFormLoading(false);
      return;
    }

    try {
      await apiClient.createContractor(contractorFormData);
      await fetchData(); // Refresh contractors list
      setShowContractorForm(false);
      setContractorFormData({
        name: '',
        pocName: '',
        pocPhone: '',
      });
    } catch (err) {
      setContractorFormError(err instanceof Error ? err.message : 'Failed to create contractor');
    } finally {
      setContractorFormLoading(false);
    }
  };

  const canManageDrivers = () => {
    if (!user) return false;
    return [UserRole.DISPATCHER, UserRole.OPS_MANAGER, UserRole.CONTRACTOR_FOCAL_POINT].includes(user.role);
  };

  const canApprove = () => {
    return user?.role === UserRole.OPS_MANAGER;
  };

  const canDelete = () => {
    return user?.role === UserRole.OPS_MANAGER;
  };

  const filteredDrivers = (Array.isArray(drivers) ? drivers : []).filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.nationalId.includes(searchTerm) ||
                         driver.phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || driver.approvalStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case ApprovalStatus.APPROVED:
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case ApprovalStatus.DENIED:
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Denied</Badge>;
      case ApprovalStatus.PENDING:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!canManageDrivers()) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. Insufficient permissions to manage drivers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Driver Management</h1>
          <p className="text-muted-foreground">
            Manage driver registrations, approvals, and assignments
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
          <Button onClick={() => setShowAddForm(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Driver
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Add Driver Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Driver</CardTitle>
            <CardDescription>Register a new driver to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddDriver} className="space-y-4">
              {formError && (
                <Alert variant="destructive">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Omar Hassan Khalil"
                    required
                    disabled={formLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nationalId">National ID *</Label>
                  <Input
                    id="nationalId"
                    value={formData.nationalId}
                    onChange={(e) => setFormData(prev => ({ ...prev, nationalId: e.target.value }))}
                    placeholder="123456789"
                    required
                    disabled={formLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+970-59-123-4567"
                    disabled={formLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="contractorId">Contractor *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowContractorForm(true)}
                      disabled={formLoading}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Contractor
                    </Button>
                  </div>
                  <Select
                    value={formData.contractorId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, contractorId: value }))}
                    disabled={formLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={contractors.length === 0 ? "No contractors available" : "Select contractor"} />
                    </SelectTrigger>
                    <SelectContent>
                      {contractors.length === 0 ? (
                        <SelectItem value="" disabled>
                          No contractors found. Please create a contractor first.
                        </SelectItem>
                      ) : (
                        contractors.map((contractor) => (
                          <SelectItem key={contractor.id} value={contractor.id}>
                            {contractor.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {contractors.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      You need to create at least one contractor before adding drivers.
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                    placeholder="GZ-DRV-001"
                    disabled={formLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="licenseExpiry">License Expiry</Label>
                  <Input
                    id="licenseExpiry"
                    type="date"
                    value={formData.licenseExpiry}
                    onChange={(e) => setFormData(prev => ({ ...prev, licenseExpiry: e.target.value }))}
                    disabled={formLoading}
                  />
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
                  {formLoading && <Users className="w-4 h-4 mr-2 animate-spin" />}
                  Add Driver
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Contractor Creation Form */}
      {showContractorForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Contractor</CardTitle>
            <CardDescription>
              Create a new contractor to assign drivers to
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddContractor} className="space-y-4">
              {contractorFormError && (
                <Alert variant="destructive">
                  <AlertDescription>{contractorFormError}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contractorName">Contractor Name *</Label>
                  <Input
                    id="contractorName"
                    value={contractorFormData.name}
                    onChange={(e) => setContractorFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Gaza Construction Co."
                    disabled={contractorFormLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pocName">Point of Contact Name *</Label>
                  <Input
                    id="pocName"
                    value={contractorFormData.pocName}
                    onChange={(e) => setContractorFormData(prev => ({ ...prev, pocName: e.target.value }))}
                    placeholder="e.g., Ahmad Hassan"
                    disabled={contractorFormLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pocPhone">Point of Contact Phone *</Label>
                <Input
                  id="pocPhone"
                  value={contractorFormData.pocPhone}
                  onChange={(e) => setContractorFormData(prev => ({ ...prev, pocPhone: e.target.value }))}
                  placeholder="e.g., +970-59-123-4567"
                  disabled={contractorFormLoading}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowContractorForm(false);
                    setContractorFormError('');
                    setContractorFormData({ name: '', pocName: '', pocPhone: '' });
                  }}
                  disabled={contractorFormLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={contractorFormLoading}>
                  {contractorFormLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Contractor
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
                  placeholder="Search drivers by name, ID, or phone..."
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
                <SelectItem value={ApprovalStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={ApprovalStatus.APPROVED}>Approved</SelectItem>
                <SelectItem value={ApprovalStatus.DENIED}>Denied</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Drivers Table */}
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
                  <TableHead>Name</TableHead>
                  <TableHead>National ID</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Contractor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Users className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {searchTerm || statusFilter !== 'all' ? 'No drivers match your search criteria' : 'No drivers registered yet'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDrivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">{driver.name}</TableCell>
                      <TableCell>{driver.nationalId}</TableCell>
                      <TableCell>{driver.phone || 'N/A'}</TableCell>
                      <TableCell>{driver.contractor?.name || 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(driver.approvalStatus)}</TableCell>
                      <TableCell>{new Date(driver.createdAt).toLocaleDateString()}</TableCell>
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
                              <FileText className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {canApprove() && driver.approvalStatus === ApprovalStatus.PENDING && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleApproval(driver.id, ApprovalStatus.APPROVED)}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleApproval(driver.id, ApprovalStatus.DENIED)}
                                  className="text-red-600"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Deny
                                </DropdownMenuItem>
                              </>
                            )}
                            {canDelete() && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(driver.id)}
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
  );
}