/**
 * Session Service Tests
 *
 * Tests for session lifecycle management including creation,
 * validation, and invalidation.
 */

import { type UserDocument } from '@astronacci/shared';

// Mock dependencies
const mockGenerateSessionToken = jest.fn();
const mockCreateSession = jest.fn();
const mockFindByToken = jest.fn();
const mockDeleteSession = jest.fn();
const mockFindById = jest.fn();

jest.mock('../../utils/crypto', () => ({
  generateSessionToken: mockGenerateSessionToken,
}));

jest.mock('../../repositories/session.repository', () => ({
  createSession: mockCreateSession,
  findByToken: mockFindByToken,
  deleteSession: mockDeleteSession,
}));

jest.mock('../../repositories/user.repository', () => ({
  findById: mockFindById,
}));

import {
  createSession,
  validateSession,
  invalidateSession,
} from '../../services/session.service';

describe('Session Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should generate token and store in Firestore', async () => {
      const userId = 'user-123';
      const mockToken = 'generated-token-abc123def456';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      mockGenerateSessionToken.mockReturnValue(mockToken);
      mockCreateSession.mockResolvedValue({
        token: mockToken,
        userId,
        expiresAt,
        createdAt: new Date(),
      });

      const session = await createSession(userId);

      expect(mockGenerateSessionToken).toHaveBeenCalled();
      expect(mockCreateSession).toHaveBeenCalledWith({
        token: mockToken,
        userId,
        expiresAt: expect.any(Date),
        userAgent: undefined,
        ipAddress: undefined,
      });
      expect(session.token).toBe(mockToken);
      expect(session.userId).toBe(userId);
    });

    it('should store session with user agent and IP', async () => {
      const userId = 'user-456';
      const mockToken = 'token-xyz789';
      const userAgent = 'Mozilla/5.0 Chrome/120';
      const ipAddress = '192.168.1.100';

      mockGenerateSessionToken.mockReturnValue(mockToken);
      mockCreateSession.mockResolvedValue({
        token: mockToken,
        userId,
        expiresAt: new Date(),
        createdAt: new Date(),
        userAgent,
        ipAddress,
      });

      const session = await createSession(userId, { userAgent, ipAddress });

      expect(mockCreateSession).toHaveBeenCalledWith({
        token: mockToken,
        userId,
        expiresAt: expect.any(Date),
        userAgent,
        ipAddress,
      });
      expect(session.userAgent).toBe(userAgent);
      expect(session.ipAddress).toBe(ipAddress);
    });

    it('should set expiration to 7 days by default', async () => {
      const userId = 'user-789';
      const mockToken = 'token-123';
      const now = Date.now();

      mockGenerateSessionToken.mockReturnValue(mockToken);
      mockCreateSession.mockImplementation((input) => {
        return Promise.resolve({
          ...input,
          createdAt: new Date(),
        });
      });

      await createSession(userId);

      const createCall = mockCreateSession.mock.calls[0][0];
      const expiresAt = createCall.expiresAt.getTime();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

      // Should be approximately 7 days from now
      expect(expiresAt).toBeGreaterThan(now + sevenDaysMs - 1000);
      expect(expiresAt).toBeLessThan(now + sevenDaysMs + 1000);
    });
  });

  describe('validateSession', () => {
    it('should return user for valid token', async () => {
      const mockToken = 'valid-token-123';
      const userId = 'user-123';
      const mockUser: UserDocument = {
        id: userId,
        email: 'user@example.com',
        displayName: 'Test User',
        membershipType: 'A',
        authProvider: 'email',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFindByToken.mockResolvedValue({
        token: mockToken,
        userId,
        expiresAt: new Date(Date.now() + 86400000), // 1 day from now
        createdAt: new Date(),
      });
      mockFindById.mockResolvedValue(mockUser);

      const result = await validateSession(mockToken);

      expect(mockFindByToken).toHaveBeenCalledWith(mockToken);
      expect(mockFindById).toHaveBeenCalledWith(userId);
      expect(result).not.toBeNull();
      expect(result?.user.id).toBe(userId);
      expect(result?.user.email).toBe('user@example.com');
    });

    it('should return null for expired token', async () => {
      const mockToken = 'expired-token';

      // Repository returns null for expired sessions
      mockFindByToken.mockResolvedValue(null);

      const result = await validateSession(mockToken);

      expect(mockFindByToken).toHaveBeenCalledWith(mockToken);
      expect(mockFindById).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null for invalid token', async () => {
      const mockToken = 'invalid-token-xyz';

      mockFindByToken.mockResolvedValue(null);

      const result = await validateSession(mockToken);

      expect(result).toBeNull();
    });

    it('should return null if user no longer exists', async () => {
      const mockToken = 'orphaned-session-token';
      const userId = 'deleted-user-456';

      mockFindByToken.mockResolvedValue({
        token: mockToken,
        userId,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
      });
      mockFindById.mockResolvedValue(null);

      const result = await validateSession(mockToken);

      expect(result).toBeNull();
    });

    it('should return session info along with user', async () => {
      const mockToken = 'full-session-token';
      const userId = 'user-full';
      const expiresAt = new Date(Date.now() + 86400000);
      const mockUser: UserDocument = {
        id: userId,
        email: 'full@example.com',
        displayName: 'Full User',
        membershipType: 'B',
        authProvider: 'google',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFindByToken.mockResolvedValue({
        token: mockToken,
        userId,
        expiresAt,
        createdAt: new Date(),
      });
      mockFindById.mockResolvedValue(mockUser);

      const result = await validateSession(mockToken);

      expect(result).not.toBeNull();
      expect(result?.session.token).toBe(mockToken);
      expect(result?.session.expiresAt).toEqual(expiresAt);
    });
  });

  describe('invalidateSession', () => {
    it('should remove session from Firestore', async () => {
      const mockToken = 'token-to-invalidate';

      mockDeleteSession.mockResolvedValue(undefined);

      await invalidateSession(mockToken);

      expect(mockDeleteSession).toHaveBeenCalledWith(mockToken);
    });

    it('should not throw if session does not exist', async () => {
      const mockToken = 'nonexistent-token';

      mockDeleteSession.mockResolvedValue(undefined);

      await expect(invalidateSession(mockToken)).resolves.not.toThrow();
    });
  });

  describe('Session with different membership types', () => {
    it('should validate session for Type A member', async () => {
      const mockToken = 'type-a-token';
      const mockUser: UserDocument = {
        id: 'type-a-user',
        email: 'typea@example.com',
        displayName: 'Type A User',
        membershipType: 'A',
        authProvider: 'email',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFindByToken.mockResolvedValue({
        token: mockToken,
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
      });
      mockFindById.mockResolvedValue(mockUser);

      const result = await validateSession(mockToken);

      expect(result?.user.membershipType).toBe('A');
    });

    it('should validate session for Type C member', async () => {
      const mockToken = 'type-c-token';
      const mockUser: UserDocument = {
        id: 'type-c-user',
        email: 'typec@example.com',
        displayName: 'Type C User',
        membershipType: 'C',
        authProvider: 'facebook',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFindByToken.mockResolvedValue({
        token: mockToken,
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
      });
      mockFindById.mockResolvedValue(mockUser);

      const result = await validateSession(mockToken);

      expect(result?.user.membershipType).toBe('C');
    });
  });
});
