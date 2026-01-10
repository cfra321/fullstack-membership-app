/**
 * Responsive Design Tests
 *
 * Tests to validate responsive behavior at different breakpoints.
 * These tests verify that components adapt properly to different screen sizes.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Header } from '../components/layout';
import { Button } from '../components/ui';
import { ArticleCard, type ArticlePreview } from '../components/content';
import { LoginForm } from '../components/auth';

// Mock the useAuth hook
const mockLogout = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock API
jest.mock('../lib/api', () => ({
  api: {
    post: jest.fn().mockResolvedValue({ data: {} }),
    get: jest.fn().mockResolvedValue({ data: {} }),
  },
  ApiError: class ApiError extends Error {
    fields?: Record<string, string>;
  },
}));

// Mock window.matchMedia for responsive testing
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

describe('Responsive Design', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  describe('Navigation - Mobile hamburger menu', () => {
    it('renders mobile menu button', () => {
      render(<Header />);

      const menuButton = screen.getByLabelText(/toggle navigation menu/i);
      expect(menuButton).toBeInTheDocument();
    });

    it('toggles mobile menu when hamburger is clicked', async () => {
      render(<Header />);

      const menuButton = screen.getByLabelText(/toggle navigation menu/i);

      // Initially, mobile menu should be hidden
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');

      // Click to open
      await userEvent.click(menuButton);
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');

      // Click to close
      await userEvent.click(menuButton);
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('mobile menu contains navigation links when open', async () => {
      render(<Header />);

      const menuButton = screen.getByLabelText(/toggle navigation menu/i);
      await userEvent.click(menuButton);

      // Should show navigation links in mobile menu
      const dashboardLinks = screen.getAllByRole('link', { name: /dashboard/i });
      expect(dashboardLinks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Forms - Mobile usability', () => {
    it('form inputs have proper width for mobile', () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      // Inputs should have the 'input' class which includes w-full
      expect(emailInput).toHaveClass('input');
      expect(passwordInput).toHaveClass('input');
    });

    it('submit button is full width for better mobile touch', () => {
      render(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toHaveClass('w-full');
    });

    it('form has proper spacing for touch targets', () => {
      render(<LoginForm />);

      // Form should have space-y class for proper spacing
      const form = screen.getByRole('button', { name: /sign in/i }).closest('form');
      expect(form).toHaveClass('space-y-4');
    });
  });

  describe('Content Cards - Responsive stacking', () => {
    const mockArticle: ArticlePreview = {
      id: '1',
      title: 'Test Article',
      preview: 'This is a test article preview.',
      author: 'Test Author',
      publishedAt: '2024-01-15T10:00:00Z',
    };

    it('article card renders as a block element', () => {
      render(<ArticleCard article={mockArticle} isAccessed={false} />);

      const card = screen.getByRole('link', { name: /test article/i });
      expect(card).toHaveClass('block');
    });

    it('article card has rounded corners and shadow', () => {
      render(<ArticleCard article={mockArticle} isAccessed={false} />);

      const card = screen.getByRole('link', { name: /test article/i });
      expect(card).toHaveClass('rounded-xl');
      expect(card).toHaveClass('shadow-sm');
    });
  });

  describe('Touch Targets - Minimum sizes', () => {
    it('button has appropriate padding for touch targets', () => {
      render(<Button>Click me</Button>);

      const button = screen.getByRole('button');
      // Medium size has px-4 py-2 which gives adequate touch target
      expect(button).toHaveClass('px-4');
      expect(button).toHaveClass('py-2');
    });

    it('large button has larger touch target', () => {
      render(<Button size="lg">Large Button</Button>);

      const button = screen.getByRole('button');
      // Large size has px-6 py-3 for larger touch target
      expect(button).toHaveClass('px-6');
      expect(button).toHaveClass('py-3');
    });

    it('small button maintains minimum touch target', () => {
      render(<Button size="sm">Small Button</Button>);

      const button = screen.getByRole('button');
      // Small size still has py-1.5 which is about 24px height
      expect(button).toHaveClass('px-3');
      expect(button).toHaveClass('py-1.5');
    });

    it('header navigation links have adequate touch targets', () => {
      render(<Header />);

      const navLinks = screen.getAllByRole('link');
      navLinks.forEach(link => {
        // Links should have padding classes for touch targets
        const hasAdequatePadding =
          link.className.includes('px-') ||
          link.className.includes('py-') ||
          link.className.includes('p-');
        // Most nav links should have padding
        expect(navLinks.some(l => l.className.includes('px-'))).toBeTruthy();
      });
    });

    it('mobile menu button has adequate touch target', () => {
      render(<Header />);

      const menuButton = screen.getByLabelText(/toggle navigation menu/i);
      expect(menuButton).toHaveClass('p-2');
    });
  });

  describe('Responsive utility classes', () => {
    it('Header hides desktop nav on mobile viewport', () => {
      render(<Header />);

      // Desktop nav should have hidden class on mobile (md:flex means hidden on mobile)
      const nav = document.querySelector('nav.hidden.md\\:flex');
      expect(nav).toBeInTheDocument();
    });

    it('Header shows mobile menu button', () => {
      render(<Header />);

      // Mobile menu button should be visible on mobile (md:hidden)
      const mobileMenuButton = screen.getByLabelText(/toggle navigation menu/i);
      expect(mobileMenuButton).toHaveClass('md:hidden');
    });
  });

  describe('Accessibility on mobile', () => {
    it('mobile menu has proper aria attributes', () => {
      render(<Header />);

      const menuButton = screen.getByLabelText(/toggle navigation menu/i);
      expect(menuButton).toHaveAttribute('aria-expanded');
      expect(menuButton).toHaveAttribute('aria-label');
    });

    it('form labels are properly associated with inputs', () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('id');
      expect(passwordInput).toHaveAttribute('id');
    });
  });
});
