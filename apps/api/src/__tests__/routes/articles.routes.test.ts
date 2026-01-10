/**
 * Articles Routes Tests
 *
 * Integration tests for article endpoints.
 * Tests listing articles and accessing individual articles with quota enforcement.
 */

import { type MembershipType, type UsageStats } from '@astronacci/shared';

// Mock dependencies
const mockListArticlesForUser = jest.fn();
const mockGetArticle = jest.fn();
const mockValidateSession = jest.fn();

jest.mock('../../services/content.service', () => ({
  listArticlesForUser: mockListArticlesForUser,
  getArticle: mockGetArticle,
}));

jest.mock('../../services/session.service', () => ({
  validateSession: mockValidateSession,
}));

import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import articlesRouter from '../../routes/articles.routes';
import { errorHandler } from '../../middleware/errorHandler';
import {
  QuotaExceededError,
  ArticleNotFoundError,
} from '../../utils/errors';

describe('Articles Routes', () => {
  let app: express.Express;

  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    displayName: 'Test User',
    membershipType: 'A' as MembershipType,
    authProvider: 'email' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSession = {
    token: 'test-session-token-123',
    userId: 'user-123',
    expiresAt: new Date(Date.now() + 86400000),
    createdAt: new Date(),
  };

  const mockArticlePreviews = [
    {
      id: 'article-1',
      title: 'First Article',
      slug: 'first-article',
      preview: 'This is the first article preview',
      author: 'Author One',
      coverImage: 'https://example.com/image1.jpg',
      publishedAt: new Date(),
    },
    {
      id: 'article-2',
      title: 'Second Article',
      slug: 'second-article',
      preview: 'This is the second article preview',
      author: 'Author Two',
      publishedAt: new Date(),
    },
  ];

  const mockUsageStats: UsageStats = {
    articles: {
      accessed: ['article-1'],
      count: 1,
      limit: 3,
      remaining: 2,
    },
    videos: {
      accessed: [],
      count: 0,
      limit: 3,
      remaining: 3,
    },
    membershipType: 'A',
  };

  const mockFullArticle = {
    id: 'article-1',
    title: 'First Article',
    slug: 'first-article',
    preview: 'This is the first article preview',
    content: 'This is the full article content that is protected.',
    author: 'Author One',
    coverImage: 'https://example.com/image1.jpg',
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/articles', articlesRouter);
    app.use(errorHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/articles', () => {
    it('should return list of article previews', async () => {
      mockValidateSession.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });
      mockListArticlesForUser.mockResolvedValue({
        articles: mockArticlePreviews,
        usage: mockUsageStats,
        accessedIds: ['article-1'],
      });

      const response = await request(app)
        .get('/api/articles')
        .set('Cookie', 'session_token=valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data.articles).toHaveLength(2);
      expect(response.body.data.articles[0]).toHaveProperty('title');
      expect(response.body.data.articles[0]).toHaveProperty('preview');
      expect(response.body.data.articles[0]).not.toHaveProperty('content');
    });

    it('should include usage stats in response', async () => {
      mockValidateSession.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });
      mockListArticlesForUser.mockResolvedValue({
        articles: mockArticlePreviews,
        usage: mockUsageStats,
        accessedIds: ['article-1'],
      });

      const response = await request(app)
        .get('/api/articles')
        .set('Cookie', 'session_token=valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data.usage).toHaveProperty('articles');
      expect(response.body.data.usage.articles.limit).toBe(3);
      expect(response.body.data.usage.articles.remaining).toBe(2);
    });

    it('should include accessed article IDs', async () => {
      mockValidateSession.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });
      mockListArticlesForUser.mockResolvedValue({
        articles: mockArticlePreviews,
        usage: mockUsageStats,
        accessedIds: ['article-1'],
      });

      const response = await request(app)
        .get('/api/articles')
        .set('Cookie', 'session_token=valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data.accessedIds).toContain('article-1');
    });

    it('should return 401 without session', async () => {
      const response = await request(app)
        .get('/api/articles');

      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      mockValidateSession.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/articles')
        .set('Cookie', 'session_token=invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/articles/:id', () => {
    it('should return full article when allowed', async () => {
      mockValidateSession.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });
      mockGetArticle.mockResolvedValue(mockFullArticle);

      const response = await request(app)
        .get('/api/articles/article-1')
        .set('Cookie', 'session_token=valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('content');
      expect(response.body.data.title).toBe('First Article');
      expect(mockGetArticle).toHaveBeenCalledWith(mockUser.id, 'article-1');
    });

    it('should return 403 when quota exceeded', async () => {
      mockValidateSession.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });
      mockGetArticle.mockRejectedValue(new QuotaExceededError(3, 3, 'A'));

      const response = await request(app)
        .get('/api/articles/article-4')
        .set('Cookie', 'session_token=valid-token');

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('QUOTA_EXCEEDED');
      expect(response.body.error.details).toHaveProperty('currentUsage');
      expect(response.body.error.details).toHaveProperty('limit');
    });

    it('should return 404 for non-existent article', async () => {
      mockValidateSession.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });
      mockGetArticle.mockRejectedValue(new ArticleNotFoundError());

      const response = await request(app)
        .get('/api/articles/non-existent')
        .set('Cookie', 'session_token=valid-token');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('ARTICLE_NOT_FOUND');
    });

    it('should allow re-access to already accessed article', async () => {
      mockValidateSession.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });
      mockGetArticle.mockResolvedValue(mockFullArticle);

      // First access
      const response1 = await request(app)
        .get('/api/articles/article-1')
        .set('Cookie', 'session_token=valid-token');

      expect(response1.status).toBe(200);

      // Second access (re-access)
      const response2 = await request(app)
        .get('/api/articles/article-1')
        .set('Cookie', 'session_token=valid-token');

      expect(response2.status).toBe(200);
      expect(response2.body.data).toHaveProperty('content');
    });

    it('should return 401 without session', async () => {
      const response = await request(app)
        .get('/api/articles/article-1');

      expect(response.status).toBe(401);
    });
  });
});
