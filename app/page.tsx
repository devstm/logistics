'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/auth-context';
import { LoginForm } from '../components/auth/login-form';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('HomePage - auth state changed:', isAuthenticated); // Debug log
    if (isAuthenticated) {
      console.log('HomePage - User authenticated, redirecting to dashboard'); // Debug log
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gaza Logistics</h1>
            <p className="text-gray-600">Humanitarian aid coordination platform</p>
          </div>
          
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
