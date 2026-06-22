'use client';

/**
 * useAuth — Auth state management hook.
 *
 * Provides login, logout, user state, and loading/error states
 * via React Context so any component in the tree can access auth.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { authService } from '@/services/authService';
import { isAuthenticated, setToken } from '@/services/apiClient';
import type { User, LoginRequest } from '@/types';

// ─── Context shape ───────────────────────────────────────────
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  impersonate: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On mount — check if user is already authenticated
  useEffect(() => {
    async function loadUser() {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        if (urlToken) {
          setToken(urlToken);
          urlParams.delete('token');
          const searchString = urlParams.toString();
          const cleanUrl = window.location.pathname + (searchString ? `?${searchString}` : '');
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }

      if (!isAuthenticated()) {
        setIsLoading(false);
        return;
      }
      try {
        const profile = await authService.getProfile();
        setUser(profile);
      } catch {
        // Token invalid / expired
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Giriş başarısız. Lütfen tekrar deneyin.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    authService.logout();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const impersonate = useCallback(async (targetUserId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.impersonate(targetUserId);
      setToken(response.access_token);
      setUser(response.user);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Doğrudan giriş başarısız.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout, clearError, impersonate }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
