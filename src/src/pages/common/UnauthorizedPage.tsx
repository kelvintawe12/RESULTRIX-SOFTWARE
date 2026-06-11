import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ArrowLeft,
  Home,
  LogOut,
  Lock
} from 'lucide-react';

export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center px-6">
      <div className="max-w-2xl w-full">

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <ShieldAlert size={34} />
              </div>

              <div>
                <h1 className="text-3xl font-bold">
                  Access Restricted
                </h1>
                <p className="text-red-100 mt-1">
                  You don't have permission to access this resource.
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-8">

            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <Lock className="text-amber-600" size={20} />
              <div>
                <h3 className="font-semibold text-amber-900">
                  Authorization Required
                </h3>
                <p className="text-sm text-amber-700">
                  Your account is authenticated, but your current role
                  does not have sufficient permissions for this page.
                </p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed">
              This area is restricted based on role permissions configured
              by your school administrator. If you believe you should have
              access, contact your administrator or support team.
            </p>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">

              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                <ArrowLeft size={18} />
                Go Back
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 transition"
              >
                <Home size={18} />
                Dashboard
              </button>

            </div>

            {/* Footer Actions */}
            <div className="mt-6 border-t pt-6">

              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                <LogOut size={16} />
                Sign in with another account
              </button>

            </div>
          </div>
        </div>

        {/* Error Code */}
        <div className="text-center mt-6">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
            Error 403 • Forbidden
          </span>
        </div>
      </div>
    </div>
  );
}