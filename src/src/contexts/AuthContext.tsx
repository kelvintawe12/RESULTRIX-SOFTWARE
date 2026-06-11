import React, { createContext, useEffect, useRef, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { authService, AuthUser } from '../lib/authService';
import { supabase, checkSessionHealth, forceSessionRefresh, clearAuthData } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useToasts } from './ToastContext';

export interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>; // Alias for logout
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  setupTwoFactor: (userId: string) => Promise<any>;
  verifyAndEnableTwoFactor: (userId: string, code: string, secret: string) => Promise<void>;
  disableTwoFactor: (userId: string, password: string) => Promise<void>;
  updateUserProfile: (userId: string, updates: Partial<AuthUser>) => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToasts();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigationRef = useRef<string | null>(null);

  // Initialize auth on mount
  useEffect(() => {
    let isMounted = true;
    let initializationTimeout: NodeJS.Timeout;
    let healthCheckInterval: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        // Fast timeout to prevent any hanging
        initializationTimeout = setTimeout(() => {
          if (isMounted && loading) {
            console.warn('Auth initialization timeout - forcing loading state to false');
            setLoading(false);
          }
        }, 5000); // 5 second timeout

        // Simply check for existing session - don't fetch profile yet
        const currentSession = await supabase.auth.getSession();
        
        clearTimeout(initializationTimeout);

        if (!isMounted) return;

        setSession(currentSession.data.session);

        // Don't fetch user profile during init - let it happen lazily
        // or through the auth state change listener
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (!isMounted) return;
        setSession(null);
      } finally {
        clearTimeout(initializationTimeout);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up periodic session health check (every 15 minutes, increased from 5)
    healthCheckInterval = setInterval(async () => {
      if (!isMounted) return;
      
      try {
        const isHealthy = await checkSessionHealth();
        if (!isHealthy && user) {
          console.warn('Session unhealthy, attempting to refresh...');
          const refreshed = await forceSessionRefresh();
          if (!refreshed) {
            // Session cannot be refreshed, clear state
            console.warn('Session refresh failed, clearing auth state...');
            if (isMounted) {
              setUser(null);
              setSession(null);
              clearAuthData();
              // Don't navigate here to avoid redirects during health check
            }
          }
        }
      } catch (error) {
        console.error('Session health check error:', error);
      }
    }, 15 * 60 * 1000); // 15 minutes (increased from 5)

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        setSession(session);

        if (event === 'SIGNED_IN' && session?.user?.id) {
          // Only fetch profile if we don't already have a user
          if (!user) {
            try {
              const userProfile = await authService.getUserProfile(session.user.id);
              if (!isMounted) return;
              setUser(userProfile);
              navigateByRole(userProfile.role);
            } catch (profileError) {
              console.error('Error fetching user profile:', profileError);
              if (!isMounted) return;
              setUser(null);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          if (!isMounted) return;
          setUser(null);
          setSession(null);
          navigationRef.current = null;
          navigate('/login', { replace: true });
        } else if (event === 'TOKEN_REFRESHED') {
          // Session was refreshed successfully
          console.log('Session refreshed successfully');
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(initializationTimeout);
      clearInterval(healthCheckInterval);
      subscription?.unsubscribe();
    };
  }, [navigate]);

  const navigateByRole = (role: string) => {
    // Prevent duplicate navigations and navigation loops
    const targetRoute = getRouteByRole(role);
    if (navigationRef.current !== targetRoute && targetRoute !== '/login') {
      navigationRef.current = targetRoute;
      try {
        navigate(targetRoute, { replace: true });
      } catch (navError) {
        console.error('Navigation error:', navError);
      }
    }
  };

  const getRouteByRole = (role: string): string => {
    switch (role) {
      case 'school_admin':
        return '/dashboard';
      case 'super_admin':
        return '/super-admin';
      case 'bursar':
        return '/bursar';
      case 'teacher':
        return '/teacher';
      case 'student':
        return '/student';
      default:
        return '/login';
    }
  };

  const handleLogin = async (email: string, password: string, rememberMe?: boolean) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.login({
        email,
        password,
        rememberMe
      });

      // Set user and session from login result
      setUser(result.user);
      setSession(result.session);

      // Show success toast
      toastSuccess('Welcome back!', `Logged in as ${result.user.full_name}`);

      // Navigate based on role immediately
      navigateByRole(result.user.role);
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      toastError('Login Failed', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (data: any) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.signup(data);
      setUser(result.user);

      // Show success toast
      toastSuccess('Registration Successful', 'Your account has been created. Please wait for approval.');
    } catch (err: any) {
      const errorMessage = err.message || 'Signup failed. Please try again.';
      setError(errorMessage);
      toastError('Signup Failed', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      setError(null);
      await authService.logout();
      setUser(null);
      setSession(null);
      toastSuccess('Logged Out', 'You have been logged out successfully.');
      // Navigate to login page
      navigate('/login');
    } catch (err: any) {
      const errorMessage = err.message || 'Logout failed.';
      setError(errorMessage);
      toastError('Logout Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPasswordReset = async (email: string) => {
    try {
      setError(null);
      await authService.requestPasswordReset(email);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send reset email.';
      setError(errorMessage);
      throw err;
    }
  };

  const handleConfirmPasswordReset = async (token: string, password: string) => {
    try {
      setError(null);
      await authService.confirmPasswordReset(token, password);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to reset password.';
      setError(errorMessage);
      throw err;
    }
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setError(null);
      await authService.changePassword(currentPassword, newPassword);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to change password.';
      setError(errorMessage);
      throw err;
    }
  };

  const handleSetupTwoFactor = async (userId: string) => {
    try {
      setError(null);
      return await authService.setupTwoFactor(userId);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to setup 2FA.';
      setError(errorMessage);
      throw err;
    }
  };

  const handleVerifyAndEnableTwoFactor = async (
    userId: string,
    code: string,
    secret: string
  ) => {
    try {
      setError(null);
      await authService.verifyAndEnableTwoFactor(userId, code, secret);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to enable 2FA.';
      setError(errorMessage);
      throw err;
    }
  };

  const handleDisableTwoFactor = async (userId: string, password: string) => {
    try {
      setError(null);
      await authService.disableTwoFactor(userId, password);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to disable 2FA.';
      setError(errorMessage);
      throw err;
    }
  };

  const handleUpdateUserProfile = async (userId: string, updates: Partial<AuthUser>) => {
    try {
      setError(null);
      const updatedUser = await authService.updateUserProfile(userId, updates);
      setUser(updatedUser);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update profile.';
      setError(errorMessage);
      throw err;
    }
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    session,
    loading,
    isAuthenticated: !!user && !!session,
    error,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
    signOut: handleLogout, // Alias for logout
    requestPasswordReset: handleRequestPasswordReset,
    confirmPasswordReset: handleConfirmPasswordReset,
    changePassword: handleChangePassword,
    setupTwoFactor: handleSetupTwoFactor,
    verifyAndEnableTwoFactor: handleVerifyAndEnableTwoFactor,
    disableTwoFactor: handleDisableTwoFactor,
    updateUserProfile: handleUpdateUserProfile,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
