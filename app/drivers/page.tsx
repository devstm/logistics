'use client';

import { useAuth } from '../../context/auth-context';
import { MainLayout } from '../../components/main-layout';
import { DriverManagement } from '../../components/drivers/driver-management';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DriversPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

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
      <DriverManagement />
    </MainLayout>
  );
}