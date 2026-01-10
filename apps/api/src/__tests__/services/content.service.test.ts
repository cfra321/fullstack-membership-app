/**
 * Content Service Tests
 *
 * Tests for content retrieval with quota integration.
 * Validates that content access is properly gated by membership quota.
 */

import {
  type Article,
  type ArticlePreview,
  type Video,
  type VideoPreview,
  type MembershipType,
} from '@astronacci/shared';

// Mock dependencies
const mockListArticles = jest.fn();
const mockGetArticleById = jest.fn();
const mockListVideos = jest.fn();
const mockGetVideoById = jest.fn();

const mockCheckAccess = jest.fn();
const mockRecordAccess = jest.fn();
const mockGetUsageStats = jest.fn();

const mockFindById = jest.fn();

jest.mock('../../repositories/content.repository', () => ({
  listArticles: mockListArticles,
  getArticleById: mockGetArticleById,
  listVideos: mockListVideos,
  getVideoById: mockGetVideoById,
}));

jest.mock('../../services/quota.service', () => ({
  checkAccess: mockCheckAccess,
  recordAccess: mockRecordAccess,
  getUsageStats: mockGetUsageStats,
}));

jest.mock('../../repositories/user.repository', () => ({
  findById: mockFindById,
}));

import {
  listArticlesForUser,
  getArticle,
  listVideosForUser,
  getVideo,
} from '../../services/content.service';
import { QuotaExceededError, ArticleNotFoundError, VideoNotFoundError } from '../../utils/errors';

describe('Content Service', () => {
  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    displayName: 'Test User',
    membershipType: 'A' as MembershipType,
    authProvider: 'email' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFindById.mockResolvedValue(mockUser);
  });

  describe('listArticlesForUser', () => {
    const mockArticlePreviews: ArticlePreview[] = [
      {
        id: 'article-1',
        title: 'Article 1',
        slug: 'article-1',
        preview: 'Preview 1',
        author: 'Author 1',
        publishedAt: new Date(),
      },
      {
        id: 'article-2',
        title: 'Article 2',
        slug: 'article-2',
        preview: 'Preview 2',
        author: 'Author 2',
        publishedAt: new Date(),
      },
    ];

    it('should return preview data without full content', async () => {
      mockListArticles.mockResolvedValue(mockArticlePreviews);
      mockGetUsageStats.mockResolvedValue({
        articles: { accessed: ['article-1'], count: 1, limit: 3, remaining: 2 },
        videos: { accessed: [], count: 0, limit: 3, remaining: 3 },
        membershipType: 'A',
      });

      const result = await listArticlesForUser('user-123');

      expect(mockListArticles).toHaveBeenCalled();
      expect(result.articles).toHaveLength(2);
      expect(result.articles[0]).not.toHaveProperty('content');
      expect(result.articles[0]).toHaveProperty('title');
      expect(result.articles[0]).toHaveProperty('preview');
    });

    it('should include usage stats with article list', async () => {
      mockListArticles.mockResolvedValue(mockArticlePreviews);
      mockGetUsageStats.mockResolvedValue({
        articles: { accessed: ['article-1'], count: 1, limit: 3, remaining: 2 },
        videos: { accessed: [], count: 0, limit: 3, remaining: 3 },
        membershipType: 'A',
      });

      const result = await listArticlesForUser('user-123');

      expect(result.usage.articles.count).toBe(1);
      expect(result.usage.articles.limit).toBe(3);
      expect(result.usage.articles.remaining).toBe(2);
    });

    it('should mark accessed articles in the list', async () => {
      mockListArticles.mockResolvedValue(mockArticlePreviews);
      mockGetUsageStats.mockResolvedValue({
        articles: { accessed: ['article-1'], count: 1, limit: 3, remaining: 2 },
        videos: { accessed: [], count: 0, limit: 3, remaining: 3 },
        membershipType: 'A',
      });

      const result = await listArticlesForUser('user-123');

      // article-1 has been accessed
      expect(result.accessedIds).toContain('article-1');
      // article-2 has not been accessed
      expect(result.accessedIds).not.toContain('article-2');
    });
  });

  describe('getArticle', () => {
    const mockFullArticle: Article = {
      id: 'article-1',
      title: 'Full Article',
      slug: 'full-article',
      preview: 'Preview text',
      content: 'Full protected content here',
      author: 'Author',
      coverImage: 'https://example.com/image.jpg',
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return full content when quota allows', async () => {
      mockCheckAccess.mockResolvedValue({
        allowed: true,
        reason: 'within_quota',
        currentUsage: 1,
        limit: 3,
      });
      mockGetArticleById.mockResolvedValue(mockFullArticle);

      const result = await getArticle('user-123', 'article-1');

      expect(result).toHaveProperty('content');
      expect(result.content).toBe('Full protected content here');
    });

    it('should throw QuotaExceededError when limit reached', async () => {
      mockCheckAccess.mockResolvedValue({
        allowed: false,
        reason: 'quota_exceeded',
        currentUsage: 3,
        limit: 3,
      });

      await expect(getArticle('user-123', 'article-1')).rejects.toThrow(QuotaExceededError);
    });

    it('should record access on successful content retrieval', async () => {
      mockCheckAccess.mockResolvedValue({
        allowed: true,
        reason: 'within_quota',
        currentUsage: 1,
        limit: 3,
      });
      mockGetArticleById.mockResolvedValue(mockFullArticle);

      await getArticle('user-123', 'article-1');

      expect(mockRecordAccess).toHaveBeenCalledWith('user-123', 'article', 'article-1');
    });

    it('should not record access for already accessed content', async () => {
      mockCheckAccess.mockResolvedValue({
        allowed: true,
        reason: 'already_accessed',
        currentUsage: 3,
        limit: 3,
      });
      mockGetArticleById.mockResolvedValue(mockFullArticle);

      await getArticle('user-123', 'article-1');

      // Should NOT record access again for already accessed content
      expect(mockRecordAccess).not.toHaveBeenCalled();
    });

    it('should throw ArticleNotFoundError when article does not exist', async () => {
      mockCheckAccess.mockResolvedValue({
        allowed: true,
        reason: 'within_quota',
        currentUsage: 1,
        limit: 3,
      });
      mockGetArticleById.mockResolvedValue(null);

      await expect(getArticle('user-123', 'nonexistent')).rejects.toThrow(ArticleNotFoundError);
    });

    it('should allow access when already accessed even at quota limit', async () => {
      mockCheckAccess.mockResolvedValue({
        allowed: true,
        reason: 'already_accessed',
        currentUsage: 3,
        limit: 3,
      });
      mockGetArticleById.mockResolvedValue(mockFullArticle);

      const result = await getArticle('user-123', 'article-1');

      expect(result).toHaveProperty('content');
    });
  });

  describe('listVideosForUser', () => {
    const mockVideoPreviews: VideoPreview[] = [
      {
        id: 'video-1',
        title: 'Video 1',
        slug: 'video-1',
        description: 'Description 1',
        thumbnail: 'https://example.com/thumb1.jpg',
        duration: 300,
        author: 'Author 1',
        publishedAt: new Date(),
      },
      {
        id: 'video-2',
        title: 'Video 2',
        slug: 'video-2',
        description: 'Description 2',
        thumbnail: 'https://example.com/thumb2.jpg',
        duration: 600,
        author: 'Author 2',
        publishedAt: new Date(),
      },
    ];

    it('should return preview data without video URL', async () => {
      mockListVideos.mockResolvedValue(mockVideoPreviews);
      mockGetUsageStats.mockResolvedValue({
        articles: { accessed: [], count: 0, limit: 3, remaining: 3 },
        videos: { accessed: ['video-1'], count: 1, limit: 3, remaining: 2 },
        membershipType: 'A',
      });

      const result = await listVideosForUser('user-123');

      expect(mockListVideos).toHaveBeenCalled();
      expect(result.videos).toHaveLength(2);
      expect(result.videos[0]).not.toHaveProperty('videoUrl');
      expect(result.videos[0]).toHaveProperty('title');
      expect(result.videos[0]).toHaveProperty('thumbnail');
    });

    it('should include usage stats with video list', async () => {
      mockListVideos.mockResolvedValue(mockVideoPreviews);
      mockGetUsageStats.mockResolvedValue({
        articles: { accessed: [], count: 0, limit: 3, remaining: 3 },
        videos: { accessed: ['video-1'], count: 1, limit: 3, remaining: 2 },
        membershipType: 'A',
      });

      const result = await listVideosForUser('user-123');

      expect(result.usage.videos.count).toBe(1);
      expect(result.usage.videos.limit).toBe(3);
      expect(result.usage.videos.remaining).toBe(2);
    });
  });

  describe('getVideo', () => {
    const mockFullVideo: Video = {
      id: 'video-1',
      title: 'Full Video',
      slug: 'full-video',
      description: 'Video description',
      thumbnail: 'https://example.com/thumb.jpg',
      videoUrl: 'https://example.com/protected-video.mp4',
      duration: 600,
      author: 'Author',
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return full video with URL when quota allows', async () => {
      mockCheckAccess.mockResolvedValue({
        allowed: true,
        reason: 'within_quota',
        currentUsage: 1,
        limit: 3,
      });
      mockGetVideoById.mockResolvedValue(mockFullVideo);

      const result = await getVideo('user-123', 'video-1');

      expect(result).toHaveProperty('videoUrl');
      expect(result.videoUrl).toBe('https://example.com/protected-video.mp4');
    });

    it('should throw QuotaExceededError when video limit reached', async () => {
      mockCheckAccess.mockResolvedValue({
        allowed: false,
        reason: 'quota_exceeded',
        currentUsage: 3,
        limit: 3,
      });

      await expect(getVideo('user-123', 'video-1')).rejects.toThrow(QuotaExceededError);
    });

    it('should record video access on success', async () => {
      mockCheckAccess.mockResolvedValue({
        allowed: true,
        reason: 'within_quota',
        currentUsage: 1,
        limit: 3,
      });
      mockGetVideoById.mockResolvedValue(mockFullVideo);

      await getVideo('user-123', 'video-1');

      expect(mockRecordAccess).toHaveBeenCalledWith('user-123', 'video', 'video-1');
    });

    it('should throw VideoNotFoundError when video does not exist', async () => {
      mockCheckAccess.mockResolvedValue({
        allowed: true,
        reason: 'within_quota',
        currentUsage: 1,
        limit: 3,
      });
      mockGetVideoById.mockResolvedValue(null);

      await expect(getVideo('user-123', 'nonexistent')).rejects.toThrow(VideoNotFoundError);
    });

    it('should not record access for already accessed video', async () => {
      mockCheckAccess.mockResolvedValue({
        allowed: true,
        reason: 'already_accessed',
        currentUsage: 3,
        limit: 3,
      });
      mockGetVideoById.mockResolvedValue(mockFullVideo);

      await getVideo('user-123', 'video-1');

      expect(mockRecordAccess).not.toHaveBeenCalled();
    });
  });

  describe('Quota enforcement parity', () => {
    it('should enforce same quota rules for videos as articles', async () => {
      // Test that video quota is enforced the same way as article quota
      mockCheckAccess.mockResolvedValue({
        allowed: false,
        reason: 'quota_exceeded',
        currentUsage: 3,
        limit: 3,
      });

      await expect(getVideo('user-123', 'video-1')).rejects.toThrow(QuotaExceededError);
      expect(mockCheckAccess).toHaveBeenCalledWith('user-123', 'video', 'video-1');
    });
  });
});
