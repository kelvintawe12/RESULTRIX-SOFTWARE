import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { School, ArrowLeft } from 'lucide-react';
export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 1000);
  };
  return <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-blue-600 p-2 rounded-lg">
            <School className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Enter your email address and we'll send you a link to reset your
          password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
          {submitted ? <div className="space-y-6">
              <Alert variant="success" title="Check your email" message={`We've sent a password reset link to ${email}`} />
              <Link to="/login">
                <Button variant="secondary" className="w-full">
                  Return to login
                </Button>
              </Link>
            </div> : <form className="space-y-6" onSubmit={handleSubmit}>
              <Input label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@school.com" />

              <div>
                <Button type="submit" variant="primary" className="w-full flex justify-center" isLoading={loading}>
                  Send Reset Link
                </Button>
              </div>

              <div className="flex items-center justify-center">
                <Link to="/login" className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to login
                </Link>
              </div>
            </form>}
        </div>
      </div>
    </div>;
}