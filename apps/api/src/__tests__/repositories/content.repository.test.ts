/**
 * Content Repository Tests
 *
 * Tests for Firestore article and video retrieval operations.
 * Uses mocked Firestore to test repository logic without actual database.
 */

// Mock Firestore before importing repository
const mockGet = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();
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
  orderBy: mockOrderBy,
});

mockDoc.mockReturnValue({
  get: mockGet,
});

mockOrderBy.mockReturnValue({
  limit: mockLimit,
  get: mockQueryGet,
});

mockLimit.mockReturnValue({
  get: mockQueryGet,
});

import {
  listArticles,
  getArticleById,
  listVideos,
  getVideoById,
} from '../../repositories/content.repository';

describe('Content Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuerySnapshot.empty = true;
    mockQuerySnapshot.docs = [];
    mockQueryGet.mockResolvedValue(mockQuerySnapshot);
  });

  describe('listArticles', () => {
    it('should return array of article previews', async () => {
      const mockArticles = [
        {
          id: 'article-1',
          data: () => ({
            title: 'Article One',
            slug: 'article-one',
            preview: 'Preview text 1',
            coverImage: 'https://example.com/image1.jpg',
            author: 'John Doe',
            publishedAt: new Date('2024-01-15'),
            content: 'Full content here',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
        {
          id: 'article-2',
          data: () => ({
            title: 'Article Two',
            slug: 'article-two',
            preview: 'Preview text 2',
            author: 'Jane Smith',
            publishedAt: new Date('2024-01-10'),
            content: 'Full content here too',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      ];

      mockQuerySnapshot.empty = false;
      mockQuerySnapshot.docs = mockArticles;
      mockQueryGet.mockResolvedValue(mockQuerySnapshot);

      const articles = await listArticles();

      expect(mockCollection).toHaveBeenCalledWith('articles');
      expect(mockOrderBy).toHaveBeenCalledWith('publishedAt', 'desc');
      expect(articles).toHaveLength(2);
      expect(articles[0]).toEqual({
        id: 'article-1',
        title: 'Article One',
        slug: 'article-one',
        preview: 'Preview text 1',
        coverImage: 'https://example.com/image1.jpg',
        author: 'John Doe',
        publishedAt: expect.any(Date),
      });
      // Should NOT include content (protected field)
      expect(articles[0]).not.toHaveProperty('content');
    });

    it('should return empty array when no articles exist', async () => {
      mockQuerySnapshot.empty = true;
      mockQuerySnapshot.docs = [];
      mockQueryGet.mockResolvedValue(mockQuerySnapshot);

      const articles = await listArticles();

      expect(articles).toEqual([]);
    });

    it('should respect limit parameter', async () => {
      mockQuerySnapshot.empty = true;
      mockQuerySnapshot.docs = [];
      mockQueryGet.mockResolvedValue(mockQuerySnapshot);

      await listArticles(10);

      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it('should handle articles without cover image', async () => {
      const mockArticle = {
        id: 'article-no-image',
        data: () => ({
          title: 'No Image Article',
          slug: 'no-image',
          preview: 'Preview',
          author: 'Author',
          publishedAt: new Date(),
          content: 'Content',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };

      mockQuerySnapshot.empty = false;
      mockQuerySnapshot.docs = [mockArticle];
      mockQueryGet.mockResolvedValue(mockQuerySnapshot);

      const articles = await listArticles();

      expect(articles[0].coverImage).toBeUndefined();
    });
  });

  describe('getArticleById', () => {
    it('should return full article when found', async () => {
      const mockArticleData = {
        title: 'Full Article',
        slug: 'full-article',
        preview: 'Preview text',
        content: 'This is the full protected content of the article.',
        coverImage: 'https://example.com/cover.jpg',
        author: 'Author Name',
        publishedAt: new Date('2024-01-15'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-10'),
      };

      mockGet.mockResolvedValue({
        exists: true,
        id: 'article-123',
        data: () => mockArticleData,
      });

      const article = await getArticleById('article-123');

      expect(mockDoc).toHaveBeenCalledWith('article-123');
      expect(article).not.toBeNull();
      expect(article?.id).toBe('article-123');
      expect(article?.title).toBe('Full Article');
      expect(article?.content).toBe('This is the full protected content of the article.');
    });

    it('should return null when article not found', async () => {
      mockGet.mockResolvedValue({
        exists: false,
      });

      const article = await getArticleById('nonexistent');

      expect(article).toBeNull();
    });

    it('should handle Firestore Timestamp conversion', async () => {
      const publishedDate = new Date('2024-01-15');
      const mockArticleData = {
        title: 'Timestamp Article',
        slug: 'timestamp',
        preview: 'Preview',
        content: 'Content',
        author: 'Author',
        publishedAt: { toDate: () => publishedDate },
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
      };

      mockGet.mockResolvedValue({
        exists: true,
        id: 'article-ts',
        data: () => mockArticleData,
      });

      const article = await getArticleById('article-ts');

      expect(article?.publishedAt).toEqual(publishedDate);
    });
  });

  describe('listVideos', () => {
    it('should return array of video previews', async () => {
      const mockVideos = [
        {
          id: 'video-1',
          data: () => ({
            title: 'Video One',
            slug: 'video-one',
            description: 'Description 1',
            thumbnail: 'https://example.com/thumb1.jpg',
            duration: 360,
            author: 'John Doe',
            publishedAt: new Date('2024-01-15'),
            videoUrl: 'https://example.com/protected-video.mp4',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
        {
          id: 'video-2',
          data: () => ({
            title: 'Video Two',
            slug: 'video-two',
            description: 'Description 2',
            thumbnail: 'https://example.com/thumb2.jpg',
            duration: 720,
            author: 'Jane Smith',
            publishedAt: new Date('2024-01-10'),
            videoUrl: 'https://example.com/protected-video2.mp4',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      ];

      mockQuerySnapshot.empty = false;
      mockQuerySnapshot.docs = mockVideos;
      mockQueryGet.mockResolvedValue(mockQuerySnapshot);

      const videos = await listVideos();

      expect(mockCollection).toHaveBeenCalledWith('videos');
      expect(mockOrderBy).toHaveBeenCalledWith('publishedAt', 'desc');
      expect(videos).toHaveLength(2);
      expect(videos[0]).toEqual({
        id: 'video-1',
        title: 'Video One',
        slug: 'video-one',
        description: 'Description 1',
        thumbnail: 'https://example.com/thumb1.jpg',
        duration: 360,
        author: 'John Doe',
        publishedAt: expect.any(Date),
      });
      // Should NOT include videoUrl (protected field)
      expect(videos[0]).not.toHaveProperty('videoUrl');
    });

    it('should return empty array when no videos exist', async () => {
      mockQuerySnapshot.empty = true;
      mockQuerySnapshot.docs = [];
      mockQueryGet.mockResolvedValue(mockQuerySnapshot);

      const videos = await listVideos();

      expect(videos).toEqual([]);
    });

    it('should respect limit parameter', async () => {
      mockQuerySnapshot.empty = true;
      mockQuerySnapshot.docs = [];
      mockQueryGet.mockResolvedValue(mockQuerySnapshot);

      await listVideos(5);

      expect(mockLimit).toHaveBeenCalledWith(5);
    });
  });

  describe('getVideoById', () => {
    it('should return full video when found', async () => {
      const mockVideoData = {
        title: 'Full Video',
        slug: 'full-video',
        description: 'Video description',
        thumbnail: 'https://example.com/thumb.jpg',
        videoUrl: 'https://example.com/protected-video.mp4',
        duration: 480,
        author: 'Creator Name',
        publishedAt: new Date('2024-01-15'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-10'),
      };

      mockGet.mockResolvedValue({
        exists: true,
        id: 'video-123',
        data: () => mockVideoData,
      });

      const video = await getVideoById('video-123');

      expect(mockDoc).toHaveBeenCalledWith('video-123');
      expect(video).not.toBeNull();
      expect(video?.id).toBe('video-123');
      expect(video?.title).toBe('Full Video');
      expect(video?.videoUrl).toBe('https://example.com/protected-video.mp4');
      expect(video?.duration).toBe(480);
    });

    it('should return null when video not found', async () => {
      mockGet.mockResolvedValue({
        exists: false,
      });

      const video = await getVideoById('nonexistent');

      expect(video).toBeNull();
    });

    it('should handle Firestore Timestamp conversion', async () => {
      const publishedDate = new Date('2024-01-15');
      const mockVideoData = {
        title: 'Timestamp Video',
        slug: 'timestamp',
        description: 'Description',
        thumbnail: 'https://example.com/thumb.jpg',
        videoUrl: 'https://example.com/video.mp4',
        duration: 300,
        author: 'Author',
        publishedAt: { toDate: () => publishedDate },
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
      };

      mockGet.mockResolvedValue({
        exists: true,
        id: 'video-ts',
        data: () => mockVideoData,
      });

      const video = await getVideoById('video-ts');

      expect(video?.publishedAt).toEqual(publishedDate);
    });
  });

  describe('Content ordering', () => {
    it('should order articles by publishedAt descending', async () => {
      mockQuerySnapshot.docs = [];
      mockQueryGet.mockResolvedValue(mockQuerySnapshot);

      await listArticles();

      expect(mockOrderBy).toHaveBeenCalledWith('publishedAt', 'desc');
    });

    it('should order videos by publishedAt descending', async () => {
      mockQuerySnapshot.docs = [];
      mockQueryGet.mockResolvedValue(mockQuerySnapshot);

      await listVideos();

      expect(mockOrderBy).toHaveBeenCalledWith('publishedAt', 'desc');
    });
  });
});
