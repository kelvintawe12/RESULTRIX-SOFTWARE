import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { AuthSlideshow } from '../../components/common/AuthSlideshow';
import { School, ArrowRight, ArrowLeft, Check } from 'lucide-react';
export function SignupPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    schoolName: '',
    address: '',
    adminName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPendingMessage, setShowPendingMessage] = useState(false);
  const [registeredSchoolName, setRegisteredSchoolName] = useState('');
  const {
    signup,
    signInWithGoogle
  } = useAuth();
  const navigate = useNavigate();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(step + 1);
  };
  const handleBack = () => {
    setStep(step - 1);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await signup(formData.email, formData.password, formData.schoolName, formData.adminName);
      // Show pending approval message instead of redirecting
      setRegisteredSchoolName(formData.schoolName);
      setShowPendingMessage(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Google');
    }
  };
  
  // Show pending approval message after successful registration
  if (showPendingMessage) {
    return <div className="min-h-screen flex">
      {/* Left Side - Slideshow */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <AuthSlideshow />
      </div>

      {/* Right Side - Success Message */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Logo */}
          <div className="mb-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-700 transition-colors">
                <School className="w-8 h-8 text-white" />
              </div>
              <span className="font-bold text-2xl text-slate-900 group-hover:text-blue-600 transition-colors">
                EduMaster
              </span>
            </Link>
          </div>

          {/* Success Message */}
          <div className="text-center">
            <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-blue-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Registration Successful!
            </h2>
            <p className="text-slate-600 mb-6">
              Your school <strong>{registeredSchoolName}</strong> has been registered successfully.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 p-1.5 rounded-full mt-0.5">
                  <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-amber-800">Pending Approval Required</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Your school registration is currently pending approval by our super administrators. 
                    You will receive an email notification once your school has been approved.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                While you wait, you can:
              </p>
              <div className="flex flex-col gap-2">
                <Link 
                  to="/" 
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Return to Homepage
                </Link>
                <Link 
                  to="/login" 
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Sign In to Existing Account
                </Link>
              </div>
            </div>

            {/* Footer Links */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex justify-center gap-6 text-sm text-slate-500">
                <Link to="/privacy-policy" className="hover:text-slate-900">
                  Privacy Policy
                </Link>
                <span>•</span>
                <Link to="/terms-of-service" className="hover:text-slate-900">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
  }
  
  return <div className="min-h-screen flex">
      {/* Left Side - Slideshow */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <AuthSlideshow />
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Back Button with Tooltip */}
          <div className="relative group mb-6">
            <Link to="/" className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-all duration-200">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back Button</span>
            </Link>
            {/* Tooltip */}
            <div className="absolute left-0 top-full mt-2 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
              Return to homepage
              <div className="absolute left-4 -top-1.5 w-2 h-2 bg-slate-900 rotate-45"></div>
            </div>
          </div>

          {/* Logo */}
          <div className="mb-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-700 transition-colors">
                <School className="w-8 h-8 text-white" />
              </div>
              <span className="font-bold text-2xl text-slate-900 group-hover:text-blue-600 transition-colors">
                EduMaster
              </span>
            </Link>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map(i => <div key={i} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                  ${step >= i ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}
                `}>
                  {step > i ? <Check className="w-4 h-4" /> : i}
                </div>
                {i < 3 && <div className={`w-12 h-1 mx-2 rounded ${step > i ? 'bg-blue-600' : 'bg-slate-200'}`} />}
              </div>)}
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900">
              {step === 1 ? 'School Information' : step === 2 ? 'Administrator Details' : 'Security'}
            </h2>
            <p className="mt-2 text-sm text-slate-600">Step {step} of 3</p>
          </div>

          {error && <div className="mb-6">
              <Alert type="error" title="Registration Failed">{error}</Alert>
            </div>}

          {step === 1 && <>
              {/* Google Sign Up */}
              <button onClick={handleGoogleSignUp} className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors mb-6">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-sm font-medium text-slate-700">
                  Continue with Google
                </span>
              </button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">
                    Or register with email
                  </span>
                </div>
              </div>
            </>}

          <form onSubmit={step === 3 ? handleSubmit : handleNext} className="space-y-6">
            {step === 1 && <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <Input label="School Name" name="schoolName" value={formData.schoolName} onChange={handleChange} required placeholder="e.g. Springfield Academy" autoFocus />
                <Input label="School Address" name="address" value={formData.address} onChange={handleChange} required placeholder="Full address" />
              </div>}

            {step === 2 && <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <Input label="Administrator Name" name="adminName" value={formData.adminName} onChange={handleChange} required placeholder="Full Name" autoFocus />
                <Input label="Email address" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="admin@school.com" />
              </div>}

            {step === 3 && <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <Input label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" autoFocus />
                <Input label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required placeholder="••••••••" />
                <p className="text-xs text-slate-500">
                  Password must be at least 6 characters long
                </p>
              </div>}

            <div className="flex gap-3 pt-4">
              {step > 1 && <Button type="button" variant="secondary" className="flex-1" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>}
              <Button type="submit" variant="primary" className="flex-1" isLoading={loading}>
                {step === 3 ? 'Create Account' : 'Next Step'}
                {step < 3 && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8">
            <p className="text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>

          {/* Footer Links */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex justify-center gap-6 text-sm text-slate-500">
              <Link to="/privacy-policy" className="hover:text-slate-900">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link to="/terms-of-service" className="hover:text-slate-900">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>;
}