/**
 * Session Service
 *
 * Manages session lifecycle including creation, validation, and invalidation.
 * Coordinates between crypto utilities and session/user repositories.
 */

import { type UserDocument } from '@astronacci/shared';

import { SESSION } from '../config/constants';
import {
  createSession as createSessionInDb,
  findByToken,
  deleteSession,
  type SessionDocument,
} from '../repositories/session.repository';
import { findById } from '../repositories/user.repository';
import { generateSessionToken } from '../utils/crypto';

/**
 * Options for creating a session.
 */
export interface CreateSessionOptions {
  /** User agent from the request */
  userAgent?: string;
  /** IP address of the client */
  ipAddress?: string;
}

/**
 * Result of a successful session validation.
 */
export interface ValidSessionResult {
  /** The authenticated user */
  user: UserDocument;
  /** The session information */
  session: SessionDocument;
}

/**
 * Create a new session for a user.
 *
 * Generates a cryptographically secure session token and stores
 * the session in Firestore with an expiration time.
 *
 * @param userId - The user ID to create a session for
 * @param options - Optional session metadata (userAgent, ipAddress)
 * @returns The created session document
 *
 * @example
 * const session = await createSession(user.id, {
 *   userAgent: req.get('User-Agent'),
 *   ipAddress: req.ip,
 * });
 * res.cookie('session_token', session.token, COOKIE_OPTIONS);
 */
export async function createSession(
  userId: string,
  options: CreateSessionOptions = {}
): Promise<SessionDocument> {
  // Generate a secure session token
  const token = generateSessionToken();

  // Calculate expiration time (default: 7 days)
  const expiresAt = new Date(Date.now() + SESSION.MAX_AGE);

  // Store the session in Firestore
  const session = await createSessionInDb({
    token,
    userId,
    expiresAt,
    userAgent: options.userAgent,
    ipAddress: options.ipAddress,
  });

  return session;
}

/**
 * Validate a session token and return the associated user.
 *
 * Checks if the session exists and hasn't expired, then fetches
 * the associated user. Returns null if the session is invalid
 * or the user no longer exists.
 *
 * @param token - The session token to validate
 * @returns The user and session if valid, null otherwise
 *
 * @example
 * const result = await validateSession(req.cookies.session_token);
 * if (!result) {
 *   throw new UnauthorizedError();
 * }
 * req.user = result.user;
 */
export async function validateSession(token: string): Promise<ValidSessionResult | null> {
  // Find the session (repository handles expiration check)
  const session = await findByToken(token);

  if (!session) {
    return null;
  }

  // Fetch the user associated with this session
  const user = await findById(session.userId);

  if (!user) {
    // User was deleted but session still exists
    // Clean up the orphaned session
    await deleteSession(token);
    return null;
  }

  return {
    user,
    session,
  };
}

/**
 * Invalidate a session by removing it from Firestore.
 *
 * Used for logout functionality. Does not throw if the session
 * doesn't exist (idempotent operation).
 *
 * @param token - The session token to invalidate
 *
 * @example
 * await invalidateSession(req.cookies.session_token);
 * res.clearCookie('session_token');
 */
export async function invalidateSession(token: string): Promise<void> {
  await deleteSession(token);
}

/**
 * Refresh a session's expiration time.
 *
 * Creates a new session and invalidates the old one.
 * Useful for keeping active users logged in.
 *
 * @param oldToken - The current session token
 * @param options - Optional session metadata to update
 * @returns The new session or null if old session was invalid
 */
export async function refreshSession(
  oldToken: string,
  options: CreateSessionOptions = {}
): Promise<SessionDocument | null> {
  // Validate the existing session
  const result = await validateSession(oldToken);

  if (!result) {
    return null;
  }

  // Create a new session
  const newSession = await createSession(result.user.id, options);

  // Invalidate the old session
  await invalidateSession(oldToken);

  return newSession;
}
