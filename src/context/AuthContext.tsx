'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, DBSubAccount } from '@/types';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  activeSubAccount: DBSubAccount | null;
  subAccounts: DBSubAccount[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchSubAccount: (subAccountId: string | null) => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshSubAccounts: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subAccounts, setSubAccounts] = useState<DBSubAccount[]>([]);
  const [activeSubAccount, setActiveSubAccount] = useState<DBSubAccount | null>(null);

  const getAccessToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  };

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSubAccounts = useCallback(async () => {
    if (!user?.profile?.role || user.profile.role !== 'admin') {
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    try {
      const response = await fetch('/api/sub-accounts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubAccounts(data.subAccounts || []);

        // Set active sub-account
        if (user.activeSubAccountId) {
          const active = data.subAccounts.find(
            (sa: DBSubAccount) => sa.id === user.activeSubAccountId
          );
          setActiveSubAccount(active || null);
        }
      }
    } catch (error) {
      console.error('Error fetching sub-accounts:', error);
    }
  }, [user]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (user?.profile?.role === 'admin') {
      refreshSubAccounts();
    } else if (user?.subAccount) {
      setActiveSubAccount(user.subAccount);
    }
  }, [user, refreshSubAccounts]);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      // Store tokens
      localStorage.setItem('access_token', data.session.access_token);
      localStorage.setItem('refresh_token', data.session.refresh_token);

      await refreshUser();

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    const token = getAccessToken();
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setSubAccounts([]);
    setActiveSubAccount(null);
  };

  const switchSubAccount = async (subAccountId: string | null) => {
    const token = getAccessToken();
    if (!token || !user?.profile?.role || user.profile.role !== 'admin') return;

    try {
      const response = await fetch('/api/sub-accounts/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subAccountId }),
      });

      if (response.ok) {
        await refreshUser();
        if (subAccountId) {
          const active = subAccounts.find((sa) => sa.id === subAccountId);
          setActiveSubAccount(active || null);
        } else {
          setActiveSubAccount(null);
        }
        
        // Redirect to dashboard and refresh
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error switching sub-account:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin: user?.profile?.role === 'admin',
        activeSubAccount,
        subAccounts,
        login,
        logout,
        switchSubAccount,
        refreshUser,
        refreshSubAccounts,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
