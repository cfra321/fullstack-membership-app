/**
 * Auth Middleware Tests
 *
 * Tests for session validation middleware.
 * Validates that protected routes are properly gated by authentication.
 */

import { type Request, type Response, type NextFunction } from 'express';
import { type MembershipType } from '@astronacci/shared';

// Mock dependencies
const mockValidateSession = jest.fn();

jest.mock('../../services/session.service', () => ({
  validateSession: mockValidateSession,
}));

import { requireAuth, optionalAuth } from '../../middleware/auth';
import { UnauthorizedError, SessionExpiredError, SessionInvalidError } from '../../utils/errors';

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

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
    token: 'valid-session-token',
    userId: 'user-123',
    expiresAt: new Date(Date.now() + 86400000),
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      cookies: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('requireAuth', () => {
    it('should return 401 when no cookie present', async () => {
      mockRequest.cookies = {};

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockValidateSession).not.toHaveBeenCalled();
    });

    it('should return 401 when session_token cookie is empty', async () => {
      mockRequest.cookies = { session_token: '' };

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should return 401 when session token is invalid', async () => {
      mockRequest.cookies = { session_token: 'invalid-token' };
      mockValidateSession.mockResolvedValue(null);

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockValidateSession).toHaveBeenCalledWith('invalid-token');
      expect(mockNext).toHaveBeenCalledWith(expect.any(SessionInvalidError));
    });

    it('should attach user to req.user on valid session', async () => {
      mockRequest.cookies = { session_token: 'valid-token' };
      mockValidateSession.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect((mockRequest as any).user).toEqual(mockUser);
      expect((mockRequest as any).session).toEqual(mockSession);
    });

    it('should call next() with no arguments on valid session', async () => {
      mockRequest.cookies = { session_token: 'valid-token' };
      mockValidateSession.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should handle session validation errors gracefully', async () => {
      mockRequest.cookies = { session_token: 'valid-token' };
      mockValidateSession.mockRejectedValue(new Error('Database error'));

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should validate the exact session token from cookie', async () => {
      const specificToken = 'specific-session-token-12345';
      mockRequest.cookies = { session_token: specificToken };
      mockValidateSession.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockValidateSession).toHaveBeenCalledWith(specificToken);
    });
  });

  describe('optionalAuth', () => {
    it('should call next() when no cookie present', async () => {
      mockRequest.cookies = {};

      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
      expect((mockRequest as any).user).toBeUndefined();
    });

    it('should attach user when valid session exists', async () => {
      mockRequest.cookies = { session_token: 'valid-token' };
      mockValidateSession.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });

      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect((mockRequest as any).user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should continue without user when session is invalid', async () => {
      mockRequest.cookies = { session_token: 'invalid-token' };
      mockValidateSession.mockResolvedValue(null);

      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect((mockRequest as any).user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should continue without user when validation throws', async () => {
      mockRequest.cookies = { session_token: 'error-token' };
      mockValidateSession.mockRejectedValue(new Error('Database error'));

      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect((mockRequest as any).user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('Session token extraction', () => {
    it('should extract token from session_token cookie', async () => {
      mockRequest.cookies = { session_token: 'extracted-token' };
      mockValidateSession.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockValidateSession).toHaveBeenCalledWith('extracted-token');
    });

    it('should handle whitespace in token', async () => {
      mockRequest.cookies = { session_token: '  token-with-spaces  ' };
      mockValidateSession.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockValidateSession).toHaveBeenCalledWith('token-with-spaces');
    });
  });
});
