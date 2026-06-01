import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { User } from '~/types/auth.types';
import { authService, setAccessToken, setLogoutCallback } from '~/services/auth.service';
import { AuthContext } from './auth-context';

export { AuthContext };

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mustChangePassword: boolean;
  setMustChangePassword: (value: boolean) => void;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const clearSession = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setMustChangePassword(false);
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
        if (data.must_change_password) {
          setMustChangePassword(true);
        }
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
    if (data.must_change_password) {
      setMustChangePassword(true);
    }
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
    mustChangePassword,
    setMustChangePassword,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
