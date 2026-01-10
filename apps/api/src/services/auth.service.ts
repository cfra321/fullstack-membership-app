/**
 * Auth Service
 *
 * Handles authentication operations including registration, login, logout,
 * and OAuth flows for Google and Facebook.
 * Coordinates between user repository, password utilities, and session service.
 */

import { google } from 'googleapis';

import {
  type User,
  type UserDocument,
  type RegisterInput,
  type AuthResult,
} from '@astronacci/shared';

import { PASSWORD } from '../config/constants';
import { GOOGLE_OAUTH, FACEBOOK_OAUTH } from '../config/oauth';
import {
  createUser,
  findByEmail,
  findByGoogleId,
  findByFacebookId,
  updateUser,
} from '../repositories/user.repository';
import { hashPassword, verifyPassword } from '../utils/password';
import {
  ValidationError,
  EmailExistsError,
  InvalidCredentialsError,
  InternalError,
} from '../utils/errors';
import {
  createSession,
  invalidateSession,
  type CreateSessionOptions,
} from './session.service';

/**
 * Google OAuth2 client instance.
 */
const googleOAuth2Client = new google.auth.OAuth2(
  GOOGLE_OAUTH.CLIENT_ID,
  GOOGLE_OAUTH.CLIENT_SECRET,
  GOOGLE_OAUTH.CALLBACK_URL
);

/**
 * Validate email format.
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password meets requirements.
 */
function isValidPassword(password: string): boolean {
  return password.length >= PASSWORD.MIN_LENGTH;
}

/**
 * Normalize email for storage and lookup.
 * Trims whitespace and converts to lowercase.
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Convert UserDocument to public User (without sensitive fields).
 */
function toPublicUser(userDoc: UserDocument): User {
  return {
    id: userDoc.id,
    email: userDoc.email,
    displayName: userDoc.displayName,
    membershipType: userDoc.membershipType,
    authProvider: userDoc.authProvider,
  };
}

/**
 * Register a new user with email and password.
 *
 * Validates input, checks for duplicate email, hashes password,
 * and creates the user with default Type A membership.
 *
 * @param input - Registration data (email, password, displayName)
 * @returns The created user (without sensitive data)
 * @throws ValidationError if input is invalid
 * @throws EmailExistsError if email is already registered
 *
 * @example
 * const user = await register({
 *   email: 'user@example.com',
 *   password: 'SecurePass123',
 *   displayName: 'John Doe',
 * });
 */
export async function register(input: RegisterInput): Promise<User> {
  // Normalize and validate email
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) {
    throw new ValidationError({ email: 'Invalid email format' });
  }

  // Validate password
  if (!isValidPassword(input.password)) {
    throw new ValidationError({
      password: `Password must be at least ${PASSWORD.MIN_LENGTH} characters`,
    });
  }

  // Validate display name
  const displayName = input.displayName.trim();
  if (!displayName) {
    throw new ValidationError({ displayName: 'Display name is required' });
  }

  // Check for existing email
  const existingUser = await findByEmail(email);
  if (existingUser) {
    throw new EmailExistsError();
  }

  // Hash password
  const passwordHash = await hashPassword(input.password);

  // Create user with default membership Type A
  const userDoc = await createUser({
    email,
    displayName,
    authProvider: 'email',
    passwordHash,
    membershipType: 'A',
  });

  return toPublicUser(userDoc);
}

/**
 * Login options for session creation.
 */
export interface LoginOptions {
  /** User agent from the request */
  userAgent?: string;
  /** IP address of the client */
  ipAddress?: string;
}

/**
 * Login a user with email and password.
 *
 * Validates credentials and creates a new session.
 *
 * @param email - User's email address
 * @param password - User's password
 * @param options - Optional session metadata
 * @returns Auth result with user, session token, and expiration
 * @throws InvalidCredentialsError if email or password is incorrect
 *
 * @example
 * const result = await login('user@example.com', 'password123', {
 *   userAgent: req.get('User-Agent'),
 *   ipAddress: req.ip,
 * });
 * res.cookie('session_token', result.sessionToken, COOKIE_OPTIONS);
 */
export async function login(
  email: string,
  password: string,
  options: LoginOptions = {}
): Promise<AuthResult> {
  const normalizedEmail = normalizeEmail(email);

  // Find user by email
  const user = await findByEmail(normalizedEmail);
  if (!user) {
    throw new InvalidCredentialsError();
  }

  // Check if this is an email auth user
  if (user.authProvider !== 'email' || !user.passwordHash) {
    // OAuth user trying to login with password
    throw new InvalidCredentialsError(
      'This account uses social login. Please sign in with your social provider.'
    );
  }

  // Verify password
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new InvalidCredentialsError();
  }

  // Create session
  const sessionOptions: CreateSessionOptions = {
    userAgent: options.userAgent,
    ipAddress: options.ipAddress,
  };
  const session = await createSession(user.id, sessionOptions);

  return {
    user: toPublicUser(user),
    sessionToken: session.token,
    expiresAt: session.expiresAt,
  };
}

/**
 * Logout a user by invalidating their session.
 *
 * @param sessionToken - The session token to invalidate
 *
 * @example
 * await logout(req.cookies.session_token);
 * res.clearCookie('session_token');
 */
export async function logout(sessionToken: string): Promise<void> {
  await invalidateSession(sessionToken);
}

// ============================================================================
// Google OAuth
// ============================================================================

/**
 * Generate Google OAuth authorization URL.
 *
 * @param state - Optional state parameter for CSRF protection
 * @returns The Google OAuth consent URL to redirect the user to
 *
 * @example
 * const url = getGoogleAuthUrl();
 * res.redirect(url);
 */
export function getGoogleAuthUrl(state?: string): string {
  const options: {
    access_type: string;
    scope: readonly string[];
    prompt: string;
    state?: string;
  } = {
    access_type: 'offline',
    scope: GOOGLE_OAUTH.SCOPES,
    prompt: 'consent',
  };

  if (state) {
    options.state = state;
  }

  return googleOAuth2Client.generateAuthUrl(options);
}

/**
 * Google user info from OAuth.
 */
interface GoogleUserInfo {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

/**
 * Handle Google OAuth callback.
 *
 * Exchanges the authorization code for tokens, fetches user info,
 * creates or updates the user, and creates a session.
 *
 * @param code - The authorization code from Google
 * @param options - Optional session metadata
 * @returns Auth result with user, session token, and expiration
 * @throws InternalError if OAuth exchange or user info fetch fails
 *
 * @example
 * const result = await handleGoogleCallback(req.query.code, {
 *   userAgent: req.get('User-Agent'),
 *   ipAddress: req.ip,
 * });
 * res.cookie('session_token', result.sessionToken, COOKIE_OPTIONS);
 * res.redirect('/dashboard');
 */
export async function handleGoogleCallback(
  code: string,
  options: LoginOptions = {}
): Promise<AuthResult> {
  let googleUserInfo: GoogleUserInfo;

  try {
    // Exchange code for tokens
    const { tokens } = await googleOAuth2Client.getToken(code);
    googleOAuth2Client.setCredentials(tokens);

    // Fetch user info
    const oauth2 = google.oauth2({ version: 'v2', auth: googleOAuth2Client });
    const userInfoResponse = await oauth2.userinfo.get();

    if (!userInfoResponse.data.email || !userInfoResponse.data.id) {
      throw new Error('Missing required user info from Google');
    }

    googleUserInfo = {
      id: userInfoResponse.data.id,
      email: userInfoResponse.data.email,
      name: userInfoResponse.data.name ?? undefined,
      picture: userInfoResponse.data.picture ?? undefined,
    };
  } catch (error) {
    throw new InternalError(
      'Failed to authenticate with Google',
      error instanceof Error ? error : undefined
    );
  }

  // Find or create user
  let user: UserDocument | null;

  // First, try to find by Google ID (returning user)
  user = await findByGoogleId(googleUserInfo.id);

  if (!user) {
    // Check if email exists (link accounts)
    const existingEmailUser = await findByEmail(googleUserInfo.email.toLowerCase());

    if (existingEmailUser) {
      // Link Google account to existing user
      await updateUser(existingEmailUser.id, {
        googleId: googleUserInfo.id,
      });
      user = { ...existingEmailUser, googleId: googleUserInfo.id };
    } else {
      // Create new user
      user = await createUser({
        email: googleUserInfo.email.toLowerCase(),
        displayName: googleUserInfo.name || googleUserInfo.email.split('@')[0]!,
        authProvider: 'google',
        googleId: googleUserInfo.id,
        membershipType: 'A',
      });
    }
  }

  // Create session for Google OAuth
  const googleSessionOptions: CreateSessionOptions = {
    userAgent: options.userAgent,
    ipAddress: options.ipAddress,
  };
  const googleSession = await createSession(user.id, googleSessionOptions);

  return {
    user: toPublicUser(user),
    sessionToken: googleSession.token,
    expiresAt: googleSession.expiresAt,
  };
}

// ============================================================================
// Facebook OAuth
// ============================================================================

/**
 * Generate Facebook OAuth authorization URL.
 *
 * @param state - Optional state parameter for CSRF protection
 * @returns The Facebook OAuth consent URL to redirect the user to
 *
 * @example
 * const url = getFacebookAuthUrl();
 * res.redirect(url);
 */
export function getFacebookAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: FACEBOOK_OAUTH.APP_ID,
    redirect_uri: FACEBOOK_OAUTH.CALLBACK_URL,
    scope: FACEBOOK_OAUTH.SCOPES.join(','),
    response_type: 'code',
  });

  if (state) {
    params.set('state', state);
  }

  return `https://www.facebook.com/${FACEBOOK_OAUTH.API_VERSION}/dialog/oauth?${params.toString()}`;
}

/**
 * Facebook user info from OAuth.
 */
interface FacebookUserInfo {
  id: string;
  email: string;
  name?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

/**
 * Facebook access token response.
 */
interface FacebookTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Facebook error response.
 */
interface FacebookErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
  };
}

/**
 * Exchange Facebook authorization code for access token.
 *
 * @param code - The authorization code from Facebook
 * @returns The access token
 * @throws InternalError if token exchange fails
 */
async function exchangeFacebookCode(code: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: FACEBOOK_OAUTH.APP_ID,
    client_secret: FACEBOOK_OAUTH.APP_SECRET,
    redirect_uri: FACEBOOK_OAUTH.CALLBACK_URL,
    code,
  });

  const tokenUrl = `https://graph.facebook.com/${FACEBOOK_OAUTH.API_VERSION}/oauth/access_token?${params.toString()}`;

  const response = await fetch(tokenUrl);
  const data = (await response.json()) as FacebookTokenResponse | FacebookErrorResponse;

  if (!response.ok || 'error' in data) {
    const errorData = data as FacebookErrorResponse;
    throw new Error(errorData.error?.message || 'Failed to exchange code for token');
  }

  return (data as FacebookTokenResponse).access_token;
}

/**
 * Fetch user info from Facebook Graph API.
 *
 * @param accessToken - The Facebook access token
 * @returns The user info
 * @throws InternalError if user info fetch fails
 */
async function fetchFacebookUserInfo(accessToken: string): Promise<FacebookUserInfo> {
  const fields = 'id,email,name,picture';
  const userInfoUrl = `https://graph.facebook.com/${FACEBOOK_OAUTH.API_VERSION}/me?fields=${fields}&access_token=${accessToken}`;

  const response = await fetch(userInfoUrl);
  const data = (await response.json()) as FacebookUserInfo | FacebookErrorResponse;

  if (!response.ok || 'error' in data) {
    const errorData = data as FacebookErrorResponse;
    throw new Error(errorData.error?.message || 'Failed to fetch user info');
  }

  return data as FacebookUserInfo;
}

/**
 * Handle Facebook OAuth callback.
 *
 * Exchanges the authorization code for tokens, fetches user info,
 * creates or updates the user, and creates a session.
 *
 * @param code - The authorization code from Facebook
 * @param options - Optional session metadata
 * @returns Auth result with user, session token, and expiration
 * @throws InternalError if OAuth exchange or user info fetch fails
 *
 * @example
 * const result = await handleFacebookCallback(req.query.code, {
 *   userAgent: req.get('User-Agent'),
 *   ipAddress: req.ip,
 * });
 * res.cookie('session_token', result.sessionToken, COOKIE_OPTIONS);
 * res.redirect('/dashboard');
 */
export async function handleFacebookCallback(
  code: string,
  options: LoginOptions = {}
): Promise<AuthResult> {
  let facebookUserInfo: FacebookUserInfo;

  try {
    // Exchange code for access token
    const accessToken = await exchangeFacebookCode(code);

    // Fetch user info
    facebookUserInfo = await fetchFacebookUserInfo(accessToken);

    if (!facebookUserInfo.email || !facebookUserInfo.id) {
      throw new Error('Missing required user info from Facebook');
    }
  } catch (error) {
    throw new InternalError(
      'Failed to authenticate with Facebook',
      error instanceof Error ? error : undefined
    );
  }

  // Find or create user
  let user: UserDocument | null;

  // First, try to find by Facebook ID (returning user)
  user = await findByFacebookId(facebookUserInfo.id);

  if (!user) {
    // Check if email exists (link accounts)
    const existingEmailUser = await findByEmail(facebookUserInfo.email.toLowerCase());

    if (existingEmailUser) {
      // Link Facebook account to existing user
      await updateUser(existingEmailUser.id, {
        facebookId: facebookUserInfo.id,
      });
      user = { ...existingEmailUser, facebookId: facebookUserInfo.id };
    } else {
      // Create new user
      user = await createUser({
        email: facebookUserInfo.email.toLowerCase(),
        displayName: facebookUserInfo.name || facebookUserInfo.email.split('@')[0]!,
        authProvider: 'facebook',
        facebookId: facebookUserInfo.id,
        membershipType: 'A',
      });
    }
  }

  // Create session for Facebook OAuth
  const facebookSessionOptions: CreateSessionOptions = {
    userAgent: options.userAgent,
    ipAddress: options.ipAddress,
  };
  const facebookSession = await createSession(user.id, facebookSessionOptions);

  return {
    user: toPublicUser(user),
    sessionToken: facebookSession.token,
    expiresAt: facebookSession.expiresAt,
  };
}
