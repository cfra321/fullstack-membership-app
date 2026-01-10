/**
 * Videos Routes Tests
 *
 * Integration tests for video endpoints.
 * Tests listing videos and accessing individual videos with quota enforcement.
 */

import { type MembershipType, type UsageStats } from '@astronacci/shared';

// Mock dependencies
const mockListVideosForUser = jest.fn();
const mockGetVideo = jest.fn();
const mockValidateSession = jest.fn();

jest.mock('../../services/content.service', () => ({
  listVideosForUser: mockListVideosForUser,
  getVideo: mockGetVideo,
}));

jest.mock('../../services/session.service', () => ({
  validateSession: mockValidateSession,
}));

import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import videosRouter from '../../routes/videos.routes';
import { errorHandler } from '../../middleware/errorHandler';
import {
  QuotaExceededError,
  VideoNotFoundError,
} from '../../utils/errors';

describe('Videos Routes', () => {
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

  const mockVideoPreviews = [
    {
      id: 'video-1',
      title: 'First Video',
      slug: 'first-video',
      description: 'This is the first video description',
      thumbnail: 'https://example.com/thumb1.jpg',
      duration: 300,
      author: 'Author One',
      publishedAt: new Date(),
    },
    {
      id: 'video-2',
      title: 'Second Video',
      slug: 'second-video',
      description: 'This is the second video description',
      thumbnail: 'https://example.com/thumb2.jpg',
      duration: 600,
      author: 'Author Two',
      publishedAt: new Date(),
    },
  ];

  const mockUsageStats: UsageStats = {
    articles: {
      accessed: [],
      count: 0,
      limit: 3,
      remaining: 3,
    },
    videos: {
      accessed: ['video-1'],
      count: 1,
      limit: 3,
      remaining: 2,
    },
    membershipType: 'A',
  };

  const mockFullVideo = {
    id: 'video-1',
    title: 'First Video',
    slug: 'first-video',
    description: 'This is the first video description',
    thumbnail: 'https://example.com/thumb1.jpg',
    videoUrl: 'https://example.com/videos/video1.mp4',
    duration: 300,
    author: 'Author One',
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/videos', videosRouter);
    app.use(errorHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/videos', () => {
    it('should return list of video previews', async () => {
      mockValidateSession.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });
      mockListVideosForUser.mockResolvedValue({
        videos: mockVideoPreviews,
        usage: mockUsageStats,
        accessedIds: ['video-1'],
      });

      const response = await request(app)
        .get('/api/videos')
        .set('Cookie', 'session_token=valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data.videos).toHaveLength(2);
      expect(response.body.data.videos[0]).toHaveProperty('title');
      expect(response.body.data.videos[0]).toHaveProperty('description');
      expect(response.body.data.videos[0]).toHaveProperty('thumbnail');
      expect(response.body.data.videos[0]).not.toHaveProperty('videoUrl');
    });

    it('should include usage stats in response', async () => {
      mockValidateSession.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });
      mockListVideosForUser.mockResolvedValue({
        videos: mockVideoPreviews,
        usage: mockUsageStats,
        accessedIds: ['video-1'],
      });

      const response = await request(app)
        .get('/api/videos')
        .set('Cookie', 'session_token=valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data.usage).toHaveProperty('videos');
      expect(response.body.data.usage.videos.limit).toBe(3);
      expect(response.body.data.usage.videos.remaining).toBe(2);
    });

    it('should include accessed video IDs', async () => {
      mockValidateSession.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });
      mockListVideosForUser.mockResolvedValue({
        videos: mockVideoPreviews,
        usage: mockUsageStats,
        accessedIds: ['video-1'],
      });

      const response = await request(app)
        .get('/api/videos')
        .set('Cookie', 'session_token=valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data.accessedIds).toContain('video-1');
    });

    it('should return 401 without session', async () => {
      const response = await request(app)
        .get('/api/videos');

      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      mockValidateSession.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/videos')
        .set('Cookie', 'session_token=invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/videos/:id', () => {
    it('should return full video when allowed', async () => {
      mockValidateSession.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });
      mockGetVideo.mockResolvedValue(mockFullVideo);

      const response = await request(app)
        .get('/api/videos/video-1')
        .set('Cookie', 'session_token=valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('videoUrl');
      expect(response.body.data.title).toBe('First Video');
      expect(mockGetVideo).toHaveBeenCalledWith(mockUser.id, 'video-1');
    });

    it('should return 403 when quota exceeded', async () => {
      mockValidateSession.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });
      mockGetVideo.mockRejectedValue(new QuotaExceededError(3, 3, 'A'));

      const response = await request(app)
        .get('/api/videos/video-4')
        .set('Cookie', 'session_token=valid-token');

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('QUOTA_EXCEEDED');
      expect(response.body.error.details).toHaveProperty('currentUsage');
      expect(response.body.error.details).toHaveProperty('limit');
    });

    it('should return 404 for non-existent video', async () => {
      mockValidateSession.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });
      mockGetVideo.mockRejectedValue(new VideoNotFoundError());

      const response = await request(app)
        .get('/api/videos/non-existent')
        .set('Cookie', 'session_token=valid-token');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('VIDEO_NOT_FOUND');
    });

    it('should allow re-access to already accessed video', async () => {
      mockValidateSession.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });
      mockGetVideo.mockResolvedValue(mockFullVideo);

      // First access
      const response1 = await request(app)
        .get('/api/videos/video-1')
        .set('Cookie', 'session_token=valid-token');

      expect(response1.status).toBe(200);

      // Second access (re-access)
      const response2 = await request(app)
        .get('/api/videos/video-1')
        .set('Cookie', 'session_token=valid-token');

      expect(response2.status).toBe(200);
      expect(response2.body.data).toHaveProperty('videoUrl');
    });

    it('should return 401 without session', async () => {
      const response = await request(app)
        .get('/api/videos/video-1');

      expect(response.status).toBe(401);
    });
  });
});
