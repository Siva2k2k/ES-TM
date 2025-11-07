import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useMsal } from '@azure/msal-react';
import { BackendAuthService } from '../../services/BackendAuthService';
import { silentRequest, isMsalConfigured } from '../../config/msalConfig';
import type { UserRole, User } from '../../types';

interface AuthContextType {
  currentUser: User | null;
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  setCurrentUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  requirePasswordChange: boolean;
  setRequirePasswordChange: (required: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error?: string; requirePasswordChange?: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('employee');
  const [isLoading, setIsLoading] = useState(true);
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);
  const { instance: msalInstance } = useMsal();

  const isAuthenticated = !!currentUser;

  // Sign in function
  const signIn = useCallback(async (email: string, password: string): Promise<{ error?: string; requirePasswordChange?: boolean }> => {
    try {
      setIsLoading(true);

      const result = await BackendAuthService.login({ email, password });

    if (!result.success) {
        return { error: result.error || result.message };
      }

      if (result.user) {
        setCurrentUser(result.user as User);
        setCurrentUserRole(result.user.role);
      }

      // Check if password change is required
      const passwordChangeRequired = Boolean((result as { requirePasswordChange?: boolean }).requirePasswordChange);
      setRequirePasswordChange(passwordChangeRequired);

      return { requirePasswordChange: passwordChangeRequired };
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      return { error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign out function
  const signOut = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      // Clear local state immediately to ensure UI updates
      setCurrentUser(null);
      setCurrentUserRole('employee');
      setRequirePasswordChange(false);

      // Sign out from backend (clears tokens)
      await BackendAuthService.logout();

    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      // Clear state and loading on completion/error
      setCurrentUser(null);
      setCurrentUserRole('employee');
      setRequirePasswordChange(false);
      setIsLoading(false);
    }
  }, []);

  // Load user profile
  const loadUserProfile = useCallback(async (): Promise<void> => {
    try {
      const { user, error } = await BackendAuthService.getProfile();

      if (error) {
        console.error('Error loading user profile:', error);
        // If profile fetch fails, clear auth state
        setCurrentUser(null);
        setCurrentUserRole('employee');
        return;
      }

      if (user) {
        setCurrentUser(user);
        setCurrentUserRole(user.role);
      }
    } catch (error) {
      console.error('Exception in loadUserProfile:', error);
      setCurrentUser(null);
      setCurrentUserRole('employee');
    }
  }, []);

  // Attempt silent Microsoft SSO authentication (for SharePoint seamless login)
  const attemptSilentMicrosoftAuth = useCallback(async (): Promise<boolean> => {
    // Only attempt if MSAL is configured and no existing auth
    if (!isMsalConfigured() || BackendAuthService.isAuthenticated()) {
      return false;
    }

    try {
      console.log('Attempting silent Microsoft authentication...');

      const accounts = msalInstance.getAllAccounts();
      if (accounts.length === 0) {
        // No Microsoft account in cache
        return false;
      }

      // Set active account
      msalInstance.setActiveAccount(accounts[0]);

      // Try to acquire token silently
      const response = await msalInstance.acquireTokenSilent({
        ...silentRequest,
        account: accounts[0],
      });

      if (response && response.accessToken) {
        console.log('Silent Microsoft authentication successful');

        // We got a Microsoft token, but we need to redirect through backend
        // to get our JWT tokens and create/merge user account
        // For now, just log success - user will need to click "Sign in with Microsoft"
        // In production, you could auto-redirect here
        return true;
      }

      return false;
    } catch (error) {
      console.log('Silent Microsoft authentication not available:', error);
      return false;
    }
  }, [msalInstance]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Check if user has valid tokens
        if (BackendAuthService.isAuthenticated()) {
          // Try to refresh token if needed
          if (BackendAuthService.shouldRefreshToken()) {
            const refreshResult = await BackendAuthService.refreshToken();
            if (!refreshResult.success) {
              setIsLoading(false);
              return;
            }
          }

          // Load user profile
          await loadUserProfile();
        } else {
          // No local auth - attempt silent Microsoft SSO
          await attemptSilentMicrosoftAuth();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Initialize
    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [loadUserProfile, attemptSilentMicrosoftAuth]);

  const value: AuthContextType = useMemo(() => ({
    currentUser,
    currentUserRole,
    setCurrentUserRole,
    setCurrentUser,
    isAuthenticated,
    isLoading,
    requirePasswordChange,
    setRequirePasswordChange,
    signIn,
    signOut,
  }), [
    currentUser,
    currentUserRole,
    isAuthenticated,
    isLoading,
    requirePasswordChange,
    signIn,
    signOut,
    setCurrentUserRole,
    setCurrentUser,
    setRequirePasswordChange
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};