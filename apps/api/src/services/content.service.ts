/**
 * Content Service
 *
 * Provides content retrieval with quota enforcement.
 * Coordinates between content repository and quota service to ensure
 * users can only access content within their membership limits.
 */

import {
  type Article,
  type ArticlePreview,
  type Video,
  type VideoPreview,
  type UsageStats,
} from '@astronacci/shared';

import {
  listArticles as listArticlesRepo,
  getArticleById,
  listVideos as listVideosRepo,
  getVideoById,
} from '../repositories/content.repository';
import {
  checkAccess,
  recordAccess,
  getUsageStats,
} from './quota.service';
import {
  QuotaExceededError,
  ArticleNotFoundError,
  VideoNotFoundError,
} from '../utils/errors';

/**
 * Result of listing articles for a user.
 * Includes usage stats and accessed IDs for UI indicators.
 */
export interface ArticleListResult {
  /** Array of article previews */
  articles: ArticlePreview[];
  /** User's current usage statistics */
  usage: UsageStats;
  /** IDs of articles the user has already accessed */
  accessedIds: string[];
}

/**
 * Result of listing videos for a user.
 * Includes usage stats and accessed IDs for UI indicators.
 */
export interface VideoListResult {
  /** Array of video previews */
  videos: VideoPreview[];
  /** User's current usage statistics */
  usage: UsageStats;
  /** IDs of videos the user has already accessed */
  accessedIds: string[];
}

/**
 * List articles for a user with usage information.
 *
 * Returns article previews (without full content) along with
 * the user's usage stats and which articles they've accessed.
 * This enables the UI to show access indicators.
 *
 * @param userId - The user's ID
 * @param limit - Maximum number of articles to return
 * @returns Article previews with usage information
 *
 * @example
 * const { articles, usage, accessedIds } = await listArticlesForUser(user.id);
 * articles.forEach(article => {
 *   const isAccessed = accessedIds.includes(article.id);
 *   console.log(`${article.title} - ${isAccessed ? 'Read' : 'New'}`);
 * });
 * console.log(`${usage.articles.remaining} articles remaining`);
 */
export async function listArticlesForUser(
  userId: string,
  limit?: number
): Promise<ArticleListResult> {
  // Fetch articles and usage in parallel
  const [articles, usage] = await Promise.all([
    listArticlesRepo(limit),
    getUsageStats(userId),
  ]);

  return {
    articles,
    usage,
    accessedIds: usage.articles.accessed,
  };
}

/**
 * Get a full article with quota enforcement.
 *
 * Checks the user's quota before returning the full article content.
 * Records the access if this is a new article for the user.
 *
 * @param userId - The user's ID
 * @param articleId - The article ID to retrieve
 * @returns The full article with content
 * @throws QuotaExceededError if user has reached their article limit
 * @throws ArticleNotFoundError if article doesn't exist
 *
 * @example
 * try {
 *   const article = await getArticle(user.id, 'article-123');
 *   console.log(article.content); // Full protected content
 * } catch (error) {
 *   if (error instanceof QuotaExceededError) {
 *     // Show upgrade prompt
 *   }
 * }
 */
export async function getArticle(
  userId: string,
  articleId: string
): Promise<Article> {
  // Check quota first
  const accessResult = await checkAccess(userId, 'article', articleId);

  if (!accessResult.allowed) {
    throw new QuotaExceededError(
      accessResult.currentUsage ?? 0,
      accessResult.limit ?? 0,
      'unknown' // Will be populated by the error handler with user's actual type
    );
  }

  // Fetch the full article
  const article = await getArticleById(articleId);

  if (!article) {
    throw new ArticleNotFoundError();
  }

  // Record access only if this is a new access (not already accessed)
  if (accessResult.reason === 'within_quota') {
    await recordAccess(userId, 'article', articleId);
  }

  return article;
}

/**
 * List videos for a user with usage information.
 *
 * Returns video previews (without video URL) along with
 * the user's usage stats and which videos they've accessed.
 * This enables the UI to show access indicators.
 *
 * @param userId - The user's ID
 * @param limit - Maximum number of videos to return
 * @returns Video previews with usage information
 *
 * @example
 * const { videos, usage, accessedIds } = await listVideosForUser(user.id);
 * videos.forEach(video => {
 *   const isWatched = accessedIds.includes(video.id);
 *   console.log(`${video.title} - ${isWatched ? 'Watched' : 'New'}`);
 * });
 * console.log(`${usage.videos.remaining} videos remaining`);
 */
export async function listVideosForUser(
  userId: string,
  limit?: number
): Promise<VideoListResult> {
  // Fetch videos and usage in parallel
  const [videos, usage] = await Promise.all([
    listVideosRepo(limit),
    getUsageStats(userId),
  ]);

  return {
    videos,
    usage,
    accessedIds: usage.videos.accessed,
  };
}

/**
 * Get a full video with quota enforcement.
 *
 * Checks the user's quota before returning the full video with URL.
 * Records the access if this is a new video for the user.
 *
 * @param userId - The user's ID
 * @param videoId - The video ID to retrieve
 * @returns The full video with URL
 * @throws QuotaExceededError if user has reached their video limit
 * @throws VideoNotFoundError if video doesn't exist
 *
 * @example
 * try {
 *   const video = await getVideo(user.id, 'video-123');
 *   console.log(video.videoUrl); // Protected video URL
 * } catch (error) {
 *   if (error instanceof QuotaExceededError) {
 *     // Show upgrade prompt
 *   }
 * }
 */
export async function getVideo(
  userId: string,
  videoId: string
): Promise<Video> {
  // Check quota first
  const accessResult = await checkAccess(userId, 'video', videoId);

  if (!accessResult.allowed) {
    throw new QuotaExceededError(
      accessResult.currentUsage ?? 0,
      accessResult.limit ?? 0,
      'unknown' // Will be populated by the error handler with user's actual type
    );
  }

  // Fetch the full video
  const video = await getVideoById(videoId);

  if (!video) {
    throw new VideoNotFoundError();
  }

  // Record access only if this is a new access (not already accessed)
  if (accessResult.reason === 'within_quota') {
    await recordAccess(userId, 'video', videoId);
  }

  return video;
}

/**
 * Get content usage stats for a user.
 *
 * Convenience wrapper around quota service's getUsageStats.
 *
 * @param userId - The user's ID
 * @returns Usage statistics
 */
export async function getContentUsage(userId: string): Promise<UsageStats> {
  return getUsageStats(userId);
}
