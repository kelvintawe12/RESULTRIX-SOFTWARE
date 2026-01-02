import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Shield, ArrowRight, Lock, Eye } from 'lucide-react';
export function SuperAdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    login,
    signInWithGoogle
  } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      // Navigation handled by auth context
    } catch (err: any) {
      setError(err.message || 'Invalid credentials or insufficient permissions');
    } finally {
      setLoading(false);
    }
  };
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Header */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top duration-700">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl mb-6 shadow-2xl shadow-blue-900/50 relative">
            <Shield className="w-10 h-10 text-white" />
            <div className="absolute inset-0 bg-white/20 rounded-2xl animate-ping"></div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Super Admin Portal
          </h1>
          <p className="text-blue-200 flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            Secure access for platform administrators
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
          {error && <div className="mb-6">
              <Alert variant="error" title="Authentication Failed" message={error} />
            </div>}

          {/* Google Sign In */}
          <button onClick={handleGoogleSignIn} className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-slate-300 rounded-lg hover:bg-slate-50 hover:border-blue-600 transition-all duration-200 mb-6 group">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">
              Continue with Google
            </span>
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">
                Or sign in with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@edumaster.com" className="h-12" />

            <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="h-12" />

            <Button type="submit" variant="primary" className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" isLoading={loading} rightIcon={<ArrowRight className="w-5 h-5" />}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <Link to="/login" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              ← Back to regular login
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center text-sm text-blue-200 space-y-1 animate-in fade-in duration-1000 delay-500">
          <div className="flex items-center justify-center gap-2">
            <Eye className="w-4 h-4" />
            <p>This portal is for authorized super administrators only.</p>
          </div>
          <p className="text-blue-300/70">
            All access attempts are logged and monitored.
          </p>
        </div>
      </div>
    </div>;
}