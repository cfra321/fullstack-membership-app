/**
 * Seed Script Tests
 *
 * Tests to validate the seed script creates correct sample data.
 */

import { sampleArticles, sampleVideos, validateArticle, validateVideo } from '../../scripts/seed';

describe('Seed Script', () => {
  describe('Sample Articles', () => {
    it('should have at least 10 articles', () => {
      expect(sampleArticles.length).toBeGreaterThanOrEqual(10);
    });

    it('should have required fields for each article', () => {
      sampleArticles.forEach((article, index) => {
        expect(article.title).toBeDefined();
        expect(typeof article.title).toBe('string');
        expect(article.title.length).toBeGreaterThan(0);

        expect(article.slug).toBeDefined();
        expect(typeof article.slug).toBe('string');
        expect(article.slug.length).toBeGreaterThan(0);

        expect(article.preview).toBeDefined();
        expect(typeof article.preview).toBe('string');
        expect(article.preview.length).toBeGreaterThan(0);

        expect(article.content).toBeDefined();
        expect(typeof article.content).toBe('string');
        expect(article.content.length).toBeGreaterThan(0);

        expect(article.author).toBeDefined();
        expect(typeof article.author).toBe('string');
        expect(article.author.length).toBeGreaterThan(0);
      });
    });

    it('should have unique slugs', () => {
      const slugs = sampleArticles.map((a) => a.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });

    it('should have coverImage as optional field', () => {
      // At least some articles should have cover images
      const articlesWithCover = sampleArticles.filter((a) => a.coverImage);
      expect(articlesWithCover.length).toBeGreaterThan(0);
    });
  });

  describe('Sample Videos', () => {
    it('should have at least 10 videos', () => {
      expect(sampleVideos.length).toBeGreaterThanOrEqual(10);
    });

    it('should have required fields for each video', () => {
      sampleVideos.forEach((video, index) => {
        expect(video.title).toBeDefined();
        expect(typeof video.title).toBe('string');
        expect(video.title.length).toBeGreaterThan(0);

        expect(video.slug).toBeDefined();
        expect(typeof video.slug).toBe('string');
        expect(video.slug.length).toBeGreaterThan(0);

        expect(video.description).toBeDefined();
        expect(typeof video.description).toBe('string');
        expect(video.description.length).toBeGreaterThan(0);

        expect(video.thumbnail).toBeDefined();
        expect(typeof video.thumbnail).toBe('string');
        expect(video.thumbnail.length).toBeGreaterThan(0);

        expect(video.videoUrl).toBeDefined();
        expect(typeof video.videoUrl).toBe('string');
        expect(video.videoUrl.length).toBeGreaterThan(0);

        expect(video.duration).toBeDefined();
        expect(typeof video.duration).toBe('number');
        expect(video.duration).toBeGreaterThan(0);

        expect(video.author).toBeDefined();
        expect(typeof video.author).toBe('string');
        expect(video.author.length).toBeGreaterThan(0);
      });
    });

    it('should have unique slugs', () => {
      const slugs = sampleVideos.map((v) => v.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });

    it('should have valid duration values (in seconds)', () => {
      sampleVideos.forEach((video) => {
        // Duration should be reasonable (between 1 minute and 2 hours)
        expect(video.duration).toBeGreaterThanOrEqual(60);
        expect(video.duration).toBeLessThanOrEqual(7200);
      });
    });
  });

  describe('Validation Functions', () => {
    it('validateArticle should return true for valid article', () => {
      const validArticle = {
        title: 'Test Article',
        slug: 'test-article',
        preview: 'This is a preview',
        content: 'This is the full content',
        author: 'Test Author',
      };

      expect(validateArticle(validArticle)).toBe(true);
    });

    it('validateArticle should return false for invalid article', () => {
      const invalidArticle = {
        title: '',
        slug: 'test',
        preview: 'Preview',
        content: '',
        author: 'Author',
      };

      expect(validateArticle(invalidArticle)).toBe(false);
    });

    it('validateVideo should return true for valid video', () => {
      const validVideo = {
        title: 'Test Video',
        slug: 'test-video',
        description: 'This is a description',
        thumbnail: 'https://example.com/thumb.jpg',
        videoUrl: 'https://example.com/video.mp4',
        duration: 300,
        author: 'Test Author',
      };

      expect(validateVideo(validVideo)).toBe(true);
    });

    it('validateVideo should return false for invalid video', () => {
      const invalidVideo = {
        title: 'Test',
        slug: 'test',
        description: '',
        thumbnail: 'https://example.com/thumb.jpg',
        videoUrl: '',
        duration: 0,
        author: 'Author',
      };

      expect(validateVideo(invalidVideo)).toBe(false);
    });
  });
});
