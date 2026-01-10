/**
 * Setup Tests
 *
 * Validates that the Next.js app is configured correctly.
 */

import { render, screen } from '@testing-library/react';

import { PACKAGE_NAME } from '@astronacci/shared';

import Home from '../app/page';
import { api } from '../lib/api';

describe('Next.js App Setup', () => {
  describe('Home Page', () => {
    it('renders without crashing', () => {
      render(<Home />);

      expect(screen.getByText('Astronacci Membership')).toBeInTheDocument();
    });

    it('displays sign in and create account links', () => {
      render(<Home />);

      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });

    it('displays shared package name', () => {
      render(<Home />);

      expect(screen.getByText(`Powered by ${PACKAGE_NAME}`)).toBeInTheDocument();
    });
  });

  describe('Tailwind CSS', () => {
    it('applies Tailwind classes correctly', () => {
      render(<Home />);

      const main = document.querySelector('main');
      expect(main).toHaveClass('flex');
      expect(main).toHaveClass('min-h-screen');
    });

    it('card component has expected classes', () => {
      render(<Home />);

      const card = document.querySelector('.card');
      expect(card).toBeInTheDocument();
    });
  });

  describe('API Client', () => {
    it('can be imported', () => {
      expect(api).toBeDefined();
      expect(api.get).toBeDefined();
      expect(api.post).toBeDefined();
      expect(api.put).toBeDefined();
      expect(api.delete).toBeDefined();
    });
  });

  describe('Shared Package', () => {
    it('exports PACKAGE_NAME', () => {
      expect(PACKAGE_NAME).toBeDefined();
      expect(typeof PACKAGE_NAME).toBe('string');
    });
  });
});
