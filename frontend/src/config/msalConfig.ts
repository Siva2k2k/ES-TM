/**
 * Microsoft OAuth Configuration
 * Server-side only OAuth handling for "Sign in with Microsoft"
 * No client-side MSAL or silent SSO functionality
 */

/**
 * Check if Microsoft OAuth is enabled
 */
export const isMicrosoftOAuthEnabled = (): boolean => {
  return true; // Set to true to enable Microsoft OAuth
};

/**
 * Redirect to server-side Microsoft OAuth endpoint
 */
export const redirectToMicrosoftOAuth = (): void => {
  if (!isMicrosoftOAuthEnabled()) {
    console.warn('Microsoft OAuth is not enabled');
    return;
  }

  // Redirect to backend Microsoft OAuth endpoint
  // Backend will handle the OAuth flow and redirect back to frontend
  window.location.href = '/api/v1/auth/microsoft';
};

// No MSAL instance or client-side authentication
export const msalInstance = null;
