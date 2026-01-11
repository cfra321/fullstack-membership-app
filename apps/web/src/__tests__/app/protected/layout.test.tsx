/**
 * Protected Layout Tests
 *
 * Tests for the protected route layout component.
 */

import { render, screen, waitFor } from '@testing-library/react';

import ProtectedLayout from '../../../app/(protected)/layout';
import { useAuth } from '../../../components/auth';

// Mock the useAuth hook
jest.mock('../../../components/auth', () => ({
  useAuth: jest.fn(),
}));

// Mock next/navigation
const mockPush = jest.fn();
const mockPathname = '/dashboard';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
  usePathname: () => mockPathname,
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Protected Layout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when loading', () => {
    it('shows loading state while checking auth', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(
        <ProtectedLayout>
          <div>Protected Content</div>
        </ProtectedLayout>
      );

      // Should show loading indicator
      expect(screen.getByRole('status')).toBeInTheDocument();
      // Should not show children
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('when not authenticated', () => {
    it('redirects to login when not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(
        <ProtectedLayout>
          <div>Protected Content</div>
        </ProtectedLayout>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('/login')
        );
      });
    });

    it('preserves redirect URL in query parameter', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(
        <ProtectedLayout>
          <div>Protected Content</div>
        </ProtectedLayout>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('redirect=')
        );
      });
    });

    it('does not render children when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(
        <ProtectedLayout>
          <div>Protected Content</div>
        </ProtectedLayout>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('when authenticated', () => {
    it('renders children when authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '123',
          email: 'test@example.com',
          displayName: 'Test User',
          membershipType: 'A',
          authProvider: 'email',
        },
        isLoading: false,
        isAuthenticated: true,
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(
        <ProtectedLayout>
          <div>Protected Content</div>
        </ProtectedLayout>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('does not redirect when authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '123',
          email: 'test@example.com',
          displayName: 'Test User',
          membershipType: 'A',
          authProvider: 'email',
        },
        isLoading: false,
        isAuthenticated: true,
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(
        <ProtectedLayout>
          <div>Protected Content</div>
        </ProtectedLayout>
      );

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('does not show loading indicator when authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '123',
          email: 'test@example.com',
          displayName: 'Test User',
          membershipType: 'A',
          authProvider: 'email',
        },
        isLoading: false,
        isAuthenticated: true,
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(
        <ProtectedLayout>
          <div>Protected Content</div>
        </ProtectedLayout>
      );

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });
});
