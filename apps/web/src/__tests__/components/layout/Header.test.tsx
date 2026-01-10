/**
 * Header Component Tests
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Header } from '../../../components/layout';

// Mock the useAuth hook
const mockLogout = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('navigation links', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        logout: mockLogout,
      });
    });

    it('renders the logo/brand', () => {
      render(<Header />);

      expect(screen.getByText(/astronacci/i)).toBeInTheDocument();
    });

    it('renders login link when not authenticated', () => {
      render(<Header />);

      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    });

    it('renders register link when not authenticated', () => {
      render(<Header />);

      expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
    });
  });

  describe('authenticated state', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          email: 'test@example.com',
          displayName: 'Test User',
          membershipType: 'A',
          authProvider: 'email',
        },
        isLoading: false,
        isAuthenticated: true,
        logout: mockLogout,
      });
    });

    it('shows user info when authenticated', () => {
      render(<Header />);

      expect(screen.getByText(/test user/i)).toBeInTheDocument();
    });

    it('renders dashboard link when authenticated', () => {
      render(<Header />);

      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    });

    it('renders articles link when authenticated', () => {
      render(<Header />);

      expect(screen.getByRole('link', { name: /articles/i })).toBeInTheDocument();
    });

    it('renders videos link when authenticated', () => {
      render(<Header />);

      expect(screen.getByRole('link', { name: /videos/i })).toBeInTheDocument();
    });

    it('renders logout button when authenticated', () => {
      render(<Header />);

      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });

    it('calls logout when logout button is clicked', async () => {
      render(<Header />);

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await userEvent.click(logoutButton);

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('does not show login/register links when authenticated', () => {
      render(<Header />);

      expect(screen.queryByRole('link', { name: /^login$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /^register$/i })).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows loading indicator when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        logout: mockLogout,
      });

      render(<Header />);

      // Should not show login/logout while loading
      expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /^login$/i })).not.toBeInTheDocument();
    });
  });

  describe('membership badge', () => {
    it('shows membership type badge', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          email: 'test@example.com',
          displayName: 'Test User',
          membershipType: 'B',
          authProvider: 'email',
        },
        isLoading: false,
        isAuthenticated: true,
        logout: mockLogout,
      });

      render(<Header />);

      expect(screen.getByText(/type b/i)).toBeInTheDocument();
    });
  });
});
