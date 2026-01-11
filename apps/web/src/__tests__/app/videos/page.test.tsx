/**
 * Videos List Page Tests
 *
 * Tests for the videos list page component.
 */

import { render, screen, waitFor } from '@testing-library/react';

import VideosPage from '../../../app/(protected)/videos/page';
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

describe('Videos List Page', () => {
  const mockVideos = [
    {
      id: 'video-1',
      title: 'Introduction to React',
      description: 'Learn the basics of React',
      thumbnail: '/images/react-intro.jpg',
      duration: 1800,
      author: 'John Doe',
      publishedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'video-2',
      title: 'Advanced TypeScript',
      description: 'Deep dive into TypeScript',
      thumbnail: '/images/typescript-advanced.jpg',
      duration: 2700,
      author: 'Jane Smith',
      publishedAt: '2024-01-16T10:00:00Z',
    },
    {
      id: 'video-3',
      title: 'Building APIs with Express',
      description: 'Create REST APIs with Express.js',
      thumbnail: '/images/express-api.jpg',
      duration: 3600,
      author: 'Bob Johnson',
      publishedAt: '2024-01-17T10:00:00Z',
    },
  ];

  const mockUsage = {
    videos: ['video-1'],
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
    it('fetches and displays video list', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          videos: mockVideos,
          usage: mockUsage.usage,
          accessedIds: mockUsage.videos,
        },
      });

      render(<VideosPage />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
        expect(screen.getByText('Advanced TypeScript')).toBeInTheDocument();
        expect(screen.getByText('Building APIs with Express')).toBeInTheDocument();
      });
    });

    it('shows video thumbnail and title', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          videos: mockVideos,
          usage: mockUsage.usage,
          accessedIds: mockUsage.videos,
        },
      });

      render(<VideosPage />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
        // Check for thumbnail image
        const thumbnails = screen.getAllByRole('img');
        expect(thumbnails.length).toBeGreaterThan(0);
      });
    });

    it('indicates already-accessed videos', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          videos: mockVideos,
          usage: mockUsage.usage,
          accessedIds: ['video-1'],
        },
      });

      render(<VideosPage />);

      await waitFor(() => {
        // The first video should show as watched
        expect(screen.getByText(/watched|accessed/i)).toBeInTheDocument();
      });
    });

    it('shows remaining quota', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          videos: mockVideos,
          usage: { count: 1, limit: 3, remaining: 2 },
          accessedIds: ['video-1'],
        },
      });

      render(<VideosPage />);

      await waitFor(() => {
        // Should show quota info like "1/3" or "2 remaining"
        expect(screen.getByText(/1.*3|2.*remaining/i)).toBeInTheDocument();
      });
    });

    it('links to individual video pages', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          videos: mockVideos,
          usage: mockUsage.usage,
          accessedIds: mockUsage.videos,
        },
      });

      render(<VideosPage />);

      await waitFor(() => {
        const links = screen.getAllByRole('link');
        const videoLink = links.find(link => link.getAttribute('href')?.includes('/videos/video-1'));
        expect(videoLink).toBeInTheDocument();
      });
    });

    it('shows video duration', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          videos: mockVideos,
          usage: mockUsage.usage,
          accessedIds: mockUsage.videos,
        },
      });

      render(<VideosPage />);

      await waitFor(() => {
        // Should show duration like "30:00" for 1800 seconds
        expect(screen.getByText(/30:00/)).toBeInTheDocument();
      });
    });
  });

  describe('loading state', () => {
    it('shows loading state while fetching', () => {
      mockApi.get.mockImplementation(() => new Promise(() => {}));

      render(<VideosPage />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message when fetch fails', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Failed to fetch'));

      render(<VideosPage />);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('empty state', () => {
    it('shows message when no videos available', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          videos: [],
          usage: { count: 0, limit: 3, remaining: 3 },
          accessedIds: [],
        },
      });

      render(<VideosPage />);

      await waitFor(() => {
        expect(screen.getByText(/no videos|empty/i)).toBeInTheDocument();
      });
    });
  });

  describe('quota exceeded', () => {
    it('shows warning when quota is reached', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          videos: mockVideos,
          usage: { count: 3, limit: 3, remaining: 0 },
          accessedIds: ['video-1', 'video-2', 'video-3'],
        },
      });

      render(<VideosPage />);

      await waitFor(() => {
        expect(screen.getByText(/limit reached|quota|upgrade/i)).toBeInTheDocument();
      });
    });
  });
});
