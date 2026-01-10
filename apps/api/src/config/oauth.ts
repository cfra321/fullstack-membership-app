/**
 * OAuth Configuration
 *
 * Configuration for OAuth providers (Google, Facebook).
 * Uses environment variables for secrets.
 */

/**
 * Google OAuth configuration.
 */
export const GOOGLE_OAUTH = {
  /** Google OAuth Client ID */
  CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  /** Google OAuth Client Secret */
  CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  /** Callback URL after OAuth consent */
  CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
  /** OAuth scopes to request */
  SCOPES: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
} as const;

/**
 * Facebook OAuth configuration.
 */
export const FACEBOOK_OAUTH = {
  /** Facebook App ID */
  APP_ID: process.env.FACEBOOK_APP_ID || '',
  /** Facebook App Secret */
  APP_SECRET: process.env.FACEBOOK_APP_SECRET || '',
  /** Callback URL after OAuth consent */
  CALLBACK_URL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3001/api/auth/facebook/callback',
  /** OAuth scopes to request */
  SCOPES: ['email', 'public_profile'],
  /** Facebook Graph API version */
  API_VERSION: 'v18.0',
} as const;

/**
 * Frontend URL for redirects after OAuth.
 */
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Validate that required Google OAuth config is present.
 */
export function validateGoogleOAuthConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!GOOGLE_OAUTH.CLIENT_ID) {
    missing.push('GOOGLE_CLIENT_ID');
  }
  if (!GOOGLE_OAUTH.CLIENT_SECRET) {
    missing.push('GOOGLE_CLIENT_SECRET');
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Validate that required Facebook OAuth config is present.
 */
export function validateFacebookOAuthConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!FACEBOOK_OAUTH.APP_ID) {
    missing.push('FACEBOOK_APP_ID');
  }
  if (!FACEBOOK_OAUTH.APP_SECRET) {
    missing.push('FACEBOOK_APP_SECRET');
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
