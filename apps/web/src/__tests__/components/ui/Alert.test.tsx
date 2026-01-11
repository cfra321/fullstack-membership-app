/**
 * Alert Component Tests
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Alert } from '../../../components/ui';

describe('Alert', () => {
  describe('variants', () => {
    it('renders error variant', () => {
      render(<Alert variant="error">Error message</Alert>);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass('bg-red-50');
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('renders success variant', () => {
      render(<Alert variant="success">Success message</Alert>);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-green-50');
    });

    it('renders warning variant', () => {
      render(<Alert variant="warning">Warning message</Alert>);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-yellow-50');
    });

    it('renders info variant by default', () => {
      render(<Alert>Info message</Alert>);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-blue-50');
    });
  });

  describe('title', () => {
    it('renders title when provided', () => {
      render(<Alert title="Error Title">Error message</Alert>);

      expect(screen.getByText('Error Title')).toBeInTheDocument();
    });

    it('does not render title element when not provided', () => {
      render(<Alert>Just message</Alert>);

      // Title should not be rendered
      const title = screen.queryByRole('heading');
      expect(title).not.toBeInTheDocument();
    });
  });

  describe('dismissible', () => {
    it('shows close button when dismissible', () => {
      render(<Alert dismissible>Message</Alert>);

      expect(screen.getByRole('button', { name: /dismiss|close/i })).toBeInTheDocument();
    });

    it('does not show close button by default', () => {
      render(<Alert>Message</Alert>);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('calls onDismiss when close button clicked', async () => {
      const handleDismiss = jest.fn();
      render(<Alert dismissible onDismiss={handleDismiss}>Message</Alert>);

      await userEvent.click(screen.getByRole('button', { name: /dismiss|close/i }));

      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('icon', () => {
    it('shows icon by default', () => {
      render(<Alert variant="error">Error</Alert>);

      // Should have an icon
      const icon = screen.getByRole('alert').querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('hides icon when showIcon is false', () => {
      render(<Alert variant="error" showIcon={false} data-testid="alert">Error</Alert>);

      const alert = screen.getByTestId('alert');
      const icon = alert.querySelector('svg:not([aria-hidden])');
      // The only SVG should be in dismiss button if present
      expect(icon).toBeNull();
    });
  });
});
