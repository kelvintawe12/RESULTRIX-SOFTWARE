import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader, Home } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: localStorage.getItem('edumaster_remember_email') || '',
    password: '',
    rememberMe: !!localStorage.getItem('edumaster_remember_email')
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoadingRemembered, setIsLoadingRemembered] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const routeMap: Record<string, string> = {
        school_admin: '/dashboard',
        super_admin: '/super-admin',
        bursar: '/bursar',
        teacher: '/teacher',
        student: '/student'
      };
      const targetRoute = routeMap[user.role] || '/dashboard';
      navigate(targetRoute, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Add safety timeout for form submission
  useEffect(() => {
    let submissionTimeout: NodeJS.Timeout;
    
    if (isSubmitting) {
      submissionTimeout = setTimeout(() => {
        setIsSubmitting(false);
        setLocalError('Login is taking longer than expected. Please try again.');
      }, 15000); // 15 second safety timeout
    }
    
    return () => {
      clearTimeout(submissionTimeout);
    };
  }, [isSubmitting]);

  // Load remembered email
  useEffect(() => {
    const remembered = localStorage.getItem('edumaster_remember_email');
    if (remembered) {
      setIsLoadingRemembered(true);
      setFormData(prev => ({
        ...prev,
        email: remembered,
        rememberMe: true
      }));
      setTimeout(() => setIsLoadingRemembered(false), 300);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setLocalError(null);
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validation
    if (!formData.email.trim()) {
      setLocalError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    if (!formData.password) {
      setLocalError('Password is required');
      return;
    }

    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(formData.email, formData.password, formData.rememberMe);
      // Navigation will be handled by the useEffect that watches isAuthenticated
    } catch (err: any) {
      setLocalError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentError = localError || error;
  const isLoading = isSubmitting || isLoadingRemembered;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -top-40 -left-40 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -bottom-40 -right-40 animate-pulse delay-1000"></div>
      </div>

      {/* Back to Home Button */}
      <Link
        to="/"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-medium border border-white/20 transition-all z-20"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">Back to Home</span>
        <span className="sm:hidden">Back</span>
      </Link>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17s4.5 10.747 10 10.747c5.5 0 10-4.998 10-10.747S17.5 6.253 12 6.253z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">EduMaster</h1>
          <p className="text-slate-400 text-sm">School Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-slate-300 text-sm mb-6">Sign in to your account to continue</p>

          {/* Error Message */}
          {currentError && (
            <div className="mb-6 p-4 bg-red-500/15 border border-red-500/50 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{currentError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full pl-10 pr-12 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-300 transition-colors disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={isLoading}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors">
                Remember me on this device
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-900/50 text-slate-400">Or</span>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <Link
              to="/forgot-password"
              className="block text-center text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              Forgot your password?
            </Link>
            <p className="text-center text-slate-400 text-sm">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                Sign up now
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-slate-400 text-xs space-y-2">
          <p>Demo credentials available for testing</p>
          <p className="text-slate-500">For support, contact: support@edumaster.com</p>
        </div>
      </div>
    </div>
  );
}
