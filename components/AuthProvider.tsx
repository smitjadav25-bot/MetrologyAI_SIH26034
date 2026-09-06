'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SafeInspector, RegisterInspectorInput } from '@/types/auth';

interface AuthContextType {
  inspector: SafeInspector | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (input: RegisterInspectorInput) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [inspector, setInspector] = useState<SafeInspector | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.inspector) {
          setInspector(data.inspector);
          return;
        }
      }
      setInspector(null);
    } catch (err) {
      console.error('Error verifying auth state:', err);
      setInspector(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (identifier: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Invalid credentials.' };
      }

      setInspector(data.inspector);
      router.refresh();
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Network or server error during sign in.' };
    }
  };

  const register = async (input: RegisterInspectorInput) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Registration failed.' };
      }

      setInspector(data.inspector);
      router.refresh();
      return { success: true };
    } catch (err) {
      console.error('Registration error:', err);
      return { success: false, error: 'Network or server error during registration.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setInspector(null);
      router.push('/');
      router.refresh();
    }
  };

  return (
    <AuthContext.Provider value={{ inspector, isLoading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
