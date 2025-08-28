'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/api';

// Define types
type User = {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  photo?: string;
  isOnline?: boolean;
  lastActive?: Date;
  aadhaarCard?: {
    aadhaar_number: string;
    full_name: string;
    date_of_birth: string;
    gender: string;
    address: string;
    father_name?: string;
    phone_number?: string;
    email?: string;
    pin_code?: string;
    state?: string;
    district?: string;
    verified: boolean;
  };
  panCard?: {
    pan_number: string;
    full_name: string;
    father_name?: string;
    date_of_birth: string;
    photo_present?: boolean;
    signature_present?: boolean;
    verified: boolean;
  };
} | null;

type AuthContextType = {
  user: User;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email?: string; phoneNumber?: string; password: string }) => Promise<void>;
  register: (userData: { name: string; email: string; phoneNumber: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  refreshUser: () => Promise<void>;
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setIsLoading(true);
        // Check if we have a token in localStorage
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        try {
          const response = await authService.getCurrentUser();
          if (response.data) {
            console.log('Current user data:', response.data);
            setUser(response.data);
            setIsAuthenticated(true);
          } else {
            // Clear token if current user endpoint returns no data
            console.warn("Authentication failed: No user data returned");
            localStorage.removeItem('accessToken');
            setIsAuthenticated(false);
            setUser(null);
          }
        } catch (apiError: any) {
          console.error('Failed to get current user:', apiError?.response?.data?.message || apiError.message);
          // Clear token if current user endpoint fails
          localStorage.removeItem('accessToken');
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (err: any) {
        console.error('Authentication check failed:', err?.message);
        // Clear invalid token if authentication fails
        localStorage.removeItem('accessToken');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (credentials: { email?: string; phoneNumber?: string; password: string }) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.login(credentials);
      setUser(response.data.user);
      setIsAuthenticated(true);
      
      // Store tokens in localStorage as a fallback for the Authorization header
      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
      }
      
      router.push('/dashboard'); // Redirect to dashboard after login
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: { name: string; email: string; phoneNumber: string; password: string }) => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.register(userData);
      router.push('/auth/login'); // Redirect to login after registration
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear tokens from localStorage
      localStorage.removeItem('accessToken');
      
      router.push('/auth/login'); // Redirect to login after logout
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const response = await authService.getCurrentUser();
      if (response.data) {
        setUser(response.data);
      }
    } catch (err: any) {
      console.error('Failed to refresh user data:', err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    error,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
