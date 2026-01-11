/**
 * Usage Repository Tests
 *
 * Tests for Firestore usage tracking operations.
 * Uses mocked Firestore to test repository logic without actual database.
 */

// Mock Firestore before importing repository
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockUpdate = jest.fn();
const mockDoc = jest.fn();
const mockCollection = jest.fn();

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
});

mockDoc.mockReturnValue({
  get: mockGet,
  set: mockSet,
  update: mockUpdate,
});

// Mock FieldValue for arrayUnion
const mockArrayUnion = jest.fn((value) => ({ _arrayUnion: value }));
jest.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    arrayUnion: mockArrayUnion,
  },
}));

import {
  getUsage,
  recordArticleAccess,
  recordVideoAccess,
  hasAccessedArticle,
  hasAccessedVideo,
} from '../../repositories/usage.repository';

describe('Usage Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsage', () => {
    it('should return empty arrays for new user', async () => {
      mockGet.mockResolvedValue({
        exists: false,
      });

      const usage = await getUsage('new-user-123');

      expect(mockCollection).toHaveBeenCalledWith('usage');
      expect(mockDoc).toHaveBeenCalledWith('new-user-123');
      expect(usage).toEqual({
        userId: 'new-user-123',
        articlesAccessed: [],
        videosAccessed: [],
        lastUpdated: expect.any(Date),
      });
    });

    it('should return existing usage data', async () => {
      const mockUsageData = {
        userId: 'existing-user-456',
        articlesAccessed: ['article-1', 'article-2'],
        videosAccessed: ['video-1'],
        lastUpdated: new Date(),
      };

      mockGet.mockResolvedValue({
        exists: true,
        id: 'existing-user-456',
        data: () => mockUsageData,
      });

      const usage = await getUsage('existing-user-456');

      expect(usage.articlesAccessed).toEqual(['article-1', 'article-2']);
      expect(usage.videosAccessed).toEqual(['video-1']);
    });

    it('should handle Firestore Timestamp conversion', async () => {
      const mockDate = new Date();
      const mockUsageData = {
        userId: 'user-789',
        articlesAccessed: [],
        videosAccessed: [],
        lastUpdated: { toDate: () => mockDate },
      };

      mockGet.mockResolvedValue({
        exists: true,
        id: 'user-789',
        data: () => mockUsageData,
      });

      const usage = await getUsage('user-789');

      expect(usage.lastUpdated).toEqual(mockDate);
    });
  });

  describe('recordArticleAccess', () => {
    it('should add article ID to array for new user', async () => {
      mockGet.mockResolvedValue({
        exists: false,
      });
      mockSet.mockResolvedValue(undefined);

      await recordArticleAccess('new-user-123', 'article-1');

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'new-user-123',
          articlesAccessed: ['article-1'],
          videosAccessed: [],
          lastUpdated: expect.any(Date),
        })
      );
    });

    it('should add article ID to existing user array', async () => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({
          userId: 'existing-user',
          articlesAccessed: ['article-1'],
          videosAccessed: [],
          lastUpdated: new Date(),
        }),
      });
      mockUpdate.mockResolvedValue(undefined);

      await recordArticleAccess('existing-user', 'article-2');

      expect(mockUpdate).toHaveBeenCalledWith({
        articlesAccessed: expect.anything(), // arrayUnion
        lastUpdated: expect.any(Date),
      });
      expect(mockArrayUnion).toHaveBeenCalledWith('article-2');
    });

    it('should not duplicate article ID if already accessed', async () => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({
          userId: 'user-123',
          articlesAccessed: ['article-1'],
          videosAccessed: [],
          lastUpdated: new Date(),
        }),
      });
      mockUpdate.mockResolvedValue(undefined);

      // arrayUnion automatically handles duplicates in Firestore
      await recordArticleAccess('user-123', 'article-1');

      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('recordVideoAccess', () => {
    it('should add video ID to array for new user', async () => {
      mockGet.mockResolvedValue({
        exists: false,
      });
      mockSet.mockResolvedValue(undefined);

      await recordVideoAccess('new-user-456', 'video-1');

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'new-user-456',
          articlesAccessed: [],
          videosAccessed: ['video-1'],
          lastUpdated: expect.any(Date),
        })
      );
    });

    it('should add video ID to existing user array', async () => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({
          userId: 'existing-user',
          articlesAccessed: [],
          videosAccessed: ['video-1'],
          lastUpdated: new Date(),
        }),
      });
      mockUpdate.mockResolvedValue(undefined);

      await recordVideoAccess('existing-user', 'video-2');

      expect(mockUpdate).toHaveBeenCalledWith({
        videosAccessed: expect.anything(), // arrayUnion
        lastUpdated: expect.any(Date),
      });
      expect(mockArrayUnion).toHaveBeenCalledWith('video-2');
    });
  });

  describe('hasAccessedArticle', () => {
    it('should return true for accessed content', async () => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({
          userId: 'user-123',
          articlesAccessed: ['article-1', 'article-2', 'article-3'],
          videosAccessed: [],
          lastUpdated: new Date(),
        }),
      });

      const result = await hasAccessedArticle('user-123', 'article-2');

      expect(result).toBe(true);
    });

    it('should return false for new content', async () => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({
          userId: 'user-123',
          articlesAccessed: ['article-1', 'article-2'],
          videosAccessed: [],
          lastUpdated: new Date(),
        }),
      });

      const result = await hasAccessedArticle('user-123', 'article-999');

      expect(result).toBe(false);
    });

    it('should return false for new user', async () => {
      mockGet.mockResolvedValue({
        exists: false,
      });

      const result = await hasAccessedArticle('new-user', 'article-1');

      expect(result).toBe(false);
    });
  });

  describe('hasAccessedVideo', () => {
    it('should return true for accessed video', async () => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({
          userId: 'user-123',
          articlesAccessed: [],
          videosAccessed: ['video-1', 'video-2'],
          lastUpdated: new Date(),
        }),
      });

      const result = await hasAccessedVideo('user-123', 'video-1');

      expect(result).toBe(true);
    });

    it('should return false for new video', async () => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({
          userId: 'user-123',
          articlesAccessed: [],
          videosAccessed: ['video-1'],
          lastUpdated: new Date(),
        }),
      });

      const result = await hasAccessedVideo('user-123', 'video-999');

      expect(result).toBe(false);
    });

    it('should return false for new user', async () => {
      mockGet.mockResolvedValue({
        exists: false,
      });

      const result = await hasAccessedVideo('new-user', 'video-1');

      expect(result).toBe(false);
    });
  });

  describe('Usage counts', () => {
    it('should accurately count accessed articles', async () => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({
          userId: 'user-123',
          articlesAccessed: ['a1', 'a2', 'a3'],
          videosAccessed: ['v1', 'v2'],
          lastUpdated: new Date(),
        }),
      });

      const usage = await getUsage('user-123');

      expect(usage.articlesAccessed.length).toBe(3);
      expect(usage.videosAccessed.length).toBe(2);
    });
  });
});
