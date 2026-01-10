'use client';

/**
 * Auth Provider
 *
 * Provides authentication state to the application via React context.
 * Handles fetching the current user, logout, and refreshing user data.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

import { type User } from '@astronacci/shared';

import { api } from '../../lib/api';

/**
 * Auth context state and methods.
 */
export interface AuthContextValue {
  /** The current authenticated user, or null if not authenticated */
  user: User | null;
  /** Whether the auth state is being loaded */
  isLoading: boolean;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Logout the current user */
  logout: () => Promise<void>;
  /** Refresh the current user data */
  refreshUser: () => Promise<void>;
}

/**
 * Auth context with default undefined value.
 * Will throw error if used outside provider.
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Auth provider props.
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component
 *
 * Wraps the application to provide authentication state.
 * Fetches the current user on mount and provides methods for logout and refresh.
 *
 * @example
 * // In your root layout or app
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetch the current user from the API.
   */
  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get<User>('/api/auth/me');
      setUser(response.data ?? null);
    } catch {
      // User is not authenticated
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout the current user.
   */
  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Ignore errors - we're logging out anyway
    } finally {
      setUser(null);
    }
  }, []);

  /**
   * Refresh the current user data.
   */
  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    await fetchUser();
  }, [fetchUser]);

  // Fetch user on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 *
 * Access the auth context from any component within the AuthProvider.
 *
 * @returns The auth context value
 * @throws Error if used outside of AuthProvider
 *
 * @example
 * function Profile() {
 *   const { user, isLoading, logout } = useAuth();
 *
 *   if (isLoading) return <Loading />;
 *   if (!user) return <Redirect to="/login" />;
 *
 *   return (
 *     <div>
 *       <p>Welcome, {user.displayName}</p>
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   );
 * }
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export default AuthProvider;
