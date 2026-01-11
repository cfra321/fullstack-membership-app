/**
 * Articles List Page Tests
 *
 * Tests for the articles list page component.
 */

import { render, screen, waitFor } from '@testing-library/react';

import ArticlesPage from '../../../app/(protected)/articles/page';
import { api } from '../../../lib/api';

// Mock the API module
jest.mock('../../../lib/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('Articles List Page', () => {
  const mockArticles = [
    {
      id: 'article-1',
      title: 'Getting Started with TypeScript',
      preview: 'Learn the basics of TypeScript',
      coverImage: '/images/typescript.jpg',
      author: 'John Doe',
      publishedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'article-2',
      title: 'Advanced React Patterns',
      preview: 'Explore advanced React patterns',
      coverImage: '/images/react.jpg',
      author: 'Jane Smith',
      publishedAt: '2024-01-16T10:00:00Z',
    },
    {
      id: 'article-3',
      title: 'Node.js Best Practices',
      preview: 'Best practices for Node.js development',
      coverImage: '/images/nodejs.jpg',
      author: 'Bob Johnson',
      publishedAt: '2024-01-17T10:00:00Z',
    },
  ];

  const mockUsage = {
    articles: ['article-1'],
    usage: {
      count: 1,
      limit: 3,
      remaining: 2,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('fetches and displays article list', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          articles: mockArticles,
          usage: mockUsage.usage,
          accessedIds: mockUsage.articles,
        },
      });

      render(<ArticlesPage />);

      await waitFor(() => {
        expect(screen.getByText('Getting Started with TypeScript')).toBeInTheDocument();
        expect(screen.getByText('Advanced React Patterns')).toBeInTheDocument();
        expect(screen.getByText('Node.js Best Practices')).toBeInTheDocument();
      });
    });

    it('shows article title and preview', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          articles: mockArticles,
          usage: mockUsage.usage,
          accessedIds: mockUsage.articles,
        },
      });

      render(<ArticlesPage />);

      await waitFor(() => {
        expect(screen.getByText('Getting Started with TypeScript')).toBeInTheDocument();
        expect(screen.getByText('Learn the basics of TypeScript')).toBeInTheDocument();
      });
    });

    it('indicates already-accessed articles', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          articles: mockArticles,
          usage: mockUsage.usage,
          accessedIds: ['article-1'],
        },
      });

      render(<ArticlesPage />);

      await waitFor(() => {
        // The first article should show as accessed
        expect(screen.getByText(/accessed|read/i)).toBeInTheDocument();
      });
    });

    it('shows remaining quota', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          articles: mockArticles,
          usage: { count: 1, limit: 3, remaining: 2 },
          accessedIds: ['article-1'],
        },
      });

      render(<ArticlesPage />);

      await waitFor(() => {
        // Should show quota info like "1/3" or "2 remaining"
        expect(screen.getByText(/1.*3|2.*remaining/i)).toBeInTheDocument();
      });
    });

    it('links to individual article pages', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          articles: mockArticles,
          usage: mockUsage.usage,
          accessedIds: mockUsage.articles,
        },
      });

      render(<ArticlesPage />);

      await waitFor(() => {
        const links = screen.getAllByRole('link');
        const articleLink = links.find(link => link.getAttribute('href')?.includes('/articles/article-1'));
        expect(articleLink).toBeInTheDocument();
      });
    });
  });

  describe('loading state', () => {
    it('shows loading state while fetching', () => {
      mockApi.get.mockImplementation(() => new Promise(() => {}));

      render(<ArticlesPage />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message when fetch fails', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Failed to fetch'));

      render(<ArticlesPage />);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('empty state', () => {
    it('shows message when no articles available', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          articles: [],
          usage: { count: 0, limit: 3, remaining: 3 },
          accessedIds: [],
        },
      });

      render(<ArticlesPage />);

      await waitFor(() => {
        expect(screen.getByText(/no articles|empty/i)).toBeInTheDocument();
      });
    });
  });

  describe('quota exceeded', () => {
    it('shows warning when quota is reached', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          articles: mockArticles,
          usage: { count: 3, limit: 3, remaining: 0 },
          accessedIds: ['article-1', 'article-2', 'article-3'],
        },
      });

      render(<ArticlesPage />);

      await waitFor(() => {
        expect(screen.getByText(/limit reached|quota|upgrade/i)).toBeInTheDocument();
      });
    });
  });
});
