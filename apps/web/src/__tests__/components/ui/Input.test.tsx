/**
 * Input Component Tests
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Input } from '../../../components/ui';

describe('Input', () => {
  describe('basic rendering', () => {
    it('renders input element', () => {
      render(<Input placeholder="Enter text" />);

      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Input label="Email" id="email" />);

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('renders with helper text', () => {
      render(<Input helperText="Enter your email address" />);

      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    });
  });

  describe('value handling', () => {
    it('handles value changes', async () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'hello');

      expect(handleChange).toHaveBeenCalled();
    });

    it('displays controlled value', () => {
      render(<Input value="test value" onChange={() => {}} />);

      expect(screen.getByDisplayValue('test value')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message', () => {
      render(<Input error="This field is required" />);

      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('has error styling when error is present', () => {
      render(<Input error="Error" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-red-500');
    });
  });

  describe('disabled state', () => {
    it('can be disabled', () => {
      render(<Input disabled />);

      expect(screen.getByRole('textbox')).toBeDisabled();
    });
  });

  describe('types', () => {
    it('renders text type by default', () => {
      render(<Input />);

      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
    });

    it('renders email type', () => {
      render(<Input type="email" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('renders password type', () => {
      render(<Input type="password" />);

      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });
  });

  describe('required', () => {
    it('shows required indicator when required', () => {
      render(<Input label="Email" required />);

      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });
});
