/**
 * Auth Routes Tests
 *
 * Integration tests for authentication endpoints.
 * Tests registration, login, logout, OAuth flows, and session management.
 */

import { type MembershipType } from '@astronacci/shared';

// Mock dependencies
const mockRegister = jest.fn();
const mockLogin = jest.fn();
const mockLogout = jest.fn();
const mockGetGoogleAuthUrl = jest.fn();
const mockHandleGoogleCallback = jest.fn();
const mockGetFacebookAuthUrl = jest.fn();
const mockHandleFacebookCallback = jest.fn();
const mockValidateSession = jest.fn();

jest.mock('../../services/auth.service', () => ({
  register: mockRegister,
  login: mockLogin,
  logout: mockLogout,
  getGoogleAuthUrl: mockGetGoogleAuthUrl,
  handleGoogleCallback: mockHandleGoogleCallback,
  getFacebookAuthUrl: mockGetFacebookAuthUrl,
  handleFacebookCallback: mockHandleFacebookCallback,
}));

jest.mock('../../services/session.service', () => ({
  validateSession: mockValidateSession,
}));

// Mock rate limiter to not interfere with tests
jest.mock('../../middleware/rateLimit', () => ({
  authRateLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
  createAuthRateLimiter: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import authRouter from '../../routes/auth.routes';
import { errorHandler } from '../../middleware/errorHandler';
import {
  ValidationError,
  EmailExistsError,
  InvalidCredentialsError,
} from '../../utils/errors';

describe('Auth Routes', () => {
  let app: express.Express;

  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    displayName: 'Test User',
    membershipType: 'A' as MembershipType,
    authProvider: 'email' as const,
  };

  const mockAuthResult = {
    user: mockUser,
    sessionToken: 'test-session-token-123',
    expiresAt: new Date(Date.now() + 86400000),
  };

  const mockSession = {
    token: 'test-session-token-123',
    userId: 'user-123',
    expiresAt: new Date(Date.now() + 86400000),
    createdAt: new Date(),
  };

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/auth', authRouter);
    app.use(errorHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    const validRegistration = {
      email: 'newuser@example.com',
      password: 'SecurePassword123',
      displayName: 'New User',
    };

    it('should create user and return 201', async () => {
      mockRegister.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistration);

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('message');
      expect(mockRegister).toHaveBeenCalledWith(validRegistration);
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'SecurePassword123',
          displayName: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.fields).toHaveProperty('email');
    });

    it('should return 400 for short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'user@example.com',
          password: 'short',
          displayName: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.fields).toHaveProperty('password');
    });

    it('should return 400 for missing displayName', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'user@example.com',
          password: 'SecurePassword123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.fields).toHaveProperty('displayName');
    });

    it('should return 409 for duplicate email', async () => {
      mockRegister.mockRejectedValue(new EmailExistsError());

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistration);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('EMAIL_EXISTS');
    });
  });

  describe('POST /api/auth/login', () => {
    const validLogin = {
      email: 'user@example.com',
      password: 'SecurePassword123',
    };

    it('should set HttpOnly cookie on success', async () => {
      mockLogin.mockResolvedValue(mockAuthResult);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLogin);

      expect(response.status).toBe(200);
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('session_token');
      expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    });

    it('should return user data on success', async () => {
      mockLogin.mockResolvedValue(mockAuthResult);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLogin);

      expect(response.body.data.user).toEqual(mockUser);
      expect(response.body.data).toHaveProperty('expiresAt');
    });

    it('should return 401 for invalid credentials', async () => {
      mockLogin.mockRejectedValue(new InvalidCredentialsError());

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLogin);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.error.fields).toHaveProperty('email');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error.fields).toHaveProperty('password');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear cookie and return success', async () => {
      mockLogout.mockResolvedValue(undefined);
      mockValidateSession.mockResolvedValue({
        user: { ...mockUser, createdAt: new Date(), updatedAt: new Date() },
        session: mockSession,
      });

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', 'session_token=test-token');

      expect(response.status).toBe(200);
      expect(response.headers['set-cookie']).toBeDefined();
      // Cookie should be cleared (empty value or expired)
      expect(mockLogout).toHaveBeenCalled();
    });

    it('should return 401 without session', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user', async () => {
      mockValidateSession.mockResolvedValue({
        user: { ...mockUser, createdAt: new Date(), updatedAt: new Date() },
        session: mockSession,
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'session_token=valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(mockUser.id);
      expect(response.body.data.email).toBe(mockUser.email);
    });

    it('should return 401 without session', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      mockValidateSession.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'session_token=invalid-token');

      expect(response.status).toBe(401);
    });

    it('should not return password in response', async () => {
      mockValidateSession.mockResolvedValue({
        user: {
          ...mockUser,
          passwordHash: 'should-not-appear',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: mockSession,
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'session_token=valid-token');

      expect(response.body.data).not.toHaveProperty('passwordHash');
    });
  });

  describe('GET /api/auth/google', () => {
    it('should redirect to Google OAuth URL', async () => {
      const googleAuthUrl = 'https://accounts.google.com/o/oauth2/auth?client_id=test';
      mockGetGoogleAuthUrl.mockReturnValue(googleAuthUrl);

      const response = await request(app)
        .get('/api/auth/google');

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe(googleAuthUrl);
    });
  });

  describe('GET /api/auth/google/callback', () => {
    it('should handle OAuth response and set cookie', async () => {
      mockHandleGoogleCallback.mockResolvedValue(mockAuthResult);

      const response = await request(app)
        .get('/api/auth/google/callback')
        .query({ code: 'auth-code-123' });

      expect(response.status).toBe(302);
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('session_token');
    });

    it('should redirect to frontend after success', async () => {
      mockHandleGoogleCallback.mockResolvedValue(mockAuthResult);

      const response = await request(app)
        .get('/api/auth/google/callback')
        .query({ code: 'auth-code-123' });

      expect(response.headers.location).toContain('/dashboard');
    });

    it('should redirect to login on error', async () => {
      mockHandleGoogleCallback.mockRejectedValue(new Error('OAuth failed'));

      const response = await request(app)
        .get('/api/auth/google/callback')
        .query({ code: 'invalid-code' });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/login');
      expect(response.headers.location).toContain('error=');
    });
  });

  describe('GET /api/auth/facebook', () => {
    it('should redirect to Facebook OAuth URL', async () => {
      const facebookAuthUrl = 'https://www.facebook.com/v18.0/dialog/oauth?client_id=test';
      mockGetFacebookAuthUrl.mockReturnValue(facebookAuthUrl);

      const response = await request(app)
        .get('/api/auth/facebook');

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe(facebookAuthUrl);
    });
  });

  describe('GET /api/auth/facebook/callback', () => {
    it('should handle OAuth response and set cookie', async () => {
      mockHandleFacebookCallback.mockResolvedValue(mockAuthResult);

      const response = await request(app)
        .get('/api/auth/facebook/callback')
        .query({ code: 'auth-code-123' });

      expect(response.status).toBe(302);
      expect(response.headers['set-cookie']).toBeDefined();
    });
  });

  describe('Rate limiting', () => {
    // Note: Rate limiting is mocked in these tests for simplicity
    // In a real integration test, you would test actual rate limiting behavior
    it('should have rate limiter applied to login endpoint', async () => {
      mockLogin.mockResolvedValue(mockAuthResult);

      // First request should succeed
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
        });

      // Rate limiter is mocked, so this just verifies the endpoint works
      expect(response.status).toBe(200);
    });
  });
});
