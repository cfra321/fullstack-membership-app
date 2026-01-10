/**
 * Card Component Tests
 */

import { render, screen } from '@testing-library/react';

import { Card, CardHeader, CardContent, CardFooter } from '../../../components/ui';

describe('Card', () => {
  describe('basic rendering', () => {
    it('renders children correctly', () => {
      render(
        <Card>
          <p>Card content</p>
        </Card>
      );

      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('applies default styling', () => {
      render(<Card data-testid="card">Content</Card>);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('rounded-xl');
      expect(card).toHaveClass('shadow-sm');
    });
  });

  describe('variants', () => {
    it('renders default variant', () => {
      render(<Card data-testid="card">Content</Card>);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('border');
    });

    it('renders elevated variant', () => {
      render(<Card variant="elevated" data-testid="card">Content</Card>);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('shadow-lg');
    });

    it('renders flat variant', () => {
      render(<Card variant="flat" data-testid="card">Content</Card>);

      const card = screen.getByTestId('card');
      expect(card).not.toHaveClass('shadow-sm');
    });
  });

  describe('padding', () => {
    it('applies default padding', () => {
      render(<Card data-testid="card">Content</Card>);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('p-6');
    });

    it('applies no padding when specified', () => {
      render(<Card padding="none" data-testid="card">Content</Card>);

      const card = screen.getByTestId('card');
      expect(card).not.toHaveClass('p-6');
    });
  });
});

describe('CardHeader', () => {
  it('renders title', () => {
    render(<CardHeader title="Card Title" />);

    expect(screen.getByText('Card Title')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<CardHeader title="Title" subtitle="Subtitle text" />);

    expect(screen.getByText('Subtitle text')).toBeInTheDocument();
  });

  it('renders action element', () => {
    render(
      <CardHeader
        title="Title"
        action={<button>Action</button>}
      />
    );

    expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
  });
});

describe('CardContent', () => {
  it('renders children', () => {
    render(
      <CardContent>
        <p>Content here</p>
      </CardContent>
    );

    expect(screen.getByText('Content here')).toBeInTheDocument();
  });
});

describe('CardFooter', () => {
  it('renders children', () => {
    render(
      <CardFooter>
        <button>Submit</button>
      </CardFooter>
    );

    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('applies border-top styling', () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>);

    const footer = screen.getByTestId('footer');
    expect(footer).toHaveClass('border-t');
  });
});
