/**
 * Registration Page Tests
 *
 * Tests for the registration page component.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RegisterPage from '../../../app/(auth)/register/page';
import { api } from '../../../lib/api';

// Mock the API module
jest.mock('../../../lib/api', () => ({
  api: {
    post: jest.fn(),
  },
}));

// Mock next/navigation
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('Registration Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders email input', () => {
      render(<RegisterPage />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('renders display name input', () => {
      render(<RegisterPage />);

      expect(screen.getByLabelText(/display name|name/i)).toBeInTheDocument();
    });

    it('renders password input', () => {
      render(<RegisterPage />);

      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    });

    it('renders confirm password input', () => {
      render(<RegisterPage />);

      expect(
        screen.getByLabelText(/confirm password/i)
      ).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<RegisterPage />);

      expect(
        screen.getByRole('button', { name: /create account|sign up|register/i })
      ).toBeInTheDocument();
    });

    it('renders link to login', () => {
      render(<RegisterPage />);

      const loginLink = screen.getByRole('link', { name: /sign in|login|already have/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('renders page title', () => {
      render(<RegisterPage />);

      expect(
        screen.getByRole('heading', { name: /create.*account|sign up|register/i })
      ).toBeInTheDocument();
    });

    it('renders password requirements', () => {
      render(<RegisterPage />);

      // Should show password requirements
      expect(screen.getByText(/8.*characters/i)).toBeInTheDocument();
    });
  });

  describe('password validation', () => {
    it('shows error for password less than 8 characters', async () => {
      render(<RegisterPage />);

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/display name|name/i), 'Test User');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'Short1');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'Short1');
      await userEvent.click(screen.getByRole('button', { name: /create account|sign up|register/i }));

      await waitFor(() => {
        expect(screen.getByText(/8.*characters/i)).toBeInTheDocument();
      });
    });

    it('shows error for password without uppercase', async () => {
      render(<RegisterPage />);

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/display name|name/i), 'Test User');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'lowercase1');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'lowercase1');
      await userEvent.click(screen.getByRole('button', { name: /create account|sign up|register/i }));

      await waitFor(() => {
        expect(screen.getByText(/uppercase/i)).toBeInTheDocument();
      });
    });

    it('shows error for password without lowercase', async () => {
      render(<RegisterPage />);

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/display name|name/i), 'Test User');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'UPPERCASE1');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'UPPERCASE1');
      await userEvent.click(screen.getByRole('button', { name: /create account|sign up|register/i }));

      await waitFor(() => {
        expect(screen.getByText(/lowercase/i)).toBeInTheDocument();
      });
    });

    it('shows error for password without number', async () => {
      render(<RegisterPage />);

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/display name|name/i), 'Test User');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'NoNumbers');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'NoNumbers');
      await userEvent.click(screen.getByRole('button', { name: /create account|sign up|register/i }));

      await waitFor(() => {
        expect(screen.getByText(/number/i)).toBeInTheDocument();
      });
    });

    it('shows error when passwords do not match', async () => {
      render(<RegisterPage />);

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/display name|name/i), 'Test User');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'ValidPass1');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'DifferentPass1');
      await userEvent.click(screen.getByRole('button', { name: /create account|sign up|register/i }));

      await waitFor(() => {
        expect(screen.getByText(/match/i)).toBeInTheDocument();
      });
    });
  });

  describe('form validation', () => {
    it('shows error for empty email', async () => {
      render(<RegisterPage />);

      await userEvent.type(screen.getByLabelText(/display name|name/i), 'Test User');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'ValidPass1');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'ValidPass1');
      await userEvent.click(screen.getByRole('button', { name: /create account|sign up|register/i }));

      await waitFor(() => {
        expect(screen.getByText(/email.*required/i)).toBeInTheDocument();
      });
    });

    it('shows error for invalid email format', async () => {
      render(<RegisterPage />);

      await userEvent.type(screen.getByLabelText(/email/i), 'notanemail');
      await userEvent.type(screen.getByLabelText(/display name|name/i), 'Test User');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'ValidPass1');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'ValidPass1');
      await userEvent.click(screen.getByRole('button', { name: /create account|sign up|register/i }));

      await waitFor(() => {
        expect(screen.getByText(/valid.*email/i)).toBeInTheDocument();
      });
    });

    it('shows error for empty display name', async () => {
      render(<RegisterPage />);

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'ValidPass1');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'ValidPass1');
      await userEvent.click(screen.getByRole('button', { name: /create account|sign up|register/i }));

      await waitFor(() => {
        expect(screen.getByText(/name.*required/i)).toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    it('calls register API on valid form submission', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: { message: 'Registration successful. Please log in.' },
      });

      render(<RegisterPage />);

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/display name|name/i), 'Test User');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'ValidPass1');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'ValidPass1');
      await userEvent.click(screen.getByRole('button', { name: /create account|sign up|register/i }));

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith('/api/auth/register', {
          email: 'test@example.com',
          displayName: 'Test User',
          password: 'ValidPass1',
        });
      });
    });

    it('redirects to login on success', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: { message: 'Registration successful. Please log in.' },
      });

      render(<RegisterPage />);

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/display name|name/i), 'Test User');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'ValidPass1');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'ValidPass1');
      await userEvent.click(screen.getByRole('button', { name: /create account|sign up|register/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('displays field-specific errors from API', async () => {
      mockApi.post.mockRejectedValueOnce({
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        fields: {
          email: 'Email already exists',
        },
      });

      render(<RegisterPage />);

      await userEvent.type(screen.getByLabelText(/email/i), 'existing@example.com');
      await userEvent.type(screen.getByLabelText(/display name|name/i), 'Test User');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'ValidPass1');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'ValidPass1');
      await userEvent.click(screen.getByRole('button', { name: /create account|sign up|register/i }));

      await waitFor(() => {
        expect(screen.getByText(/already exists/i)).toBeInTheDocument();
      });
    });

    it('displays general error message on failure', async () => {
      mockApi.post.mockRejectedValueOnce({
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong',
      });

      render(<RegisterPage />);

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/display name|name/i), 'Test User');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'ValidPass1');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'ValidPass1');
      await userEvent.click(screen.getByRole('button', { name: /create account|sign up|register/i }));

      await waitFor(() => {
        expect(screen.getByText(/went wrong|error|failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('loading state', () => {
    it('disables submit button while loading', async () => {
      // Keep the promise pending
      mockApi.post.mockImplementation(() => new Promise(() => {}));

      render(<RegisterPage />);

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/display name|name/i), 'Test User');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'ValidPass1');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'ValidPass1');
      await userEvent.click(screen.getByRole('button', { name: /create account|sign up|register/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /creating|loading/i })).toBeDisabled();
      });
    });

    it('disables form fields while loading', async () => {
      // Keep the promise pending
      mockApi.post.mockImplementation(() => new Promise(() => {}));

      render(<RegisterPage />);

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/display name|name/i), 'Test User');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'ValidPass1');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'ValidPass1');
      await userEvent.click(screen.getByRole('button', { name: /create account|sign up|register/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeDisabled();
        expect(screen.getByLabelText(/^password$/i)).toBeDisabled();
      });
    });
  });
});
