/**
 * End-to-End Integration Tests
 *
 * Comprehensive tests that validate complete user flows from start to finish.
 * These tests simulate real user journeys through the application.
 */

import { type MembershipType, type UsageStats, MEMBERSHIP_LIMITS } from '@astronacci/shared';

// ============================================================
// Mock Setup
// ============================================================

// Mock user storage (simulates database)
const mockUserStore: Map<string, any> = new Map();
const mockSessionStore: Map<string, any> = new Map();
const mockUsageStore: Map<string, { articles: string[]; videos: string[] }> = new Map();
const mockArticleStore: Map<string, any> = new Map();
const mockVideoStore: Map<string, any> = new Map();

// Generate unique IDs
let idCounter = 0;
const generateId = () => `id-${++idCounter}`;

// Mock password utilities
const mockHashPassword = jest.fn((password: string) => `hashed-${password}`);
const mockVerifyPassword = jest.fn((password: string, hash: string) => hash === `hashed-${password}`);

jest.mock('../../utils/password', () => ({
  hashPassword: (password: string) => mockHashPassword(password),
  verifyPassword: (password: string, hash: string) => mockVerifyPassword(password, hash),
}));

// Mock crypto utilities
const mockGenerateSessionToken = jest.fn(() => `session-token-${generateId()}`);

jest.mock('../../utils/crypto', () => ({
  generateSessionToken: () => mockGenerateSessionToken(),
}));

// Mock auth service with stateful behavior
const mockRegister = jest.fn(async (data: { email: string; password: string; displayName: string }) => {
  // Check if email already exists
  for (const user of mockUserStore.values()) {
    if (user.email === data.email) {
      const { EmailExistsError } = await import('../../utils/errors');
      throw new EmailExistsError();
    }
  }

  const userId = generateId();
  const user = {
    id: userId,
    email: data.email,
    displayName: data.displayName,
    passwordHash: mockHashPassword(data.password),
    membershipType: 'A' as MembershipType,
    authProvider: 'email' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockUserStore.set(userId, user);
  mockUsageStore.set(userId, { articles: [], videos: [] });

  return user;
});

const mockLogin = jest.fn(async (email: string, password: string) => {
  let foundUser: any = null;
  for (const user of mockUserStore.values()) {
    if (user.email === email) {
      foundUser = user;
      break;
    }
  }

  if (!foundUser || !mockVerifyPassword(password, foundUser.passwordHash)) {
    const { InvalidCredentialsError } = await import('../../utils/errors');
    throw new InvalidCredentialsError();
  }

  const sessionToken = mockGenerateSessionToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const session = {
    token: sessionToken,
    userId: foundUser.id,
    expiresAt,
    createdAt: new Date(),
  };

  mockSessionStore.set(sessionToken, session);

  return {
    user: {
      id: foundUser.id,
      email: foundUser.email,
      displayName: foundUser.displayName,
      membershipType: foundUser.membershipType,
      authProvider: foundUser.authProvider,
    },
    sessionToken,
    expiresAt,
  };
});

const mockLogout = jest.fn(async (sessionToken: string) => {
  mockSessionStore.delete(sessionToken);
});

const mockGetGoogleAuthUrl = jest.fn(() => 'https://accounts.google.com/o/oauth2/auth?test=true');
const mockHandleGoogleCallback = jest.fn();
const mockGetFacebookAuthUrl = jest.fn(() => 'https://www.facebook.com/v18.0/dialog/oauth?test=true');
const mockHandleFacebookCallback = jest.fn();

jest.mock('../../services/auth.service', () => ({
  register: (data: any) => mockRegister(data),
  login: (email: string, password: string) => mockLogin(email, password),
  logout: (token: string) => mockLogout(token),
  getGoogleAuthUrl: () => mockGetGoogleAuthUrl(),
  handleGoogleCallback: (code: string) => mockHandleGoogleCallback(code),
  getFacebookAuthUrl: () => mockGetFacebookAuthUrl(),
  handleFacebookCallback: (code: string) => mockHandleFacebookCallback(code),
}));

// Mock session service
const mockValidateSession = jest.fn(async (token: string) => {
  const session = mockSessionStore.get(token);
  if (!session) return null;

  // Check if session is expired
  if (new Date(session.expiresAt) < new Date()) {
    mockSessionStore.delete(token);
    return null;
  }

  const user = mockUserStore.get(session.userId);
  if (!user) return null;

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      membershipType: user.membershipType,
      authProvider: user.authProvider,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    session,
  };
});

jest.mock('../../services/session.service', () => ({
  validateSession: (token: string) => mockValidateSession(token),
}));

// Mock content service with quota enforcement
const mockListArticlesForUser = jest.fn(async (userId: string) => {
  const user = mockUserStore.get(userId);
  const usage = mockUsageStore.get(userId) || { articles: [], videos: [] };
  const limit = MEMBERSHIP_LIMITS[user?.membershipType || 'A'].articles;

  const articles = Array.from(mockArticleStore.values()).map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    preview: a.preview,
    author: a.author,
    coverImage: a.coverImage,
    publishedAt: a.publishedAt,
  }));

  return {
    articles,
    usage: {
      articles: {
        accessed: usage.articles,
        count: usage.articles.length,
        limit: limit === Infinity ? -1 : limit,
        remaining: limit === Infinity ? -1 : Math.max(0, limit - usage.articles.length),
      },
      videos: {
        accessed: usage.videos,
        count: usage.videos.length,
        limit: MEMBERSHIP_LIMITS[user?.membershipType || 'A'].videos,
        remaining: Math.max(0, MEMBERSHIP_LIMITS[user?.membershipType || 'A'].videos - usage.videos.length),
      },
      membershipType: user?.membershipType || 'A',
    },
    accessedIds: usage.articles,
  };
});

const mockGetArticle = jest.fn(async (userId: string, articleId: string) => {
  const user = mockUserStore.get(userId);
  if (!user) {
    const { UnauthorizedError } = await import('../../utils/errors');
    throw new UnauthorizedError();
  }

  const article = mockArticleStore.get(articleId);
  if (!article) {
    const { ArticleNotFoundError } = await import('../../utils/errors');
    throw new ArticleNotFoundError();
  }

  const usage = mockUsageStore.get(userId) || { articles: [], videos: [] };
  const limit = MEMBERSHIP_LIMITS[user.membershipType].articles;

  // Check if already accessed (no quota consumed)
  if (!usage.articles.includes(articleId)) {
    // Check quota
    if (limit !== Infinity && usage.articles.length >= limit) {
      const { QuotaExceededError } = await import('../../utils/errors');
      throw new QuotaExceededError(usage.articles.length, limit, user.membershipType);
    }

    // Record access
    usage.articles.push(articleId);
    mockUsageStore.set(userId, usage);
  }

  return article;
});

const mockListVideosForUser = jest.fn(async (userId: string) => {
  const user = mockUserStore.get(userId);
  const usage = mockUsageStore.get(userId) || { articles: [], videos: [] };
  const limit = MEMBERSHIP_LIMITS[user?.membershipType || 'A'].videos;

  const videos = Array.from(mockVideoStore.values()).map((v) => ({
    id: v.id,
    title: v.title,
    slug: v.slug,
    description: v.description,
    thumbnail: v.thumbnail,
    duration: v.duration,
    author: v.author,
    publishedAt: v.publishedAt,
  }));

  return {
    videos,
    usage: {
      articles: {
        accessed: usage.articles,
        count: usage.articles.length,
        limit: MEMBERSHIP_LIMITS[user?.membershipType || 'A'].articles,
        remaining: Math.max(0, MEMBERSHIP_LIMITS[user?.membershipType || 'A'].articles - usage.articles.length),
      },
      videos: {
        accessed: usage.videos,
        count: usage.videos.length,
        limit: limit === Infinity ? -1 : limit,
        remaining: limit === Infinity ? -1 : Math.max(0, limit - usage.videos.length),
      },
      membershipType: user?.membershipType || 'A',
    },
    accessedIds: usage.videos,
  };
});

const mockGetVideo = jest.fn(async (userId: string, videoId: string) => {
  const user = mockUserStore.get(userId);
  if (!user) {
    const { UnauthorizedError } = await import('../../utils/errors');
    throw new UnauthorizedError();
  }

  const video = mockVideoStore.get(videoId);
  if (!video) {
    const { VideoNotFoundError } = await import('../../utils/errors');
    throw new VideoNotFoundError();
  }

  const usage = mockUsageStore.get(userId) || { articles: [], videos: [] };
  const limit = MEMBERSHIP_LIMITS[user.membershipType].videos;

  // Check if already accessed (no quota consumed)
  if (!usage.videos.includes(videoId)) {
    // Check quota
    if (limit !== Infinity && usage.videos.length >= limit) {
      const { QuotaExceededError } = await import('../../utils/errors');
      throw new QuotaExceededError(usage.videos.length, limit, user.membershipType);
    }

    // Record access
    usage.videos.push(videoId);
    mockUsageStore.set(userId, usage);
  }

  return video;
});

jest.mock('../../services/content.service', () => ({
  listArticlesForUser: (userId: string) => mockListArticlesForUser(userId),
  getArticle: (userId: string, articleId: string) => mockGetArticle(userId, articleId),
  listVideosForUser: (userId: string) => mockListVideosForUser(userId),
  getVideo: (userId: string, videoId: string) => mockGetVideo(userId, videoId),
}));

// Mock user service
const mockGetProfile = jest.fn(async (userId: string) => {
  const user = mockUserStore.get(userId);
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    membershipType: user.membershipType,
    authProvider: user.authProvider,
  };
});

const mockGetUsage = jest.fn(async (userId: string) => {
  const user = mockUserStore.get(userId);
  const usage = mockUsageStore.get(userId) || { articles: [], videos: [] };

  const articleLimit = MEMBERSHIP_LIMITS[user?.membershipType || 'A'].articles;
  const videoLimit = MEMBERSHIP_LIMITS[user?.membershipType || 'A'].videos;

  return {
    articles: {
      accessed: usage.articles,
      count: usage.articles.length,
      limit: articleLimit === Infinity ? -1 : articleLimit,
      remaining: articleLimit === Infinity ? -1 : Math.max(0, articleLimit - usage.articles.length),
    },
    videos: {
      accessed: usage.videos,
      count: usage.videos.length,
      limit: videoLimit === Infinity ? -1 : videoLimit,
      remaining: videoLimit === Infinity ? -1 : Math.max(0, videoLimit - usage.videos.length),
    },
    membershipType: user?.membershipType || 'A',
  };
});

jest.mock('../../services/user.service', () => ({
  getProfile: (userId: string) => mockGetProfile(userId),
  getUsage: (userId: string) => mockGetUsage(userId),
}));

// Mock rate limiter
jest.mock('../../middleware/rateLimit', () => ({
  authRateLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
  createAuthRateLimiter: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// ============================================================
// Test Imports
// ============================================================

import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { createApp } from '../../app';
import { authRouter, articlesRouter, videosRouter, userRouter } from '../../routes';
import { errorHandler, notFoundHandler } from '../../middleware';

// ============================================================
// Test Suite
// ============================================================

describe('End-to-End Integration Tests', () => {
  let app: express.Express;

  // Helper to seed test content
  function seedContent() {
    // Seed articles
    for (let i = 1; i <= 5; i++) {
      mockArticleStore.set(`article-${i}`, {
        id: `article-${i}`,
        title: `Test Article ${i}`,
        slug: `test-article-${i}`,
        preview: `This is the preview for article ${i}`,
        content: `This is the full content of article ${i}. It contains protected information.`,
        author: `Author ${i}`,
        coverImage: `https://example.com/article-${i}.jpg`,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Seed videos
    for (let i = 1; i <= 5; i++) {
      mockVideoStore.set(`video-${i}`, {
        id: `video-${i}`,
        title: `Test Video ${i}`,
        slug: `test-video-${i}`,
        description: `This is the description for video ${i}`,
        thumbnail: `https://example.com/video-${i}-thumb.jpg`,
        videoUrl: `https://example.com/video-${i}.mp4`,
        duration: 300 * i,
        author: `Creator ${i}`,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  // Helper to reset all stores
  function resetStores() {
    mockUserStore.clear();
    mockSessionStore.clear();
    mockUsageStore.clear();
    mockArticleStore.clear();
    mockVideoStore.clear();
    idCounter = 0;
  }

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());

    // Health check
    app.get('/api/health', (_req, res) => {
      res.json({ data: { status: 'ok' } });
    });

    // Mount routes
    app.use('/api/auth', authRouter);
    app.use('/api/articles', articlesRouter);
    app.use('/api/videos', videosRouter);
    app.use('/api/user', userRouter);

    // Error handling
    app.use(notFoundHandler);
    app.use(errorHandler);
  });

  beforeEach(() => {
    resetStores();
    seedContent();
    jest.clearAllMocks();
  });

  // ============================================================
  // Complete User Flow Tests
  // ============================================================

  describe('Complete Registration → Login → Access Content Flow', () => {
    it('should allow user to register, login, and access content', async () => {
      const testUser = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        displayName: 'New Test User',
      };

      // Step 1: Register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.data.message).toContain('successful');

      // Step 2: Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.data.user.email).toBe(testUser.email);
      expect(loginResponse.headers['set-cookie']).toBeDefined();

      // Extract session cookie
      const sessionCookie = loginResponse.headers['set-cookie'][0];
      expect(sessionCookie).toContain('session_token');
      expect(sessionCookie).toContain('HttpOnly');

      // Step 3: Access articles list
      const articlesResponse = await request(app)
        .get('/api/articles')
        .set('Cookie', sessionCookie);

      expect(articlesResponse.status).toBe(200);
      expect(articlesResponse.body.data.articles).toHaveLength(5);
      expect(articlesResponse.body.data.usage.articles.remaining).toBe(3); // Type A limit

      // Step 4: Access individual article
      const articleResponse = await request(app)
        .get('/api/articles/article-1')
        .set('Cookie', sessionCookie);

      expect(articleResponse.status).toBe(200);
      expect(articleResponse.body.data).toHaveProperty('content');
      expect(articleResponse.body.data.title).toBe('Test Article 1');

      // Step 5: Check updated usage
      const usageResponse = await request(app)
        .get('/api/user/usage')
        .set('Cookie', sessionCookie);

      expect(usageResponse.status).toBe(200);
      expect(usageResponse.body.data.articles.count).toBe(1);
      expect(usageResponse.body.data.articles.remaining).toBe(2);
    });

    it('should complete full flow including videos', async () => {
      // Register and login
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'videouser@example.com',
          password: 'SecurePass123!',
          displayName: 'Video User',
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'videouser@example.com',
          password: 'SecurePass123!',
        });

      const sessionCookie = loginResponse.headers['set-cookie'][0];

      // Access videos list
      const videosResponse = await request(app)
        .get('/api/videos')
        .set('Cookie', sessionCookie);

      expect(videosResponse.status).toBe(200);
      expect(videosResponse.body.data.videos).toHaveLength(5);

      // Access individual video
      const videoResponse = await request(app)
        .get('/api/videos/video-1')
        .set('Cookie', sessionCookie);

      expect(videoResponse.status).toBe(200);
      expect(videoResponse.body.data).toHaveProperty('videoUrl');
    });
  });

  // ============================================================
  // Quota Enforcement Tests
  // ============================================================

  describe('Quota Enforcement Across Multiple Content Accesses', () => {
    it('should enforce Type A quota limit (3 articles)', async () => {
      // Setup user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'quotauser@example.com',
          password: 'SecurePass123!',
          displayName: 'Quota User',
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'quotauser@example.com',
          password: 'SecurePass123!',
        });

      const sessionCookie = loginResponse.headers['set-cookie'][0];

      // Access 3 articles (within limit)
      for (let i = 1; i <= 3; i++) {
        const response = await request(app)
          .get(`/api/articles/article-${i}`)
          .set('Cookie', sessionCookie);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('content');
      }

      // Try to access 4th article (should fail)
      const blockedResponse = await request(app)
        .get('/api/articles/article-4')
        .set('Cookie', sessionCookie);

      expect(blockedResponse.status).toBe(403);
      expect(blockedResponse.body.error.code).toBe('QUOTA_EXCEEDED');
      expect(blockedResponse.body.error.details.currentUsage).toBe(3);
      expect(blockedResponse.body.error.details.limit).toBe(3);
    });

    it('should allow re-access to already accessed content without consuming quota', async () => {
      // Setup user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'reaccess@example.com',
          password: 'SecurePass123!',
          displayName: 'Re-access User',
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'reaccess@example.com',
          password: 'SecurePass123!',
        });

      const sessionCookie = loginResponse.headers['set-cookie'][0];

      // Access article-1
      const firstAccess = await request(app)
        .get('/api/articles/article-1')
        .set('Cookie', sessionCookie);

      expect(firstAccess.status).toBe(200);

      // Check usage after first access
      let usageResponse = await request(app)
        .get('/api/user/usage')
        .set('Cookie', sessionCookie);

      expect(usageResponse.body.data.articles.count).toBe(1);

      // Re-access same article multiple times
      for (let i = 0; i < 5; i++) {
        const reAccess = await request(app)
          .get('/api/articles/article-1')
          .set('Cookie', sessionCookie);

        expect(reAccess.status).toBe(200);
      }

      // Usage should still be 1
      usageResponse = await request(app)
        .get('/api/user/usage')
        .set('Cookie', sessionCookie);

      expect(usageResponse.body.data.articles.count).toBe(1);
      expect(usageResponse.body.data.articles.remaining).toBe(2);
    });

    it('should track articles and videos separately', async () => {
      // Setup user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'separate@example.com',
          password: 'SecurePass123!',
          displayName: 'Separate Quota User',
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'separate@example.com',
          password: 'SecurePass123!',
        });

      const sessionCookie = loginResponse.headers['set-cookie'][0];

      // Access 3 articles (max for Type A)
      for (let i = 1; i <= 3; i++) {
        await request(app)
          .get(`/api/articles/article-${i}`)
          .set('Cookie', sessionCookie);
      }

      // Should still be able to access videos
      for (let i = 1; i <= 3; i++) {
        const response = await request(app)
          .get(`/api/videos/video-${i}`)
          .set('Cookie', sessionCookie);

        expect(response.status).toBe(200);
      }

      // Check final usage
      const usageResponse = await request(app)
        .get('/api/user/usage')
        .set('Cookie', sessionCookie);

      expect(usageResponse.body.data.articles.count).toBe(3);
      expect(usageResponse.body.data.videos.count).toBe(3);
    });
  });

  // ============================================================
  // Session Management Tests
  // ============================================================

  describe('Session Persistence Across Requests', () => {
    it('should maintain session across multiple requests', async () => {
      // Register and login
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'session@example.com',
          password: 'SecurePass123!',
          displayName: 'Session User',
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'session@example.com',
          password: 'SecurePass123!',
        });

      const sessionCookie = loginResponse.headers['set-cookie'][0];

      // Make multiple requests with the same session
      const requests = [
        request(app).get('/api/auth/me').set('Cookie', sessionCookie),
        request(app).get('/api/articles').set('Cookie', sessionCookie),
        request(app).get('/api/videos').set('Cookie', sessionCookie),
        request(app).get('/api/user/profile').set('Cookie', sessionCookie),
        request(app).get('/api/user/usage').set('Cookie', sessionCookie),
      ];

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // User data should be consistent
      const meResponse = responses[0];
      const profileResponse = responses[3];

      expect(meResponse.body.data.email).toBe('session@example.com');
      expect(profileResponse.body.data.email).toBe('session@example.com');
    });

    it('should reject requests without session cookie', async () => {
      const protectedEndpoints = [
        '/api/auth/me',
        '/api/articles',
        '/api/articles/article-1',
        '/api/videos',
        '/api/videos/video-1',
        '/api/user/profile',
        '/api/user/usage',
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request(app).get(endpoint);
        expect(response.status).toBe(401);
      }
    });

    it('should reject requests with invalid session cookie', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'session_token=invalid-token-that-does-not-exist');

      expect(response.status).toBe(401);
    });
  });

  // ============================================================
  // Logout Tests
  // ============================================================

  describe('Logout Invalidates Session', () => {
    it('should invalidate session after logout', async () => {
      // Register and login
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'logout@example.com',
          password: 'SecurePass123!',
          displayName: 'Logout User',
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logout@example.com',
          password: 'SecurePass123!',
        });

      const sessionCookie = loginResponse.headers['set-cookie'][0];

      // Verify session works
      const beforeLogout = await request(app)
        .get('/api/auth/me')
        .set('Cookie', sessionCookie);

      expect(beforeLogout.status).toBe(200);

      // Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', sessionCookie);

      expect(logoutResponse.status).toBe(200);

      // Session should be cleared in cookie
      expect(logoutResponse.headers['set-cookie']).toBeDefined();

      // Old session token should no longer work
      const afterLogout = await request(app)
        .get('/api/auth/me')
        .set('Cookie', sessionCookie);

      expect(afterLogout.status).toBe(401);
    });

    it('should allow re-login after logout', async () => {
      // Register
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'relogin@example.com',
          password: 'SecurePass123!',
          displayName: 'Re-login User',
        });

      // First login
      const firstLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'relogin@example.com',
          password: 'SecurePass123!',
        });

      const firstSessionCookie = firstLogin.headers['set-cookie'][0];

      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Cookie', firstSessionCookie);

      // Re-login
      const secondLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'relogin@example.com',
          password: 'SecurePass123!',
        });

      expect(secondLogin.status).toBe(200);

      const secondSessionCookie = secondLogin.headers['set-cookie'][0];

      // New session should work
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Cookie', secondSessionCookie);

      expect(meResponse.status).toBe(200);
      expect(meResponse.body.data.email).toBe('relogin@example.com');
    });
  });

  // ============================================================
  // OAuth Redirect Tests (Mocked)
  // ============================================================

  describe('OAuth Redirect Flows (Mocked)', () => {
    it('should redirect to Google OAuth URL', async () => {
      const response = await request(app)
        .get('/api/auth/google');

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('accounts.google.com');
    });

    it('should redirect to Facebook OAuth URL', async () => {
      const response = await request(app)
        .get('/api/auth/facebook');

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('facebook.com');
    });

    it('should handle Google OAuth callback and set cookie', async () => {
      const mockOAuthResult = {
        user: {
          id: 'google-user-id',
          email: 'google@example.com',
          displayName: 'Google User',
          membershipType: 'A' as MembershipType,
          authProvider: 'google' as const,
        },
        sessionToken: 'google-session-token',
        expiresAt: new Date(Date.now() + 86400000),
      };

      mockHandleGoogleCallback.mockResolvedValue(mockOAuthResult);

      const response = await request(app)
        .get('/api/auth/google/callback')
        .query({ code: 'test-auth-code' });

      expect(response.status).toBe(302);
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('session_token');
      expect(response.headers.location).toContain('/dashboard');
    });

    it('should redirect to login with error on OAuth failure', async () => {
      mockHandleGoogleCallback.mockRejectedValue(new Error('OAuth failed'));

      const response = await request(app)
        .get('/api/auth/google/callback')
        .query({ code: 'invalid-code' });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/login');
      expect(response.headers.location).toContain('error=');
    });
  });

  // ============================================================
  // Cookie Configuration Tests
  // ============================================================

  describe('Cookie Configuration', () => {
    it('should set secure cookie attributes', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'cookie@example.com',
          password: 'SecurePass123!',
          displayName: 'Cookie User',
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'cookie@example.com',
          password: 'SecurePass123!',
        });

      const cookie = loginResponse.headers['set-cookie'][0];

      // Check cookie attributes
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('Path=/');
      // SameSite and Secure depend on environment
    });
  });

  // ============================================================
  // Error Handling Tests
  // ============================================================

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/unknown/route');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should prevent duplicate registration', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'SecurePass123!',
        displayName: 'Duplicate User',
      };

      // First registration
      const firstResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(firstResponse.status).toBe(201);

      // Second registration with same email
      const secondResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(secondResponse.status).toBe(409);
      expect(secondResponse.body.error.code).toBe('EMAIL_EXISTS');
    });

    it('should return 404 for non-existent content', async () => {
      // Register and login
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'notfound@example.com',
          password: 'SecurePass123!',
          displayName: 'Not Found User',
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'notfound@example.com',
          password: 'SecurePass123!',
        });

      const sessionCookie = loginResponse.headers['set-cookie'][0];

      // Try to access non-existent article
      const response = await request(app)
        .get('/api/articles/non-existent-article')
        .set('Cookie', sessionCookie);

      expect(response.status).toBe(404);
    });
  });
});
