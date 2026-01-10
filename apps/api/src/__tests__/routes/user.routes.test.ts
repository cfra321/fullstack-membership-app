/**
 * User Routes Tests
 *
 * Integration tests for user profile and usage endpoints.
 * Tests retrieving user profile and usage statistics.
 */

import { type MembershipType, type UsageStats } from '@astronacci/shared';

// Mock dependencies
const mockGetProfile = jest.fn();
const mockGetUsage = jest.fn();
const mockValidateSession = jest.fn();

jest.mock('../../services/user.service', () => ({
  getProfile: mockGetProfile,
  getUsage: mockGetUsage,
}));

jest.mock('../../services/session.service', () => ({
  validateSession: mockValidateSession,
}));

import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import userRouter from '../../routes/user.routes';
import { errorHandler } from '../../middleware/errorHandler';
import { UserNotFoundError } from '../../utils/errors';

describe('User Routes', () => {
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

  const mockProfile = {
    id: 'user-123',
    email: 'user@example.com',
    displayName: 'Test User',
    membershipType: 'A' as MembershipType,
    authProvider: 'email' as const,
  };

  const mockUsageStats: UsageStats = {
    articles: {
      accessed: ['article-1', 'article-2'],
      count: 2,
      limit: 3,
      remaining: 1,
    },
    videos: {
      accessed: ['video-1'],
      count: 1,
      limit: 3,
      remaining: 2,
    },
    membershipType: 'A',
  };

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/user', userRouter);
    app.use(errorHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/user/profile', () => {
    it('should return user profile', async () => {
      mockValidateSession.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });
      mockGetProfile.mockResolvedValue(mockProfile);

      const response = await request(app)
        .get('/api/user/profile')
        .set('Cookie', 'session_token=valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('id', 'user-123');
      expect(response.body.data).toHaveProperty('email', 'user@example.com');
      expect(response.body.data).toHaveProperty('displayName', 'Test User');
      expect(response.body.data).toHaveProperty('membershipType', 'A');
      expect(response.body.data).toHaveProperty('authProvider', 'email');
    });

    it('should not return sensitive fields', async () => {
      mockValidateSession.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });
      mockGetProfile.mockResolvedValue(mockProfile);

      const response = await request(app)
        .get('/api/user/profile')
        .set('Cookie', 'session_token=valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data).not.toHaveProperty('passwordHash');
      expect(response.body.data).not.toHaveProperty('googleId');
      expect(response.body.data).not.toHaveProperty('facebookId');
    });

    it('should return 401 without session', async () => {
      const response = await request(app)
        .get('/api/user/profile');

      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      mockValidateSession.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/user/profile')
        .set('Cookie', 'session_token=invalid-token');

      expect(response.status).toBe(401);
    });

    it('should return 404 if user not found', async () => {
      mockValidateSession.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });
      mockGetProfile.mockRejectedValue(new UserNotFoundError());

      const response = await request(app)
        .get('/api/user/profile')
        .set('Cookie', 'session_token=valid-token');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('GET /api/user/usage', () => {
    it('should return usage statistics', async () => {
      mockValidateSession.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });
      mockGetUsage.mockResolvedValue(mockUsageStats);

      const response = await request(app)
        .get('/api/user/usage')
        .set('Cookie', 'session_token=valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('articles');
      expect(response.body.data).toHaveProperty('videos');
      expect(response.body.data).toHaveProperty('membershipType');
    });

    it('should show correct counts and limits', async () => {
      mockValidateSession.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });
      mockGetUsage.mockResolvedValue(mockUsageStats);

      const response = await request(app)
        .get('/api/user/usage')
        .set('Cookie', 'session_token=valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data.articles.count).toBe(2);
      expect(response.body.data.articles.limit).toBe(3);
      expect(response.body.data.articles.remaining).toBe(1);
      expect(response.body.data.videos.count).toBe(1);
      expect(response.body.data.videos.limit).toBe(3);
      expect(response.body.data.videos.remaining).toBe(2);
    });

    it('should include accessed content IDs', async () => {
      mockValidateSession.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });
      mockGetUsage.mockResolvedValue(mockUsageStats);

      const response = await request(app)
        .get('/api/user/usage')
        .set('Cookie', 'session_token=valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data.articles.accessed).toContain('article-1');
      expect(response.body.data.articles.accessed).toContain('article-2');
      expect(response.body.data.videos.accessed).toContain('video-1');
    });

    it('should return 401 without session', async () => {
      const response = await request(app)
        .get('/api/user/usage');

      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      mockValidateSession.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/user/usage')
        .set('Cookie', 'session_token=invalid-token');

      expect(response.status).toBe(401);
    });
  });
});
