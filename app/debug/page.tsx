'use client';

import { useAuth } from '@/context/auth-context';
import { getStoredToken, isValidToken } from '@/lib/auth-utils';
import { useEffect, useState } from 'react';

type ClientState = {
  token: string | null;
  tokenValid: boolean;
  localStorageRaw: string | null;
  timestamp?: string;
};

export default function DebugPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [clientState, setClientState] = useState<ClientState | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    setClientState({
      token: token ? `${token.substring(0, 20)}...` : null,
      tokenValid: token ? isValidToken(token) : false,
      localStorageRaw: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
    });
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Auth Context State:</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded">
            {JSON.stringify({
              isAuthenticated,
              isLoading,
              user: user ? { id: user.id, email: user.email, role: user.role } : null
            }, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Client Side State:</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded">
            {JSON.stringify(clientState, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Actions:</h2>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          >
            Reload Page
          </button>
          <button 
            onClick={() => localStorage.clear()} 
            className="bg-red-500 text-white px-4 py-2 rounded mr-2"
          >
            Clear localStorage
          </button>
          <button 
            onClick={() => {
              const token = getStoredToken();
              setClientState({
                token: token ? `${token.substring(0, 20)}...` : null,
                tokenValid: token ? isValidToken(token) : false,
                localStorageRaw: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
                timestamp: new Date().toISOString()
              });
            }} 
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Refresh Client State
          </button>
        </div>
      </div>
    </div>
  );
}