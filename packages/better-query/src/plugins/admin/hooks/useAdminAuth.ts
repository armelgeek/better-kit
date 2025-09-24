import { useState, useEffect } from 'react';

export interface AdminUser {
  id: string;
  name: string;
  email?: string;
  role: string;
  avatar?: string;
  permissions?: string[];
}

export interface UseAdminAuthReturn {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  checkPermission: (permission: string) => boolean;
}

export interface UseAdminAuthOptions {
  /**
   * Auth client instance
   */
  authClient?: any;

  /**
   * Required role for admin access
   */
  requiredRole?: string;

  /**
   * Auto-check authentication on mount
   */
  autoCheck?: boolean;
}

/**
 * Hook for managing admin authentication
 */
export function useAdminAuth({
  authClient,
  requiredRole = 'admin',
  autoCheck = true
}: UseAdminAuthOptions = {}): UseAdminAuthReturn {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated
  const isAuthenticated = Boolean(user);

  // Check if user has admin role
  const isAdmin = Boolean(user && user.role === requiredRole);

  // Check current authentication status
  const checkAuth = async () => {
    if (!authClient) return;

    setLoading(true);
    setError(null);

    try {
      // Attempt to get current user from auth client
      const currentUser = await getCurrentUser(authClient);
      
      if (currentUser && currentUser.role === requiredRole) {
        setUser(currentUser);
      } else if (currentUser) {
        setError(`Insufficient permissions. Admin role required.`);
        setUser(null);
      } else {
        setUser(null);
      }
    } catch (err: any) {
      console.error('Auth check failed:', err);
      setError(err.message || 'Authentication check failed');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (credentials: { email: string; password: string }) => {
    if (!authClient) {
      throw new Error('Auth client not configured');
    }

    setLoading(true);
    setError(null);

    try {
      // Attempt login with auth client
      const loginResult = await performLogin(authClient, credentials);
      
      if (loginResult.user && loginResult.user.role === requiredRole) {
        setUser(loginResult.user);
      } else if (loginResult.user) {
        setError(`Insufficient permissions. Admin role required.`);
        throw new Error('Insufficient permissions');
      } else {
        setError('Login failed');
        throw new Error('Login failed');
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setError(null);
    
    // Clear any stored auth tokens
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    }

    // Call auth client logout if available
    if (authClient?.logout) {
      authClient.logout().catch((err: any) => {
        console.warn('Auth client logout failed:', err);
      });
    }
  };

  // Check user permission
  const checkPermission = (permission: string): boolean => {
    if (!user || !user.permissions) {
      return user?.role === requiredRole; // Fallback to role check
    }

    return user.permissions.includes(permission) || user.permissions.includes('*');
  };

  // Auto-check authentication on mount
  useEffect(() => {
    if (autoCheck) {
      checkAuth();
    }
  }, [authClient, autoCheck]);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    checkPermission
  };
}

/**
 * Get current user from auth client
 */
async function getCurrentUser(authClient: any): Promise<AdminUser | null> {
  // Try different methods to get current user
  if (authClient.getSession) {
    const session = await authClient.getSession();
    return session?.user || null;
  }

  if (authClient.getCurrentUser) {
    return await authClient.getCurrentUser();
  }

  if (authClient.user) {
    return authClient.user;
  }

  // Fallback: check local storage
  if (typeof window !== 'undefined') {
    const storedUser = localStorage.getItem('admin_user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (error) {
        console.warn('Failed to parse stored user:', error);
      }
    }
  }

  return null;
}

/**
 * Perform login with auth client
 */
async function performLogin(
  authClient: any,
  credentials: { email: string; password: string }
): Promise<{ user: AdminUser }> {
  
  // Try different login methods
  if (authClient.signIn) {
    const result = await authClient.signIn.email(credentials);
    return { user: result.user };
  }

  if (authClient.login) {
    const result = await authClient.login(credentials);
    return { user: result.user || result };
  }

  // Mock login for development/demo
  if (process.env.NODE_ENV === 'development') {
    console.warn('Using mock admin login for development');
    const mockUser: AdminUser = {
      id: 'admin-1',
      name: 'Admin User',
      email: credentials.email,
      role: 'admin',
      permissions: ['*']
    };

    // Store mock user
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_user', JSON.stringify(mockUser));
      localStorage.setItem('admin_token', 'mock-admin-token');
    }

    return { user: mockUser };
  }

  throw new Error('No compatible auth client login method found');
}