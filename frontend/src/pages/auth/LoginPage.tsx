import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../store/contexts/AuthContext';
import { loginSchema, type LoginInput } from '../../schemas/auth.schema';
import { AuthCard } from './components';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { BackendAuthService } from '../../services/BackendAuthService';
import { isMicrosoftOAuthEnabled } from '../../config/msalConfig';

/**
 * LoginPage Component
 * Modern login page with react-hook-form and Zod validation
 */

export function LoginPage() {
  const { signIn, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [serverError, setServerError] = React.useState('');
  const [ssoLoading, setSsoLoading] = React.useState(false);
  const showMicrosoftSSO = isMicrosoftOAuthEnabled();

  // Check for SSO errors from URL
  React.useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (error) {
      let errorMessage = 'Microsoft login failed';

      switch (error) {
        case 'sso_init_failed':
          errorMessage = 'Failed to initiate Microsoft login. Please try again.';
          break;
        case 'sso_failed':
          errorMessage = message || 'Microsoft login failed. Please try again.';
          break;
        case 'invalid_callback':
          errorMessage = 'Invalid callback from Microsoft. Please try again.';
          break;
        case 'invalid_state':
          errorMessage = 'Security validation failed. Please try again.';
          break;
        case 'account_inactive':
          errorMessage = 'Your account is inactive. Please contact administrator.';
          break;
        case 'account_pending_approval':
          errorMessage = 'Your account is pending approval. Please contact administrator.';
          break;
        default:
          errorMessage = message || 'An error occurred during Microsoft login.';
      }

      setServerError(errorMessage);
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@company.com',
      password: 'admin123',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError('');

    try {
      const result = await signIn(data.email, data.password);

      if (result.error) {
        console.error('🔐 LoginPage - Sign in failed:', result.error);
          // Ensure the error is a string before setting it in state to avoid React object render errors
          setServerError(typeof result.error === 'string' ? result.error : String(result.error));
      } else {
        
        // Check if password change is required
        if (result.requirePasswordChange) {
          // The requirePasswordChange state in AuthContext will trigger ForcePasswordChangePage
          return;
        }

        // Always navigate to dashboard on successful login
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('🔐 LoginPage - Unexpected error:', err);
      setServerError('An unexpected error occurred. Please try again.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <AuthCard
        title="Welcome Back"
        subtitle="Sign in to your account to continue"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Server Error Message */}
          {serverError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 dark:text-red-300 text-sm">{serverError}</p>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="pl-10"
                {...register('email')}
                error={errors.email?.message}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="pl-10"
                {...register('password')}
                error={errors.password?.message}
              />
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="flex items-center justify-end">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          {/* Microsoft SSO Section */}
          {showMicrosoftSSO && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    Or continue with
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSsoLoading(true);
                  BackendAuthService.microsoftLogin();
                }}
                disabled={ssoLoading || isSubmitting}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {ssoLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-3" />
                    Redirecting to Microsoft...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 mr-3" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                      <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                      <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                      <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                    </svg>
                    Sign in with Microsoft
                  </>
                )}
              </button>
            </>
          )}
        </form>
      </AuthCard>
    </div>
  );
}

export default LoginPage;
