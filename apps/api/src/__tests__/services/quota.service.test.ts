/**
 * Quota Service Tests
 *
 * Tests for membership quota enforcement.
 * Validates that content access is properly restricted based on membership type.
 */

import { type MembershipType } from '@astronacci/shared';

// Mock dependencies
const mockGetUsage = jest.fn();
const mockRecordArticleAccess = jest.fn();
const mockRecordVideoAccess = jest.fn();
const mockFindById = jest.fn();

jest.mock('../../repositories/usage.repository', () => ({
  getUsage: mockGetUsage,
  recordArticleAccess: mockRecordArticleAccess,
  recordVideoAccess: mockRecordVideoAccess,
}));

jest.mock('../../repositories/user.repository', () => ({
  findById: mockFindById,
}));

import {
  checkAccess,
  recordAccess,
  getUsageStats,
} from '../../services/quota.service';

describe('Quota Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkAccess', () => {
    describe('Type A membership (3 articles, 3 videos limit)', () => {
      beforeEach(() => {
        mockFindById.mockResolvedValue({
          id: 'user-a',
          email: 'a@example.com',
          displayName: 'Type A User',
          membershipType: 'A' as MembershipType,
          authProvider: 'email',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      it('should allow Type A user with < 3 articles', async () => {
        mockGetUsage.mockResolvedValue({
          userId: 'user-a',
          articlesAccessed: ['article-1', 'article-2'],
          videosAccessed: [],
          lastUpdated: new Date(),
        });

        const result = await checkAccess('user-a', 'article', 'article-3');

        expect(result.allowed).toBe(true);
        expect(result.reason).toBe('within_quota');
        expect(result.currentUsage).toBe(2);
        expect(result.limit).toBe(3);
      });

      it('should deny Type A user with 3 articles when accessing new article', async () => {
        mockGetUsage.mockResolvedValue({
          userId: 'user-a',
          articlesAccessed: ['article-1', 'article-2', 'article-3'],
          videosAccessed: [],
          lastUpdated: new Date(),
        });

        const result = await checkAccess('user-a', 'article', 'article-4');

        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('quota_exceeded');
        expect(result.currentUsage).toBe(3);
        expect(result.limit).toBe(3);
      });

      it('should allow Type A user to re-access already accessed article', async () => {
        mockGetUsage.mockResolvedValue({
          userId: 'user-a',
          articlesAccessed: ['article-1', 'article-2', 'article-3'],
          videosAccessed: [],
          lastUpdated: new Date(),
        });

        const result = await checkAccess('user-a', 'article', 'article-1');

        expect(result.allowed).toBe(true);
        expect(result.reason).toBe('already_accessed');
      });

      it('should allow Type A user with < 3 videos', async () => {
        mockGetUsage.mockResolvedValue({
          userId: 'user-a',
          articlesAccessed: [],
          videosAccessed: ['video-1'],
          lastUpdated: new Date(),
        });

        const result = await checkAccess('user-a', 'video', 'video-2');

        expect(result.allowed).toBe(true);
        expect(result.reason).toBe('within_quota');
        expect(result.currentUsage).toBe(1);
        expect(result.limit).toBe(3);
      });

      it('should deny Type A user with 3 videos when accessing new video', async () => {
        mockGetUsage.mockResolvedValue({
          userId: 'user-a',
          articlesAccessed: [],
          videosAccessed: ['video-1', 'video-2', 'video-3'],
          lastUpdated: new Date(),
        });

        const result = await checkAccess('user-a', 'video', 'video-4');

        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('quota_exceeded');
        expect(result.currentUsage).toBe(3);
        expect(result.limit).toBe(3);
      });
    });

    describe('Type B membership (10 articles, 10 videos limit)', () => {
      beforeEach(() => {
        mockFindById.mockResolvedValue({
          id: 'user-b',
          email: 'b@example.com',
          displayName: 'Type B User',
          membershipType: 'B' as MembershipType,
          authProvider: 'email',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      it('should allow Type B user with < 10 articles', async () => {
        mockGetUsage.mockResolvedValue({
          userId: 'user-b',
          articlesAccessed: ['a1', 'a2', 'a3', 'a4', 'a5'],
          videosAccessed: [],
          lastUpdated: new Date(),
        });

        const result = await checkAccess('user-b', 'article', 'a6');

        expect(result.allowed).toBe(true);
        expect(result.reason).toBe('within_quota');
        expect(result.currentUsage).toBe(5);
        expect(result.limit).toBe(10);
      });

      it('should deny Type B user with 10 articles when accessing new article', async () => {
        mockGetUsage.mockResolvedValue({
          userId: 'user-b',
          articlesAccessed: ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'a10'],
          videosAccessed: [],
          lastUpdated: new Date(),
        });

        const result = await checkAccess('user-b', 'article', 'a11');

        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('quota_exceeded');
        expect(result.currentUsage).toBe(10);
        expect(result.limit).toBe(10);
      });
    });

    describe('Type C membership (unlimited access)', () => {
      beforeEach(() => {
        mockFindById.mockResolvedValue({
          id: 'user-c',
          email: 'c@example.com',
          displayName: 'Type C User',
          membershipType: 'C' as MembershipType,
          authProvider: 'email',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      it('should allow Type C user unlimited article access', async () => {
        mockGetUsage.mockResolvedValue({
          userId: 'user-c',
          articlesAccessed: Array.from({ length: 100 }, (_, i) => `article-${i}`),
          videosAccessed: [],
          lastUpdated: new Date(),
        });

        const result = await checkAccess('user-c', 'article', 'article-101');

        expect(result.allowed).toBe(true);
        expect(result.reason).toBe('within_quota');
        expect(result.currentUsage).toBe(100);
        expect(result.limit).toBe(Infinity);
      });

      it('should allow Type C user unlimited video access', async () => {
        mockGetUsage.mockResolvedValue({
          userId: 'user-c',
          articlesAccessed: [],
          videosAccessed: Array.from({ length: 50 }, (_, i) => `video-${i}`),
          lastUpdated: new Date(),
        });

        const result = await checkAccess('user-c', 'video', 'video-51');

        expect(result.allowed).toBe(true);
        expect(result.reason).toBe('within_quota');
        expect(result.currentUsage).toBe(50);
        expect(result.limit).toBe(Infinity);
      });
    });

    describe('Already accessed content', () => {
      it('should allow re-access to already accessed article regardless of quota', async () => {
        mockFindById.mockResolvedValue({
          id: 'user-a',
          email: 'a@example.com',
          displayName: 'Type A User',
          membershipType: 'A' as MembershipType,
          authProvider: 'email',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        mockGetUsage.mockResolvedValue({
          userId: 'user-a',
          articlesAccessed: ['article-1', 'article-2', 'article-3'],
          videosAccessed: [],
          lastUpdated: new Date(),
        });

        // User at quota limit, but accessing previously accessed article
        const result = await checkAccess('user-a', 'article', 'article-2');

        expect(result.allowed).toBe(true);
        expect(result.reason).toBe('already_accessed');
      });

      it('should allow re-access to already accessed video regardless of quota', async () => {
        mockFindById.mockResolvedValue({
          id: 'user-a',
          email: 'a@example.com',
          displayName: 'Type A User',
          membershipType: 'A' as MembershipType,
          authProvider: 'email',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        mockGetUsage.mockResolvedValue({
          userId: 'user-a',
          articlesAccessed: [],
          videosAccessed: ['video-1', 'video-2', 'video-3'],
          lastUpdated: new Date(),
        });

        // User at quota limit, but accessing previously accessed video
        const result = await checkAccess('user-a', 'video', 'video-3');

        expect(result.allowed).toBe(true);
        expect(result.reason).toBe('already_accessed');
      });
    });

    it('should throw error if user not found', async () => {
      mockFindById.mockResolvedValue(null);

      await expect(checkAccess('nonexistent-user', 'article', 'article-1')).rejects.toThrow();
    });
  });

  describe('recordAccess', () => {
    beforeEach(() => {
      mockFindById.mockResolvedValue({
        id: 'user-a',
        email: 'a@example.com',
        displayName: 'Type A User',
        membershipType: 'A' as MembershipType,
        authProvider: 'email',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it('should record article access', async () => {
      await recordAccess('user-a', 'article', 'article-123');

      expect(mockRecordArticleAccess).toHaveBeenCalledWith('user-a', 'article-123');
      expect(mockRecordVideoAccess).not.toHaveBeenCalled();
    });

    it('should record video access', async () => {
      await recordAccess('user-a', 'video', 'video-456');

      expect(mockRecordVideoAccess).toHaveBeenCalledWith('user-a', 'video-456');
      expect(mockRecordArticleAccess).not.toHaveBeenCalled();
    });
  });

  describe('getUsageStats', () => {
    it('should return correct usage stats for Type A user', async () => {
      mockFindById.mockResolvedValue({
        id: 'user-a',
        email: 'a@example.com',
        displayName: 'Type A User',
        membershipType: 'A' as MembershipType,
        authProvider: 'email',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockGetUsage.mockResolvedValue({
        userId: 'user-a',
        articlesAccessed: ['article-1', 'article-2'],
        videosAccessed: ['video-1'],
        lastUpdated: new Date(),
      });

      const stats = await getUsageStats('user-a');

      expect(stats.membershipType).toBe('A');
      expect(stats.articles.accessed).toEqual(['article-1', 'article-2']);
      expect(stats.articles.count).toBe(2);
      expect(stats.articles.limit).toBe(3);
      expect(stats.articles.remaining).toBe(1);
      expect(stats.videos.accessed).toEqual(['video-1']);
      expect(stats.videos.count).toBe(1);
      expect(stats.videos.limit).toBe(3);
      expect(stats.videos.remaining).toBe(2);
    });

    it('should return correct usage stats for Type B user', async () => {
      mockFindById.mockResolvedValue({
        id: 'user-b',
        email: 'b@example.com',
        displayName: 'Type B User',
        membershipType: 'B' as MembershipType,
        authProvider: 'email',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockGetUsage.mockResolvedValue({
        userId: 'user-b',
        articlesAccessed: ['a1', 'a2', 'a3', 'a4', 'a5'],
        videosAccessed: ['v1', 'v2'],
        lastUpdated: new Date(),
      });

      const stats = await getUsageStats('user-b');

      expect(stats.membershipType).toBe('B');
      expect(stats.articles.count).toBe(5);
      expect(stats.articles.limit).toBe(10);
      expect(stats.articles.remaining).toBe(5);
      expect(stats.videos.count).toBe(2);
      expect(stats.videos.limit).toBe(10);
      expect(stats.videos.remaining).toBe(8);
    });

    it('should return Infinity for Type C user limits', async () => {
      mockFindById.mockResolvedValue({
        id: 'user-c',
        email: 'c@example.com',
        displayName: 'Type C User',
        membershipType: 'C' as MembershipType,
        authProvider: 'email',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockGetUsage.mockResolvedValue({
        userId: 'user-c',
        articlesAccessed: ['a1', 'a2'],
        videosAccessed: ['v1'],
        lastUpdated: new Date(),
      });

      const stats = await getUsageStats('user-c');

      expect(stats.membershipType).toBe('C');
      expect(stats.articles.limit).toBe(Infinity);
      expect(stats.articles.remaining).toBe(Infinity);
      expect(stats.videos.limit).toBe(Infinity);
      expect(stats.videos.remaining).toBe(Infinity);
    });

    it('should return zero remaining when at quota', async () => {
      mockFindById.mockResolvedValue({
        id: 'user-a',
        email: 'a@example.com',
        displayName: 'Type A User',
        membershipType: 'A' as MembershipType,
        authProvider: 'email',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockGetUsage.mockResolvedValue({
        userId: 'user-a',
        articlesAccessed: ['a1', 'a2', 'a3'],
        videosAccessed: ['v1', 'v2', 'v3'],
        lastUpdated: new Date(),
      });

      const stats = await getUsageStats('user-a');

      expect(stats.articles.remaining).toBe(0);
      expect(stats.videos.remaining).toBe(0);
    });

    it('should throw error if user not found', async () => {
      mockFindById.mockResolvedValue(null);

      await expect(getUsageStats('nonexistent-user')).rejects.toThrow();
    });
  });
});
