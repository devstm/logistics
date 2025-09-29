'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import apiClient from '@/lib/api-client';

export default function ApiTestPage() {
  const { user, isAuthenticated } = useAuth();
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; data?: unknown; error?: string }>>({});
  const [loading, setLoading] = useState(false);

  const testEndpoints = async () => {
    setLoading(true);
    const results: Record<string, { success: boolean; data?: unknown; error?: string }> = {};

    try {
      // Test driver stats
      console.log('Testing driver stats endpoint...');
      const driverStats = await apiClient.getDriverStats();
      results.driverStats = { success: true, data: driverStats };
    } catch (error) {
      console.error('Driver stats failed:', error);
      results.driverStats = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    try {
      // Test truck stats
      console.log('Testing truck stats endpoint...');
      const truckStats = await apiClient.getTruckStats();
      results.truckStats = { success: true, data: truckStats };
    } catch (error) {
      console.error('Truck stats failed:', error);
      results.truckStats = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    try {
      // Test basic drivers endpoint
      console.log('Testing drivers endpoint...');
      const drivers = await apiClient.getDrivers();
      results.drivers = { success: true, data: drivers };
    } catch (error) {
      console.error('Drivers failed:', error);
      results.drivers = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    setTestResults(results);
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">API Endpoint Test</h1>
      
      <div className="bg-blue-100 p-4 rounded mb-4">
        <h2 className="font-semibold mb-2">Auth Status:</h2>
        <p>Authenticated: {isAuthenticated ? 'YES' : 'NO'}</p>
        <p>User Role: {user?.role}</p>
        <p>User Email: {user?.email}</p>
        <p>Token: {typeof window !== 'undefined' ? localStorage.getItem('token')?.substring(0, 30) + '...' : 'N/A'}</p>
      </div>

      <button 
        onClick={testEndpoints}
        disabled={!isAuthenticated || loading}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test API Endpoints'}
      </button>

      {Object.keys(testResults).length > 0 && (
        <div className="space-y-4">
          {Object.entries(testResults).map(([endpoint, result]) => (
            <div key={endpoint} className="border rounded p-4">
              <h3 className="font-semibold mb-2">{endpoint}:</h3>
              {result.success ? (
                <div className="bg-green-100 p-2 rounded">
                  <p className="text-green-800 font-semibold">✅ Success</p>
                  <pre className="text-sm mt-2 overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="bg-red-100 p-2 rounded">
                  <p className="text-red-800 font-semibold">❌ Failed</p>
                  <p className="text-red-700 mt-1">{result.error}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}