/**
 * Auth Middleware
 *
 * Provides authentication middleware for protecting routes.
 * Extracts session token from HttpOnly cookie and validates
 * against the session service.
 */

import { type Request, type Response, type NextFunction } from 'express';

import { type UserDocument } from '@astronacci/shared';

import { validateSession, type ValidSessionResult } from '../services/session.service';
import { UnauthorizedError, SessionInvalidError } from '../utils/errors';
import { type SessionDocument } from '../repositories/session.repository';

/**
 * Cookie name for session token.
 */
const SESSION_COOKIE_NAME = 'session_token';

/**
 * Extended Express Request with user property.
 */
export interface AuthenticatedRequest extends Request {
  /** The authenticated user */
  user: UserDocument;
  /** The session information */
  session: SessionDocument;
}

/**
 * Extract and clean session token from request cookies.
 *
 * @param req - Express request object
 * @returns The session token or null if not present
 */
function extractSessionToken(req: Request): string | null {
  const token = req.cookies?.[SESSION_COOKIE_NAME];

  if (!token || typeof token !== 'string') {
    return null;
  }

  // Trim whitespace
  const cleanToken = token.trim();

  return cleanToken || null;
}

/**
 * Require authentication middleware.
 *
 * Validates the session token from the HttpOnly cookie.
 * Attaches the user to req.user if valid.
 * Returns 401 if not authenticated.
 *
 * @example
 * // Protect a single route
 * router.get('/profile', requireAuth, (req, res) => {
 *   res.json({ data: req.user });
 * });
 *
 * @example
 * // Protect all routes in a router
 * router.use(requireAuth);
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract session token from cookie
    const token = extractSessionToken(req);

    if (!token) {
      next(new UnauthorizedError());
      return;
    }

    // Validate the session
    const result = await validateSession(token);

    if (!result) {
      next(new SessionInvalidError());
      return;
    }

    // Attach user and session to request
    (req as AuthenticatedRequest).user = result.user;
    (req as AuthenticatedRequest).session = result.session;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication middleware.
 *
 * Attempts to validate the session if present, but doesn't
 * require authentication. Useful for routes that behave
 * differently based on auth status.
 *
 * @example
 * router.get('/articles', optionalAuth, (req, res) => {
 *   if (req.user) {
 *     // Show personalized content
 *   } else {
 *     // Show public content
 *   }
 * });
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract session token from cookie
    const token = extractSessionToken(req);

    if (!token) {
      // No token, continue without user
      next();
      return;
    }

    // Attempt to validate the session
    const result = await validateSession(token);

    if (result) {
      // Attach user and session to request
      (req as AuthenticatedRequest).user = result.user;
      (req as AuthenticatedRequest).session = result.session;
    }

    // Continue regardless of validation result
    next();
  } catch {
    // Silently continue on errors for optional auth
    next();
  }
}

/**
 * Type guard to check if request is authenticated.
 *
 * @param req - Express request object
 * @returns true if the request has an authenticated user
 *
 * @example
 * if (isAuthenticated(req)) {
 *   // req.user is now typed as UserDocument
 *   console.log(req.user.email);
 * }
 */
export function isAuthenticated(req: Request): req is AuthenticatedRequest {
  return (req as AuthenticatedRequest).user !== undefined;
}

/**
 * Get the authenticated user from request.
 * Throws UnauthorizedError if not authenticated.
 *
 * @param req - Express request object
 * @returns The authenticated user
 * @throws UnauthorizedError if not authenticated
 *
 * @example
 * const user = getAuthenticatedUser(req);
 * console.log(user.email);
 */
export function getAuthenticatedUser(req: Request): UserDocument {
  if (!isAuthenticated(req)) {
    throw new UnauthorizedError();
  }
  return req.user;
}
