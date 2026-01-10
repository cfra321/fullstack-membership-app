/**
 * Articles Routes
 *
 * Endpoints for listing and accessing articles.
 * All routes require authentication and enforce quota limits.
 */

import { Router, type Request, type Response } from 'express';

import {
  listArticlesForUser,
  getArticle,
} from '../services/content.service';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Apply auth middleware to all article routes
router.use(requireAuth);

/**
 * GET /api/articles
 *
 * List all articles with previews (no full content).
 * Returns usage stats and accessed IDs for UI indicators.
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;

    const result = await listArticlesForUser(userId);

    res.json({
      data: {
        articles: result.articles,
        usage: result.usage,
        accessedIds: result.accessedIds,
      },
    });
  })
);

/**
 * GET /api/articles/:id
 *
 * Get a single article with full content.
 * Enforces quota - returns 403 if user has exceeded their limit.
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const articleId = req.params.id;

    const article = await getArticle(userId, articleId);

    res.json({
      data: article,
    });
  })
);

export default router;
