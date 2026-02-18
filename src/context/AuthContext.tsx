// autoloan-nextjs-metafullstack/src/context/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@/types';
import { getAuthToken, setAuthToken, apiFetch } from '@/services/api';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setUser = useCallback((newUser: User | null) => {
    setUserState(newUser);
    if (typeof window !== 'undefined') {
      if (newUser) {
        const token = getAuthToken();
        if (token) setCookie('token', token);
        setCookie('user_role', newUser.role);
      } else {
        deleteCookie('token');
        deleteCookie('user_role');
      }
    }
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await apiFetch<{ status: { code: number }; data: User }>(
          '/auth/me'
        );
        setUser(response.data.data);
      } catch {
        setAuthToken(null);
        deleteCookie('token');
        deleteCookie('user_role');
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, [setUser]);

  const logout = useCallback(() => {
    setUser(null);
    setAuthToken(null);
  }, [setUser]);

  return (
    <AuthContext.Provider
      value={{ user, setUser, isAuthenticated: !!user, isLoading, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
