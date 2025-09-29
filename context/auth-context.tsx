'use client';

import { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react';
import { User, UserRole } from '../types';
import apiClient from '../lib/api-client';
import { getStoredToken, setStoredToken, removeStoredToken, isValidToken } from '../lib/auth-utils';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN'; payload: { user: User; token: string } }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  console.log('🔄 Auth reducer received action:', action.type); // Debug log
  console.log('🔄 Current state before action:', state); // Debug log
  
  switch (action.type) {
    case 'SET_LOADING':
      const loadingState = { ...state, isLoading: action.payload };
      console.log('⏳ SET_LOADING - new state:', loadingState); // Debug log
      return loadingState;
    case 'LOGIN':
      const newStateLogin = {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
      };
      console.log('🎉 LOGIN action - new state:', newStateLogin); // Debug log
      console.log('🎉 LOGIN - isAuthenticated should now be:', newStateLogin.isAuthenticated); // Debug log
      return newStateLogin;
    case 'SET_USER':
      const newStateSetUser = {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
      };
      console.log('SET_USER action - new state:', newStateSetUser); // Debug log
      return newStateSetUser;
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<{
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: {
    email: string;
    name: string;
    password: string;
    role: string;
    organizationName: string;
  }) => Promise<void>;
} | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (!mounted) return; // Don't run on server-side
      
      console.log('Initializing auth...'); // Debug log
      const token = getStoredToken();
      console.log('Token from localStorage check'); // Debug log
      
      if (token && isValidToken(token)) {
        console.log('Valid token found, attempting to restore user session'); // Debug log
        
        // Try to get stored user data
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser) as User;
            console.log('Restored user from localStorage:', user); // Debug log
            dispatch({ type: 'SET_USER', payload: user });
            return;
          } catch (error) {
            console.log('Failed to parse stored user data:', error); // Debug log
          }
        }
        
        // If no stored user data, try to fetch profile
        try {
          const response = await apiClient.getProfile() as { user: User };
          console.log('Profile response:', response); // Debug log
          localStorage.setItem('user', JSON.stringify(response.user));
          dispatch({ type: 'SET_USER', payload: response.user });
        } catch (error) {
          console.log('Profile fetch failed, creating minimal user session:', error); // Debug log
          // Create a minimal user object if profile fetch fails
          const minimalUser = { 
            id: 'temp', 
            email: 'user@temp.com', 
            name: 'User', 
            role: UserRole.DISPATCHER, 
            tenantId: 'temp',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          localStorage.setItem('user', JSON.stringify(minimalUser));
          dispatch({ type: 'SET_USER', payload: minimalUser });
        }
      } else {
        console.log('No valid token found, setting loading to false'); // Debug log
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initAuth();
  }, [mounted]);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Starting login process for:', email); // Debug log
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await apiClient.login({ email, password }) as { user: User; token: string };
      console.log('✅ Login API response received:', response); // Debug log
      
      // Store token and user data
      console.log('💾 Storing token and user data in localStorage'); // Debug log
      setStoredToken(response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Verify storage
      console.log('🔍 Verification - Token stored:', !!localStorage.getItem('token')); // Debug log
      console.log('🔍 Verification - User stored:', !!localStorage.getItem('user')); // Debug log
      
      console.log('🚀 Dispatching LOGIN action with payload:', response); // Debug log
      dispatch({ type: 'LOGIN', payload: response });
      
      // Add a small delay to ensure state is updated, then force redirect if needed
      setTimeout(() => {
        console.log('⏰ Post-login state check - Should be authenticated now'); // Debug log
        // Force redirect as backup since React state updates are asynchronous
        if (typeof window !== 'undefined') {
          console.log('🔄 Forcing redirect to dashboard as backup'); // Debug log
          window.location.href = '/dashboard';
        }
      }, 200);
      
      console.log('✨ Login function completed successfully'); // Debug log
    } catch (error) {
      console.error('Login error:', error); // Debug log
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const register = async (userData: {
    email: string;
    name: string;
    password: string;
    role: string;
    organizationName: string;
  }) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await apiClient.register(userData) as { user: User; token: string };
      
      console.log('Register response:', response); // Debug log
      setStoredToken(response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      dispatch({ type: 'LOGIN', payload: response });
      console.log('Registration successful, dispatched LOGIN action'); // Debug log
    } catch (error) {
      console.error('Registration error:', error); // Debug log
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = () => {
    removeStoredToken();
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  // Don't render children until mounted (prevent hydration issues)
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      ...state, 
      login, 
      logout, 
      register 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};