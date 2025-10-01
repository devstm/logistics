'use client';

import { useAuth } from '../../context/auth-context';
import { MainLayout } from '../../components/main-layout';
import { DriverDashboard } from '../../components/driver/driver-dashboard';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserRole } from '../../types';

export default function DriverDashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
    if (!isLoading && isAuthenticated && user?.role !== UserRole.DRIVER) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== UserRole.DRIVER) {
    return null;
  }

  return (
    <MainLayout>
      <DriverDashboard />
    </MainLayout>
  );
}