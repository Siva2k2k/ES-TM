import { PublicClientApplication, LogLevel, Configuration } from '@azure/msal-browser';

/**
 * Microsoft SSO Configuration
 * Hybrid approach: Client-side MSAL for silent detection, server-side for actual authentication
 */

// MSAL configuration for silent SSO detection only
export const msalConfig: Configuration = {
  auth: {
    clientId: '7d2d4ead-c096-42ff-a560-280d5d2aac22', // Your actual client ID
    authority: 'https://login.microsoftonline.com/7ba118fb-fa31-45b6-918a-24dd21e641db', // Your tenant
    redirectUri: globalThis.location?.origin || 'http://localhost:5173', // Frontend URL for silent checks
    postLogoutRedirectUri: globalThis.location?.origin || 'http://localhost:5173',
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        if (level === LogLevel.Error) console.error(message);
      },
      piiLoggingEnabled: false,
      logLevel: LogLevel.Warning,
    },
    windowHashTimeout: 60000,
    iframeHashTimeout: 6000,
    loadFrameTimeout: 0,
  },
};

// Initialize MSAL instance for silent checks only
export const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL
export const initializeMsal = async (): Promise<void> => {
  await msalInstance.initialize();
  
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
  }
};

// Silent request for checking existing sessions
export const silentRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
  forceRefresh: false,
};

/**
 * Check if Microsoft SSO is enabled
 */
export const isMsalConfigured = (): boolean => {
  return import.meta.env.VITE_MICROSOFT_ENABLED === 'true';
};

/**
 * Check if user has silent Microsoft SSO available
 * This doesn't authenticate - just checks if tokens exist
 */
export const checkSilentMicrosoftAuth = async (): Promise<boolean> => {
  if (!isMsalConfigured()) return false;

  try {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) return false;

    msalInstance.setActiveAccount(accounts[0]);

    // Try silent token acquisition
    const response = await msalInstance.acquireTokenSilent({
      ...silentRequest,
      account: accounts[0],
    });

    return !!(response && response.accessToken);
  } catch (error) {
    console.log('Silent Microsoft auth not available:', error);
    return false;
  }
};

export default msalInstance;
