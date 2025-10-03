import * as React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

/**
 * AuthLayout Component
 * Layout for authentication pages (login, register, forgot password, etc.)
 * Provides a centered card with branding
 */
export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="relative">
              <Shield className="h-12 w-12 text-blue-600" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            TimeTracker Pro
          </h1>
          <p className="text-sm text-slate-600 mt-1">Enterprise Timesheet Management</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <Outlet />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-600 mt-6">
          © {new Date().getFullYear()} TimeTracker Pro. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
