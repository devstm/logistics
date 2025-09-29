'use client';

import { useAuth } from '@/context/auth-context';

export default function TestAuthPage() {
  const authData = useAuth();
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Test Page</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-semibold mb-2">Raw Auth Data:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(authData, null, 2)}
        </pre>
      </div>

      <div className="bg-blue-100 p-4 rounded mb-4">
        <h2 className="font-semibold mb-2">Status:</h2>
        <p>Is Authenticated: {authData.isAuthenticated ? 'YES' : 'NO'}</p>
        <p>Is Loading: {authData.isLoading ? 'YES' : 'NO'}</p>
        <p>User: {authData.user ? authData.user.email : 'None'}</p>
      </div>

      <div className="bg-green-100 p-4 rounded mb-4">
        <h2 className="font-semibold mb-2">LocalStorage:</h2>
        <p>Token: {typeof window !== 'undefined' ? localStorage.getItem('token')?.substring(0, 20) + '...' : 'N/A'}</p>
        <p>User: {typeof window !== 'undefined' ? localStorage.getItem('user')?.substring(0, 50) + '...' : 'N/A'}</p>
      </div>

      <div className="bg-yellow-100 p-4 rounded">
        <h2 className="font-semibold mb-2">Quick Actions:</h2>
        <div className="space-x-2">
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Reload Page
          </button>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }} 
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Clear All & Reload
          </button>
          <button 
            onClick={() => window.location.href = '/'} 
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
}