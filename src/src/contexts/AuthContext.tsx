import React, { useEffect, useState, createContext, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, UserRole } from '../types';
import { Session } from '@supabase/supabase-js';
interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, schoolName: string, adminName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id, false); // Don't navigate on initial load
      } else {
        setLoading(false);
      }
    });
    // Listen for changes
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id, false); // Don't navigate on auth state change
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  const fetchUserProfile = async (userId: string, shouldNavigate: boolean = false) => {
    try {
      const {
        data,
        error
      } = await supabase.from('users').select('*').eq('id', userId).single();
      if (error) throw error;
      setUser(data as User);
      // Only navigate after explicit login, not on page load
      if (data && shouldNavigate) {
        navigateByRole(data.role);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };
  const navigateByRole = (role: UserRole) => {
    // Map roles to their correct dashboard routes - MUST MATCH App.tsx routes exactly
    const routes: Record<UserRole, string> = {
      super_admin: '/super-admin',
      school_admin: '/dashboard',
      bursar: '/bursar',
      teacher: '/teacher'
    };
    const targetRoute = routes[role];
    const currentPath = window.location.pathname;
    // Only navigate if we're on a login/signup page
    const isAuthPage = currentPath.includes('/login') || currentPath.includes('/signup') || currentPath === '/' || currentPath.includes('/auth/callback');
    if (targetRoute && isAuthPage) {
      window.location.href = targetRoute;
    }
  };
  const login = async (email: string, password: string) => {
    const {
      data,
      error
    } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    if (data.user) {
      await fetchUserProfile(data.user.id, true); // Navigate after successful login
    }
  };
  const signup = async (email: string, password: string, schoolName: string, adminName: string) => {
    // First, create the auth user
    const {
      data: authData,
      error: authError
    } = await supabase.auth.signUp({
      email,
      password
    });
    if (authError) throw authError;
    if (authData.user) {
      // Create school record
      const {
        data: schoolData,
        error: schoolError
      } = await supabase.from('schools').insert({
        name: schoolName,
        approved: false
      }).select().single();
      if (schoolError) throw schoolError;
      // Create user profile
      const {
        error: userError
      } = await supabase.from('users').insert({
        id: authData.user.id,
        school_id: schoolData.id,
        email,
        role: 'school_admin',
        full_name: adminName,
        password_hash: '' // Managed by Supabase Auth
      });
      if (userError) throw userError;
      await fetchUserProfile(authData.user.id, true); // Navigate after successful signup
    }
  };
  const signInWithGoogle = async () => {
    const {
      error
    } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) throw error;
  };
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/login';
  };
  const value = {
    user,
    session,
    role: user?.role || null,
    loading,
    login,
    signup,
    signInWithGoogle,
    signOut
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}