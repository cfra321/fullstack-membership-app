/**
 * Auth Routes
 *
 * Authentication endpoints for registration, login, logout, and OAuth flows.
 * All routes use HttpOnly cookies for session management.
 */

import { Router, type Request, type Response } from 'express';

import { CORS } from '../config/constants';
import { COOKIE_OPTIONS, SESSION } from '../config/constants';
import {
  register,
  login,
  logout,
  getGoogleAuthUrl,
  handleGoogleCallback,
  getFacebookAuthUrl,
  handleFacebookCallback,
} from '../services/auth.service';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimit';
import { validate, registerSchema, loginSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * POST /api/auth/register
 *
 * Register a new user with email and password.
 * Returns 201 on success with a message.
 */
router.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, displayName } = req.body as {
      email: string;
      password: string;
      displayName: string;
    };

    await register({ email, password, displayName });

    res.status(201).json({
      data: {
        message: 'Registration successful. Please log in.',
      },
    });
  })
);

/**
 * POST /api/auth/login
 *
 * Login with email and password.
 * Sets HttpOnly session cookie and returns user data.
 */
router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    const result = await login(email, password, {
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
    });

    // Set HttpOnly session cookie
    res.cookie(SESSION.COOKIE_NAME, result.sessionToken, COOKIE_OPTIONS);

    res.json({
      data: {
        user: result.user,
        expiresAt: result.expiresAt.toISOString(),
      },
    });
  })
);

/**
 * POST /api/auth/logout
 *
 * Logout the current user by invalidating their session.
 * Clears the session cookie.
 */
router.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;

    await logout(authReq.session.token);

    // Clear the session cookie
    res.clearCookie(SESSION.COOKIE_NAME, {
      httpOnly: COOKIE_OPTIONS.httpOnly,
      secure: COOKIE_OPTIONS.secure,
      sameSite: COOKIE_OPTIONS.sameSite,
      path: COOKIE_OPTIONS.path,
    });

    res.json({
      data: {
        message: 'Logged out successfully',
      },
    });
  })
);

/**
 * GET /api/auth/me
 *
 * Get the current authenticated user.
 * Requires valid session cookie.
 */
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;

    // Return user data without sensitive fields
    const { passwordHash, ...userData } = authReq.user as Record<string, unknown>;

    res.json({
      data: userData,
    });
  })
);

// ============================================================================
// Google OAuth
// ============================================================================

/**
 * GET /api/auth/google
 *
 * Redirect to Google OAuth consent screen.
 */
router.get('/google', (_req: Request, res: Response) => {
  const url = getGoogleAuthUrl();
  res.redirect(url);
});

/**
 * GET /api/auth/google/callback
 *
 * Handle Google OAuth callback.
 * Sets session cookie and redirects to frontend.
 */
router.get(
  '/google/callback',
  asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.query as { code?: string };
    const frontendUrl = CORS.ORIGIN;

    if (!code) {
      res.redirect(`${frontendUrl}/login?error=missing_code`);
      return;
    }

    try {
      const result = await handleGoogleCallback(code, {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
      });

      // Set HttpOnly session cookie
      res.cookie(SESSION.COOKIE_NAME, result.sessionToken, COOKIE_OPTIONS);

      // Redirect to frontend dashboard
      res.redirect(`${frontendUrl}/dashboard`);
    } catch (error) {
      // Log error for debugging
      console.error('Google OAuth error:', error);
      // Redirect to login with error
      res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  })
);

// ============================================================================
// Facebook OAuth
// ============================================================================

/**
 * GET /api/auth/facebook
 *
 * Redirect to Facebook OAuth consent screen.
 */
router.get('/facebook', (_req: Request, res: Response) => {
  const url = getFacebookAuthUrl();
  res.redirect(url);
});

/**
 * GET /api/auth/facebook/callback
 *
 * Handle Facebook OAuth callback.
 * Sets session cookie and redirects to frontend.
 */
router.get(
  '/facebook/callback',
  asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.query as { code?: string };
    const frontendUrl = CORS.ORIGIN;

    if (!code) {
      res.redirect(`${frontendUrl}/login?error=missing_code`);
      return;
    }

    try {
      const result = await handleFacebookCallback(code, {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
      });

      // Set HttpOnly session cookie
      res.cookie(SESSION.COOKIE_NAME, result.sessionToken, COOKIE_OPTIONS);

      // Redirect to frontend dashboard
      res.redirect(`${frontendUrl}/dashboard`);
    } catch {
      // Redirect to login with error
      res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  })
);

export default router;
