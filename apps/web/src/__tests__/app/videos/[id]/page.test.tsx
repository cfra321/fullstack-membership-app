/**
 * Video Detail Page Tests
 *
 * Tests for the video detail page component.
 */

import { render, screen, waitFor } from '@testing-library/react';

import VideoDetailPage from '../../../../app/(protected)/videos/[id]/page';
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
    id: 'video-1',
  }),
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('Video Detail Page', () => {
  const mockVideo = {
    id: 'video-1',
    title: 'Introduction to React',
    description: 'Learn the basics of React in this comprehensive tutorial.',
    videoUrl: 'https://example.com/videos/react-intro.mp4',
    thumbnail: '/images/react-intro.jpg',
    duration: 1800,
    author: 'John Doe',
    publishedAt: '2024-01-15T10:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when video loads successfully', () => {
    it('displays video player when allowed', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: mockVideo,
      });

      render(<VideoDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      });

      // Should show video player
      const videoElement = document.querySelector('video');
      expect(videoElement).toBeInTheDocument();
    });

    it('displays video title', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: mockVideo,
      });

      render(<VideoDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Introduction to React/i })).toBeInTheDocument();
      });
    });

    it('displays author and description', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: mockVideo,
      });

      render(<VideoDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
        expect(screen.getByText(/comprehensive tutorial/i)).toBeInTheDocument();
      });
    });

    it('displays video duration', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: mockVideo,
      });

      render(<VideoDetailPage />);

      await waitFor(() => {
        // 1800 seconds = 30:00
        expect(screen.getByText(/30:00|30 min/i)).toBeInTheDocument();
      });
    });
  });

  describe('when quota exceeded', () => {
    it('displays upgrade prompt when quota exceeded (403)', async () => {
      const quotaError = new ApiError(
        'QUOTA_EXCEEDED',
        'You have reached your video limit',
        403,
        { currentUsage: 3, limit: 3, membershipType: 'A' }
      );
      mockApi.get.mockRejectedValueOnce(quotaError);

      render(<VideoDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/quota|limit|upgrade/i)).toBeInTheDocument();
      });
    });

    it('shows upgrade options in prompt', async () => {
      const quotaError = new ApiError(
        'QUOTA_EXCEEDED',
        'You have reached your video limit',
        403,
        { currentUsage: 3, limit: 3, membershipType: 'A' }
      );
      mockApi.get.mockRejectedValueOnce(quotaError);

      render(<VideoDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/upgrade|membership/i)).toBeInTheDocument();
      });
    });
  });

  describe('when video not found', () => {
    it('handles video not found (404)', async () => {
      const notFoundError = new ApiError(
        'NOT_FOUND',
        'Video not found',
        404
      );
      mockApi.get.mockRejectedValueOnce(notFoundError);

      render(<VideoDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('loading state', () => {
    it('shows loading state while fetching', () => {
      mockApi.get.mockImplementation(() => new Promise(() => {}));

      render(<VideoDetailPage />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('shows error message for generic errors', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Network error'));

      render(<VideoDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('navigation', () => {
    it('provides back navigation', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: mockVideo,
      });

      render(<VideoDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /back|videos/i })).toBeInTheDocument();
      });
    });
  });
});
