/**
 * Button Component Tests
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Button } from '../../../components/ui';

describe('Button', () => {
  describe('variants', () => {
    it('renders primary variant by default', () => {
      render(<Button>Click me</Button>);

      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-blue-600');
    });

    it('renders primary variant explicitly', () => {
      render(<Button variant="primary">Primary</Button>);

      const button = screen.getByRole('button', { name: /primary/i });
      expect(button).toHaveClass('bg-blue-600');
    });

    it('renders secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole('button', { name: /secondary/i });
      expect(button).toHaveClass('bg-gray-200');
    });

    it('renders outline variant', () => {
      render(<Button variant="outline">Outline</Button>);

      const button = screen.getByRole('button', { name: /outline/i });
      expect(button).toHaveClass('border');
      expect(button).toHaveClass('bg-transparent');
    });

    it('renders danger variant', () => {
      render(<Button variant="danger">Danger</Button>);

      const button = screen.getByRole('button', { name: /danger/i });
      expect(button).toHaveClass('bg-red-600');
    });
  });

  describe('sizes', () => {
    it('renders medium size by default', () => {
      render(<Button>Medium</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4');
      expect(button).toHaveClass('py-2');
    });

    it('renders small size', () => {
      render(<Button size="sm">Small</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-3');
      expect(button).toHaveClass('py-1.5');
    });

    it('renders large size', () => {
      render(<Button size="lg">Large</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6');
      expect(button).toHaveClass('py-3');
    });
  });

  describe('states', () => {
    it('handles click events', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      await userEvent.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('can be disabled', () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('does not call onClick when disabled', async () => {
      const handleClick = jest.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);

      await userEvent.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('shows loading state', () => {
      render(<Button isLoading>Loading</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('fullWidth', () => {
    it('renders full width when specified', () => {
      render(<Button fullWidth>Full Width</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });
  });

  describe('as link', () => {
    it('renders as anchor when href is provided', () => {
      render(<Button href="/dashboard">Go to Dashboard</Button>);

      const link = screen.getByRole('link', { name: /go to dashboard/i });
      expect(link).toHaveAttribute('href', '/dashboard');
    });
  });
});
