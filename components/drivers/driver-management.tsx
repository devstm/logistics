'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/auth-context';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Alert, AlertDescription } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from '../ui/use-toast';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Plus,
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Upload,
  Edit,
  Trash2,
  Loader2,
  Filter,
  RefreshCw,
  Download,
  Eye,
  AlertTriangle,
  UserCheck,
  UserX,
} from 'lucide-react';

import { Driver, ApprovalStatus, UserRole, Contractor } from '../../types';
import apiClient from '../../lib/api-client';

interface DriverStats {
  total: number;
  approved: number;
  pending: number;
  denied: number;
  byContractor?: Array<{
    contractorId: string;
    count: number;
  }>;
}

export function DriverManagement() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [stats, setStats] = useState<DriverStats>({
    total: 0,
    approved: 0,
    pending: 0,
    denied: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [contractorFilter, setContractorFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showContractorForm, setShowContractorForm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showDriverDetails, setShowDriverDetails] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nationalId: '',
    phone: '',
    contractorId: '',
    licenseNumber: '',
    licenseExpiry: '',
  });

  // Form validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Contractor creation state
  const [contractorFormData, setContractorFormData] = useState({
    name: '',
    pocName: '',
    pocPhone: '',
  });
  const [contractorFormLoading, setContractorFormLoading] = useState(false);
  const [contractorFormError, setContractorFormError] = useState('');

  // Bulk operations state
  const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Data fetching
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors

      console.log('Fetching driver data...');
      const [driversResponse, contractorsResponse, statsResponse] = await Promise.allSettled([
        apiClient.getDrivers(),
        apiClient.getContractors(),
        apiClient.getDriverStats(),
      ]);

      console.log('Fetch responses:', { driversResponse, contractorsResponse, statsResponse });

      // Handle drivers
      if (driversResponse.status === 'fulfilled') {
        const driversArray = Array.isArray(driversResponse.value)
          ? driversResponse.value
          : driversResponse.value?.data || [];
        setDrivers(driversArray as Driver[]);
      } else {
        console.error('Failed to fetch drivers:', driversResponse.reason);
        setDrivers([]);
      }

      // Handle contractors
      if (contractorsResponse.status === 'fulfilled') {
        const contractorsArray = Array.isArray(contractorsResponse.value)
          ? contractorsResponse.value
          : contractorsResponse.value?.data || [];
        setContractors(contractorsArray as Contractor[]);
      } else {
        console.warn('Contractors not available:', contractorsResponse.reason);
        setContractors([]);
      }

      // Handle stats - calculate from drivers data if API fails
      let statsData = {
        total: 0,
        approved: 0,
        pending: 0,
        denied: 0,
      };

      if (statsResponse.status === 'fulfilled' && statsResponse.value?.data) {
        statsData = statsResponse.value.data;
      } else {
        // Calculate stats from drivers data if stats API is not available
        const driversArray = driversResponse.status === 'fulfilled'
          ? (Array.isArray(driversResponse.value)
              ? driversResponse.value
              : driversResponse.value?.data || [])
          : [];

        statsData = {
          total: driversArray.length,
          approved: driversArray.filter((d: Driver) => d.approvalStatus === ApprovalStatus.APPROVED).length,
          pending: driversArray.filter((d: Driver) => d.approvalStatus === ApprovalStatus.PENDING).length,
          denied: driversArray.filter((d: Driver) => d.approvalStatus === ApprovalStatus.DENIED).length,
        };
      }

      setStats(statsData);

      setError('');
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client-side validation functions
  const validateField = useCallback((name: string, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Driver name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters long';
        if (value.trim().length > 100) return 'Name must be less than 100 characters';
        return '';

      case 'nationalId':
        if (!value.trim()) return 'National ID is required';
        if (!/^\d{9}$/.test(value.trim())) return 'National ID must be exactly 9 digits';
        return '';

      case 'phone':
        if (value.trim() && !/^(\+970|0)(5[0-9]|59)\d{7}$/.test(value.trim())) {
          return 'Enter a valid Palestinian mobile number (e.g., +970-59-123-4567)';
        }
        return '';

      case 'contractorId':
        if (!value.trim()) return 'Please select a contractor';
        return '';

      case 'licenseNumber':
        if (value.trim() && (value.trim().length < 3 || value.trim().length > 20)) {
          return 'License number must be between 3 and 20 characters';
        }
        return '';

      case 'licenseExpiry':
        if (value.trim()) {
          const date = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (isNaN(date.getTime())) return 'Invalid date format';
          if (date < today) return 'License expiry cannot be in the past';
        }
        return '';

      default:
        return '';
    }
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) errors[key] = error;
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, validateField]);

  const handleFieldChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Real-time validation for better UX
    const error = validateField(field, value);
    if (error) {
      setValidationErrors(prev => ({ ...prev, [field]: error }));
    }
  }, [validationErrors, validateField]);

  // CRUD operations
  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setValidationErrors({});

    if (!validateForm()) {
      setFormError('Please fix the validation errors above');
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
      toast({
        title: 'Success',
        description: 'Driver created successfully',
      });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('National ID must be exactly 9 digits')) {
          setValidationErrors({ nationalId: 'National ID must be exactly 9 digits' });
        } else if (err.message.includes('already exists')) {
          setValidationErrors({ nationalId: err.message });
        } else if (err.message.includes('contractor not found')) {
          setValidationErrors({ contractorId: 'Selected contractor is no longer available' });
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError('Failed to create driver');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleApproval = async (driverId: string, status: ApprovalStatus, notes?: string) => {
    try {
      await apiClient.approveDriver(driverId, { status, notes });
      await fetchData();
      toast({
        title: 'Success',
        description: `Driver ${status.toLowerCase()} successfully`,
      });
    } catch (err) {
      console.error('Failed to update driver status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update driver status',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (driverId: string) => {
    if (!confirm('Are you sure you want to delete this driver?')) return;

    try {
      await apiClient.deleteDriver(driverId);
      await fetchData();
      toast({
        title: 'Success',
        description: 'Driver deleted successfully',
      });
    } catch (err) {
      console.error('Failed to delete driver:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete driver',
        variant: 'destructive',
      });
    }
  };

  const handleEditDriver = (driver: Driver) => {
    setSelectedDriver(driver);
    setFormData({
      name: driver.name,
      nationalId: driver.nationalId,
      phone: driver.phone || '',
      contractorId: driver.contractorId,
      licenseNumber: driver.licenseNumber || '',
      licenseExpiry: driver.licenseExpiry ? new Date(driver.licenseExpiry).toISOString().split('T')[0] : '',
    });
    setValidationErrors({});
    setFormError('');
    setShowEditForm(true);
  };

  const handleUpdateDriver = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDriver) return;

    // Clear previous errors
    setValidationErrors({});
    setFormError('');

    // Validate form
    const errors: Record<string, string> = {};
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value);
      if (error) errors[key] = error;
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setFormLoading(false);
      return;
    }

    setFormLoading(true);

    try {
      const updateData = {
        ...formData,
        licenseExpiry: formData.licenseExpiry ? new Date(formData.licenseExpiry).toISOString() : null,
      };

      await apiClient.updateDriver(selectedDriver.id, updateData);
      await fetchData();
      setShowEditForm(false);
      setSelectedDriver(null);
      toast({
        title: 'Success',
        description: 'Driver updated successfully',
      });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('National ID must be exactly 9 digits')) {
          setValidationErrors({ nationalId: 'National ID must be exactly 9 digits' });
        } else if (err.message.includes('already exists')) {
          setValidationErrors({ nationalId: err.message });
        } else if (err.message.includes('contractor not found')) {
          setValidationErrors({ contractorId: 'Selected contractor is no longer available' });
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError('Failed to update driver');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleExport = () => {
    try {
      // Use selected drivers if any are selected, otherwise use filtered drivers
      const dataToExport = selectedDrivers.size > 0
        ? filteredDrivers.filter(driver => selectedDrivers.has(driver.id))
        : filteredDrivers;

      if (dataToExport.length === 0) {
        const message = selectedDrivers.size > 0
          ? 'No selected drivers to export.'
          : 'No drivers to export. Try adjusting your filters.';
        toast({
          title: 'No Data',
          description: message,
          variant: 'destructive',
        });
        return;
      }

      // Create CSV headers
      const headers = [
        'Name',
        'National ID',
        'Phone',
        'Contractor',
        'License Number',
        'License Expiry',
        'Status',
        'Notes',
        'Created At',
        'Updated At'
      ];

      // Create CSV rows
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(driver => [
          `"${driver.name}"`,
          `"${driver.nationalId}"`,
          `"${driver.phone || ''}"`,
          `"${driver.contractor?.name || ''}"`,
          `"${driver.licenseNumber || ''}"`,
          `"${driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString() : ''}"`,
          `"${driver.approvalStatus}"`,
          `"${driver.notes || ''}"`,
          `"${new Date(driver.createdAt).toLocaleString()}"`,
          `"${new Date(driver.updatedAt).toLocaleString()}"`
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);

      const filename = selectedDrivers.size > 0
        ? `drivers-selected-export-${new Date().toISOString().split('T')[0]}.csv`
        : `drivers-export-${new Date().toISOString().split('T')[0]}.csv`;

      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const exportMessage = selectedDrivers.size > 0
        ? `Exported ${dataToExport.length} selected drivers to CSV file.`
        : `Exported ${dataToExport.length} drivers to CSV file.`;

      toast({
        title: 'Export Successful',
        description: exportMessage,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: 'An error occurred while exporting drivers.',
        variant: 'destructive',
      });
    }
  };

  const parseCSV = (csv: string): any[] => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      data.push(row);
    }

    return data;
  };

  const handleImport = async () => {
    if (!importFile) {
      setImportError('Please select a file to import');
      return;
    }

    setImportLoading(true);
    setImportError('');

    try {
      const fileContent = await importFile.text();
      const parsedData = parseCSV(fileContent);

      if (parsedData.length === 0) {
        setImportError('No valid data found in the CSV file');
        setImportLoading(false);
        return;
      }

      // Validate and transform data
      const driversToImport = parsedData.map((row, index) => {
        const errors = [];

        if (!row.Name || row.Name.trim() === '') {
          errors.push(`Row ${index + 2}: Name is required`);
        }

        if (!row['National ID'] || row['National ID'].trim() === '') {
          errors.push(`Row ${index + 2}: National ID is required`);
        } else if (!/^\d{9}$/.test(row['National ID'].trim())) {
          errors.push(`Row ${index + 2}: National ID must be exactly 9 digits`);
        }

        if (errors.length > 0) {
          throw new Error(errors.join('\n'));
        }

        // Find contractor by name
        const contractor = contractors.find(c =>
          c.name.toLowerCase() === row.Contractor?.toLowerCase()
        );

        return {
          name: row.Name.trim(),
          nationalId: row['National ID'].trim(),
          phone: row.Phone?.trim() || '',
          contractorId: contractor?.id || contractors[0]?.id || '', // Default to first contractor
          licenseNumber: row['License Number']?.trim() || '',
          licenseExpiry: row['License Expiry'] ? new Date(row['License Expiry']).toISOString() : '',
          notes: row.Notes?.trim() || '',
        };
      });

      // Import drivers one by one
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const driverData of driversToImport) {
        try {
          await apiClient.createDriver(driverData);
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`${driverData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Refresh data
      await fetchData();

      // Close dialog and reset state
      setShowImportDialog(false);
      setImportFile(null);
      setImportError('');

      // Show result
      if (successCount > 0) {
        toast({
          title: 'Import Completed',
          description: `Successfully imported ${successCount} drivers. ${errorCount > 0 ? `${errorCount} failed.` : ''}`,
        });
      }

      if (errors.length > 0 && errors.length <= 5) {
        toast({
          title: 'Import Errors',
          description: errors.slice(0, 3).join('\n'),
          variant: 'destructive',
        });
      }

    } catch (error) {
      console.error('Import failed:', error);
      setImportError(error instanceof Error ? error.message : 'Failed to import drivers');
    } finally {
      setImportLoading(false);
    }
  };

  const handleAddContractor = async (e: React.FormEvent) => {
    e.preventDefault();
    setContractorFormLoading(true);
    setContractorFormError('');

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
      await fetchData();
      setShowContractorForm(false);
      setContractorFormData({
        name: '',
        pocName: '',
        pocPhone: '',
      });
      toast({
        title: 'Success',
        description: 'Contractor created successfully',
      });
    } catch (err) {
      setContractorFormError(err instanceof Error ? err.message : 'Failed to create contractor');
    } finally {
      setContractorFormLoading(false);
    }
  };

  // Bulk operations
  const handleBulkApprove = async () => {
    if (selectedDrivers.size === 0) return;

    setBulkLoading(true);
    try {
      await apiClient.approveDriver(Array.from(selectedDrivers).join(','), {
        status: ApprovalStatus.APPROVED
      });
      await fetchData();
      setSelectedDrivers(new Set());
      toast({
        title: 'Success',
        description: `${selectedDrivers.size} drivers approved successfully`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to approve drivers',
        variant: 'destructive',
      });
    } finally {
      setBulkLoading(false);
    }
  };

  // Permission checks
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

  // Filtered data
  const filteredDrivers = useMemo(() => {
    return drivers.filter(driver => {
      const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           driver.nationalId.includes(searchTerm) ||
                           driver.phone?.includes(searchTerm);

      const matchesStatus = statusFilter === 'all' || driver.approvalStatus === statusFilter;
      const matchesContractor = contractorFilter === 'all' || driver.contractorId === contractorFilter;

      return matchesSearch && matchesStatus && matchesContractor;
    });
  }, [drivers, searchTerm, statusFilter, contractorFilter]);

  // Status badge component
  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case ApprovalStatus.APPROVED:
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case ApprovalStatus.DENIED:
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Denied
          </Badge>
        );
      case ApprovalStatus.PENDING:
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Stats cards
  const statsCards = [
    {
      title: 'Total Drivers',
      value: stats.total,
      icon: Users,
      color: 'bg-blue-500',
      description: 'All registered drivers',
    },
    {
      title: 'Approved',
      value: stats.approved,
      icon: UserCheck,
      color: 'bg-green-500',
      description: 'Ready for missions',
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'bg-yellow-500',
      description: 'Awaiting approval',
    },
    {
      title: 'Denied',
      value: stats.denied,
      icon: UserX,
      color: 'bg-red-500',
      description: 'Not approved',
    },
  ];

  if (!canManageDrivers()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Access denied. Insufficient permissions to manage drivers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Driver Management</h1>
          <p className="text-muted-foreground">
            Manage driver registrations, approvals, and assignments
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => setShowAddForm(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Driver
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${stat.color} text-white mr-4`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm font-medium">{stat.title}</p>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>


      <div className="space-y-4">
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
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value={ApprovalStatus.PENDING}>Pending</SelectItem>
                    <SelectItem value={ApprovalStatus.APPROVED}>Approved</SelectItem>
                    <SelectItem value={ApprovalStatus.DENIED}>Denied</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={contractorFilter} onValueChange={setContractorFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Contractor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Contractors</SelectItem>
                    {contractors.map((contractor) => (
                      <SelectItem key={contractor.id} value={contractor.id}>
                        {contractor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bulk Actions */}
              {selectedDrivers.size > 0 && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {selectedDrivers.size} driver(s) selected
                    </span>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDrivers(new Set())}
                      >
                        Clear Selection
                      </Button>
                      {canApprove() && (
                        <Button
                          size="sm"
                          onClick={handleBulkApprove}
                          disabled={bulkLoading}
                        >
                          {bulkLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Approve Selected
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Drivers Table */}
          <Card>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading drivers...</p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedDrivers.size === filteredDrivers.length && filteredDrivers.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDrivers(new Set(filteredDrivers.map(d => d.id)));
                            } else {
                              setSelectedDrivers(new Set());
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>National ID</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Contractor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>License</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDrivers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-2">
                            <Users className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">
                              {searchTerm || statusFilter !== 'all' || contractorFilter !== 'all'
                                ? 'No drivers match your search criteria'
                                : 'No drivers registered yet'}
                            </p>
                            {!searchTerm && statusFilter === 'all' && contractorFilter === 'all' && (
                              <Button onClick={() => setShowAddForm(true)} variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Driver
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDrivers.map((driver) => (
                        <TableRow key={driver.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedDrivers.has(driver.id)}
                              onChange={(e) => {
                                const newSelected = new Set(selectedDrivers);
                                if (e.target.checked) {
                                  newSelected.add(driver.id);
                                } else {
                                  newSelected.delete(driver.id);
                                }
                                setSelectedDrivers(newSelected);
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{driver.name}</TableCell>
                          <TableCell>{driver.nationalId}</TableCell>
                          <TableCell>{driver.phone || 'N/A'}</TableCell>
                          <TableCell>{driver.contractor?.name || 'N/A'}</TableCell>
                          <TableCell>{getStatusBadge(driver.approvalStatus)}</TableCell>
                          <TableCell>
                            {driver.licenseNumber ? (
                              <div className="text-sm">
                                <div>{driver.licenseNumber}</div>
                                {driver.licenseExpiry && (
                                  <div className="text-muted-foreground">
                                    Exp: {new Date(driver.licenseExpiry).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
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
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDriver(driver);
                                    setShowDriverDetails(true);
                                  }}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditDriver(driver)}>
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

      {/* Add Driver Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Driver</DialogTitle>
            <DialogDescription>
              Register a new driver to the system
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddDriver} className="space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="Omar Hassan Khalil"
                  required
                  disabled={formLoading}
                  className={validationErrors.name ? 'border-red-500 focus:border-red-500' : ''}
                />
                {validationErrors.name && (
                  <p className="text-sm text-red-600">{validationErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationalId">National ID *</Label>
                <Input
                  id="nationalId"
                  value={formData.nationalId}
                  onChange={(e) => handleFieldChange('nationalId', e.target.value)}
                  placeholder="123456789"
                  required
                  disabled={formLoading}
                  className={validationErrors.nationalId ? 'border-red-500 focus:border-red-500' : ''}
                  maxLength={9}
                />
                {validationErrors.nationalId && (
                  <p className="text-sm text-red-600">{validationErrors.nationalId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  placeholder="+970-59-123-4567"
                  disabled={formLoading}
                  className={validationErrors.phone ? 'border-red-500 focus:border-red-500' : ''}
                />
                {validationErrors.phone && (
                  <p className="text-sm text-red-600">{validationErrors.phone}</p>
                )}
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
                  onValueChange={(value) => handleFieldChange('contractorId', value)}
                  disabled={formLoading}
                >
                  <SelectTrigger className={validationErrors.contractorId ? 'border-red-500 focus:border-red-500' : ''}>
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
                {validationErrors.contractorId && (
                  <p className="text-sm text-red-600">{validationErrors.contractorId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License Number</Label>
                <Input
                  id="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={(e) => handleFieldChange('licenseNumber', e.target.value)}
                  placeholder="GZ-DRV-001"
                  disabled={formLoading}
                  className={validationErrors.licenseNumber ? 'border-red-500 focus:border-red-500' : ''}
                  maxLength={20}
                />
                {validationErrors.licenseNumber && (
                  <p className="text-sm text-red-600">{validationErrors.licenseNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseExpiry">License Expiry</Label>
                <Input
                  id="licenseExpiry"
                  type="date"
                  value={formData.licenseExpiry}
                  onChange={(e) => handleFieldChange('licenseExpiry', e.target.value)}
                  disabled={formLoading}
                  className={validationErrors.licenseExpiry ? 'border-red-500 focus:border-red-500' : ''}
                  min={new Date().toISOString().split('T')[0]}
                />
                {validationErrors.licenseExpiry && (
                  <p className="text-sm text-red-600">{validationErrors.licenseExpiry}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setValidationErrors({});
                  setFormError('');
                }}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formLoading || Object.keys(validationErrors).length > 0}
              >
                {formLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Driver
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Contractor Dialog */}
      <Dialog open={showContractorForm} onOpenChange={setShowContractorForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Contractor</DialogTitle>
            <DialogDescription>
              Create a new contractor to assign drivers to
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddContractor} className="space-y-4">
            {contractorFormError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
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

            <DialogFooter>
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
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Driver Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Driver</DialogTitle>
            <DialogDescription>
              Update driver information for {selectedDriver?.name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateDriver} className="space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Full Name *</Label>
                <Input
                  id="editName"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Ahmad Hassan"
                  disabled={formLoading}
                />
                {validationErrors.name && (
                  <p className="text-sm text-red-600">{validationErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="editNationalId">National ID *</Label>
                <Input
                  id="editNationalId"
                  value={formData.nationalId}
                  onChange={(e) => setFormData(prev => ({ ...prev, nationalId: e.target.value }))}
                  placeholder="e.g., 123456789"
                  disabled={formLoading}
                />
                {validationErrors.nationalId && (
                  <p className="text-sm text-red-600">{validationErrors.nationalId}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editPhone">Phone Number</Label>
                <Input
                  id="editPhone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g., +970-59-123-4567"
                  disabled={formLoading}
                />
                {validationErrors.phone && (
                  <p className="text-sm text-red-600">{validationErrors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="editContractorId">Contractor *</Label>
                <Select
                  value={formData.contractorId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, contractorId: value }))}
                  disabled={formLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a contractor" />
                  </SelectTrigger>
                  <SelectContent>
                    {contractors.map((contractor) => (
                      <SelectItem key={contractor.id} value={contractor.id}>
                        {contractor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.contractorId && (
                  <p className="text-sm text-red-600">{validationErrors.contractorId}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editLicenseNumber">License Number</Label>
                <Input
                  id="editLicenseNumber"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                  placeholder="e.g., 12345"
                  disabled={formLoading}
                />
                {validationErrors.licenseNumber && (
                  <p className="text-sm text-red-600">{validationErrors.licenseNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="editLicenseExpiry">License Expiry Date</Label>
                <Input
                  id="editLicenseExpiry"
                  type="date"
                  value={formData.licenseExpiry}
                  onChange={(e) => setFormData(prev => ({ ...prev, licenseExpiry: e.target.value }))}
                  disabled={formLoading}
                />
                {validationErrors.licenseExpiry && (
                  <p className="text-sm text-red-600">{validationErrors.licenseExpiry}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditForm(false);
                  setSelectedDriver(null);
                  setFormError('');
                  setValidationErrors({});
                }}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Driver
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Drivers</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import drivers. The file should include columns: Name, National ID, Phone, Contractor, License Number, License Expiry, Notes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {importError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="importFile">Select CSV File</Label>
              <Input
                id="importFile"
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setImportFile(file || null);
                  if (importError) setImportError('');
                }}
                disabled={importLoading}
              />
              <p className="text-sm text-muted-foreground">
                Please ensure your CSV file has the following columns: Name, National ID, Phone, Contractor, License Number, License Expiry, Notes
              </p>
            </div>

            {importFile && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">Selected file:</p>
                <p className="text-sm text-muted-foreground">{importFile.name}</p>
                <p className="text-sm text-muted-foreground">Size: {(importFile.size / 1024).toFixed(1)} KB</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImportDialog(false);
                setImportFile(null);
                setImportError('');
              }}
              disabled={importLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importFile || importLoading}
            >
              {importLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Import Drivers
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Driver Details Dialog */}
      <Dialog open={showDriverDetails} onOpenChange={setShowDriverDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Driver Details</DialogTitle>
            <DialogDescription>
              Detailed information about {selectedDriver?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedDriver && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                  <p className="text-sm">{selectedDriver.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">National ID</Label>
                  <p className="text-sm">{selectedDriver.nationalId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                  <p className="text-sm">{selectedDriver.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedDriver.approvalStatus)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Contractor</Label>
                  <p className="text-sm">{selectedDriver.contractor?.name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">License Number</Label>
                  <p className="text-sm">{selectedDriver.licenseNumber || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Registration Date</Label>
                  <p className="text-sm">{new Date(selectedDriver.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                  <p className="text-sm">{new Date(selectedDriver.updatedAt).toLocaleString()}</p>
                </div>
              </div>

              {selectedDriver.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">{selectedDriver.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDriverDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}