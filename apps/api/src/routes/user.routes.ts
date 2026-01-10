/**
 * User Routes
 *
 * Endpoints for user profile and usage statistics.
 * All routes require authentication.
 */

import { Router, type Request, type Response } from 'express';

import { getProfile, getUsage } from '../services/user.service';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Apply auth middleware to all user routes
router.use(requireAuth);

/**
 * GET /api/user/profile
 *
 * Get the current user's profile.
 * Returns user data without sensitive fields.
 */
router.get(
  '/profile',
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;

    const profile = await getProfile(userId);

    res.json({
      data: profile,
    });
  })
);

/**
 * GET /api/user/usage
 *
 * Get the current user's content usage statistics.
 * Returns counts, limits, and remaining quota for articles and videos.
 */
router.get(
  '/usage',
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;

    const usage = await getUsage(userId);

    res.json({
      data: usage,
    });
  })
);

export default router;
