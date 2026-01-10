/**
 * User Service Tests
 *
 * Tests for user profile and usage retrieval.
 * Validates that user data is returned in the expected format
 * without exposing sensitive information.
 */

import { type MembershipType } from '@astronacci/shared';

// Mock dependencies
const mockFindById = jest.fn();
const mockGetUsageStats = jest.fn();

jest.mock('../../repositories/user.repository', () => ({
  findById: mockFindById,
}));

jest.mock('../../services/quota.service', () => ({
  getUsageStats: mockGetUsageStats,
}));

import { getProfile, getUsage } from '../../services/user.service';
import { UserNotFoundError } from '../../utils/errors';

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    const mockUserDocument = {
      id: 'user-123',
      email: 'user@example.com',
      displayName: 'Test User',
      membershipType: 'A' as MembershipType,
      authProvider: 'email' as const,
      passwordHash: '$2b$12$hashedpasswordvalue',
      googleId: undefined,
      facebookId: undefined,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    };

    it('should return user data without password', async () => {
      mockFindById.mockResolvedValue(mockUserDocument);

      const profile = await getProfile('user-123');

      expect(profile).toHaveProperty('id');
      expect(profile).toHaveProperty('email');
      expect(profile).toHaveProperty('displayName');
      expect(profile).toHaveProperty('membershipType');
      expect(profile).toHaveProperty('authProvider');
      expect(profile).not.toHaveProperty('passwordHash');
    });

    it('should return correct user information', async () => {
      mockFindById.mockResolvedValue(mockUserDocument);

      const profile = await getProfile('user-123');

      expect(profile.id).toBe('user-123');
      expect(profile.email).toBe('user@example.com');
      expect(profile.displayName).toBe('Test User');
      expect(profile.membershipType).toBe('A');
      expect(profile.authProvider).toBe('email');
    });

    it('should throw UserNotFoundError when user does not exist', async () => {
      mockFindById.mockResolvedValue(null);

      await expect(getProfile('nonexistent')).rejects.toThrow(UserNotFoundError);
    });

    it('should not expose OAuth IDs in profile', async () => {
      const userWithOAuth = {
        ...mockUserDocument,
        authProvider: 'google' as const,
        googleId: 'google-oauth-id-123',
      };
      mockFindById.mockResolvedValue(userWithOAuth);

      const profile = await getProfile('user-123');

      expect(profile).not.toHaveProperty('googleId');
      expect(profile).not.toHaveProperty('facebookId');
    });

    it('should not expose timestamp fields in profile', async () => {
      mockFindById.mockResolvedValue(mockUserDocument);

      const profile = await getProfile('user-123');

      // Profile should not include internal timestamp fields
      expect(profile).not.toHaveProperty('createdAt');
      expect(profile).not.toHaveProperty('updatedAt');
    });
  });

  describe('getUsage', () => {
    const mockUsageStats = {
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
      membershipType: 'A' as MembershipType,
    };

    it('should return formatted usage statistics', async () => {
      mockGetUsageStats.mockResolvedValue(mockUsageStats);

      const usage = await getUsage('user-123');

      expect(usage).toHaveProperty('articles');
      expect(usage).toHaveProperty('videos');
      expect(usage).toHaveProperty('membershipType');
    });

    it('should return correct article usage', async () => {
      mockGetUsageStats.mockResolvedValue(mockUsageStats);

      const usage = await getUsage('user-123');

      expect(usage.articles.accessed).toEqual(['article-1', 'article-2']);
      expect(usage.articles.count).toBe(2);
      expect(usage.articles.limit).toBe(3);
      expect(usage.articles.remaining).toBe(1);
    });

    it('should return correct video usage', async () => {
      mockGetUsageStats.mockResolvedValue(mockUsageStats);

      const usage = await getUsage('user-123');

      expect(usage.videos.accessed).toEqual(['video-1']);
      expect(usage.videos.count).toBe(1);
      expect(usage.videos.limit).toBe(3);
      expect(usage.videos.remaining).toBe(2);
    });

    it('should return membership type', async () => {
      mockGetUsageStats.mockResolvedValue(mockUsageStats);

      const usage = await getUsage('user-123');

      expect(usage.membershipType).toBe('A');
    });

    it('should handle Type B user with higher limits', async () => {
      const typeBUsage = {
        articles: {
          accessed: ['a1', 'a2', 'a3', 'a4', 'a5'],
          count: 5,
          limit: 10,
          remaining: 5,
        },
        videos: {
          accessed: ['v1', 'v2'],
          count: 2,
          limit: 10,
          remaining: 8,
        },
        membershipType: 'B' as MembershipType,
      };
      mockGetUsageStats.mockResolvedValue(typeBUsage);

      const usage = await getUsage('user-123');

      expect(usage.membershipType).toBe('B');
      expect(usage.articles.limit).toBe(10);
      expect(usage.videos.limit).toBe(10);
    });

    it('should handle Type C user with unlimited access', async () => {
      const typeCUsage = {
        articles: {
          accessed: Array.from({ length: 50 }, (_, i) => `article-${i}`),
          count: 50,
          limit: Infinity,
          remaining: Infinity,
        },
        videos: {
          accessed: Array.from({ length: 25 }, (_, i) => `video-${i}`),
          count: 25,
          limit: Infinity,
          remaining: Infinity,
        },
        membershipType: 'C' as MembershipType,
      };
      mockGetUsageStats.mockResolvedValue(typeCUsage);

      const usage = await getUsage('user-123');

      expect(usage.membershipType).toBe('C');
      expect(usage.articles.limit).toBe(Infinity);
      expect(usage.articles.remaining).toBe(Infinity);
      expect(usage.videos.limit).toBe(Infinity);
      expect(usage.videos.remaining).toBe(Infinity);
    });

    it('should handle user with no usage', async () => {
      const emptyUsage = {
        articles: {
          accessed: [],
          count: 0,
          limit: 3,
          remaining: 3,
        },
        videos: {
          accessed: [],
          count: 0,
          limit: 3,
          remaining: 3,
        },
        membershipType: 'A' as MembershipType,
      };
      mockGetUsageStats.mockResolvedValue(emptyUsage);

      const usage = await getUsage('user-123');

      expect(usage.articles.count).toBe(0);
      expect(usage.articles.remaining).toBe(3);
      expect(usage.videos.count).toBe(0);
      expect(usage.videos.remaining).toBe(3);
    });
  });
});
