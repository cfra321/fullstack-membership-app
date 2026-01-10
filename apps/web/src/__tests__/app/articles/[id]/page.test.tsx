/**
 * Article Detail Page Tests
 *
 * Tests for the article detail page component.
 */

import { render, screen, waitFor } from '@testing-library/react';

import ArticleDetailPage from '../../../../app/(protected)/articles/[id]/page';
import { api, ApiError } from '../../../../lib/api';

// Mock the API module
jest.mock('../../../../lib/api', () => ({
  api: {
    get: jest.fn(),
  },
  ApiError: class ApiError extends Error {
    code: string;
    statusCode: number;
    details?: Record<string, unknown>;
    constructor(code: string, message: string, statusCode: number, details?: Record<string, unknown>) {
      super(message);
      this.code = code;
      this.statusCode = statusCode;
      this.details = details;
    }
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useParams: () => ({
    id: 'article-1',
  }),
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('Article Detail Page', () => {
  const mockArticle = {
    id: 'article-1',
    title: 'Getting Started with TypeScript',
    content: '<p>This is the full article content with <strong>rich text</strong>.</p>',
    preview: 'Learn the basics of TypeScript',
    coverImage: '/images/typescript.jpg',
    author: 'John Doe',
    publishedAt: '2024-01-15T10:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when article loads successfully', () => {
    it('displays full article content when allowed', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: mockArticle,
      });

      render(<ArticleDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Getting Started with TypeScript')).toBeInTheDocument();
      });

      // Should show full content
      expect(screen.getByText(/full article content/i)).toBeInTheDocument();
    });

    it('displays article title', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: mockArticle,
      });

      render(<ArticleDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Getting Started with TypeScript/i })).toBeInTheDocument();
      });
    });

    it('displays author and date', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: mockArticle,
      });

      render(<ArticleDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      });
    });

    it('displays cover image if available', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: mockArticle,
      });

      render(<ArticleDetailPage />);

      await waitFor(() => {
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('src', '/images/typescript.jpg');
      });
    });
  });

  describe('when quota exceeded', () => {
    it('displays upgrade prompt when quota exceeded (403)', async () => {
      const quotaError = new ApiError(
        'QUOTA_EXCEEDED',
        'You have reached your article limit',
        403,
        { currentUsage: 3, limit: 3, membershipType: 'A' }
      );
      mockApi.get.mockRejectedValueOnce(quotaError);

      render(<ArticleDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/quota|limit|upgrade/i)).toBeInTheDocument();
      });
    });

    it('shows upgrade options in prompt', async () => {
      const quotaError = new ApiError(
        'QUOTA_EXCEEDED',
        'You have reached your article limit',
        403,
        { currentUsage: 3, limit: 3, membershipType: 'A' }
      );
      mockApi.get.mockRejectedValueOnce(quotaError);

      render(<ArticleDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/upgrade|membership/i)).toBeInTheDocument();
      });
    });
  });

  describe('when article not found', () => {
    it('handles article not found (404)', async () => {
      const notFoundError = new ApiError(
        'NOT_FOUND',
        'Article not found',
        404
      );
      mockApi.get.mockRejectedValueOnce(notFoundError);

      render(<ArticleDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('loading state', () => {
    it('shows loading state while fetching', () => {
      mockApi.get.mockImplementation(() => new Promise(() => {}));

      render(<ArticleDetailPage />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('shows error message for generic errors', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Network error'));

      render(<ArticleDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('navigation', () => {
    it('provides back navigation', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: mockArticle,
      });

      render(<ArticleDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /back|articles/i })).toBeInTheDocument();
      });
    });
  });
});
