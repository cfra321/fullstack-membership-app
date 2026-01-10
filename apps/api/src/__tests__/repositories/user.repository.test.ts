/**
 * User Repository Tests
 *
 * Tests for Firestore user operations.
 * Uses mocked Firestore to test repository logic without actual database.
 */

import { type MembershipType, type AuthProvider } from '@astronacci/shared';

// Mock Firestore before importing repository
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockUpdate = jest.fn();
const mockWhere = jest.fn();
const mockDoc = jest.fn();
const mockCollection = jest.fn();

// Mock the query result
const mockQueryGet = jest.fn();
const mockQuerySnapshot = {
  empty: true,
  docs: [] as Array<{ id: string; data: () => Record<string, unknown> }>,
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
  update: mockUpdate,
});

mockWhere.mockReturnValue({
  get: mockQueryGet,
  limit: jest.fn().mockReturnValue({
    get: mockQueryGet,
  }),
});

import {
  createUser,
  findByEmail,
  findById,
  findByGoogleId,
  findByFacebookId,
  updateUser,
  type CreateUserInput,
} from '../../repositories/user.repository';

describe('User Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset query snapshot
    mockQuerySnapshot.empty = true;
    mockQuerySnapshot.docs = [];
    mockQueryGet.mockResolvedValue(mockQuerySnapshot);
  });

  describe('createUser', () => {
    it('should store user document with generated ID', async () => {
      const input: CreateUserInput = {
        email: 'test@example.com',
        displayName: 'Test User',
        authProvider: 'email' as AuthProvider,
        passwordHash: 'hashed_password',
      };

      mockSet.mockResolvedValue(undefined);

      const user = await createUser(input);

      expect(mockCollection).toHaveBeenCalledWith('users');
      expect(mockDoc).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          displayName: 'Test User',
          authProvider: 'email',
          membershipType: 'A', // Default membership
          passwordHash: 'hashed_password',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      );

      expect(user).toMatchObject({
        email: 'test@example.com',
        displayName: 'Test User',
        authProvider: 'email',
        membershipType: 'A',
      });
      expect(user.id).toBeDefined();
    });

    it('should store OAuth user with provider ID', async () => {
      const input: CreateUserInput = {
        email: 'google@example.com',
        displayName: 'Google User',
        authProvider: 'google' as AuthProvider,
        googleId: 'google-123',
      };

      mockSet.mockResolvedValue(undefined);

      const user = await createUser(input);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'google@example.com',
          authProvider: 'google',
          googleId: 'google-123',
        })
      );

      expect(user.authProvider).toBe('google');
    });

    it('should default membership to type A', async () => {
      const input: CreateUserInput = {
        email: 'test@example.com',
        displayName: 'Test User',
        authProvider: 'email' as AuthProvider,
      };

      mockSet.mockResolvedValue(undefined);

      const user = await createUser(input);

      expect(user.membershipType).toBe('A');
    });

    it('should allow specifying membership type', async () => {
      const input: CreateUserInput = {
        email: 'premium@example.com',
        displayName: 'Premium User',
        authProvider: 'email' as AuthProvider,
        membershipType: 'C' as MembershipType,
      };

      mockSet.mockResolvedValue(undefined);

      const user = await createUser(input);

      expect(user.membershipType).toBe('C');
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      const mockUserData = {
        email: 'test@example.com',
        displayName: 'Test User',
        authProvider: 'email',
        membershipType: 'A',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockQuerySnapshot.empty = false;
      mockQuerySnapshot.docs = [
        {
          id: 'user-123',
          data: () => mockUserData,
        },
      ];
      mockQueryGet.mockResolvedValue(mockQuerySnapshot);

      const user = await findByEmail('test@example.com');

      expect(mockWhere).toHaveBeenCalledWith('email', '==', 'test@example.com');
      expect(user).not.toBeNull();
      expect(user?.id).toBe('user-123');
      expect(user?.email).toBe('test@example.com');
    });

    it('should return null when not found', async () => {
      mockQuerySnapshot.empty = true;
      mockQuerySnapshot.docs = [];
      mockQueryGet.mockResolvedValue(mockQuerySnapshot);

      const user = await findByEmail('notfound@example.com');

      expect(user).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUserData = {
        email: 'test@example.com',
        displayName: 'Test User',
        authProvider: 'email',
        membershipType: 'B',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGet.mockResolvedValue({
        exists: true,
        id: 'user-123',
        data: () => mockUserData,
      });

      const user = await findById('user-123');

      expect(mockDoc).toHaveBeenCalledWith('user-123');
      expect(user).not.toBeNull();
      expect(user?.id).toBe('user-123');
      expect(user?.membershipType).toBe('B');
    });

    it('should return null when not found', async () => {
      mockGet.mockResolvedValue({
        exists: false,
      });

      const user = await findById('nonexistent');

      expect(user).toBeNull();
    });
  });

  describe('findByGoogleId', () => {
    it('should return user for OAuth login', async () => {
      const mockUserData = {
        email: 'google@example.com',
        displayName: 'Google User',
        authProvider: 'google',
        membershipType: 'A',
        googleId: 'google-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockQuerySnapshot.empty = false;
      mockQuerySnapshot.docs = [
        {
          id: 'user-456',
          data: () => mockUserData,
        },
      ];
      mockQueryGet.mockResolvedValue(mockQuerySnapshot);

      const user = await findByGoogleId('google-123');

      expect(mockWhere).toHaveBeenCalledWith('googleId', '==', 'google-123');
      expect(user).not.toBeNull();
      expect(user?.googleId).toBe('google-123');
      expect(user?.authProvider).toBe('google');
    });

    it('should return null when Google ID not found', async () => {
      mockQuerySnapshot.empty = true;
      mockQuerySnapshot.docs = [];
      mockQueryGet.mockResolvedValue(mockQuerySnapshot);

      const user = await findByGoogleId('unknown-google-id');

      expect(user).toBeNull();
    });
  });

  describe('findByFacebookId', () => {
    it('should return user for OAuth login', async () => {
      const mockUserData = {
        email: 'facebook@example.com',
        displayName: 'Facebook User',
        authProvider: 'facebook',
        membershipType: 'A',
        facebookId: 'fb-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockQuerySnapshot.empty = false;
      mockQuerySnapshot.docs = [
        {
          id: 'user-789',
          data: () => mockUserData,
        },
      ];
      mockQueryGet.mockResolvedValue(mockQuerySnapshot);

      const user = await findByFacebookId('fb-123');

      expect(mockWhere).toHaveBeenCalledWith('facebookId', '==', 'fb-123');
      expect(user).not.toBeNull();
      expect(user?.facebookId).toBe('fb-123');
      expect(user?.authProvider).toBe('facebook');
    });

    it('should return null when Facebook ID not found', async () => {
      mockQuerySnapshot.empty = true;
      mockQuerySnapshot.docs = [];
      mockQueryGet.mockResolvedValue(mockQuerySnapshot);

      const user = await findByFacebookId('unknown-fb-id');

      expect(user).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should modify existing document', async () => {
      mockUpdate.mockResolvedValue(undefined);

      await updateUser('user-123', {
        displayName: 'Updated Name',
        membershipType: 'B' as MembershipType,
      });

      expect(mockDoc).toHaveBeenCalledWith('user-123');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          displayName: 'Updated Name',
          membershipType: 'B',
          updatedAt: expect.any(Date),
        })
      );
    });

    it('should only update specified fields', async () => {
      mockUpdate.mockResolvedValue(undefined);

      await updateUser('user-123', {
        displayName: 'New Name',
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        displayName: 'New Name',
        updatedAt: expect.any(Date),
      });
    });

    it('should update membership type', async () => {
      mockUpdate.mockResolvedValue(undefined);

      await updateUser('user-123', {
        membershipType: 'C' as MembershipType,
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        membershipType: 'C',
        updatedAt: expect.any(Date),
      });
    });
  });
});
