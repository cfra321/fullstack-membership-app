/**
 * MainLayout Component Tests
 */

import { render, screen } from '@testing-library/react';

import { MainLayout } from '../../../components/layout';

// Mock the useAuth hook
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

describe('MainLayout', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      logout: jest.fn(),
    });
  });

  it('renders children correctly', () => {
    render(
      <MainLayout>
        <div data-testid="child-content">Test Content</div>
      </MainLayout>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('wraps children with Header and Footer', () => {
    render(
      <MainLayout>
        <main>Page Content</main>
      </MainLayout>
    );

    // Should have header (nav element with brand)
    expect(screen.getByRole('banner')).toBeInTheDocument();

    // Should have footer
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();

    // Should have the content
    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  it('applies proper layout structure', () => {
    const { container } = render(
      <MainLayout>
        <div>Content</div>
      </MainLayout>
    );

    // Should have a flex column container for min-height
    const layoutContainer = container.firstChild;
    expect(layoutContainer).toHaveClass('flex');
    expect(layoutContainer).toHaveClass('flex-col');
    expect(layoutContainer).toHaveClass('min-h-screen');
  });

  it('renders main content area with proper classes', () => {
    render(
      <MainLayout>
        <div>Content</div>
      </MainLayout>
    );

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('flex-1');
  });

  it('can hide header when showHeader is false', () => {
    render(
      <MainLayout showHeader={false}>
        <div>Content</div>
      </MainLayout>
    );

    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  });

  it('can hide footer when showFooter is false', () => {
    render(
      <MainLayout showFooter={false}>
        <div>Content</div>
      </MainLayout>
    );

    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
  });
});
