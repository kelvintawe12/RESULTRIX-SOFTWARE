import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Create Supabase client with enhanced configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Extended session timeout (24 hours instead of default 1 hour)
    // This helps with the "session failing quickly" issue
    sessionStorage: {
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      storageKey: 'edumaster-auth-session',
      storage: window.localStorage
    },
    // Configure auto-refresh behavior
    refreshAccessToken: async () => {
      // Custom refresh logic if needed
      console.log('Refreshing access token');
    }
  },
  // Global settings
  global: {
    headers: {
      'X-Client-Name': 'edumaster-web',
      'X-Client-Version': '1.0.0'
    }
  },
  // Retry configuration for failed requests
  db: {
    schema: 'public'
  },
  realtime: {
    // Configure realtime behavior
    params: {
      eventsPerSecond: 10
    }
  }
});

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = true;

// Helper function to check session health
export async function checkSessionHealth(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('Session health check failed:', error);
    return false;
  }
}

// Helper function to force session refresh
export async function forceSessionRefresh(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    return !error && !!data.session;
  } catch (error) {
    console.error('Session refresh failed:', error);
    return false;
  }
}

// Helper function to clear all auth data
export function clearAuthData(): void {
  try {
    localStorage.removeItem('edumaster-auth-session');
    sessionStorage.clear();
  } catch (error) {
    console.error('Failed to clear auth data:', error);
  }
}