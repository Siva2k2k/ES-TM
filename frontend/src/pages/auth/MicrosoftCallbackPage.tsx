import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { BackendAuthService } from '../../services/BackendAuthService';
import { useAuth } from '../../store/contexts/AuthContext';

/**
 * Microsoft OAuth Callback Handler Page
 * Handles the callback from Microsoft OAuth flow and exchanges tokens
 */
export function MicrosoftCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setCurrentUser, setCurrentUserRole } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing Microsoft login...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Handle Microsoft callback
        const result = BackendAuthService.handleMicrosoftCallback(searchParams);

        if (result.success && result.tokens) {
          setStatus('success');
          setMessage('Microsoft login successful! Redirecting...');

          // Load user profile
          const profileResult = await BackendAuthService.getProfile();

          if (profileResult.user) {
            setCurrentUser(profileResult.user as any);
            setCurrentUserRole(profileResult.user.role);
          }

          // Redirect to dashboard after short delay
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1500);
        } else {
          setStatus('error');
          setMessage(result.error || result.message || 'Microsoft login failed');

          // Redirect to login after delay
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
        }
      } catch (error) {
        console.error('Microsoft callback error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred during Microsoft login');

        // Redirect to login after delay
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, setCurrentUser, setCurrentUserRole]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-16 w-16 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Signing you in
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Login Successful!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Login Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default MicrosoftCallbackPage;
