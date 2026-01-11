/**
 * Dashboard Page Tests
 *
 * Tests for the dashboard page component.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DashboardPage from '../../../app/(protected)/dashboard/page';
import { useAuth } from '../../../components/auth';
import { useUsage } from '../../../hooks/useUsage';

// Mock the hooks
jest.mock('../../../components/auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../hooks/useUsage', () => ({
  useUsage: jest.fn(),
}));

// Mock next/navigation
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseUsage = useUsage as jest.MockedFunction<typeof useUsage>;

describe('Dashboard Page', () => {
  const mockUser = {
    id: '123',
    email: 'test@example.com',
    displayName: 'Test User',
    membershipType: 'A' as const,
    authProvider: 'email' as const,
  };

  const mockUsageData = {
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
  };

  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      logout: mockLogout,
      refreshUser: jest.fn(),
    });

    mockUseUsage.mockReturnValue({
      usage: mockUsageData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  describe('rendering', () => {
    it('displays welcome message with user name', () => {
      render(<DashboardPage />);

      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
      expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    });

    it('displays membership type', () => {
      render(<DashboardPage />);

      expect(screen.getByText(/membership/i)).toBeInTheDocument();
      // Should show membership type A (Basic/Standard)
      expect(screen.getByText(/basic|type a|tier a/i)).toBeInTheDocument();
    });

    it('displays article usage', () => {
      render(<DashboardPage />);

      // Should show "2/3" or "2 of 3" format
      expect(screen.getByText(/article/i)).toBeInTheDocument();
      expect(screen.getByText(/2/)).toBeInTheDocument();
      expect(screen.getByText(/3/)).toBeInTheDocument();
    });

    it('displays video usage', () => {
      render(<DashboardPage />);

      // Should show "1/3" or "1 of 3" format
      expect(screen.getByText(/video/i)).toBeInTheDocument();
      expect(screen.getByText(/1/)).toBeInTheDocument();
    });

    it('displays navigation link to articles', () => {
      render(<DashboardPage />);

      const articlesLink = screen.getByRole('link', { name: /article/i });
      expect(articlesLink).toBeInTheDocument();
      expect(articlesLink).toHaveAttribute('href', '/articles');
    });

    it('displays navigation link to videos', () => {
      render(<DashboardPage />);

      const videosLink = screen.getByRole('link', { name: /video/i });
      expect(videosLink).toBeInTheDocument();
      expect(videosLink).toHaveAttribute('href', '/videos');
    });
  });

  describe('logout', () => {
    it('displays logout button', () => {
      render(<DashboardPage />);

      expect(
        screen.getByRole('button', { name: /logout|sign out/i })
      ).toBeInTheDocument();
    });

    it('calls logout and redirects when logout button clicked', async () => {
      mockLogout.mockResolvedValueOnce(undefined);

      render(<DashboardPage />);

      const logoutButton = screen.getByRole('button', { name: /logout|sign out/i });
      await userEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('loading state', () => {
    it('shows loading state while fetching usage', () => {
      mockUseUsage.mockReturnValue({
        usage: null,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      });

      render(<DashboardPage />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message when usage fetch fails', () => {
      mockUseUsage.mockReturnValue({
        usage: null,
        isLoading: false,
        error: 'Failed to fetch usage',
        refetch: jest.fn(),
      });

      render(<DashboardPage />);

      expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
    });
  });

  describe('membership types', () => {
    it('displays correct label for Type B membership', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, membershipType: 'B' as const },
        isLoading: false,
        isAuthenticated: true,
        logout: mockLogout,
        refreshUser: jest.fn(),
      });

      mockUseUsage.mockReturnValue({
        usage: {
          ...mockUsageData,
          articles: { ...mockUsageData.articles, limit: 10 },
          videos: { ...mockUsageData.videos, limit: 10 },
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<DashboardPage />);

      expect(screen.getByText(/premium|type b|tier b/i)).toBeInTheDocument();
    });

    it('displays unlimited for Type C membership', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, membershipType: 'C' as const },
        isLoading: false,
        isAuthenticated: true,
        logout: mockLogout,
        refreshUser: jest.fn(),
      });

      mockUseUsage.mockReturnValue({
        usage: {
          articles: {
            accessed: ['article-1'],
            count: 1,
            limit: Infinity,
            remaining: Infinity,
          },
          videos: {
            accessed: [],
            count: 0,
            limit: Infinity,
            remaining: Infinity,
          },
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<DashboardPage />);

      expect(screen.getByText(/unlimited|vip|type c|tier c/i)).toBeInTheDocument();
    });
  });
});
