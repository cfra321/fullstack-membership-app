/**
 * Session Repository Tests
 *
 * Tests for Firestore session operations.
 * Uses mocked Firestore to test repository logic without actual database.
 */

// Mock Firestore before importing repository
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockDelete = jest.fn();
const mockWhere = jest.fn();
const mockDoc = jest.fn();
const mockCollection = jest.fn();

// Mock the query result
const mockQueryGet = jest.fn();
const mockQuerySnapshot = {
  empty: true,
  docs: [] as Array<{ id: string; ref: { delete: jest.Mock }; data: () => Record<string, unknown> }>,
  forEach: jest.fn(),
};

jest.mock('../../config/firebase', () => ({
  getDb: jest.fn(() => ({
    collection: mockCollection,
  })),
  COLLECTIONS: {
    USERS: 'users',
    SESSIONS: 'sessions',
    USAGE: 'usage',
    ARTICLES: 'articles',
    VIDEOS: 'videos',
  },
}));

// Set up mock chain
mockCollection.mockReturnValue({
  doc: mockDoc,
  where: mockWhere,
});

mockDoc.mockReturnValue({
  get: mockGet,
  set: mockSet,
  delete: mockDelete,
});

mockWhere.mockReturnValue({
  get: mockQueryGet,
  where: mockWhere,
});

import {
  createSession,
  findByToken,
  deleteSession,
  deleteExpiredSessions,
  type CreateSessionInput,
} from '../../repositories/session.repository';

describe('Session Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset query snapshot
    mockQuerySnapshot.empty = true;
    mockQuerySnapshot.docs = [];
    mockQueryGet.mockResolvedValue(mockQuerySnapshot);
  });

  describe('createSession', () => {
    it('should store session with expiration', async () => {
      const input: CreateSessionInput = {
        token: 'session-token-123',
        userId: 'user-456',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      };

      mockSet.mockResolvedValue(undefined);

      const session = await createSession(input);

      expect(mockCollection).toHaveBeenCalledWith('sessions');
      expect(mockDoc).toHaveBeenCalledWith('session-token-123');
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'session-token-123',
          userId: 'user-456',
          expiresAt: expect.any(Date),
          createdAt: expect.any(Date),
        })
      );

      expect(session.token).toBe('session-token-123');
      expect(session.userId).toBe('user-456');
    });

    it('should store session with user agent and IP', async () => {
      const input: CreateSessionInput = {
        token: 'session-token-789',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 86400000),
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        ipAddress: '192.168.1.1',
      };

      mockSet.mockResolvedValue(undefined);

      const session = await createSession(input);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          ipAddress: '192.168.1.1',
        })
      );

      expect(session.userAgent).toBe('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
      expect(session.ipAddress).toBe('192.168.1.1');
    });

    it('should use token as document ID', async () => {
      const token = 'unique-session-token';
      const input: CreateSessionInput = {
        token,
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 86400000),
      };

      mockSet.mockResolvedValue(undefined);

      await createSession(input);

      expect(mockDoc).toHaveBeenCalledWith(token);
    });
  });

  describe('findByToken', () => {
    it('should return session when found and not expired', async () => {
      const futureDate = new Date(Date.now() + 86400000); // 1 day in future
      const mockSessionData = {
        token: 'valid-token',
        userId: 'user-123',
        expiresAt: futureDate,
        createdAt: new Date(),
      };

      mockGet.mockResolvedValue({
        exists: true,
        id: 'valid-token',
        data: () => mockSessionData,
      });

      const session = await findByToken('valid-token');

      expect(mockDoc).toHaveBeenCalledWith('valid-token');
      expect(session).not.toBeNull();
      expect(session?.token).toBe('valid-token');
      expect(session?.userId).toBe('user-123');
    });

    it('should return null when not found', async () => {
      mockGet.mockResolvedValue({
        exists: false,
      });

      const session = await findByToken('nonexistent-token');

      expect(session).toBeNull();
    });

    it('should return null for expired session', async () => {
      const pastDate = new Date(Date.now() - 86400000); // 1 day in past
      const mockSessionData = {
        token: 'expired-token',
        userId: 'user-123',
        expiresAt: pastDate,
        createdAt: new Date(Date.now() - 2 * 86400000),
      };

      mockGet.mockResolvedValue({
        exists: true,
        id: 'expired-token',
        data: () => mockSessionData,
      });

      const session = await findByToken('expired-token');

      expect(session).toBeNull();
    });

    it('should handle Firestore Timestamp conversion', async () => {
      const futureDate = new Date(Date.now() + 86400000);
      const mockSessionData = {
        token: 'timestamp-token',
        userId: 'user-123',
        expiresAt: { toDate: () => futureDate },
        createdAt: { toDate: () => new Date() },
      };

      mockGet.mockResolvedValue({
        exists: true,
        id: 'timestamp-token',
        data: () => mockSessionData,
      });

      const session = await findByToken('timestamp-token');

      expect(session).not.toBeNull();
      expect(session?.expiresAt).toEqual(futureDate);
    });
  });

  describe('deleteSession', () => {
    it('should remove session from Firestore', async () => {
      mockDelete.mockResolvedValue(undefined);

      await deleteSession('token-to-delete');

      expect(mockCollection).toHaveBeenCalledWith('sessions');
      expect(mockDoc).toHaveBeenCalledWith('token-to-delete');
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should not throw if session does not exist', async () => {
      mockDelete.mockResolvedValue(undefined);

      await expect(deleteSession('nonexistent-token')).resolves.not.toThrow();
    });
  });

  describe('deleteExpiredSessions', () => {
    it('should delete all expired sessions', async () => {
      const mockDeleteRef = jest.fn().mockResolvedValue(undefined);
      const expiredSessions = [
        { id: 'expired-1', ref: { delete: mockDeleteRef }, data: () => ({}) },
        { id: 'expired-2', ref: { delete: mockDeleteRef }, data: () => ({}) },
        { id: 'expired-3', ref: { delete: mockDeleteRef }, data: () => ({}) },
      ];

      mockQuerySnapshot.empty = false;
      mockQuerySnapshot.docs = expiredSessions;
      mockQuerySnapshot.forEach = jest.fn((callback) => {
        expiredSessions.forEach(callback);
      });
      mockQueryGet.mockResolvedValue(mockQuerySnapshot);

      const count = await deleteExpiredSessions();

      expect(mockWhere).toHaveBeenCalledWith('expiresAt', '<', expect.any(Date));
      expect(count).toBe(3);
      expect(mockDeleteRef).toHaveBeenCalledTimes(3);
    });

    it('should return 0 when no expired sessions exist', async () => {
      mockQuerySnapshot.empty = true;
      mockQuerySnapshot.docs = [];
      mockQueryGet.mockResolvedValue(mockQuerySnapshot);

      const count = await deleteExpiredSessions();

      expect(count).toBe(0);
    });
  });

  describe('Session with metadata', () => {
    it('should retrieve session with user agent and IP', async () => {
      const futureDate = new Date(Date.now() + 86400000);
      const mockSessionData = {
        token: 'session-with-meta',
        userId: 'user-123',
        expiresAt: futureDate,
        createdAt: new Date(),
        userAgent: 'Chrome/120.0.0.0',
        ipAddress: '10.0.0.1',
      };

      mockGet.mockResolvedValue({
        exists: true,
        id: 'session-with-meta',
        data: () => mockSessionData,
      });

      const session = await findByToken('session-with-meta');

      expect(session?.userAgent).toBe('Chrome/120.0.0.0');
      expect(session?.ipAddress).toBe('10.0.0.1');
    });
  });
});
