/**
 * Loading Component Tests
 */

import { render, screen } from '@testing-library/react';

import { Loading, Spinner } from '../../../components/ui';

describe('Spinner', () => {
  it('renders spinner element', () => {
    render(<Spinner />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders with default size', () => {
    render(<Spinner data-testid="spinner" />);

    const spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveClass('w-6');
    expect(spinner).toHaveClass('h-6');
  });

  it('renders small size', () => {
    render(<Spinner size="sm" data-testid="spinner" />);

    const spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveClass('w-4');
    expect(spinner).toHaveClass('h-4');
  });

  it('renders large size', () => {
    render(<Spinner size="lg" data-testid="spinner" />);

    const spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveClass('w-8');
    expect(spinner).toHaveClass('h-8');
  });

  it('has accessible label', () => {
    render(<Spinner />);

    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
  });
});

describe('Loading', () => {
  it('renders loading overlay', () => {
    render(<Loading />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays loading text', () => {
    render(<Loading />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays custom loading text', () => {
    render(<Loading text="Fetching data..." />);

    expect(screen.getByText('Fetching data...')).toBeInTheDocument();
  });

  it('renders fullscreen variant', () => {
    render(<Loading fullScreen data-testid="loading" />);

    const loading = screen.getByTestId('loading');
    expect(loading).toHaveClass('fixed');
    expect(loading).toHaveClass('inset-0');
  });

  it('renders inline variant', () => {
    render(<Loading data-testid="loading" />);

    const loading = screen.getByTestId('loading');
    expect(loading).not.toHaveClass('fixed');
  });
});
