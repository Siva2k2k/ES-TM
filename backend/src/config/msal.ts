import { logger } from './logger';

/**
 * Microsoft OAuth2 Configuration
 * Simplified configuration for Microsoft SSO without MSAL dependency
 */

/**
 * Get authorization URL for Microsoft login
 */
export const getAuthorizationUrl = async (state: string): Promise<string> => {
  if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET || !process.env.MICROSOFT_REDIRECT_URI) {
    throw new Error('Microsoft SSO not properly configured');
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
  const redirectUri = encodeURIComponent(process.env.MICROSOFT_REDIRECT_URI);
  const scopes = encodeURIComponent('openid profile email User.Read');

  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
    `client_id=${clientId}` +
    `&response_type=code` +
    `&redirect_uri=${redirectUri}` +
    `&response_mode=query` +
    `&scope=${scopes}` +
    `&state=${state}` +
    `&prompt=select_account`;

  logger.info('Generated Microsoft authorization URL');
  return authUrl;
};

/**
 * Exchange authorization code for access token
 */
export const acquireTokenByCode = async (code: string) => {
  if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET || !process.env.MICROSOFT_REDIRECT_URI) {
    throw new Error('Microsoft SSO not properly configured');
  }

  const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
      scope: 'openid profile email User.Read'
    })
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.text();
    logger.error('Failed to acquire token by code:', errorData);
    throw new Error('Failed to exchange code for token');
  }

  const tokenData = await tokenResponse.json();
  logger.info('Successfully exchanged code for Microsoft token');
  return tokenData;
};

/**
 * Validate access token and extract user info
 */
export const validateAndExtractUserInfo = (tokenResponse: any) => {
  if (!tokenResponse.access_token) {
    throw new Error('No access token in response');
  }

  return {
    microsoftId: tokenResponse.id_token ? extractFromIdToken(tokenResponse.id_token) : null,
    email: tokenResponse.id_token ? extractFromIdToken(tokenResponse.id_token)?.email : null,
    name: tokenResponse.id_token ? extractFromIdToken(tokenResponse.id_token)?.name : null,
    idToken: tokenResponse.id_token,
    accessToken: tokenResponse.access_token,
  };
};

/**
 * Extract user info from ID token
 */
const extractFromIdToken = (idToken: string) => {
  try {
    const base64Url = idToken.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64')
        .toString('ascii')
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);
    
    return {
      microsoftId: payload.oid || payload.sub,
      email: payload.preferred_username || payload.email,
      name: payload.name || '',
    };
  } catch (error) {
    logger.error('Failed to extract info from ID token:', error);
    return null;
  }
};

export default {
  getAuthorizationUrl,
  acquireTokenByCode,
  validateAndExtractUserInfo,
};
