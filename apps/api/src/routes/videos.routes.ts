/**
 * Videos Routes
 *
 * Endpoints for listing and accessing videos.
 * All routes require authentication and enforce quota limits.
 */

import { Router, type Request, type Response } from 'express';

import {
  listVideosForUser,
  getVideo,
} from '../services/content.service';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Apply auth middleware to all video routes
router.use(requireAuth);

/**
 * GET /api/videos
 *
 * List all videos with previews (no video URL).
 * Returns usage stats and accessed IDs for UI indicators.
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;

    const result = await listVideosForUser(userId);

    res.json({
      data: {
        videos: result.videos,
        usage: result.usage,
        accessedIds: result.accessedIds,
      },
    });
  })
);

/**
 * GET /api/videos/:id
 *
 * Get a single video with full details including video URL.
 * Enforces quota - returns 403 if user has exceeded their limit.
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const videoId = req.params.id;

    const video = await getVideo(userId, videoId);

    res.json({
      data: video,
    });
  })
);

export default router;
