/**
 * useAuth Hook Tests
 *
 * Tests for the authentication context and hook.
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { type User } from '@astronacci/shared';

import { AuthProvider, useAuth } from '../../components/auth/AuthProvider';
import { api } from '../../lib/api';

// Mock the API module
jest.mock('../../lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

// Test component that uses the auth hook
function TestComponent() {
  const { user, isLoading, isAuthenticated, logout, refreshUser } = useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="authenticated">
        {isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <button onClick={logout} data-testid="logout-btn">
        Logout
      </button>
      <button onClick={refreshUser} data-testid="refresh-btn">
        Refresh
      </button>
    </div>
  );
}

describe('AuthProvider and useAuth', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    membershipType: 'A',
    authProvider: 'email',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('isLoading is true during fetch', async () => {
      // Keep the promise pending
      mockApi.get.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    });
  });

  describe('authenticated user', () => {
    it('fetches user on mount', async () => {
      mockApi.get.mockResolvedValueOnce({ data: mockUser });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith('/api/auth/me');
      });
    });

    it('returns user when authenticated', async () => {
      mockApi.get.mockResolvedValueOnce({ data: mockUser });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });
    });

    it('sets isAuthenticated to true', async () => {
      mockApi.get.mockResolvedValueOnce({ data: mockUser });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent(
          'authenticated'
        );
      });
    });

    it('sets isLoading to false after fetch', async () => {
      mockApi.get.mockResolvedValueOnce({ data: mockUser });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
    });
  });

  describe('unauthenticated user', () => {
    it('returns null when not authenticated', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Unauthorized'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      });
    });

    it('sets isAuthenticated to false', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Unauthorized'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent(
          'not-authenticated'
        );
      });
    });

    it('sets isLoading to false after failed fetch', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Unauthorized'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
    });
  });

  describe('logout', () => {
    it('clears user state', async () => {
      mockApi.get.mockResolvedValueOnce({ data: mockUser });
      mockApi.post.mockResolvedValueOnce({ data: { message: 'Logged out' } });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial auth check
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });

      // Click logout
      await act(async () => {
        await userEvent.click(screen.getByTestId('logout-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      });
    });

    it('calls logout API', async () => {
      mockApi.get.mockResolvedValueOnce({ data: mockUser });
      mockApi.post.mockResolvedValueOnce({ data: { message: 'Logged out' } });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent(
          'authenticated'
        );
      });

      await act(async () => {
        await userEvent.click(screen.getByTestId('logout-btn'));
      });

      expect(mockApi.post).toHaveBeenCalledWith('/api/auth/logout');
    });

    it('sets isAuthenticated to false after logout', async () => {
      mockApi.get.mockResolvedValueOnce({ data: mockUser });
      mockApi.post.mockResolvedValueOnce({ data: { message: 'Logged out' } });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent(
          'authenticated'
        );
      });

      await act(async () => {
        await userEvent.click(screen.getByTestId('logout-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent(
          'not-authenticated'
        );
      });
    });
  });

  describe('refreshUser', () => {
    it('fetches user again', async () => {
      mockApi.get
        .mockResolvedValueOnce({ data: mockUser })
        .mockResolvedValueOnce({ data: { ...mockUser, email: 'updated@example.com' } });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });

      await act(async () => {
        await userEvent.click(screen.getByTestId('refresh-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('updated@example.com');
      });

      expect(mockApi.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
