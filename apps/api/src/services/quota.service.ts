/**
 * Quota Service
 *
 * Enforces membership-based access limits for content.
 * Coordinates between user repository and usage repository to
 * check and record content access.
 */

import {
  type MembershipType,
  type AccessResult,
  type UsageStats,
  MEMBERSHIP_LIMITS,
} from '@astronacci/shared';

import { findById } from '../repositories/user.repository';
import {
  getUsage,
  recordArticleAccess,
  recordVideoAccess,
} from '../repositories/usage.repository';
import { NotFoundError } from '../utils/errors';

/**
 * Content type for quota checking.
 */
export type ContentType = 'article' | 'video';

/**
 * Get the limit for a membership type and content type.
 */
function getLimit(membershipType: MembershipType, contentType: ContentType): number {
  const limits = MEMBERSHIP_LIMITS[membershipType];
  return contentType === 'article' ? limits.articles : limits.videos;
}

/**
 * Check if a user has already accessed specific content.
 */
function hasAccessed(
  accessedIds: string[],
  contentId: string
): boolean {
  return accessedIds.includes(contentId);
}

/**
 * Check if a user can access specific content.
 *
 * This is the core quota enforcement function. It checks:
 * 1. If the user has already accessed this content (always allowed)
 * 2. If the user's current usage is within their membership limits
 *
 * @param userId - The user's ID
 * @param contentType - Either 'article' or 'video'
 * @param contentId - The specific content ID being accessed
 * @returns Access result with allowed status and reason
 * @throws NotFoundError if user doesn't exist
 *
 * @example
 * const result = await checkAccess(user.id, 'article', 'article-123');
 * if (!result.allowed) {
 *   throw new QuotaExceededError(result.currentUsage, result.limit, membership);
 * }
 */
export async function checkAccess(
  userId: string,
  contentType: ContentType,
  contentId: string
): Promise<AccessResult> {
  // Get user to determine membership type
  const user = await findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Get current usage
  const usage = await getUsage(userId);
  const accessedIds = contentType === 'article'
    ? usage.articlesAccessed
    : usage.videosAccessed;

  // Check if already accessed (always allowed)
  if (hasAccessed(accessedIds, contentId)) {
    return {
      allowed: true,
      reason: 'already_accessed',
      currentUsage: accessedIds.length,
      limit: getLimit(user.membershipType, contentType),
    };
  }

  // Check quota
  const limit = getLimit(user.membershipType, contentType);
  const currentUsage = accessedIds.length;

  if (currentUsage >= limit) {
    return {
      allowed: false,
      reason: 'quota_exceeded',
      currentUsage,
      limit,
    };
  }

  return {
    allowed: true,
    reason: 'within_quota',
    currentUsage,
    limit,
  };
}

/**
 * Record that a user has accessed specific content.
 *
 * Should only be called after checkAccess returns allowed: true.
 * Uses Firestore arrayUnion to prevent duplicates.
 *
 * @param userId - The user's ID
 * @param contentType - Either 'article' or 'video'
 * @param contentId - The specific content ID being accessed
 *
 * @example
 * const result = await checkAccess(user.id, 'article', 'article-123');
 * if (result.allowed) {
 *   await recordAccess(user.id, 'article', 'article-123');
 *   // Return content
 * }
 */
export async function recordAccess(
  userId: string,
  contentType: ContentType,
  contentId: string
): Promise<void> {
  if (contentType === 'article') {
    await recordArticleAccess(userId, contentId);
  } else {
    await recordVideoAccess(userId, contentId);
  }
}

/**
 * Get usage statistics for a user.
 *
 * Returns comprehensive usage data including:
 * - List of accessed content IDs
 * - Current counts
 * - Membership limits
 * - Remaining quota
 *
 * @param userId - The user's ID
 * @returns Usage statistics for the user
 * @throws NotFoundError if user doesn't exist
 *
 * @example
 * const stats = await getUsageStats(user.id);
 * console.log(`Articles: ${stats.articles.count}/${stats.articles.limit}`);
 * console.log(`Remaining: ${stats.articles.remaining}`);
 */
export async function getUsageStats(userId: string): Promise<UsageStats> {
  // Get user to determine membership type
  const user = await findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Get current usage
  const usage = await getUsage(userId);
  const limits = MEMBERSHIP_LIMITS[user.membershipType];

  // Calculate remaining (handle Infinity correctly)
  const articlesRemaining = limits.articles === Infinity
    ? Infinity
    : Math.max(0, limits.articles - usage.articlesAccessed.length);

  const videosRemaining = limits.videos === Infinity
    ? Infinity
    : Math.max(0, limits.videos - usage.videosAccessed.length);

  return {
    articles: {
      accessed: usage.articlesAccessed,
      count: usage.articlesAccessed.length,
      limit: limits.articles,
      remaining: articlesRemaining,
    },
    videos: {
      accessed: usage.videosAccessed,
      count: usage.videosAccessed.length,
      limit: limits.videos,
      remaining: videosRemaining,
    },
    membershipType: user.membershipType,
  };
}

/**
 * Check if a user can access new content (not previously accessed).
 *
 * Convenience function that checks if there's remaining quota.
 *
 * @param userId - The user's ID
 * @param contentType - Either 'article' or 'video'
 * @returns true if user has remaining quota
 */
export async function hasRemainingQuota(
  userId: string,
  contentType: ContentType
): Promise<boolean> {
  const stats = await getUsageStats(userId);
  const remaining = contentType === 'article'
    ? stats.articles.remaining
    : stats.videos.remaining;
  return remaining > 0;
}
