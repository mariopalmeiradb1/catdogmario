import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { User } from '~/types/auth.types';
import { authService, setAccessToken, setLogoutCallback } from '~/services/auth.service';
import { AuthContext } from './auth-context';

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setUser(null);
    setAccessToken(null);
  }, []);

  useEffect(() => {
    setLogoutCallback(clearSession);
  }, [clearSession]);

  useEffect(() => {
    async function tryRefresh() {
      try {
        const data = await authService.refresh();
        setAccessToken(data.access_token);
        setUser(data.user);
      } catch {
        clearSession();
      } finally {
        setIsLoading(false);
      }
    }
    tryRefresh();
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authService.login(email, password);
    setAccessToken(data.access_token);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
