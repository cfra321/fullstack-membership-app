/**
 * Login Page Tests
 *
 * Tests for the login page component.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import LoginPage from '../../../app/(auth)/login/page';
import { api } from '../../../lib/api';

// Mock the API module
jest.mock('../../../lib/api', () => ({
  api: {
    post: jest.fn(),
  },
}));

// Mock next/navigation
const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders Google OAuth button', () => {
      render(<LoginPage />);

      expect(
        screen.getByRole('link', { name: /google/i })
      ).toBeInTheDocument();
    });

    it('renders Facebook OAuth button', () => {
      render(<LoginPage />);

      expect(
        screen.getByRole('link', { name: /facebook/i })
      ).toBeInTheDocument();
    });

    it('renders email/password form', () => {
      render(<LoginPage />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /sign in/i })
      ).toBeInTheDocument();
    });

    it('renders link to registration', () => {
      render(<LoginPage />);

      const registerLink = screen.getByRole('link', { name: /create.*account|sign up|register/i });
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute('href', '/register');
    });

    it('renders page title', () => {
      render(<LoginPage />);

      expect(
        screen.getByRole('heading', { name: /sign in|login|welcome/i })
      ).toBeInTheDocument();
    });
  });

  describe('OAuth buttons', () => {
    it('Google button links to backend OAuth URL', () => {
      render(<LoginPage />);

      const googleButton = screen.getByRole('link', { name: /google/i });
      expect(googleButton).toHaveAttribute(
        'href',
        expect.stringContaining('/api/auth/google')
      );
    });

    it('Facebook button links to backend OAuth URL', () => {
      render(<LoginPage />);

      const facebookButton = screen.getByRole('link', { name: /facebook/i });
      expect(facebookButton).toHaveAttribute(
        'href',
        expect.stringContaining('/api/auth/facebook')
      );
    });
  });

  describe('form submission', () => {
    it('calls login API on form submission', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: {
          user: { id: '123', email: 'test@example.com' },
          expiresAt: new Date().toISOString(),
        },
      });

      render(<LoginPage />);

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith('/api/auth/login', {
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('redirects to dashboard on success', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: {
          user: { id: '123', email: 'test@example.com' },
          expiresAt: new Date().toISOString(),
        },
      });

      render(<LoginPage />);

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('displays error message on failure', async () => {
      mockApi.post.mockRejectedValueOnce({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });

      render(<LoginPage />);

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid|error|failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('validation', () => {
    it('shows error for empty email', async () => {
      render(<LoginPage />);

      await userEvent.type(screen.getByLabelText(/password/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/email.*required/i)).toBeInTheDocument();
      });
    });

    it('shows error for empty password', async () => {
      render(<LoginPage />);

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/password.*required/i)).toBeInTheDocument();
      });
    });

    it('shows error for invalid email format', async () => {
      render(<LoginPage />);

      await userEvent.type(screen.getByLabelText(/email/i), 'notanemail');
      await userEvent.type(screen.getByLabelText(/password/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/valid.*email/i)).toBeInTheDocument();
      });
    });
  });

  describe('loading state', () => {
    it('disables submit button while loading', async () => {
      // Keep the promise pending
      mockApi.post.mockImplementation(() => new Promise(() => {}));

      render(<LoginPage />);

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign in|loading/i })).toBeDisabled();
      });
    });
  });
});
