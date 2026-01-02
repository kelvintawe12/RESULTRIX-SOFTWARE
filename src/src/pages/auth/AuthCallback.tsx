import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/ui/Alert';
export function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for existing session or handle the hash fragment
        const {
          data: {
            session
          },
          error: sessionError
        } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) {
          // If no session immediately, wait a moment as the hash might be processing
          // In a real scenario, we might parse the hash manually if supabase doesn't catch it,
          // but getSession usually handles it.
          throw new Error('No session found. Please try logging in again.');
        }
        // Fetch user profile to get the role
        const {
          data: profile,
          error: profileError
        } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          throw new Error('Failed to fetch user profile.');
        }
        if (!profile?.role) {
          throw new Error('User role not assigned.');
        }
        // Redirect based on role
        switch (profile.role) {
          case 'super_admin':
            navigate('/super-admin/dashboard');
            break;
          case 'school_admin':
            navigate('/dashboard');
            break;
          case 'teacher':
            navigate('/teacher/dashboard');
            break;
          case 'bursar':
            navigate('/bursar/dashboard');
            break;
          default:
            // Fallback for unknown roles
            navigate('/dashboard');
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'An unexpected error occurred during authentication.');
        // Redirect to login after a short delay so user sees the error
        setTimeout(() => navigate('/login'), 3000);
      }
    };
    handleAuthCallback();
  }, [navigate]);
  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md space-y-4 text-center">
          <Alert variant="destructive" title="Authentication Failed">
            {error}
          </Alert>
          <p className="text-sm text-gray-500">Redirecting you to login...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <LoadingSpinner size="lg" className="text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Verifying your identity
        </h2>
        <p className="text-gray-500">
          Please wait while we set up your dashboard...
        </p>
      </div>
    </div>;
}