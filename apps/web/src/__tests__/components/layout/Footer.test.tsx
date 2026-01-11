/**
 * Footer Component Tests
 */

import { render, screen } from '@testing-library/react';

import { Footer } from '../../../components/layout';

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

describe('Footer', () => {
  it('renders correctly', () => {
    render(<Footer />);

    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('displays copyright text', () => {
    render(<Footer />);

    expect(screen.getByText(/astronacci/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(new Date().getFullYear().toString()))).toBeInTheDocument();
  });

  it('renders privacy policy link', () => {
    render(<Footer />);

    expect(screen.getByRole('link', { name: /privacy/i })).toBeInTheDocument();
  });

  it('renders terms of service link', () => {
    render(<Footer />);

    expect(screen.getByRole('link', { name: /terms/i })).toBeInTheDocument();
  });

  it('renders contact link', () => {
    render(<Footer />);

    expect(screen.getByRole('link', { name: /contact/i })).toBeInTheDocument();
  });
});
